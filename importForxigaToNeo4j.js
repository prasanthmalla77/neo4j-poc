const neo4j = require('neo4j-driver');
const fs = require('fs');

const NEO4J_CONFIG = {
    uri: 'bolt://localhost:7687',
    username: 'neo4j',
    password: '14071407',
    database: 'test'
};

// Brand configuration
const BRAND = 'forxiga';

const driver = neo4j.driver(
    NEO4J_CONFIG.uri,
    neo4j.auth.basic(NEO4J_CONFIG.username, NEO4J_CONFIG.password)
);

async function ensureDatabaseExists() {
    const systemSession = driver.session({ database: 'system' });

    try {
        console.log('Checking if database exists...');
        const result = await systemSession.run('SHOW DATABASES');
        const databases = result.records.map(record => record.get('name'));

        if (!databases.includes(NEO4J_CONFIG.database)) {
            console.log(`Database '${NEO4J_CONFIG.database}' not found. Creating...`);
            await systemSession.run(`CREATE DATABASE ${NEO4J_CONFIG.database}`);
            console.log(`Database '${NEO4J_CONFIG.database}' created successfully.`);
        } else {
            console.log(`Database '${NEO4J_CONFIG.database}' already exists.`);
        }
    } catch (error) {
        console.error('Error checking/creating database:', error);
        throw error;
    } finally {
        await systemSession.close();
    }
}

async function clearDatabase(session) {
    console.log('Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Database cleared.');
}

async function createMainNode(session, node) {
    // Use type or stage_of_manufacture as fallback for node_type if not present
    const nodeType = node.node_type || node.type || node.stage_of_manufacture || 'Unknown';

    const query = `
        CREATE (n:${nodeType} {
            id: $id,
            brand: $brand,
            node_type: $node_type,
            stage_of_manufacture: $stage_of_manufacture,
            type: $type,
            site: $site,
            plant_code: $plant_code,
            site_name: $site_name,
            site_country_code: $site_country_code,
            site_country_name: $site_country_name,
            vendor_country_name: $vendor_country_name,
            vendor_country_code: $vendor_country_code,
            vendor_name: $vendor_name,
            vendor_code: $vendor_code,
            site_type: $site_type,
            labels: $labels,
            connections: $connections,
            filter_indicator_flag: $filter_indicator_flag,
            seq: $seq
        })
        RETURN n
    `;

    await session.run(query, {
        id: node.id,
        brand: BRAND,
        node_type: nodeType,
        stage_of_manufacture: node.stage_of_manufacture || '',
        type: node.type || '',
        site: node.site || '',
        plant_code: node.plant_code || '',
        site_name: node.site_name || '',
        site_country_code: node.site_country_code || '',
        site_country_name: node.site_country_name || '',
        vendor_country_name: node.vendor_country_name || '',
        vendor_country_code: node.vendor_country_code || '',
        vendor_name: node.vendor_name || '',
        vendor_code: node.vendor_code || '',
        site_type: node.site_type || '',
        labels: node.labels || [],
        connections: node.connections || [],
        filter_indicator_flag: node.filter_indicator_flag || 0,
        seq: node.seq || 0
    });

    console.log(`Created main node: ${node.id}`);
}

async function createMaterialNodes(session, mainNodeId, materials) {
    if (!materials || materials.length === 0) return;

    for (const material of materials) {
        const query = `
            MATCH (main {id: $mainNodeId})
            CREATE (m:Material {
                brand: $brand,
                material_code: $material_code,
                material_name: $material_name,
                material_type_name: $material_type_name,
                material_manufacturer: $material_manufacturer,
                plant_code: $plant_code,
                stage: $stage
            })
            CREATE (main)-[:HAS_MATERIAL {brand: $brand}]->(m)
            RETURN m
        `;

        await session.run(query, {
            mainNodeId: mainNodeId,
            brand: BRAND,
            material_code: material.material_code,
            material_name: material.material_name,
            material_type_name: material.material_type_name,
            material_manufacturer: material.material_manufacturer,
            plant_code: material.plant_code,
            stage: material.stage
        });
    }

    console.log(`  Created ${materials.length} Material nodes for ${mainNodeId}`);
}

async function createMaterialLocationNodes(session, mainNodeId, materialLocations) {
    if (!materialLocations || materialLocations.length === 0) return;

    for (const location of materialLocations) {
        const query = `
            MATCH (m:Material {material_code: $material_code, plant_code: $plant_code})
            CREATE (ml:MaterialLocation {
                brand: $brand,
                material_identifier: $material_identifier,
                material_code: $material_code,
                plant_code: $plant_code,
                prodloc_code: $prodloc_code,
                material_brand: $material_brand,
                test_load_smu: $test_load_smu,
                test_loaded_smu: $test_loaded_smu,
                actual_volume: $actual_volume,
                pa_smu_conversion_factor: $pa_smu_conversion_factor,
                pp_smu_conversion_factor: $pp_smu_conversion_factor,
                planned_volume: $planned_volume,
                group_cost_usd: $group_cost_usd,
                budget_volume_auom: $budget_volume_auom,
                production_actual: $production_actual,
                production_total_year: $production_total_year,
                inventory_projected_volume: $inventory_projected_volume,
                inventory_days_design: $inventory_days_design,
                inventory_projected_value: $inventory_projected_value,
                budget_volume: $budget_volume,
                packs_quantity: $packs_quantity,
                ia_unrestricted: $ia_unrestricted,
                ia_intransit: $ia_intransit,
                standard_manufacturing_unit: $standard_manufacturing_unit,
                tot_inv_design_value: $tot_inv_design_value,
                tot_inv_design_days: $tot_inv_design_days,
                tot_inv_design_smu: $tot_inv_design_smu,
                average_daily_demand: $average_daily_demand,
                inventory_volume_actual: $inventory_volume_actual,
                inventory_volume: $inventory_volume,
                inventory_value: $inventory_value,
                inventory_days_covered_actual: $inventory_days_covered_actual,
                demand: $demand
            })
            CREATE (m)-[:HAS_MATERIAL_LOCATION {brand: $brand}]->(ml)
            RETURN ml
        `;

        await session.run(query, {
            brand: BRAND,
            material_code: location.material_code,
            plant_code: location.plant_code,
            material_identifier: location.material_identifier || '',
            prodloc_code: location.prodloc_code || '',
            material_brand: location.material_brand || '',
            test_load_smu: location.test_load_smu || 0,
            test_loaded_smu: location.test_loaded_smu || 0,
            actual_volume: location.actual_volume || 0,
            pa_smu_conversion_factor: location.pa_smu_conversion_factor || 0,
            pp_smu_conversion_factor: location.pp_smu_conversion_factor || 0,
            planned_volume: location.planned_volume || 0,
            group_cost_usd: location.group_cost_usd || 0,
            budget_volume_auom: location.budget_volume_auom || 0,
            production_actual: location.production_actual || 0,
            production_total_year: location.production_total_year || 0,
            inventory_projected_volume: location.inventory_projected_volume || 0,
            inventory_days_design: location.inventory_days_design || 0,
            inventory_projected_value: location.inventory_projected_value || 0,
            budget_volume: location.budget_volume || 0,
            packs_quantity: location.packs_quantity || 0,
            ia_unrestricted: location.ia_unrestricted || 0,
            ia_intransit: location.ia_intransit || 0,
            standard_manufacturing_unit: location.standard_manufacturing_unit || 0,
            tot_inv_design_value: location.tot_inv_design_value || 0,
            tot_inv_design_days: location.tot_inv_design_days || 0,
            tot_inv_design_smu: location.tot_inv_design_smu || 0,
            average_daily_demand: location.average_daily_demand || 0,
            inventory_volume_actual: location.inventory_volume_actual || 0,
            inventory_volume: location.inventory_volume || 0,
            inventory_value: location.inventory_value || 0,
            inventory_days_covered_actual: location.inventory_days_covered_actual || 0,
            demand: location.demand || 0
        });
    }

    console.log(`  Created ${materialLocations.length} MaterialLocation nodes for ${mainNodeId}`);
}

async function createInventoryDataPoints(session, mainNodeId, dataPoints) {
    if (!dataPoints) return;

    const query = `
        MATCH (main {id: $mainNodeId})
        CREATE (idp:InventoryDataPoints {
            brand: $brand,
            inventory_days_covered_API: $inventory_days_covered_API,
            inventory_volume_API: $inventory_volume_API,
            inventory_projected_volume_API: $inventory_projected_volume_API,
            inventory_days_design_API: $inventory_days_design_API,
            inventory_value_API: $inventory_value_API,
            inventory_projected_value_API: $inventory_projected_value_API,
            inventory_days_covered_BULK: $inventory_days_covered_BULK,
            inventory_volume_BULK: $inventory_volume_BULK,
            inventory_projected_volume_BULK: $inventory_projected_volume_BULK,
            inventory_days_design_BULK: $inventory_days_design_BULK,
            inventory_value_BULK: $inventory_value_BULK,
            inventory_projected_value_BULK: $inventory_projected_value_BULK
        })
        CREATE (main)-[:HAS_INVENTORY_DATA {brand: $brand}]->(idp)
        RETURN idp
    `;

    await session.run(query, {
        mainNodeId: mainNodeId,
        brand: BRAND,
        inventory_days_covered_API: dataPoints.inventory_days_covered_API || 0,
        inventory_volume_API: dataPoints.inventory_volume_API || 0,
        inventory_projected_volume_API: dataPoints.inventory_projected_volume_API || 0,
        inventory_days_design_API: dataPoints.inventory_days_design_API || 0,
        inventory_value_API: dataPoints.inventory_value_API || 0,
        inventory_projected_value_API: dataPoints.inventory_projected_value_API || 0,
        inventory_days_covered_BULK: dataPoints.inventory_days_covered_BULK || 0,
        inventory_volume_BULK: dataPoints.inventory_volume_BULK || 0,
        inventory_projected_volume_BULK: dataPoints.inventory_projected_volume_BULK || 0,
        inventory_days_design_BULK: dataPoints.inventory_days_design_BULK || 0,
        inventory_value_BULK: dataPoints.inventory_value_BULK || 0,
        inventory_projected_value_BULK: dataPoints.inventory_projected_value_BULK || 0
    });

    console.log(`  Created InventoryDataPoints node for ${mainNodeId}`);
}

async function createProductionDataPoints(session, mainNodeId, dataPoints) {
    if (!dataPoints) return;

    const query = `
        MATCH (main {id: $mainNodeId})
        CREATE (pdp:ProductionDataPoints {
            brand: $brand,
            production_budget: $production_budget,
            production_actual: $production_actual,
            production_total_year: $production_total_year
        })
        CREATE (main)-[:HAS_PRODUCTION_DATA {brand: $brand}]->(pdp)
        RETURN pdp
    `;

    await session.run(query, {
        mainNodeId: mainNodeId,
        brand: BRAND,
        production_budget: dataPoints.production_budget || 0,
        production_actual: dataPoints.production_actual || 0,
        production_total_year: dataPoints.production_total_year || 0
    });

    console.log(`  Created ProductionDataPoints node for ${mainNodeId}`);
}

async function createNodeConnections(session, sourceNodeId, connections) {
    if (!connections || connections.length === 0) return;

    for (const targetNodeId of connections) {
        const query = `
            MATCH (source {id: $sourceNodeId})
            MATCH (target {id: $targetNodeId})
            CREATE (source)-[:SUPPLIES_TO {brand: $brand}]->(target)
        `;

        try {
            await session.run(query, {
                sourceNodeId: sourceNodeId,
                targetNodeId: targetNodeId,
                brand: BRAND
            });
        } catch (error) {
            console.log(`  Warning: Could not create connection from ${sourceNodeId} to ${targetNodeId}`);
        }
    }

    console.log(`  Created ${connections.length} supply chain connections for ${sourceNodeId}`);
}

async function importData() {
    try {
        // Ensure database exists
        await ensureDatabaseExists();

        const session = driver.session({ database: NEO4J_CONFIG.database });

        try {
            // Read JSON file
            console.log('Reading forxiga.json...');
            const data = JSON.parse(fs.readFileSync('forxiga.json', 'utf8'));

            // Clear existing data
            await clearDatabase(session);

        // Process each node - Create all nodes first
        console.log(`Processing ${data.node_list.length} nodes...`);

        for (let i = 0; i < data.node_list.length; i++) {
            const node = data.node_list[i];
            console.log(`\n[${i + 1}/${data.node_list.length}] Processing ${node.id}...`);

            // Create main node
            await createMainNode(session, node);

            // Create material nodes
            await createMaterialNodes(session, node.id, node.materials);

            // Create material location nodes
            await createMaterialLocationNodes(session, node.id, node.material_locations);

            // Create inventory data points
            await createInventoryDataPoints(session, node.id, node.data_points_inventory);

            // Create production data points
            await createProductionDataPoints(session, node.id, node.data_points_production);
        }

        // Now create all connections between nodes
        console.log('\n\nCreating connections between nodes...');
        for (let i = 0; i < data.node_list.length; i++) {
            const node = data.node_list[i];
            if (node.connections && node.connections.length > 0) {
                await createNodeConnections(session, node.id, node.connections);
            }
        }

            console.log('\n✓ Import completed successfully!');

        } catch (error) {
            console.error('Error during import:', error);
        } finally {
            await session.close();
        }
    } catch (error) {
        console.error('Error during database setup:', error);
    } finally {
        await driver.close();
    }
}

// Run the import
importData();
