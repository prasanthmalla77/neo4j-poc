const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./forxiga.json', 'utf8'));

console.log('=== FORXIGA DATA STRUCTURE ANALYSIS ===\n');

// 1. Node Types Overview
console.log('1. NODE TYPES:');
data.node_types.forEach(type => console.log(`   - ${type}`));

// 2. Total Nodes
console.log(`\n2. TOTAL NODES: ${data.node_list.length}`);

// 3. Count by type
const nodesByType = {};
data.node_list.forEach(node => {
  const type = node.node_type;
  nodesByType[type] = (nodesByType[type] || 0) + 1;
});

console.log('\n3. NODES BY TYPE:');
Object.entries(nodesByType).sort((a,b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}`);
});

// 4. Geographic Distribution
const countries = {};
data.node_list.forEach(node => {
  if (node.site_country_name) {
    countries[node.site_country_name] = (countries[node.site_country_name] || 0) + 1;
  }
  if (node.vendor_country_name && node.vendor_country_name !== '') {
    countries[node.vendor_country_name] = (countries[node.vendor_country_name] || 0) + 1;
  }
});

console.log('\n4. GEOGRAPHIC DISTRIBUTION:');
Object.entries(countries).sort((a,b) => b[1] - a[1]).forEach(([country, count]) => {
  console.log(`   ${country}: ${count} nodes`);
});

// 5. Sites/Plants
const sites = new Set();
data.node_list.forEach(node => {
  if (node.site_name) sites.add(node.site_name);
});

console.log(`\n5. UNIQUE SITES/PLANTS: ${sites.size}`);
Array.from(sites).sort().forEach(site => console.log(`   - ${site}`));

// 6. Material Analysis
let totalMaterials = 0;
const materialTypes = {};
const materialsByNode = {};

data.node_list.forEach(node => {
  if (node.materials && Array.isArray(node.materials)) {
    totalMaterials += node.materials.length;
    node.materials.forEach(mat => {
      const type = mat.material_type_name || 'Unknown';
      materialTypes[type] = (materialTypes[type] || 0) + 1;
    });
    materialsByNode[node.id] = node.materials.length;
  }
});

console.log(`\n6. MATERIALS OVERVIEW:`);
console.log(`   Total Materials: ${totalMaterials}`);
console.log(`   Material Types:`);
Object.entries(materialTypes).sort((a,b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`     - ${type}: ${count}`);
});

// 7. Relationships/Connections
let totalConnections = 0;
data.node_list.forEach(node => {
  if (node.connections && Array.isArray(node.connections)) {
    totalConnections += node.connections.length;
  }
});

console.log(`\n7. RELATIONSHIPS:`);
console.log(`   Total Outgoing Connections: ${totalConnections}`);

// 8. Site Types
const siteTypes = {};
data.node_list.forEach(node => {
  if (node.site_type) {
    siteTypes[node.site_type] = (siteTypes[node.site_type] || 0) + 1;
  }
});

console.log(`\n8. SITE TYPES:`);
Object.entries(siteTypes).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}`);
});

// 9. Sample nodes for each type
console.log(`\n9. SAMPLE NODES BY TYPE:`);
const samplesByType = {};
data.node_list.forEach(node => {
  const type = node.node_type;
  if (!samplesByType[type]) {
    samplesByType[type] = [];
  }
  if (samplesByType[type].length < 2) {
    samplesByType[type].push(node);
  }
});

Object.entries(samplesByType).forEach(([type, samples]) => {
  console.log(`\n   ${type}:`);
  samples.forEach(node => {
    console.log(`     ID: ${node.id}`);
    console.log(`     Label: ${node.labels ? node.labels[0] : 'N/A'}`);
    if (node.materials) {
      console.log(`     Materials: ${node.materials.length}`);
    }
    if (node.connections) {
      console.log(`     Connections: ${node.connections.length}`);
    }
  });
});

// 10. Extract sample materials with details
console.log(`\n10. SAMPLE MATERIALS WITH DETAILS:`);
let sampleCount = 0;
for (const node of data.node_list) {
  if (node.materials && node.materials.length > 0) {
    console.log(`\n   From Node: ${node.id} (${node.site_name})`);
    node.materials.slice(0, 3).forEach(mat => {
      console.log(`     - ${mat.material_code}: ${mat.material_name}`);
      console.log(`       Type: ${mat.material_type_name}, Stage: ${mat.stage}`);
    });
    sampleCount++;
    if (sampleCount >= 3) break;
  }
}
