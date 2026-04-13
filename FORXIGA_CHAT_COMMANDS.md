# FORXIGA Supply Chain - Chat Interface Commands

**Application**: Neo4j POC - FORXIGA Pharmaceutical Supply Chain
**Last Updated**: 2026-04-13

---

## Available Chat Commands

The chat interface supports natural language queries mapped to optimized Neo4j Cypher queries. Below are all available commands grouped by category.

---

### 📊 Complete Supply Chain Views

#### `show the forxiga supply chain`
- **Description**: Displays the complete end-to-end FORXIGA supply chain from raw materials to customer markets
- **Returns**: All supply chain nodes (API, Formulation, Packing, Storage, Distribution, Markets) with connections
- **Dashboard**: Updates to "Supply Chain Flow" view
- **Use Case**: Executive overview, complete network visualization

#### `show supply chain stages`
- **Description**: All supply chain tiers with downstream connections
- **Returns**: RSM, RM, Intermediate, API, Formulation, Packing, Storage nodes
- **Dashboard**: Supply Chain Flow
- **Use Case**: Understanding 6-tier supply chain architecture

---

### 🏭 Manufacturing & Production Analysis

#### `show formulation sites`
- **Description**: All formulation/manufacturing sites with materials, production data, and connections
- **Returns**: 5 formulation sites (Mt Vernon, SE Snäckviken, China, Puerto Rico, Russia)
- **Dashboard**: Manufacturing Sites - Production Analysis
- **Use Case**: Production planning, capacity analysis

#### `show manufacturing bottlenecks`
- **Description**: Identifies sites with highest material concentration (potential bottlenecks)
- **Returns**: Top 5 formulation sites ranked by material count
- **Dashboard**: Manufacturing Sites
- **Key Insight**: Mt Vernon (123 materials) and SE Snäckviken (103 materials) are critical bottlenecks
- **Use Case**: Capacity optimization, risk mitigation

#### `show production capacity`
- **Description**: Production capacity utilization analysis with estimated utilization levels
- **Returns**: Sites with production actual/budget, material count, and utilization estimate
- **Dashboard**: Manufacturing Sites
- **Key Metrics**:
  - CRITICAL: 100+ materials (85-90% capacity)
  - HIGH: 80-100 materials (80-85% capacity)
  - GOOD: <80 materials (<80% capacity)
- **Use Case**: Capacity planning, expansion decisions

#### `show production data`
- **Description**: Production performance across all manufacturing sites
- **Returns**: Formulation, API, Packing sites with production data
- **Dashboard**: Manufacturing Sites
- **Use Case**: Performance tracking, budget vs actual analysis

---

### 💊 API & Raw Materials

#### `show api manufacturing sites`
- **Description**: All API (Active Pharmaceutical Ingredient) sources with production data
- **Returns**: 3 API sites (Ireland, Switzerland, Germany) with connections
- **Dashboard**: Supply Chain Flow
- **Key Suppliers**: Lonza, SK Biotek, Dottikon, BASF, Siegfried
- **Use Case**: API sourcing strategy, supplier diversification

#### `show api suppliers`
- **Description**: API supplier diversity analysis with sample materials
- **Returns**: API nodes with material counts and sample API names
- **Dashboard**: Supply Chain Flow
- **Use Case**: Supplier risk assessment, diversification planning

#### `show upstream suppliers for formulation`
- **Description**: Traces upstream supply chain from API/RM to formulation sites
- **Returns**: Complete paths showing API → Intermediate → Formulation flow
- **Dashboard**: Supply Chain Flow
- **Use Case**: Supply chain visibility, lead time analysis

---

### 📦 Materials & Inventory Management

#### `show materials and inventory`
- **Description**: Complete materials view with locations and inventory data
- **Returns**: Materials, MaterialLocations, InventoryDataPoints across all sites
- **Dashboard**: Inventory & Stock Management
- **Use Case**: Inventory optimization, stock level monitoring

#### `show inventory data`
- **Description**: Inventory metrics and stock levels across manufacturing sites
- **Returns**: Inventory value, volume, days covered
- **Dashboard**: Inventory Management
- **Use Case**: Working capital optimization, stock risk analysis

#### `show material locations`
- **Description**: Detailed material location tracking with inventory volumes
- **Returns**: Materials with positive inventory across sites
- **Dashboard**: Inventory Management
- **Use Case**: Stock allocation, distribution planning

#### `show high volume products`
- **Description**: FORXIGA products distributed across most locations
- **Returns**: Top 15 products ranked by distribution breadth
- **Key Insight**: India market SKUs distributed across 11-13 locations
- **Dashboard**: Inventory Management
- **Use Case**: SKU rationalization, distribution consolidation opportunities

---

### 🌍 Geographic & Regional Analysis

#### `show china supply chain`
- **Description**: China-specific supply chain network with all connections
- **Returns**: All nodes in China with related entities
- **Dashboard**: Supply Chain Flow
- **Use Case**: Regional strategy, China operations analysis

#### `show us supply chain`
- **Description**: US-specific supply chain network
- **Returns**: All US nodes (Mt Vernon, Newark, distribution centers)
- **Dashboard**: Supply Chain Flow
- **Use Case**: North America operations, US capacity planning

#### `show apac supply chain`
- **Description**: Asia-Pacific region supply chain (12+ countries, 31 nodes)
- **Returns**: India, China, Japan, Thailand, Malaysia, Indonesia, Australia, Singapore, etc.
- **Dashboard**: Supply Chain Flow
- **Key Markets**: India (13 nodes, 12 sites), China, Japan
- **Use Case**: APAC expansion strategy, regional optimization

#### `show emea supply chain`
- **Description**: Europe, Middle East, Africa region (20+ countries, 35 nodes)
- **Returns**: Sweden, UK, Germany, Switzerland, Ireland, Poland, Spain, France, etc.
- **Dashboard**: Supply Chain Flow
- **Key Hubs**: Sweden (Snäckviken), UK (Macclesfield), Belgium
- **Use Case**: EMEA operations, European manufacturing strategy

---

### 🔗 Network & Connectivity Analysis

#### `show critical supply chain hubs`
- **Description**: Identifies nodes with highest connectivity (10+ connections)
- **Returns**: Top 10 hub nodes ranked by connection count
- **Dashboard**: Supply Chain Flow
- **Key Hubs**:
  - SE Snäckviken/Gärtuna: 17 connections
  - Mumbai (India): 15 connections
  - Mt Vernon Packing: 14 connections
- **Use Case**: Single-point-of-failure risk assessment, network resilience

#### `show api to market flow`
- **Description**: Complete end-to-end paths from API sites to customer markets
- **Returns**: Multi-hop paths through formulation and packing
- **Dashboard**: Supply Chain Flow
- **Use Case**: Lead time analysis, supply chain optimization

---

### 🎯 Customer Markets & Distribution

#### `show customer markets`
- **Description**: All customer markets with upstream supply paths
- **Returns**: 32 customer market nodes with 1-2 hop suppliers
- **Dashboard**: Supply Chain Flow
- **Coverage**: 41 countries globally
- **Use Case**: Market coverage assessment, distribution strategy

---

## Command Usage Tips

### Partial Matching
The chat interface uses partial string matching, so you can use shortened versions:
- `show formulation` → triggers "show formulation sites"
- `show api` → triggers "show api manufacturing sites"
- `show bottleneck` → triggers "show manufacturing bottlenecks"

### Natural Language Variations
The system normalizes queries, so these variations work:
- "show me the forxiga supply chain"
- "display formulation sites"
- "what are the manufacturing bottlenecks?"

### Dashboard Synchronization
Each query automatically updates the analytics dashboard to the relevant view:
- **formulation-sites**: Manufacturing-focused charts
- **supply-chain**: End-to-end flow visualizations
- **materials-inventory**: Stock and inventory analysis
- **all**: Comprehensive overview

---

## Key Insights from Analysis

### Manufacturing Bottlenecks
- **Mt Vernon (USA)**: 123 materials, 85-90% capacity → CRITICAL
- **SE Snäckviken (Sweden)**: 103 materials, 80-85% capacity → HIGH
- **Opportunity**: Shift 20-30% load to Puerto Rico (40-50% capacity)

### High-Volume Products
- India market FORXIGA SKUs distributed across 11-13 locations
- Consolidation opportunity: Reduce from 13 → 8-10 locations (20-25% logistics savings)

### API Supplier Diversity
- 4-6 suppliers per major API (Good diversification)
- Geographic concentration in Europe (Risk: 4-6 month lead times to APAC)
- Recommendation: Develop Asian API sourcing

### Regional Distribution
- **APAC**: 31 nodes, 12+ countries (highest growth potential)
- **EMEA**: 35 nodes, 20+ countries (established network)
- **Americas**: 24 nodes, 9 countries (capacity constraints)

### Critical Hub Nodes
- SE Snäckviken: 17 connections, 78 materials → Maximum connectivity
- Mumbai: 15 connections → APAC distribution hub
- Risk: Single-point-of-failure mitigation needed

---

## Recommended Query Sequences

### Executive Overview
1. `show the forxiga supply chain` → Complete network
2. `show critical supply chain hubs` → Risk assessment
3. `show customer markets` → Market coverage

### Operations Planning
1. `show formulation sites` → Manufacturing capacity
2. `show manufacturing bottlenecks` → Constraint identification
3. `show production capacity` → Utilization analysis

### Strategic Sourcing
1. `show api suppliers` → Current supplier base
2. `show upstream suppliers for formulation` → Supply paths
3. `show api manufacturing sites` → Supplier details

### Regional Strategy
1. `show apac supply chain` → Asia-Pacific network
2. `show emea supply chain` → European network
3. `show us supply chain` → North America network

### Inventory Optimization
1. `show materials and inventory` → Current stock
2. `show high volume products` → Distribution breadth
3. `show material locations` → Stock allocation

---

## Next Steps

### Application Usage
1. Start the React application: `npm start`
2. Navigate to the Chat interface
3. Enter any command from the list above
4. View the interactive graph visualization
5. Analyze the synchronized dashboard charts

### Data Import
If data is not loaded:
```bash
node importForxigaToNeo4j.js
```

### Neo4j Browser
Verify data at: http://localhost:7474
- Database: `test`
- Expected nodes: 112 main nodes + materials + inventory + production

---

## Support & Documentation

- **Main Analysis**: [FORXIGA_SUPPLY_CHAIN_ANALYSIS.md](./FORXIGA_SUPPLY_CHAIN_ANALYSIS.md)
- **KPI Summary**: [FORXIGA_KPI_SUMMARY.txt](./FORXIGA_KPI_SUMMARY.txt)
- **Visual Diagrams**: [SUPPLY_CHAIN_STRUCTURE_VISUAL.txt](./SUPPLY_CHAIN_STRUCTURE_VISUAL.txt)
- **Analysis Index**: [ANALYSIS_INDEX.md](./ANALYSIS_INDEX.md)

---

**END OF COMMAND REFERENCE**
