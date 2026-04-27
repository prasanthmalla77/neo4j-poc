import { initDriver } from './neo4jService';

const USE_AZ_CLOUD = process.env.REACT_APP_AZ_CLOUD === 'true';
const NEO4J_DATABASE = USE_AZ_CLOUD
  ? (process.env.REACT_APP_AZ_NEO4J_DATABASE || 'neo4j')
  : (process.env.REACT_APP_NEO4J_DATABASE || 'neo4j');

// Helper function to run a query with its own session
const runQuery = async (query) => {
  const driver = await initDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    const result = await session.run(query);
    return result;
  } finally {
    await session.close();
  }
};

// Fetch all dashboard data
export const fetchDashboardData = async (queryType = 'all') => {
  try {
    // Base queries (always run)
    const totalNodesResult = await runQuery('MATCH (n) RETURN count(n) as count');
    const totalRelationshipsResult = await runQuery('MATCH ()-[r]->() RETURN count(r) as count');
    const nodeTypesResult = await runQuery('MATCH (n) RETURN labels(n)[0] as type, count(n) as count ORDER BY count DESC');
    const relationshipTypesResult = await runQuery('MATCH ()-[r]->() RETURN type(r) as type, count(r) as count ORDER BY count DESC');

    // Context-specific KPIs for Forxiga Supply Chain
    const totalMaterialsResult = await runQuery('MATCH (m:Material) RETURN count(m) as count');
    const totalFormulationSitesResult = await runQuery('MATCH (s:Formulation) RETURN count(s) as count');
    const totalMarketsResult = await runQuery('MATCH (m:Customer_Market) RETURN count(m) as count');
    const totalAPISitesResult = await runQuery('MATCH (api:API) RETURN count(api) as count');

    // Inventory and Production totals
    const totalInventoryVolumeResult = await runQuery(`
      MATCH (n)-[:HAS_INVENTORY_DATA]->(inv:InventoryDataPoints)
      RETURN sum(inv.inventory_volume_API) + sum(inv.inventory_volume_BULK) as total
    `);
    const totalProductionResult = await runQuery(`
      MATCH (n)-[:HAS_PRODUCTION_DATA]->(prod:ProductionDataPoints)
      RETURN sum(prod.production_actual) as total
    `);

    // Query-specific analytics
    let materialInventoryResult, sitesWithMaterialsResult, topForecastsResult, supplyChainConnectionsResult;

    if (queryType === 'formulation-sites') {
      // Analytics for "Formulation Sites" - Production Analysis

      // Chart 1: Top Materials by Site (Material Distribution)
      materialInventoryResult = await runQuery(`
        MATCH (form:Formulation)-[:HAS_MATERIAL]->(m:Material)
        WITH m.material_name as material, count(DISTINCT form) as siteCount
        RETURN material, siteCount as inventory
        ORDER BY siteCount DESC LIMIT 10
      `);

      // Chart 2: Formulation Sites Production Performance
      sitesWithMaterialsResult = await runQuery(`
        MATCH (form:Formulation)-[:HAS_PRODUCTION_DATA]->(prod:ProductionDataPoints)
        RETURN form.site_name as site,
               prod.production_actual as production,
               prod.production_budget as capacity
        ORDER BY production DESC LIMIT 10
      `);

      // Chart 3: Top Materials by Usage Across Formulation Sites
      topForecastsResult = await runQuery(`
        MATCH (form:Formulation)-[:HAS_MATERIAL]->(m:Material)
        WITH m.material_name as material, count(form) as usageCount
        RETURN material, usageCount as value
        ORDER BY value DESC LIMIT 8
      `);

      // Chart 4: Site-Material Production Matrix
      supplyChainConnectionsResult = await runQuery(`
        MATCH (form:Formulation)-[:HAS_MATERIAL]->(m:Material)
        OPTIONAL MATCH (form)-[:HAS_PRODUCTION_DATA]->(prod:ProductionDataPoints)
        RETURN form.site_name as site,
               m.material_name as material,
               prod.production_actual as production,
               'Produces' as relationship
        ORDER BY production DESC
        LIMIT 15
      `);
    } else if (queryType === 'supply-chain') {
      // Analytics for "Supply Chain Network" - End-to-End Flow from API to Markets

      // Chart 1: Customer Market Sales Volume
      materialInventoryResult = await runQuery(`
        MATCH (mk:Customer_Market)
        RETURN mk.countryname as market,
               mk.Sales as inventory
        ORDER BY inventory DESC LIMIT 10
      `);

      // Chart 2: Supply Chain Stages Distribution
      sitesWithMaterialsResult = await runQuery(`
        MATCH (n)
        WHERE n:RSM OR n:RM OR n:Intermediate OR n:API OR n:Formulation OR n:Packing OR n:Storage
        WITH labels(n)[0] as stage, count(n) as siteCount
        RETURN stage as site,
               siteCount as materialCount
        ORDER BY materialCount DESC
      `);

      // Chart 3: Top API Sites by Downstream Connections
      topForecastsResult = await runQuery(`
        MATCH (api:API)-[:SUPPLIES_TO*1..2]->(downstream)
        WITH api.site_name as material, count(DISTINCT downstream) as value
        RETURN material, value
        ORDER BY value DESC LIMIT 10
      `);

      // Chart 4: Complete Supply Chain Flow (API → Formulation → Packing → Market)
      supplyChainConnectionsResult = await runQuery(`
        MATCH (api:API)-[:SUPPLIES_TO]->(form:Formulation)-[:SUPPLIES_TO]->(pack:Packing)-[:SUPPLIES_TO]->(market:Customer_Market)
        RETURN api.site_name as supplier,
               form.site_name as material,
               market.countryname as market,
               market.Sales as demand,
               'API→Form→Pack→Market' as relationship
        ORDER BY demand DESC
        LIMIT 15
      `);
    } else if (queryType === 'materials-inventory') {
      // Analytics for "Materials with Inventory" - Stock Health & Optimization

      // Chart 1: Top Materials by Inventory Volume
      materialInventoryResult = await runQuery(`
        MATCH (form:Formulation)-[:HAS_MATERIAL]->(m:Material)
        OPTIONAL MATCH (m)-[:HAS_MATERIAL_LOCATION]->(ml:MaterialLocation)
        WITH m.material_name as material, sum(ml.inventory_volume) as totalInventory
        WHERE totalInventory > 0
        RETURN material, totalInventory as inventory
        ORDER BY inventory DESC LIMIT 10
      `);

      // Chart 2: Inventory Value by Site
      sitesWithMaterialsResult = await runQuery(`
        MATCH (site)-[:HAS_INVENTORY_DATA]->(inv:InventoryDataPoints)
        WHERE site:Formulation OR site:API OR site:Packing
        RETURN site.site_name as site,
               inv.inventory_value_API as inventory,
               inv.inventory_volume_API as production
        ORDER BY inventory DESC LIMIT 10
      `);

      // Chart 3: Inventory Days Covered (Stock Risk Analysis)
      topForecastsResult = await runQuery(`
        MATCH (site)-[:HAS_INVENTORY_DATA]->(inv:InventoryDataPoints)
        WHERE site:Formulation OR site:API
        WITH site.site_name as material, inv.inventory_days_covered_API as value
        WHERE value > 0
        RETURN material, toInteger(value) as value
        ORDER BY value ASC LIMIT 10
      `);

      // Chart 4: Material Location Details
      supplyChainConnectionsResult = await runQuery(`
        MATCH (form:Formulation)-[:HAS_MATERIAL]->(m:Material)-[:HAS_MATERIAL_LOCATION]->(ml:MaterialLocation)
        WHERE ml.inventory_volume > 0
        RETURN form.site_name as site,
               m.material_name as material,
               ml.prodloc_code as market,
               ml.inventory_volume as quantity,
               'Inventory: ' + toString(toInteger(ml.inventory_volume)) + ' units' as relationship
        ORDER BY quantity DESC
        LIMIT 15
      `);
    } else {
      // Default: "All Data" - Comprehensive Forxiga Supply Chain Overview

      // Chart 1: Production Volume by Site Type
      materialInventoryResult = await runQuery(`
        MATCH (site)-[:HAS_PRODUCTION_DATA]->(prod:ProductionDataPoints)
        WHERE site:Formulation OR site:API OR site:Packing
        WITH labels(site)[0] as material, sum(prod.production_actual) as totalProduction
        RETURN material, toInteger(totalProduction) as inventory
        ORDER BY inventory DESC
      `);

      // Chart 2: Top Sites by Production Volume
      sitesWithMaterialsResult = await runQuery(`
        MATCH (site)-[:HAS_PRODUCTION_DATA]->(prod:ProductionDataPoints)
        WHERE site:Formulation OR site:API OR site:Packing
        OPTIONAL MATCH (site)-[:HAS_INVENTORY_DATA]->(inv:InventoryDataPoints)
        RETURN site.site_name as site,
               toInteger(prod.production_actual) as production,
               toInteger(inv.inventory_volume_API) as inventory
        ORDER BY production DESC LIMIT 10
      `);

      // Chart 3: Supply Chain Connectivity (Nodes with Most Connections)
      topForecastsResult = await runQuery(`
        MATCH (n)-[:SUPPLIES_TO]-(connected)
        WHERE n:API OR n:Formulation OR n:Packing
        WITH n.id as material, count(DISTINCT connected) as value
        RETURN material, value
        ORDER BY value DESC LIMIT 10
      `);

      // Chart 4: End-to-End Supply Chain Stages
      supplyChainConnectionsResult = await runQuery(`
        MATCH path = (source)-[:SUPPLIES_TO*1..3]->(target)
        WHERE source:API OR source:Intermediate
        AND target:Customer_Market OR target:Packing
        WITH source, target, length(path) as pathLength
        RETURN source.site_name as supplier,
               labels(target)[0] as material,
               target.id as market,
               pathLength as demand,
               'Supply Path Length: ' + toString(pathLength) as relationship
        ORDER BY pathLength DESC
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
      totalSites: toNumber(totalFormulationSitesResult.records[0]?.get('count')) || 0,
      totalMarkets: toNumber(totalMarketsResult.records[0]?.get('count')) || 0,
      totalAPISites: toNumber(totalAPISitesResult.records[0]?.get('count')) || 0,
      totalInventory: toNumber(totalInventoryVolumeResult.records[0]?.get('total')) || 0,
      totalProduction: toNumber(totalProductionResult.records[0]?.get('total')) || 0,

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
