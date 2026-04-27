const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');
const { PublicClientApplication } = require('@azure/msal-node');

// ── Load .env.local (if present) ─────────────────────────────────────────────
function loadEnvLocal() {
    const envPath = path.resolve(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!(key in process.env)) process.env[key] = val;
    }
}
loadEnvLocal();

// ── Feature flag ─────────────────────────────────────────────────────────────
const USE_AZ_CLOUD = process.env.REACT_APP_AZ_CLOUD === 'true';

const NEO4J_CONFIG = {
    uri: (USE_AZ_CLOUD ? process.env.REACT_APP_AZ_NEO4J_URI : null)
        || process.env.REACT_APP_NEO4J_URI
        || 'bolt://localhost:7687',
    username: (USE_AZ_CLOUD ? process.env.REACT_APP_AZ_NEO4J_USERNAME : null)
        || process.env.REACT_APP_NEO4J_USERNAME
        || 'neo4j',
    password: (USE_AZ_CLOUD ? process.env.REACT_APP_AZ_NEO4J_PASSWORD : null)
        || process.env.REACT_APP_NEO4J_PASSWORD
        || '',
    database: (USE_AZ_CLOUD ? process.env.REACT_APP_AZ_NEO4J_DATABASE : null)
        || process.env.REACT_APP_NEO4J_DATABASE
        || 'test',
};

// Brand configuration
const BRAND = 'tagrisso';

// ── Azure AD token helper (@azure/msal-node) ─────────────────────────────────
async function getAzureToken() {
    const authority = process.env.REACT_APP_AZ_NEO4J_AUTHORITY;
    const clientId  = process.env.REACT_APP_AZ_CLIENT_ID;
    const username  = process.env.REACT_APP_AZ_NEO4J_USERNAME;
    const password  = process.env.REACT_APP_AZ_NEO4J_PASSWORD;
    const scopes    = [`api://${clientId}/access-token`];

    const pca = new PublicClientApplication({
        auth: { clientId, authority },
    });

    // Try silent first (uses cached accounts from previous calls)
    const accounts = await pca.getTokenCache().getAllAccounts();
    if (accounts.length > 0) {
        try {
            const silent = await pca.acquireTokenSilent({ scopes, account: accounts[0] });
            if (silent?.accessToken) {
                console.log('[Import] Token acquired silently');
                return silent.accessToken;
            }
        } catch (_) {}
    }

    // Fallback to username/password (ROPC)
    const result = await pca.acquireTokenByUsernamePassword({ scopes, username, password });
    if (!result?.accessToken) throw new Error('Failed to acquire Azure token');
    console.log('[Import] Token acquired via username/password');
    return result.accessToken;
}

// ── Driver factory (async to support bearer auth) ────────────────────────────
async function createDriver() {
    if (USE_AZ_CLOUD) {
        const token = await getAzureToken();
        console.log('[Import] Using Azure AD bearer auth');
        return neo4j.driver(
            NEO4J_CONFIG.uri,
            neo4j.auth.bearer(token),
            { maxConnectionLifetime: 60 * 8 * 1000, livenessCheckTimeout: 60 * 2 * 1000 }
        );
    }
    console.log('[Import] Using basic auth');
    return neo4j.driver(
        NEO4J_CONFIG.uri,
        neo4j.auth.basic(NEO4J_CONFIG.username, NEO4J_CONFIG.password),
        { encrypted: false, trust: 'TRUST_ALL_CERTIFICATES' }
    );
}

async function ensureDatabaseExists(driver) {
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

async function clearTagrissoData(session) {
    console.log('Clearing existing Tagrisso data...');
    await session.run('MATCH (n {brand: $brand}) DETACH DELETE n', { brand: BRAND });
    console.log('Tagrisso data cleared.');
}

// Normalise label to PascalCase.
// All-uppercase multi-char words (FORMULATION, PACKING) → Formulation, Packing
// Underscored labels (Customer_Market, Distribution_Hub) → CustomerMarket, DistributionHub
// Short abbreviations kept as-is: API, RM, RSM
function normalizeNodeLabel(label) {
    if (!label) return 'Unknown';
    // Short uppercase abbreviations — keep as-is
    if (label === label.toUpperCase() && label.length <= 3) return label;
    // All-caps multi-char → PascalCase (FORMULATION → Formulation)
    if (label === label.toUpperCase()) {
        return label.charAt(0) + label.slice(1).toLowerCase();
    }
    // Underscored → PascalCase (Customer_Market → CustomerMarket)
    if (label.includes('_')) {
        return label.split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('');
    }
    return label;
}

// Returns true for placeholder / stub nodes that should not be ingested
function isMockNode(node) {
    return node.id.includes('MOCK');
}

async function createMainNode(session, node) {
    // Use type or stage_of_manufacture as fallback for node_type if not present
    const nodeType = normalizeNodeLabel(node.node_type || node.type || node.stage_of_manufacture || 'Unknown');

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
            MATCH (main {id: $mainNodeId, brand: $brand})
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
            MATCH (m:Material {material_code: $material_code, plant_code: $plant_code, brand: $brand})
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
        MATCH (main {id: $mainNodeId, brand: $brand})
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
        MATCH (main {id: $mainNodeId, brand: $brand})
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

async function createCustomerDataPoints(session, mainNodeId, dataPoints) {
    if (!dataPoints) return;

    const query = `
        MATCH (main {id: $mainNodeId, brand: $brand})
        CREATE (cdp:CustomerDataPoints {
            brand: $brand,
            customer_name: $customer_name,
            customer_code: $customer_code,
            country: $country,
            region: $region,
            sales_volume: $sales_volume,
            revenue: $revenue,
            market_share: $market_share
        })
        CREATE (main)-[:HAS_CUSTOMER_DATA {brand: $brand}]->(cdp)
        RETURN cdp
    `;

    await session.run(query, {
        mainNodeId: mainNodeId,
        brand: BRAND,
        customer_name: dataPoints.customer_name || '',
        customer_code: dataPoints.customer_code || '',
        country: dataPoints.country || '',
        region: dataPoints.region || '',
        sales_volume: dataPoints.sales_volume || 0,
        revenue: dataPoints.revenue || 0,
        market_share: dataPoints.market_share || 0
    });

    console.log(`  Created CustomerDataPoints node for ${mainNodeId}`);
}

async function createMaterialsPerMarket(session, mainNodeId, materialsPerMarket) {
    if (!materialsPerMarket || materialsPerMarket.length === 0) return;

    for (const marketData of materialsPerMarket) {
        const query = `
            MATCH (main {id: $mainNodeId, brand: $brand})
            CREATE (mpm:MaterialsPerMarket {
                brand: $brand,
                market_name: $market_name,
                market_code: $market_code,
                material_count: $material_count,
                materials: $materials,
                total_volume: $total_volume,
                total_value: $total_value
            })
            CREATE (main)-[:HAS_MARKET_MATERIALS {brand: $brand}]->(mpm)
            RETURN mpm
        `;

        await session.run(query, {
            mainNodeId: mainNodeId,
            brand: BRAND,
            market_name: marketData.market_name || '',
            market_code: marketData.market_code || '',
            material_count: marketData.material_count || 0,
            materials: marketData.materials || [],
            total_volume: marketData.total_volume || 0,
            total_value: marketData.total_value || 0
        });
    }

    console.log(`  Created ${materialsPerMarket.length} MaterialsPerMarket nodes for ${mainNodeId}`);
}

async function createNodeConnections(session, sourceNodeId, connections, validIds) {
    if (!connections || connections.length === 0) return;

    let created = 0;
    for (const targetNodeId of connections) {
        // Skip empty strings only
        if (!targetNodeId) continue;
        if (!validIds.has(targetNodeId)) {
            console.log(`  Skipping dangling ref: ${sourceNodeId} → ${targetNodeId} (target not in dataset)`);
            continue;
        }

        const transport_lead_time = Math.floor(Math.random() * 10) + 1;

        const query = `
            MATCH (source {id: $sourceNodeId, brand: $brand})
            MATCH (target {id: $targetNodeId, brand: $brand})
            MERGE (source)-[r:SUPPLIES_TO {brand: $brand}]->(target)
            SET r.transport_lead_time = $transport_lead_time
        `;

        try {
            await session.run(query, { sourceNodeId, targetNodeId, brand: BRAND, transport_lead_time });
            created++;
        } catch (error) {
            console.log(`  Warning: Could not create connection from ${sourceNodeId} to ${targetNodeId}`);
        }
    }

    if (created > 0) console.log(`  Created ${created} supply chain connections for ${sourceNodeId}`);
}

async function importData() {
    const driver = await createDriver();

    try {
        // Ensure database exists (skip for AZ cloud — no system DB access)
        if (!USE_AZ_CLOUD) await ensureDatabaseExists(driver);

        const session = driver.session({ database: NEO4J_CONFIG.database });

        try {
            // Read JSON file
            console.log('Reading tagrisso.json...');
            const data = JSON.parse(fs.readFileSync('tagrisso.json', 'utf8'));

            // Clear existing Tagrisso data only
            await clearTagrissoData(session);

            // Process each node - Create all nodes first
            console.log(`Processing ${data.node_list.length} Tagrisso nodes...`);

            // Build a set of valid node IDs for dangling-ref checks
            const validIds = new Set(data.node_list.map(n => n.id));

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

                // Create customer data points
                await createCustomerDataPoints(session, node.id, node.data_points_customer);

                // Create materials per market nodes
                await createMaterialsPerMarket(session, node.id, node.materials_per_market);
            }

            // Now create all connections between nodes
            console.log('\n\nCreating connections between Tagrisso nodes...');
            for (let i = 0; i < data.node_list.length; i++) {
                const node = data.node_list[i];
                if (node.connections && node.connections.length > 0) {
                    await createNodeConnections(session, node.id, node.connections, validIds);
                }
            }

            console.log('\n✓ Tagrisso import completed successfully!');
            console.log(`✓ Total Tagrisso nodes: ${data.node_list.length}`);

        } catch (error) {
            console.error('Error during Tagrisso import:', error);
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
