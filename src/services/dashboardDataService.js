import neo4j from 'neo4j-driver';

const NEO4J_CONFIG = {
  uri: 'bolt://localhost:7687',
  username: 'neo4j',
  password: '14071407',
  database: 'test'
};

let driver = null;

// Initialize Neo4j driver
const getDriver = () => {
  if (!driver) {
    driver = neo4j.driver(
      NEO4J_CONFIG.uri,
      neo4j.auth.basic(NEO4J_CONFIG.username, NEO4J_CONFIG.password)
    );
  }
  return driver;
};

// Helper function to run a query with its own session
const runQuery = async (query) => {
  const driver = getDriver();
  const session = driver.session({ database: NEO4J_CONFIG.database });
  try {
    const result = await session.run(query);
    return result;
  } finally {
    await session.close();
  }
};

// Fetch all dashboard data
export const fetchDashboardData = async () => {
  const driver = getDriver();

  try {
    // Run queries sequentially with separate sessions
    const totalNodesResult = await runQuery('MATCH (n) RETURN count(n) as count');
    const totalRelationshipsResult = await runQuery('MATCH ()-[r]->() RETURN count(r) as count');
    const nodeTypesResult = await runQuery('MATCH (n) RETURN labels(n)[0] as type, count(n) as count ORDER BY count DESC');
    const relationshipTypesResult = await runQuery('MATCH ()-[r]->() RETURN type(r) as type, count(r) as count ORDER BY count DESC');
    const cityPopulationsResult = await runQuery('MATCH (c:City) RETURN c.name as city, c.population as population ORDER BY c.population DESC');
    const mostVisitedCitiesResult = await runQuery('MATCH (p:Person)-[:VISITED]->(c:City) RETURN c.name as city, count(p) as visitors ORDER BY visitors DESC');
    const peopleByOccupationResult = await runQuery('MATCH (p:Person) RETURN p.occupation as occupation, count(p) as count ORDER BY count DESC');
    const roadConnectionsResult = await runQuery(`
      MATCH (c1:City)-[r:ROAD]->(c2:City)
      RETURN c1.name as from, c2.name as to, r.distance as distance, r.time as time
      ORDER BY r.distance DESC
      LIMIT 15
    `);

    // Helper function to convert Neo4j Integer to JS number
    const toNumber = (value) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return value;
      if (neo4j.isInt(value)) return value.toNumber();
      return Number(value);
    };

    // Process results
    const dashboardData = {
      totalNodes: toNumber(totalNodesResult.records[0]?.get('count')) || 0,
      totalRelationships: toNumber(totalRelationshipsResult.records[0]?.get('count')) || 0,

      nodeTypes: nodeTypesResult.records.map(record => ({
        type: record.get('type'),
        count: toNumber(record.get('count'))
      })),

      relationshipTypes: relationshipTypesResult.records.map(record => ({
        type: record.get('type'),
        count: toNumber(record.get('count'))
      })),

      cityPopulations: cityPopulationsResult.records.map(record => ({
        city: record.get('city'),
        population: toNumber(record.get('population'))
      })),

      mostVisitedCities: mostVisitedCitiesResult.records.map(record => ({
        city: record.get('city'),
        visitors: toNumber(record.get('visitors'))
      })),

      peopleByOccupation: peopleByOccupationResult.records.map(record => ({
        occupation: record.get('occupation'),
        count: toNumber(record.get('count'))
      })),

      roadConnections: roadConnectionsResult.records.map(record => ({
        from: record.get('from'),
        to: record.get('to'),
        distance: toNumber(record.get('distance')),
        time: toNumber(record.get('time'))
      }))
    };

    return dashboardData;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error(`Failed to fetch dashboard data: ${error.message}`);
  }
};

// Get specific metric
export const fetchMetric = async (metricName) => {
  try {
    let query = '';

    switch (metricName) {
      case 'totalNodes':
        query = 'MATCH (n) RETURN count(n) as value';
        break;
      case 'totalRelationships':
        query = 'MATCH ()-[r]->() RETURN count(r) as value';
        break;
      case 'nodeTypes':
        query = 'MATCH (n) RETURN labels(n)[0] as label, count(n) as value';
        break;
      default:
        throw new Error(`Unknown metric: ${metricName}`);
    }

    const result = await runQuery(query);
    return result.records;
  } catch (error) {
    console.error(`Error fetching metric ${metricName}:`, error);
    throw error;
  }
};

// Close driver connection
export const closeDashboardConnection = async () => {
  if (driver) {
    await driver.close();
    driver = null;
  }
};
