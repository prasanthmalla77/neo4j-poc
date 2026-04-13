const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./forxiga.json', 'utf8'));

console.log('=== FORXIGA PHARMACEUTICAL SUPPLY CHAIN - BUSINESS METRICS & KPIs ===\n');

// Detailed material analysis
console.log('1. MATERIAL INVENTORY & PRODUCTION ANALYSIS:\n');

const materialStages = {};
const materialsByType = {};
const materialsByManufacturer = {};
let apiCount = 0;
let sfCount = 0;
let fmCount = 0;

data.node_list.forEach(node => {
  if (node.materials && Array.isArray(node.materials)) {
    node.materials.forEach(mat => {
      // By stage
      const stage = mat.stage || 'Unknown';
      materialStages[stage] = (materialStages[stage] || 0) + 1;

      // By material type
      const type = mat.material_type_name || 'Unknown';
      if (!materialsByType[type]) {
        materialsByType[type] = [];
      }
      materialsByType[type].push(mat);

      // Count by manufacture process
      if (mat.material_type_name === 'Raw material') apiCount++;
      if (mat.material_type_name === 'Semi finished') sfCount++;
      if (mat.material_type_name === 'Finished Material') fmCount++;

      // By manufacturer
      const manuf = mat.material_manufacturer || 'Unknown';
      materialsByManufacturer[manuf] = (materialsByManufacturer[manuf] || 0) + 1;
    });
  }
});

console.log('Production/Manufacturing Stages Found:');
Object.entries(materialStages).sort((a,b) => b[1] - a[1]).forEach(([stage, count]) => {
  console.log(`  ${stage}: ${count} materials`);
});

console.log(`\n\nMaterial Type Distribution:`);
console.log(`  Raw Materials (API level): ${apiCount}`);
console.log(`  Semi-Finished Materials: ${sfCount}`);
console.log(`  Finished Materials: ${fmCount}`);
console.log(`  Total Materials: ${apiCount + sfCount + fmCount}`);

console.log(`\n\nManufacturer Types:`);
Object.entries(materialsByManufacturer).forEach(([manuf, count]) => {
  console.log(`  ${manuf}: ${count} materials`);
});

// Supply Chain Stages
console.log('\n\n2. SUPPLY CHAIN STAGES REPRESENTATION:\n');

const stagesByNode = {};
data.node_list.forEach(node => {
  const nodeType = node.node_type;
  if (!stagesByNode[nodeType]) {
    stagesByNode[nodeType] = [];
  }
  stagesByNode[nodeType].push({
    id: node.id,
    site: node.site_name,
    materials: node.materials ? node.materials.length : 0,
    connections: node.connections ? node.connections.length : 0
  });
});

const supplyChainMap = {
  'API': 'Active Pharmaceutical Ingredient Production',
  'RM': 'Raw Material Supply',
  'Formulation': 'Drug Formulation/Manufacturing',
  'Packing': 'Packaging & Final Assembly',
  'Storage': 'Storage/Warehousing',
  'Distribution_Hub': 'Distribution & Logistics',
  'Customer_Market': 'Market/Customer',
  'Intermediate': 'Intermediate Processing'
};

console.log('Supply Chain Stages Identified:');
Object.entries(supplyChainMap).forEach(([stage, description]) => {
  const count = stagesByNode[stage] ? stagesByNode[stage].length : 0;
  if (count > 0) {
    console.log(`  ${stage}: ${count} nodes - ${description}`);
  }
});

// Geographic Analysis
console.log('\n\n3. GEOGRAPHIC DISTRIBUTION & REGIONAL SUPPLY CHAINS:\n');

const byCountry = {};
const byRegion = {};

data.node_list.forEach(node => {
  const country = node.site_country_name || 'Unknown';
  if (!byCountry[country]) {
    byCountry[country] = {
      sites: new Set(),
      nodes: [],
      materials: 0
    };
  }
  byCountry[country].sites.add(node.site_name);
  byCountry[country].nodes.push(node);
  if (node.materials) {
    byCountry[country].materials += node.materials.length;
  }
});

console.log('Top 10 Countries by Supply Chain Presence:');
Object.entries(byCountry)
  .sort((a,b) => b[1].nodes.length - a[1].nodes.length)
  .slice(0, 10)
  .forEach(([country, data], idx) => {
    console.log(`\n  ${idx + 1}. ${country}:`);
    console.log(`     - Supply Chain Nodes: ${data.nodes.length}`);
    console.log(`     - Manufacturing Sites: ${data.sites.size}`);
    console.log(`     - Materials in Supply Chain: ${data.materials}`);
    console.log(`     - Sites: ${Array.from(data.sites).join(', ')}`);
  });

// Node Connectivity Analysis
console.log('\n\n4. SUPPLY CHAIN CONNECTIVITY & NETWORK ANALYSIS:\n');

const nodeConnectivity = {};
let maxConnections = 0;
let hubNodes = [];

data.node_list.forEach(node => {
  const connCount = node.connections ? node.connections.length : 0;
  nodeConnectivity[node.id] = {
    node_type: node.node_type,
    site: node.site_name,
    connections: connCount,
    materials: node.materials ? node.materials.length : 0
  };
  if (connCount > maxConnections) {
    maxConnections = connCount;
  }
});

// Find hub nodes (high connectivity)
Object.entries(nodeConnectivity).forEach(([id, data]) => {
  if (data.connections >= maxConnections * 0.5) { // Top 50% connectivity
    hubNodes.push({ id, ...data });
  }
});

hubNodes.sort((a,b) => b.connections - a.connections);

console.log(`Maximum Connections in Network: ${maxConnections}`);
console.log(`Average Connections per Node: ${(Object.values(nodeConnectivity).reduce((sum, n) => sum + n.connections, 0) / data.node_list.length).toFixed(2)}`);
console.log(`\nTop Hub Nodes (High Connectivity):`);
hubNodes.slice(0, 10).forEach((node, idx) => {
  console.log(`  ${idx + 1}. ${node.id} (${node.site})`);
  console.log(`     - Type: ${node.node_type}`);
  console.log(`     - Outgoing Connections: ${node.connections}`);
  console.log(`     - Materials Handled: ${node.materials}`);
});

// SKU/Product Analysis
console.log('\n\n5. PRODUCT PORTFOLIO & SKU ANALYSIS:\n');

const products = {};
const formulations = new Set();

data.node_list.forEach(node => {
  if (node.materials) {
    node.materials.forEach(mat => {
      // Extract product name
      const productName = mat.material_name || 'Unknown';
      if (!products[productName]) {
        products[productName] = {
          code: mat.material_code,
          type: mat.material_type_name,
          stage: mat.stage,
          count: 0,
          locations: new Set()
        };
      }
      products[productName].count++;
      products[productName].locations.add(node.site_name);

      if (node.node_type === 'Formulation') {
        formulations.add(mat.material_name);
      }
    });
  }
});

console.log(`Unique Product SKUs: ${Object.keys(products).length}`);
console.log(`Unique Formulations: ${formulations.size}`);

console.log('\nTop 15 High-Volume Products (by distribution locations):');
Object.entries(products)
  .sort((a,b) => b[1].locations.size - a[1].locations.size)
  .slice(0, 15)
  .forEach((entry, idx) => {
    const [name, info] = entry;
    console.log(`  ${idx + 1}. ${name.substring(0, 60)}${name.length > 60 ? '...' : ''}`);
    console.log(`     - Code: ${info.code}`);
    console.log(`     - Type: ${info.type}`);
    console.log(`     - Distribution Locations: ${info.locations.size}`);
  });

// Supply Chain Complexity
console.log('\n\n6. SUPPLY CHAIN COMPLEXITY METRICS:\n');

const tiers = {
  '1_API_RM': 0,
  '2_Processing': 0,
  '3_Manufacturing': 0,
  '4_Finishing': 0,
  '5_Distribution': 0,
  '6_Customer': 0
};

data.node_list.forEach(node => {
  switch(node.node_type) {
    case 'API':
    case 'RM':
      tiers['1_API_RM']++;
      break;
    case 'Storage':
      tiers['2_Processing']++;
      break;
    case 'Formulation':
      tiers['3_Manufacturing']++;
      break;
    case 'Packing':
      tiers['4_Finishing']++;
      break;
    case 'Distribution_Hub':
      tiers['5_Distribution']++;
      break;
    case 'Customer_Market':
      tiers['6_Customer']++;
      break;
  }
});

console.log('Supply Chain Tiers:');
console.log(`  Tier 1 - Raw Materials/APIs: ${tiers['1_API_RM']} nodes`);
console.log(`  Tier 2 - Processing/Storage: ${tiers['2_Processing']} nodes`);
console.log(`  Tier 3 - Manufacturing/Formulation: ${tiers['3_Manufacturing']} nodes`);
console.log(`  Tier 4 - Finishing/Packing: ${tiers['4_Finishing']} nodes`);
console.log(`  Tier 5 - Distribution/Logistics: ${tiers['5_Distribution']} nodes`);
console.log(`  Tier 6 - Market/Customers: ${tiers['6_Customer']} nodes`);

console.log(`\nTotal Supply Chain Nodes: ${tiers['1_API_RM'] + tiers['2_Processing'] + tiers['3_Manufacturing'] + tiers['4_Finishing'] + tiers['5_Distribution'] + tiers['6_Customer']}`);

// Key Performance Indicators (KPIs)
console.log('\n\n7. DERIVED KEY PERFORMANCE INDICATORS (KPIs):\n');

// KPI 1: Supply Chain Depth
const maxDepth = data.node_list.reduce((max, node) => {
  const connections = node.connections ? node.connections.length : 0;
  return Math.max(max, connections);
}, 0);

// KPI 2: Network Resilience (alternative suppliers)
const locationDiversity = {};
Object.entries(byCountry).forEach(([country, data]) => {
  locationDiversity[country] = data.sites.size;
});

// KPI 3: Inventory complexity
const totalInventoryPoints = data.node_list.length;
const avgMaterialsPerNode = (Object.values(materialsByType).reduce((sum, arr) => sum + arr.length, 0) / totalInventoryPoints).toFixed(2);

console.log('KEY PERFORMANCE INDICATORS:');
console.log(`\n  1. Supply Chain Depth`);
console.log(`     - Maximum Node Connections: ${maxDepth}`);
console.log(`     - Average Connections per Node: ${(Object.values(nodeConnectivity).reduce((sum, n) => sum + n.connections, 0) / data.node_list.length).toFixed(2)}`);

console.log(`\n  2. Inventory Metrics`);
console.log(`     - Total Inventory Points (Nodes): ${totalInventoryPoints}`);
console.log(`     - Average Materials per Node: ${avgMaterialsPerNode}`);
console.log(`     - Total SKU Variants: ${Object.keys(products).length}`);
console.log(`     - Raw Material SKUs: ${apiCount}`);
console.log(`     - Semi-Finished SKUs: ${sfCount}`);
console.log(`     - Finished Product SKUs: ${fmCount}`);

console.log(`\n  3. Geographic Resilience`);
console.log(`     - Number of Countries: ${Object.keys(byCountry).length}`);
console.log(`     - Manufacturing Sites: ${new Set(data.node_list.map(n => n.site_name)).size}`);
console.log(`     - Average Locations per Country: ${(new Set(data.node_list.map(n => n.site_name)).size / Object.keys(byCountry).length).toFixed(2)}`);

console.log(`\n  4. Production Capacity Distribution`);
console.log(`     - Formulation Sites: ${tiers['3_Manufacturing']}`);
console.log(`     - Packing Sites: ${tiers['4_Finishing']}`);
console.log(`     - Total Manufacturing Nodes: ${tiers['3_Manufacturing'] + tiers['4_Finishing']}`);

console.log(`\n  5. Supplier/Vendor Diversity`);
const vendorCount = new Set(data.node_list.filter(n => n.vendor_name).map(n => n.vendor_name)).size;
const externalVendors = data.node_list.filter(n => n.site_type && n.site_type.includes('External')).length;
console.log(`     - External Vendors: ${externalVendors}`);
console.log(`     - Internal AZ Sites: ${data.node_list.filter(n => n.site_type === 'AZSite').length}`);

console.log(`\n  6. Network Complexity Score`);
const complexityScore = (data.node_list.length * Object.keys(byCountry).length * Object.keys(products).length) / 1000;
console.log(`     - Nodes × Countries × SKUs: ${complexityScore.toFixed(2)}`);
