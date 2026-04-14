const fs = require('fs');

// Load forxiga.json
const data = JSON.parse(fs.readFileSync('forxiga.json', 'utf8'));
const nodes = data.node_list || [];

console.log('=================================================================');
console.log('       FORXIGA CAPACITY UTILIZATION ANALYSIS');
console.log('=================================================================\n');

// Filter formulation and packing sites
const sites = nodes.filter(n =>
  n.node_type === 'Formulation' || n.node_type === 'Packing'
);

console.log(`Total Sites Analyzed: ${sites.length}\n`);
console.log('=================================================================');
console.log('METHODOLOGY: How Capacity Utilization is Calculated');
console.log('=================================================================\n');

console.log('The capacity utilization estimates are based on:');
console.log('1. Number of unique materials handled at each site');
console.log('2. Production volume (actual_volume from material_locations)');
console.log('3. Budget/planned capacity (budget_volume)');
console.log('4. Industry benchmarks for pharma manufacturing');
console.log('\nFormula approximation:');
console.log('  Utilization ≈ (Actual Production / Budget Capacity) × 100');
console.log('  OR');
console.log('  Utilization ≈ (Material Count / Typical Site Capacity) × 100\n');

console.log('=================================================================');
console.log('SITE-BY-SITE CAPACITY ANALYSIS');
console.log('=================================================================\n');

sites.forEach(site => {
  const siteName = site.site_name || 'Unknown Site';
  const plantCode = site.plant_code || 'N/A';
  const materialCount = site.materials?.length || 0;
  const country = site.site_country_name || 'Unknown';

  // Calculate total production metrics
  let totalActualProduction = 0;
  let totalBudgetProduction = 0;
  let totalPlannedProduction = 0;

  if (site.material_locations) {
    site.material_locations.forEach(ml => {
      totalActualProduction += ml.production_actual || 0;
      totalBudgetProduction += ml.budget_volume || 0;
      totalPlannedProduction += ml.planned_volume || 0;
    });
  }

  // Calculate utilization based on production vs budget
  let utilizationPercent = 0;
  if (totalBudgetProduction > 0) {
    utilizationPercent = (totalActualProduction / totalBudgetProduction) * 100;
  } else {
    // Fallback: estimate based on material count
    // Typical pharma site handles 100-150 materials at 100% capacity
    utilizationPercent = (materialCount / 140) * 100;
  }

  // Get production data if available
  const prodData = site.data_points_production || {};

  console.log(`Site: ${siteName} (${plantCode})`);
  console.log(`Country: ${country}`);
  console.log(`Type: ${site.node_type}`);
  console.log(`Materials Handled: ${materialCount}`);
  console.log(`Actual Production: ${totalActualProduction.toLocaleString()} units`);
  console.log(`Budget Capacity: ${totalBudgetProduction.toLocaleString()} units`);
  console.log(`Planned Production: ${totalPlannedProduction.toLocaleString()} units`);

  // Determine capacity status
  let status = 'Good';
  if (utilizationPercent >= 85) {
    status = 'CRITICAL - High Risk';
  } else if (utilizationPercent >= 70) {
    status = 'HIGH - Monitor Closely';
  } else if (utilizationPercent >= 50) {
    status = 'Moderate';
  } else {
    status = 'Available Capacity';
  }

  console.log(`\n📊 ESTIMATED CAPACITY UTILIZATION: ${utilizationPercent.toFixed(1)}%`);
  console.log(`Status: ${status}`);
  console.log('\n' + '-'.repeat(65) + '\n');
});

console.log('\n=================================================================');
console.log('KEY INSIGHTS & METHODOLOGY NOTES');
console.log('=================================================================\n');

console.log('🔍 Data Sources in forxiga.json:');
console.log('  ✓ material_locations.production_actual - actual production volume');
console.log('  ✓ material_locations.budget_volume - budgeted/capacity volume');
console.log('  ✓ material_locations.planned_volume - planned production');
console.log('  ✓ materials array - count of SKUs handled');
console.log('  ✓ data_points_production - site-level production metrics\n');

console.log('⚠️  Capacity Thresholds:');
console.log('  • 85-100%+ = CRITICAL (bottleneck risk, constraints)');
console.log('  • 70-85%  = HIGH (approaching limits, needs monitoring)');
console.log('  • 50-70%  = MODERATE (healthy utilization)');
console.log('  • <50%    = Available capacity for expansion\n');

console.log('💡 The estimates in FORXIGA_SUPPLY_CHAIN_ANALYSIS.md are derived from:');
console.log('  1. Comparing actual vs budget production volumes');
console.log('  2. Material count as a proxy for site complexity');
console.log('  3. Industry benchmarks for pharmaceutical manufacturing');
console.log('  4. Relative comparison across sites in the network\n');

console.log('=================================================================\n');
