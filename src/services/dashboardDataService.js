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
export const fetchDashboardData = async (queryType = 'all') => {
  const driver = getDriver();

  try {
    // Base queries (always run)
    const totalNodesResult = await runQuery('MATCH (n) RETURN count(n) as count');
    const totalRelationshipsResult = await runQuery('MATCH ()-[r]->() RETURN count(r) as count');
    const nodeTypesResult = await runQuery('MATCH (n) RETURN labels(n)[0] as type, count(n) as count ORDER BY count DESC');
    const relationshipTypesResult = await runQuery('MATCH ()-[r]->() RETURN type(r) as type, count(r) as count ORDER BY count DESC');

    // Context-specific KPIs
    const totalMaterialsResult = await runQuery('MATCH (m:Material) RETURN count(m) as count');
    const totalSitesResult = await runQuery('MATCH (s:Site) RETURN count(s) as count');
    const totalMarketsResult = await runQuery('MATCH (m:Market) RETURN count(m) as count');
    const totalInventoryResult = await runQuery('MATCH (ia:InventoryActuals) RETURN sum(ia.quantity) as total');

    // Query-specific analytics
    let materialInventoryResult, sitesWithMaterialsResult, topForecastsResult, supplyChainConnectionsResult;

    if (queryType === 'materials-sites') {
      // Analytics for "Materials & Sites" - Production Network Analysis

      // Chart 1: Material Distribution Across Sites (Supply Diversification Risk)
      materialInventoryResult = await runQuery(`
        MATCH (m:Material)-[:HAS_MATERIAL_LOCATION]->(ml:MaterialLocation)-[:LOCATED_AT]->(s:Site)
        WITH m, count(DISTINCT s) as siteCount
        RETURN m.name as material, siteCount as inventory
        ORDER BY siteCount DESC LIMIT 10
      `);

      // Chart 2: Site Production Capacity vs Actual Production
      sitesWithMaterialsResult = await runQuery(`
        MATCH (s:Site)-[:HAS_PRODUCTION_ACTUALS]->(p:ProductionActuals)
        OPTIONAL MATCH (s)<-[:LOCATED_AT]-(ml:MaterialLocation)
        WITH s, sum(p.quantity) as actualProduction, count(DISTINCT ml) as capacity
        RETURN s.name as site,
               actualProduction as production,
               capacity as capacity
        ORDER BY actualProduction DESC
      `);

      // Chart 3: Top Materials by Production Volume
      topForecastsResult = await runQuery(`
        MATCH (m:Material)<-[:produces]-(p:ProductionActuals)
        RETURN m.name as material, sum(p.quantity) as value
        ORDER BY value DESC LIMIT 8
      `);

      // Chart 4: Site Utilization Insights (Multi-material sites)
      supplyChainConnectionsResult = await runQuery(`
        MATCH (s:Site)<-[:LOCATED_AT]-(ml:MaterialLocation)<-[:HAS_MATERIAL_LOCATION]-(m:Material)
        WITH s, m, ml
        MATCH (s)-[:HAS_PRODUCTION_ACTUALS]->(p:ProductionActuals)
        RETURN s.name as site, m.name as material,
               sum(p.quantity) as production,
               'Produces' as relationship
        ORDER BY production DESC
        LIMIT 15
      `);
    } else if (queryType === 'supply-chain') {
      // Analytics for "Supply Chain Network" - End-to-End Flow Analysis

      // Chart 1: Forecast vs Actual Sales by Market (Demand Planning Accuracy)
      materialInventoryResult = await runQuery(`
        MATCH (mk:Market)<-[:marketOfSale]-(f:Forecast)
        OPTIONAL MATCH (mk)<-[:marketOfSale]-(s:ActualSales)
        WITH mk,
             sum(f.forecast_qty) as totalForecast,
             sum(s.sales_qty) as totalSales
        RETURN mk.name as market,
               toInteger(coalesce(totalForecast, 0)) as forecast,
               toInteger(coalesce(totalSales, 0)) as actual
        ORDER BY forecast DESC LIMIT 10
      `);

      // Chart 2: Supplier Network Health (Materials per Supplier)
      sitesWithMaterialsResult = await runQuery(`
        MATCH (org:Organisation)-[:supplies]->(m:Material)
        RETURN org.name as supplier,
               count(DISTINCT m) as materialCount
        ORDER BY materialCount DESC
      `);

      // Chart 3: Market Forecast Accuracy (% Variance)
      topForecastsResult = await runQuery(`
        MATCH (mk:Market)<-[:marketOfSale]-(f:Forecast)
        MATCH (mk)<-[:marketOfSale]-(s:ActualSales)
        WITH mk,
             sum(f.forecast_qty) as totalForecast,
             sum(s.sales_qty) as totalSales
        WHERE totalForecast > 0
        WITH mk, totalForecast, totalSales,
             toInteger(abs((totalForecast - totalSales) * 100.0 / totalForecast)) as variance
        RETURN mk.name as market, variance as value
        ORDER BY variance DESC LIMIT 10
      `);

      // Chart 4: Complete Supply Chain Flow
      supplyChainConnectionsResult = await runQuery(`
        MATCH (org:Organisation)-[:supplies]->(m:Material)-[:HAS_FORECAST]->(f:Forecast)-[:marketOfSale]->(mk:Market)
        RETURN org.name as supplier,
               m.name as material,
               mk.name as market,
               f.forecast_qty as demand,
               'Supplier→Material→Market' as relationship
        ORDER BY demand DESC
        LIMIT 15
      `);
    } else if (queryType === 'materials-inventory') {
      // Analytics for "Materials with Inventory" - Stock Health & Optimization

      // Chart 1: Top Materials by Inventory Levels
      materialInventoryResult = await runQuery(`
        MATCH (m:Material)<-[:HAS_MATERIAL]-(ia:InventoryActuals)
        RETURN m.name as material, sum(ia.quantity) as inventory
        ORDER BY inventory DESC LIMIT 10
      `);

      // Chart 2: Inventory vs Production Ratio by Material (Stock Efficiency)
      sitesWithMaterialsResult = await runQuery(`
        MATCH (m:Material)<-[:HAS_MATERIAL]-(ia:InventoryActuals)
        OPTIONAL MATCH (m)<-[:produces]-(p:ProductionActuals)
        WITH m, sum(ia.quantity) as totalInventory, sum(p.quantity) as totalProduction
        WHERE totalProduction > 0
        RETURN m.name as material,
               toInteger(totalInventory) as inventory,
               toInteger(totalProduction) as production
        ORDER BY inventory DESC LIMIT 10
      `);

      // Chart 3: Stockout Risk Analysis (Low Inventory Materials)
      topForecastsResult = await runQuery(`
        MATCH (m:Material)<-[:HAS_MATERIAL]-(ia:InventoryActuals)
        OPTIONAL MATCH (m)-[:HAS_ACTUAL_SALES]->(s:ActualSales)
        WITH m, sum(ia.quantity) as totalInventory, sum(s.sales_qty) as totalSales
        WHERE totalSales > 0 AND totalInventory > 0
        WITH m, totalInventory, totalSales,
             toInteger((totalInventory * 100.0) / totalSales) as coverage
        RETURN m.name as material, coverage as value
        ORDER BY coverage ASC LIMIT 10
      `);

      // Chart 4: Site-Level Inventory Distribution
      supplyChainConnectionsResult = await runQuery(`
        MATCH (s:Site)-[:HAS_INVENTORY_ACTUALS]->(ia:InventoryActuals)-[:HAS_MATERIAL]->(m:Material)
        RETURN s.name as site,
               m.name as material,
               ia.quantity as quantity,
               'Stock: ' + toString(ia.quantity) + ' units' as relationship
        ORDER BY quantity DESC
        LIMIT 15
      `);
    } else {
      // Default: "All Data" - Comprehensive Supply Chain Overview

      // Chart 1: Material Performance Score (Inventory + Production + Sales)
      materialInventoryResult = await runQuery(`
        MATCH (m:Material)
        OPTIONAL MATCH (m)<-[:HAS_MATERIAL]-(ia:InventoryActuals)
        OPTIONAL MATCH (m)<-[:produces]-(p:ProductionActuals)
        OPTIONAL MATCH (m)-[:HAS_ACTUAL_SALES]->(s:ActualSales)
        WITH m,
             sum(ia.quantity) as inv,
             sum(p.quantity) as prod,
             sum(s.sales_qty) as sales
        WHERE inv > 0 OR prod > 0 OR sales > 0
        RETURN m.name as material,
               toInteger(coalesce(inv, 0) + coalesce(prod, 0) + coalesce(sales, 0)) as inventory
        ORDER BY inventory DESC LIMIT 10
      `);

      // Chart 2: Site Production vs Inventory Capacity
      sitesWithMaterialsResult = await runQuery(`
        MATCH (s:Site)
        OPTIONAL MATCH (s)-[:HAS_PRODUCTION_ACTUALS]->(p:ProductionActuals)
        OPTIONAL MATCH (s)-[:HAS_INVENTORY_ACTUALS]->(ia:InventoryActuals)
        WITH s,
             sum(p.quantity) as production,
             sum(ia.quantity) as inventory
        WHERE production > 0 OR inventory > 0
        RETURN s.name as site,
               toInteger(coalesce(production, 0)) as production,
               toInteger(coalesce(inventory, 0)) as inventory
        ORDER BY production DESC
      `);

      // Chart 3: BOM Complexity Analysis (Materials with Most Components)
      topForecastsResult = await runQuery(`
        MATCH (m:Material)-[:HAS_BOM]->(b:BOM)-[:HAS_BOM_ITEM]->(comp:Material)
        WITH m, count(DISTINCT comp) as componentCount
        RETURN m.name as material, componentCount as value
        ORDER BY componentCount DESC LIMIT 10
      `);

      // Chart 4: End-to-End Supply Chain Connections
      supplyChainConnectionsResult = await runQuery(`
        MATCH (org:Organisation)-[:supplies]->(m:Material)
        OPTIONAL MATCH (m)-[:HAS_BOM]->(b:BOM)-[:HAS_BOM_ITEM]->(comp:Material)
        RETURN org.name as supplier,
               m.name as material,
               comp.name as component,
               'Supplier→Material→Component' as relationship
        LIMIT 15
      `);
    }

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
      totalMaterials: toNumber(totalMaterialsResult.records[0]?.get('count')) || 0,
      totalSites: toNumber(totalSitesResult.records[0]?.get('count')) || 0,
      totalMarkets: toNumber(totalMarketsResult.records[0]?.get('count')) || 0,
      totalInventory: toNumber(totalInventoryResult.records[0]?.get('total')) || 0,

      nodeTypes: nodeTypesResult.records.map(record => ({
        type: record.get('type'),
        count: toNumber(record.get('count'))
      })),

      relationshipTypes: relationshipTypesResult.records.map(record => ({
        type: record.get('type'),
        count: toNumber(record.get('count'))
      })),

      materialInventory: materialInventoryResult.records.map(record => {
        const keys = record.keys;

        // Get the label field (could be 'material' or 'market')
        let materialLabel = 'Unknown';
        if (keys.includes('material')) {
          materialLabel = record.get('material') || 'Unknown';
        } else if (keys.includes('market')) {
          materialLabel = record.get('market') || 'Unknown';
        }

        return {
          material: materialLabel,
          inventory: keys.includes('inventory') ? toNumber(record.get('inventory')) : (keys.includes('count') ? toNumber(record.get('count')) : 0),
          forecast: keys.includes('forecast') ? toNumber(record.get('forecast')) : 0,
          actual: keys.includes('actual') ? toNumber(record.get('actual')) : 0
        };
      }),

      sitesWithMaterials: sitesWithMaterialsResult.records.map(record => {
        const keys = record.keys;

        // Get the label field (could be 'site', 'supplier', or 'material')
        let siteLabel = 'Unknown';
        if (keys.includes('site')) {
          siteLabel = record.get('site') || 'Unknown';
        } else if (keys.includes('supplier')) {
          siteLabel = record.get('supplier') || 'Unknown';
        } else if (keys.includes('material')) {
          siteLabel = record.get('material') || 'Unknown';
        }

        return {
          site: siteLabel,
          materialCount: keys.includes('materialCount') ? toNumber(record.get('materialCount')) : 0,
          production: keys.includes('production') ? toNumber(record.get('production')) : 0,
          inventory: keys.includes('inventory') ? toNumber(record.get('inventory')) : 0,
          capacity: keys.includes('capacity') ? toNumber(record.get('capacity')) : 0
        };
      }),

      topForecasts: topForecastsResult.records.map(record => {
        const keys = record.keys;

        // Get the label field (could be 'material' or 'market')
        let materialLabel = 'Unknown';
        if (keys.includes('material')) {
          materialLabel = record.get('material') || 'Unknown';
        } else if (keys.includes('market')) {
          materialLabel = record.get('market') || 'Unknown';
        }

        return {
          material: materialLabel,
          forecast: keys.includes('forecast') ? toNumber(record.get('forecast')) : 0,
          value: keys.includes('value') ? toNumber(record.get('value')) : 0
        };
      }),

      supplyChainConnections: supplyChainConnectionsResult.records.map(record => {
        const keys = record.keys;

        // Safely get supplier/site field
        let supplierValue = 'Unknown';
        if (keys.includes('supplier')) {
          supplierValue = record.get('supplier') || 'Unknown';
        } else if (keys.includes('site')) {
          supplierValue = record.get('site') || 'Unknown';
        }

        // Safely get market/component/site field
        let marketValue = 'Unknown';
        if (keys.includes('market')) {
          marketValue = record.get('market') || 'Unknown';
        } else if (keys.includes('component')) {
          marketValue = record.get('component') || 'Unknown';
        } else if (keys.includes('site') && !keys.includes('supplier')) {
          marketValue = record.get('site') || 'Unknown';
        }

        return {
          supplier: supplierValue,
          material: record.get('material') || 'Unknown',
          market: marketValue,
          relationship: record.get('relationship') || 'Connected',
          production: keys.includes('production') ? toNumber(record.get('production')) : 0,
          demand: keys.includes('demand') ? toNumber(record.get('demand')) : 0,
          quantity: keys.includes('quantity') ? toNumber(record.get('quantity')) : 0
        };
      })
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
