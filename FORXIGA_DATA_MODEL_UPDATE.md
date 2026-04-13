# Forxiga Supply Chain Data Model - Update Summary

## Overview
This document summarizes the updates made to adapt the Neo4j POC application for the Forxiga pharmaceutical supply chain data.

---

## Data Import

### Import Script: `importToNeo4j.js`
**Status**: ✅ Complete

The import script has been created to load data from `forxiga.json` into Neo4j with the following structure:

#### Node Types Created:
1. **Main Supply Chain Nodes** (RSM, RM, Intermediate, API, Formulation, Packing, Storage, Customer_Market)
   - Properties: id, node_type, site_name, site_country_name, plant_code, etc.

2. **Material Nodes**
   - Label: `Material`
   - Properties: material_code, material_name, material_type_name, stage
   - Relationship: `(MainNode)-[:HAS_MATERIAL]->(Material)`

3. **Material Location Nodes**
   - Label: `MaterialLocation`
   - Properties: material_identifier, prodloc_code, inventory metrics, production metrics
   - Relationship: `(Material)-[:HAS_MATERIAL_LOCATION]->(MaterialLocation)`

4. **Inventory Data Points**
   - Label: `InventoryDataPoints`
   - Properties: inventory_days_covered_API, inventory_volume_API, inventory_value_API, BULK metrics
   - Relationship: `(MainNode)-[:HAS_INVENTORY_DATA]->(InventoryDataPoints)`

5. **Production Data Points**
   - Label: `ProductionDataPoints`
   - Properties: production_budget, production_actual, production_total_year
   - Relationship: `(MainNode)-[:HAS_PRODUCTION_DATA]->(ProductionDataPoints)`

#### Supply Chain Relationships:
- `(SourceNode)-[:SUPPLIES_TO]->(DestinationNode)` - Represents supply chain flow

### Running the Import:
```bash
# First time setup
npm install neo4j-driver

# Run the import
node importToNeo4j.js
```

The script will:
1. Check if 'test' database exists (create if not)
2. Clear existing data
3. Import all 112 nodes from forxiga.json
4. Create materials, material locations, inventory data, and production data for each node
5. Create supply chain relationships based on the `connections` array

---

## Application Updates

### 1. Sample Data (`src/data/sampleData.js`)
**Status**: ✅ Updated

- Updated with Forxiga supply chain structure
- Added color scheme for all node types:
  - RSM: Brown (#8B4513)
  - RM: Red (#FF6B6B)
  - Intermediate: Orange (#FFA500)
  - API: Royal Blue (#4169E1)
  - Formulation: Lime Green (#32CD32)
  - Packing: Medium Purple (#9370DB)
  - Storage: Gold (#FFD700)
  - Customer_Market: Deep Pink (#FF1493)
  - Material: Green (#4CAF50)
  - MaterialLocation: Cyan (#00BCD4)
  - InventoryDataPoints: Amber (#FFC107)
  - ProductionDataPoints: Purple (#9C27B0)

### 2. Neo4j Service (`src/services/neo4jService.js`)
**Status**: ✅ Already compatible

- Already configured to connect to 'test' database
- Fetches all nodes and relationships correctly
- GDS algorithms ready to use

### 3. Chat Service (`src/services/chatService.js`)
**Status**: ✅ Updated

New sample questions added:
1. "show the forxiga supply chain" - Complete end-to-end supply chain
2. "show api manufacturing sites" - All API sites with connections
3. "show formulation sites" - Formulation sites with materials
4. "show customer markets" - All markets and their supply sources
5. "show materials and inventory" - Materials with inventory data
6. "show production data" - Production metrics
7. "show inventory data" - Inventory metrics
8. "show china supply chain" - China-specific entities
9. "show us supply chain" - US-specific entities
10. "show upstream suppliers for formulation" - Trace back supply chain

---

## Supply Chain Stages

The Forxiga data represents the following pharmaceutical supply chain stages:

```
RSM (Raw Supplier Materials)
  ↓ SUPPLIES_TO
RM (Raw Materials)
  ↓ SUPPLIES_TO
Intermediate (Intermediate Products)
  ↓ SUPPLIES_TO
API (Active Pharmaceutical Ingredient)
  ↓ SUPPLIES_TO
Storage (Optional storage nodes)
  ↓ SUPPLIES_TO
Formulation (Tablet/Drug formulation)
  ↓ SUPPLIES_TO
Packing (Final Product/Packaging)
  ↓ SUPPLIES_TO
Customer_Market (End markets/customers)
```

---

## Next Steps (Pending Updates)

### 4. Dashboard Service (`src/services/dashboardService.js`)
**Status**: 🔲 Pending

Update needed:
- Add Forxiga-specific dashboard queries
- Create widgets for:
  - Production volumes by site
  - Inventory levels by material type
  - Supply chain flow visualization
  - Market sales data
  - Site performance metrics

### 5. GDS Service (`src/services/gdsService.js`)
**Status**: 🔲 Pending

Update needed:
- Add supply chain specific algorithms:
  - Critical path analysis (longest/shortest path between RSM → Customer_Market)
  - Bottleneck detection (identify nodes with highest throughput)
  - Alternative supplier analysis (find backup routes for materials)
  - Inventory optimization (identify over/under-stocked locations)

### 6. Graph Visualization (`src/components/GraphVisualization.js`)
**Status**: 🔲 Pending

Update needed:
- Apply new color scheme from sampleData.js
- Add legends for node types
- Update tooltips to show Forxiga-specific properties
- Add filters by stage (RSM, RM, API, Formulation, etc.)

### 7. Algorithm Configurations (`src/data/algorithmConfigs.js`)
**Status**: 🔲 Pending

Update needed:
- Add supply chain-specific algorithm configurations
- Update node similarity to find similar manufacturing sites
- Update shortest path to find supply routes

---

## Sample Cypher Queries

Here are some useful queries for the Forxiga data:

### Get all supply chain stages
```cypher
MATCH (n)
WHERE n:RSM OR n:RM OR n:Intermediate OR n:API OR n:Formulation OR n:Packing OR n:Customer_Market
RETURN labels(n)[0] as stage, count(n) as count
ORDER BY count DESC
```

### Find path from API to Customer Market
```cypher
MATCH path = (api:API)-[:SUPPLIES_TO*]->(market:Customer_Market)
WHERE api.id = 'API_Sk_Biotek_Ireland' AND market.id = 'Customer_Market_CN'
RETURN path
```

### Get materials for a specific formulation site
```cypher
MATCH (form:Formulation {id: 'FORM_CN40'})-[:HAS_MATERIAL]->(m:Material)
RETURN form.site_name, m.material_code, m.material_name, m.material_type_name
```

### Find inventory data for all formulation sites
```cypher
MATCH (form:Formulation)-[:HAS_INVENTORY_DATA]->(inv:InventoryDataPoints)
RETURN form.id, form.site_name, inv.inventory_volume_API, inv.inventory_value_API
```

### Get production data
```cypher
MATCH (site)-[:HAS_PRODUCTION_DATA]->(prod:ProductionDataPoints)
RETURN site.id, site.site_name, prod.production_actual, prod.production_budget
ORDER BY prod.production_actual DESC
```

---

## Testing the Application

1. **Import the data**:
   ```bash
   node importToNeo4j.js
   ```

2. **Start the React application**:
   ```bash
   npm start
   ```

3. **Test the chat interface** with sample questions like:
   - "show the forxiga supply chain"
   - "show formulation sites"
   - "show materials and inventory"

4. **Verify in Neo4j Browser**:
   - Open http://localhost:7474
   - Run: `MATCH (n) RETURN labels(n) as type, count(n) as count`
   - Should see all node types: Formulation, API, Packing, Material, MaterialLocation, etc.

---

## Database Schema

```
Main Nodes (112 nodes from forxiga.json)
  ├─ [:HAS_MATERIAL] → Material nodes (multiple per main node)
  │   └─ [:HAS_MATERIAL_LOCATION] → MaterialLocation nodes (inventory details)
  ├─ [:HAS_INVENTORY_DATA] → InventoryDataPoints (1 per main node)
  ├─ [:HAS_PRODUCTION_DATA] → ProductionDataPoints (1 per main node)
  └─ [:SUPPLIES_TO] → Other Main Nodes (supply chain flow)
```

---

## Known Issues & Limitations

1. **Default Values**: Some nodes may have missing properties - the import script handles this with default values
2. **Material Matching**: MaterialLocation nodes are matched to Material nodes by `material_code` and `plant_code`
3. **Data Size**: The forxiga.json file is 1.7MB with 112 main nodes - import may take a few minutes

---

## Contact & Support

For questions about the data model or implementation:
- Check the Neo4j browser at http://localhost:7474
- Review the import logs in console
- Refer to [README_NEO4J_INTEGRATION.md](./README_NEO4J_INTEGRATION.md) for Neo4j setup
