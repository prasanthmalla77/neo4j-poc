// Neo4j Connection Service
// Handles direct connection to Neo4j database

import neo4j from 'neo4j-driver';

// Neo4j connection configuration
const NEO4J_CONFIG = {
  uri: 'bolt://localhost:7687',
  username: 'neo4j',
  password: '14071407', // Updated with your Neo4j password
  database: 'test'
};

let driver = null;

/**
 * Initialize Neo4j driver
 * @param {Object} config - Optional custom configuration
 * @returns {Object} Neo4j driver instance
 */
export const initDriver = (config = NEO4J_CONFIG) => {
  if (!driver) {
    driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000 // 2 minutes
      }
    );
    console.log('[Neo4j Service] Driver initialized');
  }
  return driver;
};

/**
 * Test connection to Neo4j
 * @returns {Promise<Boolean>} Connection success status
 */
export const testConnection = async () => {
  try {
    const driver = initDriver();
    const session = driver.session();

    const result = await session.run('RETURN 1 as test');
    await session.close();

    console.log('[Neo4j Service] Connection successful');
    return true;
  } catch (error) {
    console.error('[Neo4j Service] Connection failed:', error.message);
    return false;
  }
};

/**
 * Fetch filtered graph data from Neo4j with specific node labels and relationship types
 * @param {String} jobId - Job identifier
 * @param {Array<String>} nodeLabels - Array of node labels to fetch (e.g., ['Drug', 'Country'])
 * @param {Array<String>} relationshipTypes - Array of relationship types to fetch (e.g., ['APPROVED_IN'])
 * @returns {Promise<Object>} Filtered job data
 */
export const fetchFilteredGraphData = async (jobId = 'neo4j_job_001', nodeLabels = [], relationshipTypes = []) => {
  const driver = initDriver();
  const session = driver.session({ database: NEO4J_CONFIG.database });

  try {
    let nodesResult, relsResult;

    if (nodeLabels.length === 0) {
      // If no labels specified, fetch all nodes
      nodesResult = await session.run(`
        MATCH (n)
        RETURN
          id(n) as id,
          labels(n) as labels,
          properties(n) as properties
      `);
    } else {
      // Build WHERE clause for multiple labels using OR
      const labelConditions = nodeLabels.map((label, idx) => `'${label}' IN labels(n)`).join(' OR ');

      nodesResult = await session.run(`
        MATCH (n)
        WHERE ${labelConditions}
        RETURN
          id(n) as id,
          labels(n) as labels,
          properties(n) as properties
      `);
    }

    if (relationshipTypes.length === 0) {
      // If no types specified, fetch all relationships
      relsResult = await session.run(`
        MATCH (start)-[r]->(end)
        RETURN
          id(r) as id,
          type(r) as type,
          id(start) as startNode,
          id(end) as endNode,
          properties(r) as properties
      `);
    } else {
      // Build WHERE clause for multiple relationship types
      const typeConditions = relationshipTypes.map(type => `type(r) = '${type}'`).join(' OR ');

      relsResult = await session.run(`
        MATCH (start)-[r]->(end)
        WHERE ${typeConditions}
        RETURN
          id(r) as id,
          type(r) as type,
          id(start) as startNode,
          id(end) as endNode,
          properties(r) as properties
      `);
    }

    // Transform nodes
    const nodes = nodesResult.records.map(record => ({
      id: record.get('id').toString(),
      labels: record.get('labels'),
      properties: record.get('properties')
    }));

    // Transform relationships
    const relationships = relsResult.records.map(record => ({
      id: record.get('id').toString(),
      type: record.get('type'),
      startNode: record.get('startNode').toString(),
      endNode: record.get('endNode').toString(),
      properties: record.get('properties')
    }));

    // Filter relationships to only include those connecting filtered nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    const filteredRelationships = relationships.filter(rel =>
      nodeIds.has(rel.startNode) && nodeIds.has(rel.endNode)
    );

    // Get available algorithms
    const availableAlgorithms = [
      {
        id: 'nodeSimilarity',
        name: 'Node Similarity',
        description: 'Find similar nodes based on their neighborhoods',
        category: 'similarity',
        tier: 'beta'
      },
      {
        id: 'shortestPath',
        name: 'Shortest Path',
        description: 'Find shortest path between two nodes',
        category: 'path-finding',
        tier: 'production'
      }
    ];

    await session.close();

    console.log(`[Neo4j Service] Fetched ${nodes.length} nodes and ${filteredRelationships.length} relationships (filtered)`);

    return {
      jobId,
      createdAt: new Date().toISOString(),
      status: 'ready',
      nodes,
      relationships: filteredRelationships,
      availableAlgorithms
    };
  } catch (error) {
    console.error('[Neo4j Service] Error fetching filtered graph data:', error);
    await session.close();
    throw error;
  }
};

/**
 * Fetch job data from Neo4j (nodes and relationships)
 * @param {String} jobId - Job identifier (optional, for filtering)
 * @returns {Promise<Object>} Job data with nodes and relationships
 */
export const fetchGraphData = async (jobId = 'neo4j_job_001') => {
  const driver = initDriver();
  const session = driver.session({ database: NEO4J_CONFIG.database });

  try {
    // Fetch all nodes
    const nodesResult = await session.run(`
      MATCH (n)
      RETURN
        id(n) as id,
        labels(n) as labels,
        properties(n) as properties
    `);

    // Fetch all relationships
    const relsResult = await session.run(`
      MATCH (start)-[r]->(end)
      RETURN
        id(r) as id,
        type(r) as type,
        id(start) as startNode,
        id(end) as endNode,
        properties(r) as properties
    `);

    // Transform nodes
    const nodes = nodesResult.records.map(record => ({
      id: record.get('id').toString(),
      labels: record.get('labels'),
      properties: record.get('properties')
    }));

    // Transform relationships
    const relationships = relsResult.records.map(record => ({
      id: record.get('id').toString(),
      type: record.get('type'),
      startNode: record.get('startNode').toString(),
      endNode: record.get('endNode').toString(),
      properties: record.get('properties')
    }));

    // Get available algorithms (hardcoded for now)
    const availableAlgorithms = [
      {
        id: 'nodeSimilarity',
        name: 'Node Similarity',
        description: 'Find similar nodes based on their neighborhoods',
        category: 'similarity',
        tier: 'beta'
      },
      {
        id: 'shortestPath',
        name: 'Shortest Path',
        description: 'Find shortest path between two nodes',
        category: 'path-finding',
        tier: 'production'
      }
    ];

    await session.close();

    console.log(`[Neo4j Service] Fetched ${nodes.length} nodes and ${relationships.length} relationships`);

    return {
      jobId,
      createdAt: new Date().toISOString(),
      status: 'ready',
      nodes,
      relationships,
      availableAlgorithms
    };
  } catch (error) {
    console.error('[Neo4j Service] Error fetching graph data:', error);
    await session.close();
    throw error;
  }
};

/**
 * Execute a custom Cypher query
 * @param {String} query - Cypher query string
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export const executeQuery = async (query, params = {}) => {
  const driver = initDriver();
  const session = driver.session({ database: NEO4J_CONFIG.database });

  try {
    const result = await session.run(query, params);
    await session.close();

    return result.records.map(record => record.toObject());
  } catch (error) {
    console.error('[Neo4j Service] Query execution failed:', error);
    await session.close();
    throw error;
  }
};

/**
 * Create a GDS projection in Neo4j
 * @param {String} projectionName - Name for the projection
 * @param {String} nodeQuery - Cypher query for nodes
 * @param {String} relationshipQuery - Cypher query for relationships
 * @returns {Promise<Object>} Projection info
 */
export const createGdsProjection = async (projectionName, nodeQuery = '*', relationshipQuery = '*') => {
  const driver = initDriver();
  const session = driver.session({ database: NEO4J_CONFIG.database });

  try {
    // Drop existing projection if it exists
    try {
      await session.run(`CALL gds.graph.drop('${projectionName}')`);
      console.log(`[Neo4j Service] Dropped existing projection: ${projectionName}`);
    } catch (e) {
      // Projection doesn't exist, continue
    }

    // Create new projection
    const result = await session.run(`
      CALL gds.graph.project(
        '${projectionName}',
        '${nodeQuery}',
        '${relationshipQuery}'
      )
      YIELD graphName, nodeCount, relationshipCount
      RETURN graphName, nodeCount, relationshipCount
    `);

    const record = result.records[0];
    const projection = {
      name: record.get('graphName'),
      nodeCount: record.get('nodeCount').toNumber(),
      relationshipCount: record.get('relationshipCount').toNumber(),
      createdAt: new Date().toISOString(),
      status: 'ready'
    };

    await session.close();

    console.log(`[Neo4j Service] Created GDS projection: ${projectionName}`);
    return projection;
  } catch (error) {
    console.error('[Neo4j Service] Failed to create GDS projection:', error);
    await session.close();
    throw error;
  }
};

/**
 * Run Node Similarity algorithm using GDS
 * @param {String} projectionName - GDS projection name
 * @param {Object} config - Algorithm configuration
 * @returns {Promise<Array>} Similarity results
 */
export const runNodeSimilarityGds = async (projectionName, config) => {
  const driver = initDriver();
  const session = driver.session({ database: NEO4J_CONFIG.database });

  try {
    const {
      similarityMetric = 'JACCARD',
      topK = 10,
      similarityThreshold = 0.5
    } = config;

    const query = `
      CALL gds.nodeSimilarity.stream('${projectionName}', {
        similarityMetric: '${similarityMetric.toUpperCase()}',
        topK: ${topK},
        similarityCutoff: ${similarityThreshold}
      })
      YIELD node1, node2, similarity
      RETURN
        gds.util.asNode(node1).id as node1Id,
        gds.util.asNode(node2).id as node2Id,
        similarity
      ORDER BY similarity DESC
      LIMIT ${topK}
    `;

    const result = await session.run(query);
    await session.close();

    return result.records.map(record => ({
      node1: record.get('node1Id'),
      node2: record.get('node2Id'),
      score: record.get('similarity')
    }));
  } catch (error) {
    console.error('[Neo4j Service] Node Similarity failed:', error);
    await session.close();
    throw error;
  }
};

/**
 * Run Shortest Path algorithm using GDS
 * @param {String} projectionName - GDS projection name
 * @param {Object} config - Algorithm configuration
 * @returns {Promise<Object>} Path results
 */
export const runShortestPathGds = async (projectionName, config) => {
  const driver = initDriver();
  const session = driver.session({ database: NEO4J_CONFIG.database });

  try {
    const {
      sourceNode,
      targetNode,
      weightProperty = null
    } = config;

    // First, get the internal IDs from the node IDs
    const sourceQuery = await session.run(
      `MATCH (n) WHERE id(n) = toInteger($nodeId) RETURN n`,
      { nodeId: sourceNode }
    );

    const targetQuery = await session.run(
      `MATCH (n) WHERE id(n) = toInteger($nodeId) RETURN n`,
      { nodeId: targetNode }
    );

    if (sourceQuery.records.length === 0 || targetQuery.records.length === 0) {
      throw new Error('Source or target node not found');
    }

    const weightClause = weightProperty ? `, relationshipWeightProperty: '${weightProperty}'` : '';

    const query = `
      MATCH (source) WHERE id(source) = toInteger($sourceId)
      MATCH (target) WHERE id(target) = toInteger($targetId)
      CALL gds.shortestPath.dijkstra.stream('${projectionName}', {
        sourceNode: source,
        targetNode: target
        ${weightClause}
      })
      YIELD index, sourceNode, targetNode, totalCost, nodeIds, costs, path
      RETURN
        nodeIds,
        totalCost,
        [node IN nodes(path) | id(node)] as pathNodeIds,
        [rel IN relationships(path) | id(rel)] as pathRelIds
    `;

    const result = await session.run(query, {
      sourceId: sourceNode,
      targetId: targetNode
    });

    await session.close();

    if (result.records.length === 0) {
      return { paths: [], found: false };
    }

    const record = result.records[0];
    return {
      found: true,
      nodeIds: record.get('pathNodeIds').map(id => id.toString()),
      relationshipIds: record.get('pathRelIds').map(id => id.toString()),
      totalCost: record.get('totalCost')
    };
  } catch (error) {
    console.error('[Neo4j Service] Shortest Path failed:', error);
    await session.close();
    throw error;
  }
};

/**
 * Drop a GDS projection
 * @param {String} projectionName - Projection name to drop
 * @returns {Promise<Boolean>} Success status
 */
export const dropGdsProjection = async (projectionName) => {
  const driver = initDriver();
  const session = driver.session({ database: NEO4J_CONFIG.database });

  try {
    await session.run(`CALL gds.graph.drop('${projectionName}')`);
    await session.close();

    console.log(`[Neo4j Service] Dropped projection: ${projectionName}`);
    return true;
  } catch (error) {
    console.error('[Neo4j Service] Failed to drop projection:', error);
    await session.close();
    return false;
  }
};

/**
 * Close the Neo4j driver connection
 */
export const closeDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('[Neo4j Service] Driver closed');
  }
};

// Export configuration for external use
export { NEO4J_CONFIG };
