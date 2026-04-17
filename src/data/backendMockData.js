// Mock data simulating backend API response
// This represents what your backend engine will send
// Supply Chain Data Model

export const mockJobResponse = {
  jobId: 'job_12345',
  createdAt: '2026-04-09T10:30:00Z',
  status: 'ready',
  nodes: [
    // Materials
    {
      id: 'material_1',
      labels: ['Material'],
      properties: {
        MATERIAL_IDENTIFIER: 'MAT1',
        CLEANED_LOCAL_MATERIAL_CODE: 'LCM1',
        name: 'Material 1'
      }
    },
    {
      id: 'material_2',
      labels: ['Material'],
      properties: {
        MATERIAL_IDENTIFIER: 'MAT2',
        CLEANED_LOCAL_MATERIAL_CODE: 'LCM2',
        name: 'Material 2'
      }
    },
    {
      id: 'material_3',
      labels: ['Material'],
      properties: {
        MATERIAL_IDENTIFIER: 'MAT3',
        CLEANED_LOCAL_MATERIAL_CODE: 'LCM3',
        name: 'Material 3'
      }
    },
    // Sites
    {
      id: 'site_1',
      labels: ['Site'],
      properties: {
        PLANT_CODE: 'PLANT1',
        name: 'Site 1'
      }
    },
    {
      id: 'site_2',
      labels: ['Site'],
      properties: {
        PLANT_CODE: 'PLANT2',
        name: 'Site 2'
      }
    },
    {
      id: 'site_3',
      labels: ['Site'],
      properties: {
        PLANT_CODE: 'PLANT3',
        name: 'Site 3'
      }
    },
    // Markets
    {
      id: 'market_1',
      labels: ['Market'],
      properties: {
        MARKET_CODE: 'MKT1',
        name: 'Market 1'
      }
    },
    {
      id: 'market_2',
      labels: ['Market'],
      properties: {
        MARKET_CODE: 'MKT2',
        name: 'Market 2'
      }
    },
    // Warehouses
    {
      id: 'warehouse_1',
      labels: ['Warehouse'],
      properties: {
        id: 'WH1',
        name: 'Warehouse 1'
      }
    },
    {
      id: 'warehouse_2',
      labels: ['Warehouse'],
      properties: {
        id: 'WH2',
        name: 'Warehouse 2'
      }
    },
    // Material Locations
    {
      id: 'material_location_1',
      labels: ['MaterialLocation'],
      properties: {
        MATERIAL_IDENTIFIER: 'MAT1',
        PLANT_CODE: 'PLANT1',
        PRODUCT_LOCATION_TYPE_CODE: 'TYPE1'
      }
    },
    // Inventory Actuals
    {
      id: 'inventory_1',
      labels: ['InventoryActuals'],
      properties: {
        MATERIAL_CODE: 'LCM1',
        PLANT_CODE: 'PLANT1',
        quantity: 150
      }
    },
    {
      id: 'inventory_2',
      labels: ['InventoryActuals'],
      properties: {
        MATERIAL_CODE: 'LCM2',
        PLANT_CODE: 'PLANT2',
        quantity: 200
      }
    },
    // Forecasts
    {
      id: 'forecast_1',
      labels: ['Forecast'],
      properties: {
        CLEANED_LOCAL_MATERIAL_CODE: 'LCM1',
        MARKET_CODE: 'MKT1',
        forecast_qty: 250
      }
    },
    // Actual Sales
    {
      id: 'sales_1',
      labels: ['ActualSales'],
      properties: {
        DEMAND_YEAR_MONTH_NUMBER: 202401,
        CLEANED_LOCAL_MATERIAL_CODE: 'LCM1',
        MARKET_CODE: 'MKT1',
        sales_qty: 180
      }
    },
    // Production Actuals
    {
      id: 'production_1',
      labels: ['ProductionActuals'],
      properties: {
        LOCALPACKKEY: 'PK1',
        PLANTCODE: 'PLANT1',
        YEARNUMBER: 2024,
        quantity: 170
      }
    },
    // BOM
    {
      id: 'bom_1',
      labels: ['BOM'],
      properties: {
        BILL_OF_MATERIALS_IDENTIFIER: 'BOM1'
      }
    },
    // Organisation (Supplier)
    {
      id: 'supplier_1',
      labels: ['Organisation'],
      properties: {
        VENDOR_CODE: 'VEND1',
        name: 'Vendor 1'
      }
    },
    // Performance Metric
    {
      id: 'metric_1',
      labels: ['PerformanceMetric'],
      properties: {
        id: 'PM1',
        score: 85
      }
    }
  ],
  relationships: [
    // Material - Material Location
    {
      id: 'rel_1',
      type: 'HAS_MATERIAL_LOCATION',
      startNode: 'material_1',
      endNode: 'material_location_1',
      properties: {}
    },
    // Material Location - Site
    {
      id: 'rel_2',
      type: 'LOCATED_AT',
      startNode: 'material_location_1',
      endNode: 'site_1',
      properties: {}
    },
    // Site - Inventory
    {
      id: 'rel_3',
      type: 'HAS_INVENTORY_ACTUALS',
      startNode: 'site_1',
      endNode: 'inventory_1',
      properties: {}
    },
    // Inventory - Material
    {
      id: 'rel_4',
      type: 'HAS_MATERIAL',
      startNode: 'inventory_1',
      endNode: 'material_1',
      properties: {}
    },
    // Material - Forecast
    {
      id: 'rel_5',
      type: 'HAS_FORECAST',
      startNode: 'material_1',
      endNode: 'forecast_1',
      properties: {}
    },
    // Forecast - Market
    {
      id: 'rel_6',
      type: 'marketOfSale',
      startNode: 'forecast_1',
      endNode: 'market_1',
      properties: {}
    },
    // Material - Actual Sales
    {
      id: 'rel_7',
      type: 'HAS_ACTUAL_SALES',
      startNode: 'material_1',
      endNode: 'sales_1',
      properties: {}
    },
    // Actual Sales - Market
    {
      id: 'rel_8',
      type: 'marketOfSale',
      startNode: 'sales_1',
      endNode: 'market_1',
      properties: {}
    },
    // Site - Production
    {
      id: 'rel_9',
      type: 'HAS_PRODUCTION_ACTUALS',
      startNode: 'site_1',
      endNode: 'production_1',
      properties: {}
    },
    // Production - Material
    {
      id: 'rel_10',
      type: 'produces',
      startNode: 'production_1',
      endNode: 'material_1',
      properties: {}
    },
    // Material - BOM
    {
      id: 'rel_11',
      type: 'HAS_BOM',
      startNode: 'material_1',
      endNode: 'bom_1',
      properties: {}
    },
    // BOM - Material (component)
    {
      id: 'rel_12',
      type: 'HAS_BOM_ITEM',
      startNode: 'bom_1',
      endNode: 'material_2',
      properties: {}
    },
    // Supplier - Material
    {
      id: 'rel_13',
      type: 'supplies',
      startNode: 'supplier_1',
      endNode: 'material_1',
      properties: {}
    },
    // Material - Performance Metric
    {
      id: 'rel_14',
      type: 'isEvaluatedBy',
      startNode: 'material_1',
      endNode: 'metric_1',
      properties: {}
    }
  ],
  availableAlgorithms: [
    {
      id: 'nodeSimilarity',
      name: 'Node Similarity',
      description: 'Computes similarity between nodes based on their neighborhoods',
      category: 'similarity',
      tier: 'beta'
    },
    {
      id: 'shortestPath',
      name: 'Shortest Path',
      description: 'Finds the shortest path between two nodes',
      category: 'path-finding',
      tier: 'production'
    },
    {
      id: 'betweenness',
      name: 'Betweenness Centrality',
      description: 'Identify single points of failure — nodes that control the most supply routes',
      category: 'centrality',
      tier: 'production'
    }
  ]
};

// Additional mock job for testing
export const mockJobResponse2 = {
  jobId: 'job_67890',
  createdAt: '2026-04-09T11:00:00Z',
  status: 'ready',
  nodes: [
    {
      id: 'material_10',
      labels: ['Material'],
      properties: {
        MATERIAL_IDENTIFIER: 'MAT10',
        CLEANED_LOCAL_MATERIAL_CODE: 'LCM10',
        name: 'Material 10'
      }
    },
    {
      id: 'site_10',
      labels: ['Site'],
      properties: {
        PLANT_CODE: 'PLANT10',
        name: 'Site 10'
      }
    }
  ],
  relationships: [],
  availableAlgorithms: [
    {
      id: 'nodeSimilarity',
      name: 'Node Similarity',
      description: 'Computes similarity between nodes based on their neighborhoods',
      category: 'similarity',
      tier: 'beta'
    },
    {
      id: 'shortestPath',
      name: 'Shortest Path',
      description: 'Finds the shortest path between two nodes',
      category: 'path-finding',
      tier: 'production'
    },
    {
      id: 'betweenness',
      name: 'Betweenness Centrality',
      description: 'Identify single points of failure — nodes that control the most supply routes',
      category: 'centrality',
      tier: 'production'
    }
  ]
};
