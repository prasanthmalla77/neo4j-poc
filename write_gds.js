const fs = require('fs');

const content = `// Neo4j Graph Data Science (GDS) Service Layer
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
export const createGdsProjection = async (jobId, nodes, relationships, targetLabel = null, targetProperties = []) => {
  const projectionName = \`graph_gds_\${jobId}\`;

  // Cache node/rel data locally for result enrichment
  activeProjections.set(projectionName, { name: projectionName, jobId, nodes, relationships });

  const relTypes = [...new Set(relationships.map(r => r.type))].filter(Boolean);

  const driver = initDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    // Drop stale projection if present (failIfMissing = false)
    try {
      await session.run('CALL gds.graph.drop($name, false) YIELD graphName', { name: projectionName });
    } catch (_) { /* not present - fine */ }

    let result;

    if (targetLabel) {
      // Scoped projection: only the user-selected label, with optional property embeddings.
      // Map syntax: { "LabelName": { properties: [...] } } scopes GDS to exactly what the user chose.
      const nodeProjection = targetProperties.length > 0
        ? { [targetLabel]: { properties: targetProperties } }
        : { [targetLabel]: {} };

      if (relTypes.length === 0) {
        result = await session.run(
          "CALL gds.graph.project($name, $nodeProjection, '*') YIELD graphName, nodeCount, relationshipCount",
          { name: projectionName, nodeProjection }
        );
      } else {
        result = await session.run(
          'CALL gds.graph.project($name, $nodeProjection, $relTypes) YIELD graphName, nodeCount, relationshipCount',
          { name: projectionName, nodeProjection, relTypes }
        );
      }
    } else {
      // No label filter: derive labels from the visible graphData nodes
      const nodeLabels = [...new Set(nodes.flatMap(n => n.labels || []))].filter(Boolean);

      // Star wildcard must be a Cypher literal, not a parameter
      if (nodeLabels.length === 0 && relTypes.length === 0) {
        result = await session.run(
          "CALL gds.graph.project($name, '*', '*') YIELD graphName, nodeCount, relationshipCount",
          { name: projectionName }
        );
      } else if (nodeLabels.length === 0) {
        result = await session.run(
          "CALL gds.graph.project($name, '*', $relTypes) YIELD graphName, nodeCount, relationshipCount",
          { name: projectionName, relTypes }
        );
      } else if (relTypes.length === 0) {
        result = await session.run(
          "CALL gds.graph.project($name, $nodeLabels, '*') YIELD graphName, nodeCount, relationshipCount",
          { name: projectionName, nodeLabels }
        );
      } else {
        result = await session.run(
          'CALL gds.graph.project($name, $nodeLabels, $relTypes) YIELD graphName, nodeCount, relationshipCount',
          { name: projectionName, nodeLabels, relTypes }
        );
      }
    }

    const rec = result.records[0];
    const nodeCount         = toNum(rec.get('nodeCount'));
    const relationshipCount = toNum(rec.get('relationshipCount'));

    console.log(\`[GDS] Projection created: \${projectionName} - \${nodeCount} nodes, \${relationshipCount} rels\`);

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

// --- Node Similarity ---------------------------------------------------------------

/**
 * Run gds.nodeSimilarity.stream on the server projection.
 * similarityMode: 'neighbours' (JACCARD) | 'properties' (COSINE)
 */
export const runNodeSimilarity = async (projectionName, config) => {
  console.log('[GDS] runNodeSimilarity called:', { projectionName, config });
  const projection = activeProjections.get(projectionName);
  if (!projection) {
    console.error('[GDS] Projection not found in registry. Available:', Array.from(activeProjections.keys()));
    throw new Error(\`Projection \${projectionName} not found\`);
  }

  const {
    topK = 10,
    similarityThreshold = 0.5,
    degreeCutoff = 1,
    similarityMode = 'neighbours',
    targetNodeLabel = '',
    targetProperties = [],
  } = config;

  // Map user-facing mode to GDS similarityMetric
  // "neighbours" -> JACCARD (intersection-over-union of shared graph neighbors)
  // "properties" -> COSINE  (angle between relationship-weight feature vectors)
  const gdsMetric = similarityMode === 'properties' ? 'COSINE' : 'JACCARD';

  const { nodes } = projection;
  const driver = initDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const result = await session.run(
      \`CALL gds.nodeSimilarity.stream($projName, {
         topK: $topK,
         similarityCutoff: $threshold,
         degreeCutoff: $degreeCutoff,
         similarityMetric: $metric
       })
       YIELD node1, node2, similarity
       WITH gds.util.asNode(node1) AS n1, gds.util.asNode(node2) AS n2, similarity
       RETURN
         id(n1)         AS node1Id,
         labels(n1)     AS node1Labels,
         properties(n1) AS node1Props,
         id(n2)         AS node2Id,
         labels(n2)     AS node2Labels,
         properties(n2) AS node2Props,
         similarity
       ORDER BY similarity DESC
       LIMIT $topK\`,
      {
        projName: projectionName,
        topK: neo4j.int(topK),
        threshold: similarityThreshold,
        degreeCutoff: neo4j.int(degreeCutoff),
        metric: gdsMetric,
      }
    );

    let results = result.records.map(rec => {
      const node1Id = rec.get('node1Id').toString();
      const node2Id = rec.get('node2Id').toString();
      const node1Data = nodes.find(n => n.id === node1Id) || {
        id: node1Id, labels: rec.get('node1Labels'), properties: rec.get('node1Props'),
      };
      const node2Data = nodes.find(n => n.id === node2Id) || {
        id: node2Id, labels: rec.get('node2Labels'), properties: rec.get('node2Props'),
      };
      return { node1: node1Id, node2: node2Id, score: rec.get('similarity'), node1Data, node2Data };
    });

    console.log('[GDS] nodeSimilarity raw records:', result.records.length, '| after mapping:', results.length);

    // Remove pairs that represent the same physical site (same plant_code or same logical id)
    results = results.filter(r => {
      const p1 = r.node1Data.properties || {};
      const p2 = r.node2Data.properties || {};
      const samePhysicalSite =
        (p1.plant_code && p2.plant_code && p1.plant_code === p2.plant_code) ||
        (p1.id && p2.id && p1.id === p2.id);
      return !samePhysicalSite;
    });

    // If a specific label was selected, keep only pairs where both nodes carry that label
    if (targetNodeLabel) {
      results = results.filter(r =>
        r.node1Data.labels?.includes(targetNodeLabel) &&
        r.node2Data.labels?.includes(targetNodeLabel)
      );
    }

    // Keep only pairs where BOTH nodes are currently visible in the filtered graph.
    // GDS projects all Neo4j nodes with matching labels, but graphData is a filtered
    // subset - results referencing invisible nodes cannot be highlighted on the graph.
    const graphNodeIds = new Set(nodes.map(n => n.id));
    results = results.filter(r => graphNodeIds.has(r.node1) && graphNodeIds.has(r.node2));

    console.log('[GDS] nodeSimilarity after all filters:', results.length);

    return {
      algorithmType: ALGORITHM_TYPES.NODE_SIMILARITY,
      projectionName, config,
      executedAt: new Date().toISOString(),
      resultCount: results.length, results,
      stats: {
        nodesCompared: nodes.length,
        pairsEvaluated: result.records.length,
        similarityMode,
        gdsMetric,
        targetNodeLabel: targetNodeLabel || 'all',
        targetProperties: targetProperties.length > 0 ? targetProperties : 'all',
        threshold: similarityThreshold,
      },
    };
  } finally {
    await session.close();
  }
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
    throw new Error(\`Projection \${projectionName} not found\`);
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
  const weightClause = weightProperty ? \`, relationshipWeightProperty: $weightProp\` : '';

  try {
    let records = [];

    if (algorithm === 'yens') {
      const result = await session.run(
        \`MATCH (source) WHERE id(source) = toInteger($sourceId)
         MATCH (target) WHERE id(target) = toInteger($targetId)
         CALL gds.kShortestPaths.yens.stream($projName, {
           sourceNode: source,
           targetNode: target,
           k: $kPaths
           \${weightClause}
         })
         YIELD index, nodeIds, totalCost
         RETURN index, [nid IN nodeIds | toString(nid)] AS nodeIds, totalCost
         ORDER BY index\`,
        { sourceId: sourceNode, targetId: targetNode, projName: projectionName, kPaths: neo4j.int(kPaths), weightProp: weightProperty }
      );
      records = result.records;
    } else if (algorithm === 'astar') {
      const result = await session.run(
        \`MATCH (source) WHERE id(source) = toInteger($sourceId)
         MATCH (target) WHERE id(target) = toInteger($targetId)
         CALL gds.shortestPath.astar.stream($projName, {
           sourceNode: source,
           targetNode: target,
           latitudeProperty: 'latitude',
           longitudeProperty: 'longitude'
           \${weightClause}
         })
         YIELD index, nodeIds, totalCost
         RETURN index, [nid IN nodeIds | toString(nid)] AS nodeIds, totalCost
         ORDER BY index\`,
        { sourceId: sourceNode, targetId: targetNode, projName: projectionName, weightProp: weightProperty }
      );
      records = result.records;
    } else {
      // Dijkstra (default)
      const result = await session.run(
        \`MATCH (source) WHERE id(source) = toInteger($sourceId)
         MATCH (target) WHERE id(target) = toInteger($targetId)
         CALL gds.shortestPath.dijkstra.stream($projName, {
           sourceNode: source,
           targetNodes: [target]
           \${weightClause}
         })
         YIELD index, nodeIds, totalCost
         RETURN index, [nid IN nodeIds | toString(nid)] AS nodeIds, totalCost
         ORDER BY index\`,
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
    throw new Error(\`Projection \${projectionName} not found\`);
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
`;

fs.writeFileSync('src/services/gdsService.js', content, 'utf8');
console.log('Written gdsService.js, length:', content.length);
