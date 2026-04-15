// Neo4j Graph Data Science (GDS) Service Layer
// All algorithms run on Neo4j GDS via Bolt - no in-memory fallback.

import neo4j from 'neo4j-driver';
import { initDriver } from './neo4jService';
import { ALGORITHM_TYPES } from '../data/algorithmConfigs';

const NEO4J_DATABASE = process.env.REACT_APP_NEO4J_DATABASE || 'neo4j';

// Projection registry - stores node/rel data for result enrichment after GDS calls
const activeProjections = new Map();

// Convert a Neo4j Integer object to JS number safely
const toNum = (val) => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toNumber === 'function') return val.toNumber();
  if (typeof val.low === 'number') return val.low;
  return Number(val);
};

// --- Projection management --------------------------------------------------------

/**
 * Create (or recreate) a named GDS graph projection on the Neo4j server.
 * When targetLabel is provided the projection is scoped to that label only
 * (with optional property embeddings). This prevents GDS from including nodes
 * outside the current filtered view, keeping result IDs in sync with graphData.
 */
export const createGdsProjection = async (jobId, nodes, relationships) => {
  const projectionName = `graph_gds_${jobId}`;

  // Cache node/rel data locally for result enrichment
  activeProjections.set(projectionName, { name: projectionName, jobId, nodes, relationships });

  const relTypes = [...new Set(relationships.map(r => r.type))].filter(Boolean);

  // Build an UNDIRECTED relationship projection map.
  // By default GDS nodeSimilarity uses OUTGOING edges only — nodes that only have
  // INCOMING edges (e.g. Distribution_Hub receiving supply) appear degree-0 and
  // return zero results. Making every relationship type UNDIRECTED fixes this.
  const buildRelProjection = (types) => {
    if (types.length === 0) {
      // Wildcard: project all types as undirected
      return { all: { type: '*', orientation: 'UNDIRECTED' } };
    }
    const proj = {};
    types.forEach(t => { proj[t] = { type: t, orientation: 'UNDIRECTED' }; });
    return proj;
  };
  const relProjection = buildRelProjection(relTypes);

  const driver = initDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    // Drop stale projection if present (failIfMissing = false)
    try {
      await session.run('CALL gds.graph.drop($name, false) YIELD graphName', { name: projectionName });
    } catch (_) { /* not present - fine */ }

    let result;
    const nodeLabels = [...new Set(nodes.flatMap(n => n.labels || []))].filter(Boolean);

    if (nodeLabels.length === 0) {
      result = await session.run(
        "CALL gds.graph.project($name, '*', $relProjection) YIELD graphName, nodeCount, relationshipCount",
        { name: projectionName, relProjection }
      );
    } else {
      result = await session.run(
        'CALL gds.graph.project($name, $nodeLabels, $relProjection) YIELD graphName, nodeCount, relationshipCount',
        { name: projectionName, nodeLabels, relProjection }
      );
    }

    const rec = result.records[0];
    const nodeCount         = toNum(rec.get('nodeCount'));
    const relationshipCount = toNum(rec.get('relationshipCount'));

    console.log(`[GDS] Projection created: ${projectionName} - ${nodeCount} nodes, ${relationshipCount} rels`);

    return {
      name: projectionName,
      jobId,
      nodeCount,
      relationshipCount,
      createdAt: new Date().toISOString(),
      status: 'ready',
    };
  } finally {
    await session.close();
  }
};

export const projectionExists = (projectionName) => activeProjections.has(projectionName);
export const getProjection    = (projectionName) => activeProjections.get(projectionName) || null;

/**
 * Register graph data in-memory only — no Neo4j/GDS call.
 * Used by node similarity which runs entirely in JS.
 */
export const registerProjection = (jobId, nodes, relationships) => {
  const projectionName = `graph_gds_${jobId}`;
  activeProjections.set(projectionName, { name: projectionName, jobId, nodes, relationships });
  console.log(`[Similarity] Registered in-memory projection: ${projectionName} — ${nodes.length} nodes, ${relationships.length} rels`);
  return {
    name: projectionName,
    jobId,
    nodeCount: nodes.length,
    relationshipCount: relationships.length,
    createdAt: new Date().toISOString(),
    status: 'ready',
  };
};

// --- Node Similarity ---------------------------------------------------------------

/**
 * Run Node Similarity entirely in JavaScript (no GDS call).
 *
 * similarityMode: 'neighbours' → Jaccard on shared graph neighbours
 *                 'properties' → Property match score: matched_keys / total_keys
 *                                Works on strings, numbers, any value type.
 */
export const runNodeSimilarity = async (projectionName, config) => {
  console.log('[Similarity] runNodeSimilarity (JS) called:', { projectionName, config });
  const projection = activeProjections.get(projectionName);
  if (!projection) {
    throw new Error(`Projection ${projectionName} not found`);
  }

  const {
    similarityThreshold = 0.5,
    degreeCutoff = 1,
    similarityMode = 'neighbours',
    targetNodeLabel = '',
    targetProperties = [],
    relationshipFilter = [],
  } = config;

  const gdsMetric = similarityMode === 'properties' ? 'MATCH' : 'JACCARD';
  const { nodes, relationships } = projection;

  // ── 1. Optionally filter by relationship type ──────────────────────────────
  const activeRels = relationshipFilter.length > 0
    ? relationships.filter(r => relationshipFilter.includes(r.type))
    : relationships;

  // ── 2. Build undirected adjacency sets ────────────────────────────────────
  const neighborMap = new Map(); // nodeId → Set of neighbor nodeIds
  nodes.forEach(n => neighborMap.set(n.id, new Set()));
  activeRels.forEach(r => {
    const s = r.startNode ?? r.from;
    const e = r.endNode ?? r.to;
    if (neighborMap.has(s)) neighborMap.get(s).add(e);
    if (neighborMap.has(e)) neighborMap.get(e).add(s);
  });

  // ── 3. Determine candidate nodes ──────────────────────────────────────────
  // degreeCutoff only applies to 'neighbours' mode — for 'properties' mode we
  // compare property values, so relationship count is irrelevant.
  let candidates = similarityMode === 'neighbours'
    ? nodes.filter(n => neighborMap.get(n.id)?.size >= degreeCutoff)
    : nodes;
  if (targetNodeLabel) {
    candidates = candidates.filter(n => n.labels?.includes(targetNodeLabel));
  }
  console.log('[Similarity] Candidates after filters:', candidates.length);

  // ── 4. Compute similarity for every pair ──────────────────────────────────
  const pairs = [];

  if (similarityMode === 'neighbours') {
    // Jaccard: |A ∩ B| / |A ∪ B|  — also capture shared/unique neighbour IDs for display
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i];
        const b = candidates[j];
        const nA = neighborMap.get(a.id);
        const nB = neighborMap.get(b.id);
        const sharedIds    = [...nA].filter(x => nB.has(x));
        const onlyInA      = [...nA].filter(x => !nB.has(x));
        const onlyInB      = [...nB].filter(x => !nA.has(x));
        const union        = sharedIds.length + onlyInA.length + onlyInB.length;
        const score        = union > 0 ? sharedIds.length / union : 0;
        if (score >= similarityThreshold) {
          // Resolve IDs to node objects for display
          const resolve = (id) => nodes.find(n => n.id === id) || { id, labels: [], properties: {} };
          pairs.push({
            node1: a.id, node2: b.id, score,
            node1Data: a, node2Data: b,
            detail: {
              shared:   sharedIds.map(resolve),
              onlyIn1:  onlyInA.map(resolve),
              onlyIn2:  onlyInB.map(resolve),
            },
          });
        }
      }
    }
  } else {
    // Property value matching: score = number of keys with equal values / total keys compared.
    // Works for strings, numbers, booleans — any value. No vectorisation needed.
    const propKeys = targetProperties.length > 0
      ? targetProperties
      : [...new Set(candidates.flatMap(n => Object.keys(n.properties || {})))];

    const normalize = (v) => (v == null ? '' : String(v).trim().toLowerCase());

    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i];
        const b = candidates[j];
        const propsA = a.properties || {};
        const propsB = b.properties || {};

        // Only count keys where at least one node has a non-empty value
        const relevantKeys = propKeys.filter(k =>
          normalize(propsA[k]) !== '' || normalize(propsB[k]) !== ''
        );
        if (relevantKeys.length === 0) continue;

        const matched = relevantKeys.filter(k =>
          normalize(propsA[k]) === normalize(propsB[k]) && normalize(propsA[k]) !== ''
        ).length;

        const score = matched / relevantKeys.length;
        if (score >= similarityThreshold) {
          // Build per-property breakdown for display
          const matchedProps   = relevantKeys.filter(k =>
            normalize(propsA[k]) === normalize(propsB[k]) && normalize(propsA[k]) !== ''
          );
          const unmatchedProps = relevantKeys.filter(k =>
            normalize(propsA[k]) !== normalize(propsB[k])
          );
          pairs.push({
            node1: a.id, node2: b.id, score,
            node1Data: a, node2Data: b,
            detail: { matchedProps, unmatchedProps },
          });
        }
      }
    }
  }

  // ── 5. Sort by score descending ─────────────────────────────────────────
  pairs.sort((a, b) => b.score - a.score);
  let results = pairs;

  // ── 6. Remove same-physical-site pairs ───────────────────────────────────
  results = results.filter(r => {
    const p1 = r.node1Data.properties || {};
    const p2 = r.node2Data.properties || {};
    return !(
      (p1.plant_code && p2.plant_code && p1.plant_code === p2.plant_code) ||
      (p1.id        && p2.id        && p1.id        === p2.id)
    );
  });

  console.log('[Similarity] JS pairs found:', results.length);

  return {
    algorithmType: ALGORITHM_TYPES.NODE_SIMILARITY,
    projectionName, config,
    executedAt: new Date().toISOString(),
    resultCount: results.length, results,
    stats: {
      nodesCompared: candidates.length,
      pairsEvaluated: pairs.length,
      similarityMode,
      gdsMetric,
      targetNodeLabel: targetNodeLabel || 'all',
      targetProperties: targetProperties.length > 0 ? targetProperties : 'all',
      threshold: similarityThreshold,
    },
  };
};

// --- Shortest Path ----------------------------------------------------------------

/**
 * Run shortest-path on Neo4j GDS.
 * algorithm: 'dijkstra' | 'astar' | 'yens'
 */
export const runShortestPath = async (projectionName, config) => {
  console.log('[GDS] runShortestPath called:', { projectionName, config });
  const projection = activeProjections.get(projectionName);
  if (!projection) {
    console.error('[GDS] Projection not found in registry. Available:', Array.from(activeProjections.keys()));
    throw new Error(`Projection ${projectionName} not found`);
  }

  const { sourceNode, targetNode } = config;
  if (!sourceNode || !targetNode) throw new Error('Source and target nodes are required');

  if (sourceNode === targetNode) {
    return {
      algorithmType: ALGORITHM_TYPES.SHORTEST_PATH,
      projectionName, config,
      executedAt: new Date().toISOString(),
      resultCount: 0, results: [],
      stats: { pathsFound: 0, message: 'Source and target nodes are the same' },
    };
  }

  const {
    algorithm = 'dijkstra',
    weightProperty = '',
    maxDepth = 10,
    kPaths = 1,
  } = config;

  const { nodes, relationships } = projection;
  const driver = initDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  const weightClause = weightProperty ? `, relationshipWeightProperty: $weightProp` : '';

  try {
    let records = [];

    if (algorithm === 'yens') {
      const result = await session.run(
        `MATCH (source) WHERE id(source) = toInteger($sourceId)
         MATCH (target) WHERE id(target) = toInteger($targetId)
         CALL gds.kShortestPaths.yens.stream($projName, {
           sourceNode: source,
           targetNode: target,
           k: $kPaths
           ${weightClause}
         })
         YIELD index, nodeIds, totalCost
         RETURN index, [nid IN nodeIds | toString(nid)] AS nodeIds, totalCost
         ORDER BY index`,
        { sourceId: sourceNode, targetId: targetNode, projName: projectionName, kPaths: neo4j.int(kPaths), weightProp: weightProperty }
      );
      records = result.records;
    } else if (algorithm === 'astar') {
      const result = await session.run(
        `MATCH (source) WHERE id(source) = toInteger($sourceId)
         MATCH (target) WHERE id(target) = toInteger($targetId)
         CALL gds.shortestPath.astar.stream($projName, {
           sourceNode: source,
           targetNode: target,
           latitudeProperty: 'latitude',
           longitudeProperty: 'longitude'
           ${weightClause}
         })
         YIELD index, nodeIds, totalCost
         RETURN index, [nid IN nodeIds | toString(nid)] AS nodeIds, totalCost
         ORDER BY index`,
        { sourceId: sourceNode, targetId: targetNode, projName: projectionName, weightProp: weightProperty }
      );
      records = result.records;
    } else {
      // Dijkstra (default)
      const result = await session.run(
        `MATCH (source) WHERE id(source) = toInteger($sourceId)
         MATCH (target) WHERE id(target) = toInteger($targetId)
         CALL gds.shortestPath.dijkstra.stream($projName, {
           sourceNode: source,
           targetNodes: [target]
           ${weightClause}
         })
         YIELD index, nodeIds, totalCost
         RETURN index, [nid IN nodeIds | toString(nid)] AS nodeIds, totalCost
         ORDER BY index`,
        { sourceId: sourceNode, targetId: targetNode, projName: projectionName, weightProp: weightProperty }
      );
      records = result.records;
    }

    const results = records.map(rec =>
      _buildPathResult(
        rec.get('nodeIds'),
        toNum(rec.get('totalCost')),
        sourceNode, targetNode,
        nodes, relationships
      )
    );

    return {
      algorithmType: ALGORITHM_TYPES.SHORTEST_PATH,
      projectionName, config,
      executedAt: new Date().toISOString(),
      resultCount: results.length, results,
      stats: { pathsFound: results.length, algorithm, weighted: !!weightProperty, maxDepth },
    };
  } finally {
    await session.close();
  }
};

// Reconstruct a path result object from GDS-returned node-ID strings
const _buildPathResult = (nodeIds, totalCost, sourceNode, targetNode, nodes, relationships) => {
  const pathNodes = nodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean);

  const pathRelIds = [];
  const pathRels   = [];
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const rel = relationships.find(r =>
      (r.startNode === nodeIds[i] && r.endNode === nodeIds[i + 1]) ||
      (r.startNode === nodeIds[i + 1] && r.endNode === nodeIds[i])
    );
    if (rel) { pathRelIds.push(rel.id); pathRels.push(rel); }
  }

  return {
    sourceNode, targetNode,
    nodeIds,
    relationshipIds: pathRelIds,
    nodes: pathNodes,
    relationships: pathRels,
    pathLength: nodeIds.length - 1,
    totalCost,
    pathDescription: pathNodes.map(n =>
      n.properties?.site_name || n.properties?.name || n.id
    ).join(' -> '),
  };
};

// --- Projection teardown ----------------------------------------------------------

export const dropGdsProjection = async (projectionName) => {
  if (!activeProjections.has(projectionName)) {
    throw new Error(`Projection ${projectionName} not found`);
  }

  const driver = initDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    await session.run('CALL gds.graph.drop($name, false) YIELD graphName', { name: projectionName });
  } finally {
    await session.close();
  }

  activeProjections.delete(projectionName);

  return {
    projectionName,
    dropped: true,
    droppedAt: new Date().toISOString(),
  };
};

export const getActiveProjections = () => Array.from(activeProjections.keys());

export const clearAllProjections = () => {
  const count = activeProjections.size;
  activeProjections.clear();
  return count;
};
