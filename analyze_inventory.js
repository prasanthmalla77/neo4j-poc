const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./forxiga.json', 'utf8'));

console.log('=== FORXIGA INVENTORY & MATERIAL VOLUME ANALYSIS ===\n');

// Advanced inventory analysis
console.log('1. INVENTORY LOCATION MAPPING:\n');

const inventoryByStage = {};
const inventoryByLocation = {};
const materialFlow = {};

data.node_list.forEach(node => {
  if (node.materials && node.materials.length > 0) {
    const location = node.site_name || 'Unknown';
    const stage = node.node_type || 'Unknown';

    if (!inventoryByLocation[location]) {
      inventoryByLocation[location] = {
        total_materials: 0,
        by_type: {},
        node_type: node.node_type,
        country: node.site_country_name,
        plant_code: node.plant_code
      };
    }

    node.materials.forEach(mat => {
      inventoryByLocation[location].total_materials++;
      const matType = mat.material_type_name || 'Unknown';
      inventoryByLocation[location].by_type[matType] = (inventoryByLocation[location].by_type[matType] || 0) + 1;

      // Track material flow through stages
      const stageCode = mat.stage || 'Unknown';
      if (!materialFlow[stageCode]) {
        materialFlow[stageCode] = {
          locations: new Set(),
          count: 0,
          types: {}
        };
      }
      materialFlow[stageCode].count++;
      materialFlow[stageCode].locations.add(location);
      materialFlow[stageCode].types[matType] = (materialFlow[stageCode].types[matType] || 0) + 1;
    });
  }
});

console.log('Top 20 Inventory Holding Locations (by material count):');
Object.entries(inventoryByLocation)
  .sort((a,b) => b[1].total_materials - a[1].total_materials)
  .slice(0, 20)
  .forEach((entry, idx) => {
    const [location, data] = entry;
    console.log(`\n  ${idx + 1}. ${location}`);
    console.log(`     Country: ${data.country || 'N/A'}`);
    console.log(`     Plant Code: ${data.plant_code || 'N/A'}`);
    console.log(`     Node Type: ${data.node_type}`);
    console.log(`     Total Materials: ${data.total_materials}`);
    console.log(`     By Type:`);
    Object.entries(data.by_type).forEach(([type, count]) => {
      console.log(`       - ${type}: ${count}`);
    });
  });

// Material stage analysis
console.log('\n\n2. MATERIAL FLOW THROUGH MANUFACTURING STAGES:\n');

console.log('Manufacturing Stages with Material Distribution:');
const stagesSorted = Object.entries(materialFlow)
  .sort((a,b) => b[1].count - a[1].count);

stagesSorted.slice(0, 15).forEach((entry, idx) => {
  const [stage, info] = entry;
  console.log(`\n  ${idx + 1}. ${stage}`);
  console.log(`     Total Materials: ${info.count}`);
  console.log(`     Locations: ${info.locations.size}`);
  console.log(`     Distribution:`);
  Object.entries(info.types).forEach(([type, count]) => {
    console.log(`       - ${type}: ${count}`);
  });
});

// Product-Location matrix
console.log('\n\n3. KEY PRODUCTS & THEIR SUPPLY LOCATIONS:\n');

const productLocations = {};

data.node_list.forEach(node => {
  if (node.materials) {
    node.materials.forEach(mat => {
      const productName = mat.material_name;
      const location = node.site_name;

      if (!productLocations[productName]) {
        productLocations[productName] = {
          code: mat.material_code,
          type: mat.material_type_name,
          stage: mat.stage,
          locations: [],
          location_count: 0
        };
      }

      if (!productLocations[productName].locations.includes(location)) {
        productLocations[productName].locations.push(location);
        productLocations[productName].location_count++;
      }
    });
  }
});

console.log('Top 25 Products by Supply Chain Distribution:');
Object.entries(productLocations)
  .filter(([name, info]) => info.type === 'Finished Material') // Focus on finished goods
  .sort((a,b) => b[1].location_count - a[1].location_count)
  .slice(0, 25)
  .forEach((entry, idx) => {
    const [name, info] = entry;
    console.log(`\n  ${idx + 1}. ${name.substring(0, 55)}${name.length > 55 ? '...' : ''}`);
    console.log(`     Code: ${info.code}`);
    console.log(`     Stage: ${info.stage}`);
    console.log(`     Supply Locations: ${info.location_count}`);
    if (info.location_count <= 5) {
      console.log(`     Locations: ${info.locations.map(l => l.substring(0, 30)).join(', ')}`);
    }
  });

// Raw material analysis
console.log('\n\n4. RAW MATERIAL (API) SOURCING NETWORK:\n');

const apiSources = {};
const semiFinishedSources = {};

data.node_list.forEach(node => {
  if (node.materials) {
    node.materials.forEach(mat => {
      if (mat.material_type_name === 'Raw material') {
        const productName = mat.material_name;
        if (!apiSources[productName]) {
          apiSources[productName] = {
            code: mat.material_code,
            sources: new Set(),
            stage: mat.stage
          };
        }
        apiSources[productName].sources.add(node.site_name);
      }

      if (mat.material_type_name === 'Semi finished') {
        const productName = mat.material_name;
        if (!semiFinishedSources[productName]) {
          semiFinishedSources[productName] = {
            code: mat.material_code,
            sources: new Set(),
            stage: mat.stage
          };
        }
        semiFinishedSources[productName].sources.add(node.site_name);
      }
    });
  }
});

console.log('Top Raw Materials (APIs) by Supplier Diversification:');
Object.entries(apiSources)
  .sort((a,b) => b[1].sources.size - a[1].sources.size)
  .slice(0, 15)
  .forEach((entry, idx) => {
    const [name, info] = entry;
    console.log(`\n  ${idx + 1}. ${name}`);
    console.log(`     Code: ${info.code}`);
    console.log(`     Stage: ${info.stage}`);
    console.log(`     Number of Sources: ${info.sources.size}`);
    console.log(`     Sources: ${Array.from(info.sources).join(', ')}`);
  });

console.log('\n\n5. SEMI-FINISHED PRODUCTS - INTERMEDIATE SOURCING:\n');

console.log('Top Semi-Finished Materials by Production Locations:');
Object.entries(semiFinishedSources)
  .sort((a,b) => b[1].sources.size - a[1].sources.size)
  .slice(0, 15)
  .forEach((entry, idx) => {
    const [name, info] = entry;
    console.log(`\n  ${idx + 1}. ${name.substring(0, 50)}${name.length > 50 ? '...' : ''}`);
    console.log(`     Code: ${info.code}`);
    console.log(`     Stage: ${info.stage}`);
    console.log(`     Production Locations: ${info.sources.size}`);
  });

// Inventory days analysis (derived from distribution)
console.log('\n\n6. SUPPLY CHAIN VELOCITY ANALYSIS (based on distribution points):\n');

const nodeTypeDistribution = {
  'API': [],
  'Formulation': [],
  'Packing': [],
  'Distribution_Hub': [],
  'Storage': []
};

data.node_list.forEach(node => {
  const type = node.node_type;
  if (nodeTypeDistribution[type]) {
    nodeTypeDistribution[type].push({
      id: node.id,
      site: node.site_name,
      materials: node.materials ? node.materials.length : 0,
      connections: node.connections ? node.connections.length : 0
    });
  }
});

console.log('Distribution Velocity by Node Type:');
console.log('\n  APIs (Source nodes):');
console.log(`    - Count: ${nodeTypeDistribution['API'].length}`);
console.log(`    - Avg Materials per Node: ${nodeTypeDistribution['API'].length > 0 ? (nodeTypeDistribution['API'].reduce((sum, n) => sum + n.materials, 0) / nodeTypeDistribution['API'].length).toFixed(1) : 0}`);
console.log(`    - Avg Onward Connections: ${nodeTypeDistribution['API'].length > 0 ? (nodeTypeDistribution['API'].reduce((sum, n) => sum + n.connections, 0) / nodeTypeDistribution['API'].length).toFixed(1) : 0}`);

console.log('\n  Formulation (Manufacturing):');
console.log(`    - Count: ${nodeTypeDistribution['Formulation'].length}`);
console.log(`    - Avg Materials per Node: ${nodeTypeDistribution['Formulation'].length > 0 ? (nodeTypeDistribution['Formulation'].reduce((sum, n) => sum + n.materials, 0) / nodeTypeDistribution['Formulation'].length).toFixed(1) : 0}`);
console.log(`    - Avg Onward Connections: ${nodeTypeDistribution['Formulation'].length > 0 ? (nodeTypeDistribution['Formulation'].reduce((sum, n) => sum + n.connections, 0) / nodeTypeDistribution['Formulation'].length).toFixed(1) : 0}`);

console.log('\n  Packing (Final Assembly):');
console.log(`    - Count: ${nodeTypeDistribution['Packing'].length}`);
console.log(`    - Avg Materials per Node: ${nodeTypeDistribution['Packing'].length > 0 ? (nodeTypeDistribution['Packing'].reduce((sum, n) => sum + n.materials, 0) / nodeTypeDistribution['Packing'].length).toFixed(1) : 0}`);
console.log(`    - Avg Onward Connections: ${nodeTypeDistribution['Packing'].length > 0 ? (nodeTypeDistribution['Packing'].reduce((sum, n) => sum + n.connections, 0) / nodeTypeDistribution['Packing'].length).toFixed(1) : 0}`);

console.log('\n  Distribution Hubs:');
console.log(`    - Count: ${nodeTypeDistribution['Distribution_Hub'].length}`);
console.log(`    - Avg Materials per Node: ${nodeTypeDistribution['Distribution_Hub'].length > 0 ? (nodeTypeDistribution['Distribution_Hub'].reduce((sum, n) => sum + n.materials, 0) / nodeTypeDistribution['Distribution_Hub'].length).toFixed(1) : 0}`);
console.log(`    - Avg Onward Connections: ${nodeTypeDistribution['Distribution_Hub'].length > 0 ? (nodeTypeDistribution['Distribution_Hub'].reduce((sum, n) => sum + n.connections, 0) / nodeTypeDistribution['Distribution_Hub'].length).toFixed(1) : 0}`);

// Critical bottlenecks
console.log('\n\n7. CRITICAL SUPPLY CHAIN BOTTLENECKS:\n');

const bottlenecks = [];

data.node_list.forEach(node => {
  const incomingCount = data.node_list.filter(n =>
    n.connections && n.connections.includes(node.id)
  ).length;

  if (incomingCount > 1 && node.node_type !== 'Distribution_Hub') {
    bottlenecks.push({
      id: node.id,
      site: node.site_name,
      type: node.node_type,
      materials: node.materials ? node.materials.length : 0,
      incoming: incomingCount,
      outgoing: node.connections ? node.connections.length : 0,
      criticality: incomingCount * (node.materials ? node.materials.length : 1)
    });
  }
});

bottlenecks.sort((a,b) => b.criticality - a.criticality);

console.log('Critical Nodes (Single-point-of-failure risk):');
console.log('(Nodes with multiple incoming suppliers but limited alternative routes)\n');
bottlenecks.slice(0, 12).forEach((node, idx) => {
  console.log(`  ${idx + 1}. ${node.site} (${node.id})`);
  console.log(`     Type: ${node.type}`);
  console.log(`     Incoming Dependencies: ${node.incoming}`);
  console.log(`     Outgoing Routes: ${node.outgoing}`);
  console.log(`     Materials Handled: ${node.materials}`);
  console.log(`     Criticality Score: ${node.criticality}`);
});

// Cost and complexity insights
console.log('\n\n8. SUPPLY CHAIN OPTIMIZATION OPPORTUNITIES:\n');

const highTouchMaterials = [];
data.node_list.forEach(node => {
  if (node.materials) {
    node.materials.forEach(mat => {
      const locationCount = productLocations[mat.material_name]?.location_count || 0;
      if (locationCount > 6) {
        highTouchMaterials.push({
          name: mat.material_name,
          code: mat.material_code,
          type: mat.material_type_name,
          locations: locationCount,
          stage: mat.stage
        });
      }
    });
  }
});

const uniqueHighTouch = [...new Map(highTouchMaterials.map(m => [m.code, m])).values()]
  .sort((a,b) => b.locations - a.locations);

console.log(`High-Touch Materials (6+ distribution locations):`);
console.log(`Count: ${uniqueHighTouch.length}`);
console.log(`\nTop candidates for logistics optimization:\n`);
uniqueHighTouch.slice(0, 10).forEach((mat, idx) => {
  console.log(`  ${idx + 1}. ${mat.name}`);
  console.log(`     Distribution Centers: ${mat.locations}`);
  console.log(`     Type: ${mat.type}`);
  console.log(`     Stage: ${mat.stage}`);
});
