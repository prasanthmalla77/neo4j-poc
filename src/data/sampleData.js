// Sample Neo4j graph data - Forxiga pharmaceutical supply chain network
// This represents the supply chain stages: RSM → RM → Intermediate → API → Formulation → Packing → Customer_Market

// Node type color scheme for pharmaceutical supply chain
export const nodeTypeColors = {
  RSM: '#8B4513',              // Brown - Raw Supplier Materials
  RM: '#FF6B6B',               // Red - Raw Materials
  Intermediate: '#FFA500',      // Orange - Intermediate products
  API: '#4169E1',              // Royal Blue - Active Pharmaceutical Ingredient
  Formulation: '#32CD32',      // Lime Green - Formulation sites
  Packing: '#9370DB',          // Medium Purple - Packing/Final Product sites
  Storage: '#FFD700',          // Gold - Storage locations
  Customer_Market: '#FF1493',  // Deep Pink - Customer Markets
  Material: '#4CAF50',         // Green - Material nodes
  MaterialLocation: '#00BCD4', // Cyan - Material Location nodes
  InventoryDataPoints: '#FFC107',  // Amber - Inventory data
  ProductionDataPoints: '#9C27B0'  // Purple - Production data
};

export const sampleGraphData = {
  nodes: [
    // RSM Node
    {
      id: 'RSM_001',
      size: 30,
      color: nodeTypeColors.RSM,
      caption: 'Raw Supplier Material 001',
      labels: ['RSM'],
      properties: {
        id: 'RSM_001',
        node_type: 'RSM',
        site_name: 'Supplier Site A',
        site_country_name: 'Germany'
      }
    },
    // RM Nodes
    {
      id: 'RM_002',
      size: 30,
      color: nodeTypeColors.RM,
      caption: 'Raw Material 002',
      labels: ['RM'],
      properties: {
        id: 'RM_002',
        node_type: 'RM',
        site_name: 'RM Processing Site',
        site_country_name: 'India'
      }
    },
    // Intermediate Node
    {
      id: 'INT_MOCK_Farxiga_911',
      size: 30,
      color: nodeTypeColors.Intermediate,
      caption: 'Dapa Pen 172 Intermediate',
      labels: ['Intermediate'],
      properties: {
        id: 'INT_MOCK_Farxiga_911',
        node_type: 'Intermediate',
        site_type: 'ExternalNonEsmSite'
      }
    },
    // API Nodes
    {
      id: 'API_Sk_Biotek_Ireland',
      size: 35,
      color: nodeTypeColors.API,
      caption: 'SK Biotek Ireland API',
      labels: ['API'],
      properties: {
        id: 'API_Sk_Biotek_Ireland',
        node_type: 'API',
        site_name: 'SK Biotek',
        site_country_name: 'Ireland'
      }
    },
    {
      id: 'API_Dottikon_Exclusive_Switzerland',
      size: 35,
      color: nodeTypeColors.API,
      caption: 'Dottikon Switzerland API',
      labels: ['API'],
      properties: {
        id: 'API_Dottikon_Exclusive_Switzerland',
        node_type: 'API',
        site_name: 'Dottikon Exclusive',
        site_country_name: 'Switzerland'
      }
    },
    // Storage Node
    {
      id: 'STORAGE_Dottikon_Exclusive_Switzerland',
      size: 30,
      color: nodeTypeColors.Storage,
      caption: 'Dottikon Storage',
      labels: ['Storage'],
      properties: {
        id: 'STORAGE_Dottikon_Exclusive_Switzerland',
        node_type: 'Storage',
        site_country_name: 'Switzerland'
      }
    },
    // Formulation Nodes
    {
      id: 'FORM_CN40',
      size: 35,
      color: nodeTypeColors.Formulation,
      caption: 'AstraZeneca China Taizhou',
      labels: ['Formulation'],
      properties: {
        id: 'FORM_CN40',
        node_type: 'Formulation',
        site: 'CN40',
        site_name: 'AstraZeneca China Taizhou',
        site_country_name: 'China'
      }
    },
    {
      id: 'FORM_1448',
      size: 35,
      color: nodeTypeColors.Formulation,
      caption: 'Mt Vernon (US)',
      labels: ['Formulation'],
      properties: {
        id: 'FORM_1448',
        node_type: 'Formulation',
        site: '1448',
        site_name: 'Mt Vernon',
        site_country_name: 'United States'
      }
    },
    // Packing/Final Product Nodes
    {
      id: 'FP_CN40',
      size: 35,
      color: nodeTypeColors.Packing,
      caption: 'Final Product CN40',
      labels: ['Packing'],
      properties: {
        id: 'FP_CN40',
        node_type: 'Packing',
        site: 'CN40',
        site_country_name: 'China'
      }
    },
    {
      id: 'FP_1448',
      size: 35,
      color: nodeTypeColors.Packing,
      caption: 'Final Product 1448',
      labels: ['Packing'],
      properties: {
        id: 'FP_1448',
        node_type: 'Packing',
        site: '1448',
        site_country_name: 'United States'
      }
    },
    // Customer Market Nodes
    {
      id: 'Customer_Market_CN',
      size: 40,
      color: nodeTypeColors.Customer_Market,
      caption: 'China Market',
      labels: ['Customer_Market'],
      properties: {
        id: 'Customer_Market_CN',
        stage_of_manufacture: 'Customer_Market',
        countryname: 'China',
        Sales: 575506010
      }
    },
    {
      id: 'Customer_Market_US',
      size: 40,
      color: nodeTypeColors.Customer_Market,
      caption: 'US Market',
      labels: ['Customer_Market'],
      properties: {
        id: 'Customer_Market_US',
        stage_of_manufacture: 'Customer_Market',
        countryname: 'United States',
        Sales: 450000000
      }
    }
  ],
  relationships: [
    // RSM to RM
    {
      id: 'r1',
      from: 'RSM_001',
      to: 'RM_002',
      caption: 'SUPPLIES_TO'
    },
    // RM to Intermediate
    {
      id: 'r2',
      from: 'RM_002',
      to: 'INT_MOCK_Farxiga_911',
      caption: 'SUPPLIES_TO'
    },
    // Intermediate to API
    {
      id: 'r3',
      from: 'INT_MOCK_Farxiga_911',
      to: 'API_Sk_Biotek_Ireland',
      caption: 'SUPPLIES_TO'
    },
    {
      id: 'r4',
      from: 'INT_MOCK_Farxiga_911',
      to: 'API_Dottikon_Exclusive_Switzerland',
      caption: 'SUPPLIES_TO'
    },
    // API to Storage
    {
      id: 'r5',
      from: 'API_Dottikon_Exclusive_Switzerland',
      to: 'STORAGE_Dottikon_Exclusive_Switzerland',
      caption: 'SUPPLIES_TO'
    },
    // API/Storage to Formulation
    {
      id: 'r6',
      from: 'API_Sk_Biotek_Ireland',
      to: 'FORM_CN40',
      caption: 'SUPPLIES_TO'
    },
    {
      id: 'r7',
      from: 'STORAGE_Dottikon_Exclusive_Switzerland',
      to: 'FORM_CN40',
      caption: 'SUPPLIES_TO'
    },
    {
      id: 'r8',
      from: 'API_Sk_Biotek_Ireland',
      to: 'FORM_1448',
      caption: 'SUPPLIES_TO'
    },
    {
      id: 'r9',
      from: 'API_Dottikon_Exclusive_Switzerland',
      to: 'FORM_1448',
      caption: 'SUPPLIES_TO'
    },
    // Formulation to Final Product/Packing
    {
      id: 'r10',
      from: 'FORM_CN40',
      to: 'FP_CN40',
      caption: 'SUPPLIES_TO'
    },
    {
      id: 'r11',
      from: 'FORM_1448',
      to: 'FP_1448',
      caption: 'SUPPLIES_TO'
    },
    // Final Product to Customer Markets
    {
      id: 'r12',
      from: 'FP_CN40',
      to: 'Customer_Market_CN',
      caption: 'SUPPLIES_TO'
    },
    {
      id: 'r13',
      from: 'FP_1448',
      to: 'Customer_Market_US',
      caption: 'SUPPLIES_TO'
    }
  ]
};
