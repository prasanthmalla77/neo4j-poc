import { fetchGraphData } from './neo4jService';

// Hardcoded query mapping for POC
const HARDCODED_QUERIES = {
  'show me all materials and their sites': {
    query: `MATCH (n)
WHERE n:Material OR n:Site
OPTIONAL MATCH (n)-[r]-(connected)
WHERE connected:Material OR connected:Site OR connected:MaterialLocation
RETURN n, r, connected
LIMIT 100`,
    description: 'Fetching all materials and sites with their relationships'
  },
  'show supply chain network': {
    query: `MATCH (n)
WHERE n:Material OR n:Site OR n:Market OR n:Warehouse
OPTIONAL MATCH (n)-[r]-(connected)
RETURN n, r, connected
LIMIT 150`,
    description: 'Fetching complete supply chain network'
  },
  'show materials with inventory': {
    query: `MATCH (n)
WHERE n:Material OR n:InventoryActuals OR n:Site
OPTIONAL MATCH (n)-[r]-(connected)
WHERE connected:Material OR connected:InventoryActuals OR connected:Site
RETURN n, r, connected
LIMIT 100`,
    description: 'Fetching materials with inventory at sites'
  }
};

// Generate NLP answer based on graph data
const generateNLPAnswer = (userQuestion, graphData) => {
  const nodeCount = graphData.nodes.length;
  const relCount = graphData.relationships.length;

  // Analyze node types
  const nodeTypes = graphData.nodes.reduce((acc, node) => {
    const label = node.labels[0];
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  // Analyze relationships
  const relTypes = graphData.relationships.reduce((acc, rel) => {
    acc[rel.type] = (acc[rel.type] || 0) + 1;
    return acc;
  }, {});

  // Build natural language answer
  let answer = "";

  // Opening statement based on question type
  const normalizedQ = userQuestion.toLowerCase();
  if (normalizedQ.includes('material') && normalizedQ.includes('site')) {
    answer = `I found **${nodeCount} entities** in your supply chain network. `;
  } else if (normalizedQ.includes('supply chain')) {
    answer = `Your supply chain network contains **${nodeCount} nodes** connected by **${relCount} relationships**. `;
  } else if (normalizedQ.includes('inventory')) {
    answer = `Based on the inventory analysis, I discovered **${nodeCount} entities** across your system. `;
  } else {
    answer = `I've analyzed your graph database and found **${nodeCount} nodes** with **${relCount} relationships**. `;
  }

  // Detailed breakdown
  const nodeBreakdown = Object.entries(nodeTypes)
    .map(([label, count]) => `**${count}** ${label}${count > 1 ? 's' : ''}`)
    .join(', ');

  answer += `This includes ${nodeBreakdown}. `;

  // Relationship insights
  if (relCount > 0) {
    const topRelType = Object.entries(relTypes).sort((a, b) => b[1] - a[1])[0];
    answer += `\n\nThe network has **${relCount}** connections, with the most common relationship being "${topRelType[0]}" (${topRelType[1]} instances). `;
  }

  // Specific insights based on node types
  if (nodeTypes['Material']) {
    answer += `\n\n🏭 **Material Insights:** Found ${nodeTypes['Material']} material${nodeTypes['Material'] > 1 ? 's' : ''} in the network. `;
  }

  if (nodeTypes['Site']) {
    answer += `These materials are distributed across ${nodeTypes['Site']} production site${nodeTypes['Site'] > 1 ? 's' : ''}. `;
  }

  if (nodeTypes['InventoryActuals']) {
    answer += `\n\n📦 **Inventory Status:** ${nodeTypes['InventoryActuals']} inventory record${nodeTypes['InventoryActuals'] > 1 ? 's are' : ' is'} available showing current stock levels. `;
  }

  if (nodeTypes['Market']) {
    answer += `\n\n🌍 **Market Coverage:** The supply chain serves ${nodeTypes['Market']} market${nodeTypes['Market'] > 1 ? 's' : ''}. `;
  }

  if (nodeTypes['Warehouse']) {
    answer += `Materials are stored in ${nodeTypes['Warehouse']} warehouse${nodeTypes['Warehouse'] > 1 ? 's' : ''}. `;
  }

  // Closing statement
  answer += `\n\nYou can explore the interactive graph visualization to see how these entities are connected and analyze the relationships in detail.`;

  return answer;
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
    queryInfo = HARDCODED_QUERIES['show me all materials and their sites'];
  }

  // Execute the query and get graph data
  try {
    const graphData = await executeCustomQuery(queryInfo.query);

    // Generate NLP answer
    const nlpAnswer = generateNLPAnswer(userQuestion, graphData);

    return {
      query: queryInfo.query,
      description: queryInfo.description,
      graphData: graphData,
      nlpAnswer: nlpAnswer
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
    'Material': '#4CAF50',
    'Site': '#0B6FCC',
    'Market': '#FF9800',
    'Warehouse': '#9C27B0',
    'MaterialLocation': '#00BCD4',
    'InventoryActuals': '#F44336',
    'Forecast': '#FFC107',
    'ActualSales': '#E91E63',
    'ProductionActuals': '#673AB7',
    'BOM': '#795548',
    'Organisation': '#607D8B',
    'PerformanceMetric': '#009688'
  };
  return colorMap[label] || '#999999';
};
