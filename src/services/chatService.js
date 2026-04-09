import { fetchGraphData } from './neo4jService';

// Hardcoded query mapping for POC
const HARDCODED_QUERIES = {
  'give me all details of all cities and persons': {
    query: `MATCH (n)
WHERE n:City OR n:Person
OPTIONAL MATCH (n)-[r]-(connected)
WHERE connected:City OR connected:Person
RETURN n, r, connected`,
    description: 'Fetching all cities and persons with their relationships'
  }
};

// Process chat query (hardcoded for POC)
export const processChatQuery = async (userQuestion) => {
  // Normalize the question
  const normalizedQuestion = userQuestion.toLowerCase().trim();

  // Find matching hardcoded query
  let queryInfo = null;
  for (const [key, value] of Object.entries(HARDCODED_QUERIES)) {
    if (normalizedQuestion.includes(key) || key.includes(normalizedQuestion)) {
      queryInfo = value;
      break;
    }
  }

  // Default query if no match found
  if (!queryInfo) {
    queryInfo = HARDCODED_QUERIES['give me all details of all cities and persons'];
  }

  // Execute the query and get graph data
  try {
    const graphData = await executeCustomQuery(queryInfo.query);

    return {
      query: queryInfo.query,
      description: queryInfo.description,
      graphData: graphData
    };
  } catch (error) {
    throw new Error(`Failed to execute query: ${error.message}`);
  }
};

// Execute custom Cypher query
const executeCustomQuery = async (cypherQuery) => {
  const neo4j = require('neo4j-driver');

  const NEO4J_CONFIG = {
    uri: 'bolt://localhost:7687',
    username: 'neo4j',
    password: '14071407',
    database: 'test'
  };

  const driver = neo4j.driver(
    NEO4J_CONFIG.uri,
    neo4j.auth.basic(NEO4J_CONFIG.username, NEO4J_CONFIG.password)
  );

  const session = driver.session({ database: NEO4J_CONFIG.database });

  try {
    const result = await session.run(cypherQuery);

    const nodesMap = new Map();
    const relationships = [];

    // Process results
    result.records.forEach(record => {
      // Extract node n
      if (record.get('n')) {
        const node = record.get('n');
        const nodeId = node.identity.toString();

        if (!nodesMap.has(nodeId)) {
          nodesMap.set(nodeId, {
            id: nodeId,
            labels: node.labels,
            properties: convertNeo4jProperties(node.properties),
            size: 30,
            color: getNodeColor(node.labels[0])
          });
        }
      }

      // Extract connected node
      if (record.get('connected')) {
        const connectedNode = record.get('connected');
        const connectedId = connectedNode.identity.toString();

        if (!nodesMap.has(connectedId)) {
          nodesMap.set(connectedId, {
            id: connectedId,
            labels: connectedNode.labels,
            properties: convertNeo4jProperties(connectedNode.properties),
            size: 30,
            color: getNodeColor(connectedNode.labels[0])
          });
        }
      }

      // Extract relationship
      if (record.get('r')) {
        const rel = record.get('r');
        relationships.push({
          id: rel.identity.toString(),
          startNode: rel.start.toString(),
          endNode: rel.end.toString(),
          from: rel.start.toString(),
          to: rel.end.toString(),
          type: rel.type,
          properties: convertNeo4jProperties(rel.properties)
        });
      }
    });

    await session.close();
    await driver.close();

    return {
      nodes: Array.from(nodesMap.values()),
      relationships: relationships
    };

  } catch (error) {
    await session.close();
    await driver.close();
    throw error;
  }
};

// Helper function to convert Neo4j properties
const convertNeo4jProperties = (properties) => {
  const converted = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value && typeof value === 'object' && value.low !== undefined) {
      // Neo4j Integer
      converted[key] = value.toNumber ? value.toNumber() : value.low;
    } else if (Array.isArray(value)) {
      converted[key] = value.map(v =>
        v && typeof v === 'object' && v.low !== undefined
          ? (v.toNumber ? v.toNumber() : v.low)
          : v
      );
    } else {
      converted[key] = value;
    }
  }
  return converted;
};

// Get node color based on label
const getNodeColor = (label) => {
  const colorMap = {
    'City': '#0B6FCC',
    'Person': '#4CAF50',
    'Company': '#FF9800',
    'Project': '#E91E63',
    'Skill': '#9C27B0'
  };
  return colorMap[label] || '#999999';
};
