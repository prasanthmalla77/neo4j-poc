// Neo4j Graph Data Science (GDS) Service Layer
// Mock implementations for GDS operations
// Will be replaced with actual Neo4j driver calls in Phase 6

import { ALGORITHM_TYPES } from '../data/algorithmConfigs';

// Store active projections in memory (mock)
const activeProjections = new Map();

/**
 * Create a GDS projection from graph data
 * @param {string} jobId - The job identifier
 * @param {Array} nodes - Array of node objects
 * @param {Array} relationships - Array of relationship objects
 * @returns {Promise<Object>} Projection details
 */
export const createGdsProjection = async (jobId, nodes, relationships) => {
  const projectionName = `graph_gds_${jobId}`;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock projection creation
  const projection = {
    name: projectionName,
    jobId,
    nodeCount: nodes.length,
    relationshipCount: relationships.length,
    createdAt: new Date().toISOString(),
    status: 'ready'
  };

  activeProjections.set(projectionName, {
    ...projection,
    nodes,
    relationships
  });

  console.log(`[GDS Service] Created projection: ${projectionName}`);

  return projection;
};

/**
 * Check if a GDS projection exists
 * @param {string} projectionName - The projection name
 * @returns {boolean} Whether the projection exists
 */
export const projectionExists = (projectionName) => {
  return activeProjections.has(projectionName);
};

/**
 * Get projection details
 * @param {string} projectionName - The projection name
 * @returns {Object|null} Projection details or null if not found
 */
export const getProjection = (projectionName) => {
  return activeProjections.get(projectionName) || null;
};

/**
 * Run Node Similarity algorithm
 * @param {string} projectionName - The GDS projection name
 * @param {Object} config - Algorithm configuration
 * @returns {Promise<Object>} Algorithm results
 */
export const runNodeSimilarity = async (projectionName, config) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const projection = activeProjections.get(projectionName);
  if (!projection) {
    throw new Error(`Projection ${projectionName} not found`);
  }

  console.log(`[GDS Service] Running Node Similarity on ${projectionName}`, config);

  // Mock similarity computation
  const { nodes, relationships } = projection;
  const {
    similarityMetric = 'jaccard',
    topK = 10,
    similarityThreshold = 0.5,
    nodeFilter = [],
    relationshipFilter = []
  } = config;

  // Filter nodes if specified
  let filteredNodes = nodes;
  if (nodeFilter.length > 0) {
    filteredNodes = nodes.filter(node =>
      node.labels.some(label => nodeFilter.includes(label))
    );
  }

  // Build adjacency information for similarity calculation
  const nodeNeighbors = new Map();
  filteredNodes.forEach(node => {
    nodeNeighbors.set(node.id, new Set());
  });

  relationships.forEach(rel => {
    if (relationshipFilter.length === 0 || relationshipFilter.includes(rel.type)) {
      if (nodeNeighbors.has(rel.startNode)) {
        nodeNeighbors.get(rel.startNode).add(rel.endNode);
      }
      if (nodeNeighbors.has(rel.endNode)) {
        nodeNeighbors.get(rel.endNode).add(rel.startNode);
      }
    }
  });

  // Calculate similarity pairs (mock)
  // IMPORTANT: Only compare nodes of the same type/label
  const similarityPairs = [];
  const nodeIds = Array.from(nodeNeighbors.keys());

  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const node1Id = nodeIds[i];
      const node2Id = nodeIds[j];

      const node1 = nodes.find(n => n.id === node1Id);
      const node2 = nodes.find(n => n.id === node2Id);

      // Skip if nodes don't have the same primary label
      if (!node1 || !node2 || node1.labels[0] !== node2.labels[0]) {
        continue;
      }

      const neighbors1 = nodeNeighbors.get(node1Id);
      const neighbors2 = nodeNeighbors.get(node2Id);

      // Calculate similarity based on metric
      let similarity = 0;
      if (similarityMetric === 'jaccard') {
        const intersection = new Set([...neighbors1].filter(x => neighbors2.has(x)));
        const union = new Set([...neighbors1, ...neighbors2]);
        similarity = union.size > 0 ? intersection.size / union.size : 0;
      } else if (similarityMetric === 'overlap') {
        const intersection = new Set([...neighbors1].filter(x => neighbors2.has(x)));
        const minSize = Math.min(neighbors1.size, neighbors2.size);
        similarity = minSize > 0 ? intersection.size / minSize : 0;
      } else if (similarityMetric === 'cosine') {
        const intersection = new Set([...neighbors1].filter(x => neighbors2.has(x)));
        const denominator = Math.sqrt(neighbors1.size * neighbors2.size);
        similarity = denominator > 0 ? intersection.size / denominator : 0;
      } else {
        // Pearson or other - use random for mock
        similarity = Math.random() * 0.5 + 0.3;
      }

      // Add some randomness for demo purposes
      similarity = Math.min(1, similarity + (Math.random() - 0.5) * 0.1);

      if (similarity >= similarityThreshold) {
        similarityPairs.push({
          node1: node1Id,
          node2: node2Id,
          score: similarity,
          node1Data: node1,
          node2Data: node2
        });
      }
    }
  }

  // Sort by score and limit to topK
  similarityPairs.sort((a, b) => b.score - a.score);
  const results = similarityPairs.slice(0, topK);

  return {
    algorithmType: ALGORITHM_TYPES.NODE_SIMILARITY,
    projectionName,
    config,
    executedAt: new Date().toISOString(),
    resultCount: results.length,
    results,
    stats: {
      nodesCompared: filteredNodes.length,
      pairsEvaluated: (filteredNodes.length * (filteredNodes.length - 1)) / 2,
      similarityMetric,
      threshold: similarityThreshold
    }
  };
};

/**
 * Run Shortest Path algorithm
 * @param {string} projectionName - The GDS projection name
 * @param {Object} config - Algorithm configuration
 * @returns {Promise<Object>} Algorithm results
 */
export const runShortestPath = async (projectionName, config) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const projection = activeProjections.get(projectionName);
  if (!projection) {
    throw new Error(`Projection ${projectionName} not found`);
  }

  console.log(`[GDS Service] Running Shortest Path on ${projectionName}`, config);

  const { nodes, relationships } = projection;
  const {
    sourceNode,
    targetNode,
    algorithm = 'dijkstra',
    weightProperty = '',
    relationshipFilter = [],
    maxDepth = 10,
    kPaths = 1
  } = config;

  if (!sourceNode || !targetNode) {
    throw new Error('Source and target nodes are required');
  }

  if (sourceNode === targetNode) {
    return {
      algorithmType: ALGORITHM_TYPES.SHORTEST_PATH,
      projectionName,
      config,
      executedAt: new Date().toISOString(),
      resultCount: 0,
      results: [],
      stats: {
        pathsFound: 0,
        message: 'Source and target nodes are the same'
      }
    };
  }

  // Build adjacency list
  const graph = new Map();
  nodes.forEach(node => {
    graph.set(node.id, []);
  });

  relationships.forEach(rel => {
    if (relationshipFilter.length === 0 || relationshipFilter.includes(rel.type)) {
      const weight = weightProperty && rel.properties?.[weightProperty]
        ? rel.properties[weightProperty]
        : 1;

      graph.get(rel.startNode)?.push({
        to: rel.endNode,
        weight,
        relationshipId: rel.id,
        type: rel.type
      });

      // For undirected traversal (most common in GDS)
      graph.get(rel.endNode)?.push({
        to: rel.startNode,
        weight,
        relationshipId: rel.id,
        type: rel.type
      });
    }
  });

  // Run Dijkstra's algorithm (mock implementation)
  const paths = findShortestPaths(graph, sourceNode, targetNode, maxDepth, kPaths);

  const results = paths.map(path => {
    const nodeIds = path.nodes;
    const relationshipIds = path.relationships;
    const pathNodes = nodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean);
    const pathRels = relationshipIds.map(id =>
      relationships.find(r => r.id === id)
    ).filter(Boolean);

    return {
      sourceNode,
      targetNode,
      nodeIds,
      relationshipIds,
      nodes: pathNodes,
      relationships: pathRels,
      pathLength: nodeIds.length - 1,
      totalCost: path.cost,
      pathDescription: nodeIds.map(id => {
        const node = nodes.find(n => n.id === id);
        return node?.properties?.name || id;
      }).join(' → ')
    };
  });

  return {
    algorithmType: ALGORITHM_TYPES.SHORTEST_PATH,
    projectionName,
    config,
    executedAt: new Date().toISOString(),
    resultCount: results.length,
    results,
    stats: {
      pathsFound: results.length,
      algorithm,
      weighted: !!weightProperty,
      maxDepth
    }
  };
};

/**
 * Helper function to find shortest paths using a simplified Dijkstra's algorithm
 * @param {Map} graph - Adjacency list representation
 * @param {string} start - Start node ID
 * @param {string} end - End node ID
 * @param {number} maxDepth - Maximum path length
 * @param {number} k - Number of paths to find
 * @returns {Array} Array of paths
 */
function findShortestPaths(graph, start, end, maxDepth, k = 1) {
  const paths = [];
  const queue = [{ node: start, cost: 0, path: [start], relationships: [] }];
  const visited = new Set();

  while (queue.length > 0 && paths.length < k) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();

    if (current.path.length > maxDepth) continue;

    const stateKey = `${current.node}-${current.path.length}`;
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);

    if (current.node === end) {
      paths.push({
        nodes: current.path,
        relationships: current.relationships,
        cost: current.cost
      });
      continue;
    }

    const neighbors = graph.get(current.node) || [];
    for (const neighbor of neighbors) {
      if (!current.path.includes(neighbor.to)) {
        queue.push({
          node: neighbor.to,
          cost: current.cost + neighbor.weight,
          path: [...current.path, neighbor.to],
          relationships: [...current.relationships, neighbor.relationshipId]
        });
      }
    }
  }

  return paths;
}

/**
 * Drop a GDS projection
 * @param {string} projectionName - The projection name
 * @returns {Promise<Object>} Result of the drop operation
 */
export const dropGdsProjection = async (projectionName) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  if (!activeProjections.has(projectionName)) {
    throw new Error(`Projection ${projectionName} not found`);
  }

  activeProjections.delete(projectionName);

  console.log(`[GDS Service] Dropped projection: ${projectionName}`);

  return {
    projectionName,
    dropped: true,
    droppedAt: new Date().toISOString()
  };
};

/**
 * Get all active projections
 * @returns {Array} List of active projection names
 */
export const getActiveProjections = () => {
  return Array.from(activeProjections.keys());
};

/**
 * Clear all projections (for testing)
 * @returns {number} Number of projections cleared
 */
export const clearAllProjections = () => {
  const count = activeProjections.size;
  activeProjections.clear();
  console.log(`[GDS Service] Cleared all projections (${count})`);
  return count;
};
