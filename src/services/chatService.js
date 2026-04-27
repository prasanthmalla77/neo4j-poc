
// Hardcoded query mapping for POC - Forxiga Supply Chain
// Aligned with Dashboard Service query types
import { initDriver } from './neo4jService';

const NEO4J_DATABASE = process.env.REACT_APP_AZ_NEO4J_DATABASE
  || process.env.REACT_APP_NEO4J_DATABASE
  || 'neo4j';

const HARDCODED_QUERIES = {
  // Complete Supply Chain View
  'show the forxiga supply chain': {
    query: `MATCH (n)
WHERE n:RSM OR n:RM OR n:Intermediate OR n:API OR n:Formulation OR n:Packing OR n:Storage OR n:Customer_Market
OPTIONAL MATCH (n)-[r:SUPPLIES_TO]-(connected)
RETURN n, r, connected
LIMIT 200`,
    description: 'Fetching complete Forxiga pharmaceutical supply chain from raw materials to customer markets',
    dashboardType: 'supply-chain'
  },

  // Formulation Sites View (matches dashboard 'formulation-sites')
  'show formulation sites': {
    query: `MATCH (n:Formulation)
OPTIONAL MATCH (n)-[r1:HAS_MATERIAL]->(m:Material)
OPTIONAL MATCH (n)-[r2:HAS_PRODUCTION_DATA]->(pd:ProductionDataPoints)
OPTIONAL MATCH (n)-[r3:SUPPLIES_TO]-(connected)
RETURN n, r1, m, r2, pd, r3, connected
LIMIT 150`,
    description: 'Fetching formulation sites with materials, production data, and connections',
    dashboardType: 'formulation-sites'
  },

  // API Manufacturing Sites
  'show api manufacturing sites': {
    query: `MATCH (n:API)
OPTIONAL MATCH (n)-[r1:SUPPLIES_TO]-(connected)
OPTIONAL MATCH (n)-[r2:HAS_PRODUCTION_DATA]->(pd:ProductionDataPoints)
RETURN n, r1, connected, r2, pd
LIMIT 100`,
    description: 'Fetching all API (Active Pharmaceutical Ingredient) manufacturing sites with production data',
    dashboardType: 'supply-chain'
  },

  // Materials and Inventory (matches dashboard 'materials-inventory')
  'show materials and inventory': {
    query: `MATCH (main)
WHERE main:Formulation OR main:API OR main:Packing
OPTIONAL MATCH (main)-[r1:HAS_MATERIAL]->(m:Material)
OPTIONAL MATCH (m)-[r2:HAS_MATERIAL_LOCATION]->(ml:MaterialLocation)
OPTIONAL MATCH (main)-[r3:HAS_INVENTORY_DATA]->(inv:InventoryDataPoints)
RETURN main, r1, m, r2, ml, r3, inv
LIMIT 150`,
    description: 'Fetching materials, locations, and inventory data across the supply chain',
    dashboardType: 'materials-inventory'
  },

  // Production Performance
  'show production data': {
    query: `MATCH (main)
WHERE main:Formulation OR main:API OR main:Packing
OPTIONAL MATCH (main)-[r:HAS_PRODUCTION_DATA]->(pd:ProductionDataPoints)
RETURN main, r, pd
ORDER BY pd.production_actual DESC
LIMIT 100`,
    description: 'Fetching production performance data for all manufacturing sites',
    dashboardType: 'formulation-sites'
  },

  // Inventory Analysis
  'show inventory data': {
    query: `MATCH (main)
WHERE main:Formulation OR main:API OR main:Packing
OPTIONAL MATCH (main)-[r:HAS_INVENTORY_DATA]->(id:InventoryDataPoints)
RETURN main, r, id
ORDER BY id.inventory_value_API DESC
LIMIT 100`,
    description: 'Fetching inventory metrics and stock levels across sites',
    dashboardType: 'materials-inventory'
  },

  // Customer Markets
  'show customer markets': {
    query: `MATCH (n:Customer_Market)
OPTIONAL MATCH (upstream)-[r:SUPPLIES_TO*1..2]->(n)
RETURN n, r, upstream
LIMIT 100`,
    description: 'Fetching all customer markets and their supply chain paths',
    dashboardType: 'supply-chain'
  },

  // Regional Supply Chains
  'show china supply chain': {
    query: `MATCH (n)
WHERE n.site_country_name = 'China' OR n.countryname = 'China'
OPTIONAL MATCH (n)-[r]-(connected)
WHERE connected.site_country_name = 'China' OR connected.countryname = 'China' OR type(r) = 'SUPPLIES_TO'
RETURN n, r, connected
LIMIT 150`,
    description: 'Fetching China-specific supply chain network with all connections',
    dashboardType: 'supply-chain'
  },

  'show us supply chain': {
    query: `MATCH (n)
WHERE n.site_country_name = 'United States' OR n.countryname = 'United States'
OPTIONAL MATCH (n)-[r]-(connected)
WHERE connected.site_country_name = 'United States' OR connected.countryname = 'United States' OR type(r) = 'SUPPLIES_TO'
RETURN n, r, connected
LIMIT 150`,
    description: 'Fetching US-specific supply chain network with all connections',
    dashboardType: 'supply-chain'
  },

  // Supply Chain Paths
  'show upstream suppliers for formulation': {
    query: `MATCH path = (upstream)-[r:SUPPLIES_TO*1..3]->(form:Formulation)
WHERE upstream:API OR upstream:Intermediate OR upstream:RM
RETURN form, r, upstream, path
LIMIT 150`,
    description: 'Fetching upstream supply chain paths from API/Intermediate/RM to Formulation sites',
    dashboardType: 'supply-chain'
  },

  // End-to-End Flow
  'show api to market flow': {
    query: `MATCH path = (api:API)-[r:SUPPLIES_TO*1..4]->(market:Customer_Market)
RETURN api, r, market, path
LIMIT 100`,
    description: 'Fetching complete supply chain flow from API sites to customer markets',
    dashboardType: 'supply-chain'
  },

  // Material Details
  'show material locations': {
    query: `MATCH (form:Formulation)-[r1:HAS_MATERIAL]->(m:Material)
MATCH (m)-[r2:HAS_MATERIAL_LOCATION]->(ml:MaterialLocation)
WHERE ml.inventory_volume > 0
RETURN form, m, ml, r1, r2
ORDER BY ml.inventory_volume DESC
LIMIT 100`,
    description: 'Fetching materials with their location details and inventory volumes',
    dashboardType: 'materials-inventory'
  },

  // Supply Chain Stages
  'show supply chain stages': {
    query: `MATCH (n)
WHERE n:RSM OR n:RM OR n:Intermediate OR n:API OR n:Formulation OR n:Packing OR n:Storage
OPTIONAL MATCH (n)-[r:SUPPLIES_TO]->(downstream)
RETURN n, r, downstream
LIMIT 200`,
    description: 'Fetching all supply chain stages with downstream connections',
    dashboardType: 'supply-chain'
  },

  'which tagrisso api suppliers feed into the snackviken formulation site': {
    query: `MATCH (api:API {brand: 'tagrisso'})-[r:SUPPLIES_TO {brand: 'tagrisso'}]->(form:Formulation {brand: 'tagrisso'})
WHERE form.site_name CONTAINS 'Snäckviken'
RETURN api, r, form`,
    description: 'Fetching Tagrisso API suppliers feeding into SE: Snäckviken / Gärtuna formulation site',
    dashboardType: 'supply-chain'
  },

  'which forxiga formulation sites are dependent on a single api supplier': {
    query: `MATCH (api:API {brand: 'forxiga'})-[r:SUPPLIES_TO {brand: 'forxiga'}]->(form:Formulation {brand: 'forxiga'})
WITH form, collect(DISTINCT api) AS apiSuppliers
WHERE size(apiSuppliers) = 1
UNWIND apiSuppliers AS api
MATCH (api)-[r2:SUPPLIES_TO {brand: 'forxiga'}]->(form)
RETURN api, r2, form`,
    description: 'Fetching Forxiga formulation sites that receive API from only one supplier',
    dashboardType: 'supply-chain'
  },

  'which tagrisso nodes are external vendor sites and what countries are they in': {
    query: `MATCH (n {brand: 'tagrisso'})
WHERE n.site_type = 'ExternalESMSite' OR n.site_type = 'ExternalCMSite'
RETURN n`,
    description: 'Fetching all Tagrisso nodes flagged as ExternalESMSite or ExternalCMSite with their country data',
    dashboardType: 'supply-chain'
  },

  'show forxiga nodes where api inventory projected value is greater than 1 million': {
    query: `MATCH (site {brand: 'forxiga'})-[r:HAS_INVENTORY_DATA]->(inv:InventoryDataPoints {brand: 'forxiga'})
WHERE inv.inventory_projected_value_API > 1000000
RETURN site, r, inv
ORDER BY inv.inventory_projected_value_API DESC`,
    description: 'Fetching Forxiga supply chain nodes whose projected API inventory value exceeds $1M',
    dashboardType: 'supply-chain'
  },

  'which tagrisso packing sites have the highest production total year': {
    query: `MATCH (n:Packing {brand: 'tagrisso'})-[r:HAS_PRODUCTION_DATA]->(pd:ProductionDataPoints {brand: 'tagrisso'})
WHERE pd.production_total_year > 0
RETURN n, r, pd
ORDER BY pd.production_total_year DESC`,
    description: 'Fetching Tagrisso packing sites ranked by annual production volume',
    dashboardType: 'supply-chain'
  },

  'list all forxiga supply chain sites located in china': {
    query: `MATCH (n {brand: 'forxiga'})
WHERE n.site_country_name = 'China' OR n.vendor_country_name = 'China'
RETURN n
ORDER BY n.stage_of_manufacture, n.site_name`,
    description: 'Fetching all Forxiga supply chain nodes located in China',
    dashboardType: 'supply-chain'
  },

  'which countries have both a formulation and a packing site for tagrisso': {
    query: `MATCH (form:Formulation {brand: 'tagrisso'}), (pack:Packing {brand: 'tagrisso'})
WHERE form.site_country_name = pack.site_country_name
  AND form.site_country_name <> ''
RETURN DISTINCT form, pack`,
    description: 'Fetching Tagrisso countries that have both formulation and packing nodes',
    dashboardType: 'supply-chain'
  },

  'are there any sites that appear in both forxiga and tagrisso supply chains': {
    query: `MATCH (f {brand: 'forxiga'}), (t {brand: 'tagrisso'})
WHERE f.site_name = t.site_name
  AND f.site_name IS NOT NULL AND f.site_name <> ''
  AND labels(f)[0] = labels(t)[0]
RETURN DISTINCT f, t
ORDER BY f.site_name`,
    description: 'Fetching all AstraZeneca sites shared across both Forxiga and Tagrisso supply chains',
    dashboardType: 'supply-chain'
  },

  'show all customer markets supplied by forxiga packing sites': {
    query: `MATCH (pack:Packing {brand: 'forxiga'})-[*1..3]->(market:Customer_Market)
WHERE market.brand = 'forxiga'
RETURN DISTINCT pack, market
ORDER BY market.id`,
    description: 'Fetching all customer markets reachable from Forxiga packing sites',
    dashboardType: 'supply-chain'
  },

  'which forxiga formulation sites supply to more than 5 downstream nodes': {
    query: `MATCH (form:Formulation {brand: 'forxiga'})-[r:SUPPLIES_TO {brand: 'forxiga'}]->(downstream)
WITH form, count(DISTINCT downstream) AS downstreamCount
WHERE downstreamCount > 5
MATCH (form)-[r2:SUPPLIES_TO {brand: 'forxiga'}]->(ds)
RETURN form, r2, ds`,
    description: 'Fetching Forxiga formulation sites with more than 5 direct downstream connections',
    dashboardType: 'supply-chain'
  },

  // === SPECIFIC OPERATIONAL QUESTIONS ===

  'which forxiga manufacturing and packing sites are operating above 80% capacity': {
    query: `MATCH (n)
WHERE (n:Formulation OR n:Packing)
  AND (n.site_name = 'Mt Vernon' OR n.site_name CONTAINS 'Snäckviken' OR n.site_name = 'Macclesfield Works')
OPTIONAL MATCH (n)-[:HAS_MATERIAL]->(m:Material)
OPTIONAL MATCH (n)-[:HAS_PRODUCTION_DATA]->(prod:ProductionDataPoints)
RETURN n, m, prod
ORDER BY n.site_name`,
    description: 'Identifying high-capacity sites: Mt Vernon (85-90%), SE Snäckviken (80-85%), Macclesfield (70-75%)',
    dashboardType: 'formulation-sites'
  },

  'which forxiga supply chain nodes are located in india and how many materials do they handle': {
    query: `MATCH (n {brand: 'forxiga'})
WHERE n.site_country_name = 'India' OR n.countryname = 'India'
OPTIONAL MATCH (n)-[h:HAS_MATERIAL {brand: 'forxiga'}]->(m:Material {brand: 'forxiga'})
OPTIONAL MATCH (n)-[r:SUPPLIES_TO {brand: 'forxiga'}]-(connected {brand: 'forxiga'})
RETURN n, m, r, connected, h
ORDER BY n.site_name`,
    description: 'Fetching all India supply chain nodes (13 sites, 99 materials total)',
    dashboardType: 'supply-chain'
  },

  'which suppliers provide forxiga api materials and how many sources exist per material': {
    query: `MATCH (api:API {brand: 'forxiga'})
OPTIONAL MATCH (api)-[:HAS_MATERIAL {brand: 'forxiga'}]->(m:Material {brand: 'forxiga'})
WHERE m.material_name CONTAINS 'Dapagliflozin' OR m.material_type_name CONTAINS 'Dapagliflozin'
OPTIONAL MATCH (api)-[r:SUPPLIES_TO {brand: 'forxiga'}]->(downstream {brand: 'forxiga'})
RETURN api, m, r, downstream
ORDER BY api.site_name`,
    description: 'Identifying API suppliers: Lonza, SK Biotek, Dottikon, BASF, Siegfried (4-6 sources per material)',
    dashboardType: 'supply-chain'
  },

  'which forxiga packing sites handle more than 30 materials': {
    query: `MATCH (packing:Packing {brand: 'forxiga'})
OPTIONAL MATCH (packing)-[:HAS_MATERIAL]->(m:Material {brand: 'forxiga'})
WITH packing, count(DISTINCT m) as materialCount, collect(m) as materials
WHERE materialCount > 30
OPTIONAL MATCH (packing)-[r:SUPPLIES_TO {brand: 'forxiga'}]-(connected {brand: 'forxiga'})
RETURN packing, materials, r, connected, materialCount
ORDER BY materialCount DESC`,
    description: 'High-volume packing sites: SE Snäckviken (78), Macclesfield (48), Mt Vernon (40), Japan (41), China (35)',
    dashboardType: 'formulation-sites'
  },

  'which forxiga sites have the highest number of materials and how many does each site handle': {
    query: `MATCH (n {brand: 'forxiga'})-[h:HAS_MATERIAL {brand: 'forxiga'}]->(m:Material {brand: 'forxiga'})
WITH n, COUNT(DISTINCT m) as materialCount, collect(DISTINCT m) as materials
OPTIONAL MATCH (n)-[r:SUPPLIES_TO {brand: 'forxiga'}]-(connected {brand: 'forxiga'})
RETURN n, materials, r, connected, materialCount, h
ORDER BY materialCount DESC`,
    description: 'Ranking all Forxiga sites by material count: Mt Vernon (123), SE Snäckviken (103), Macclesfield (48)',
    dashboardType: 'material-count'
  },

  // === TOP 3 EXECUTIVE BUSINESS QUESTIONS ===

  'where can we save $15-25M annually in the forxiga supply chain': {
    query: `MATCH (n {brand: 'forxiga'})
WHERE n:Formulation OR n:Packing OR n:Distribution_Hub
OPTIONAL MATCH (n)-[:HAS_MATERIAL {brand: 'forxiga'}]->(m:Material {brand: 'forxiga'})
OPTIONAL MATCH (n)-[:HAS_PRODUCTION_DATA {brand: 'forxiga'}]->(prod:ProductionDataPoints {brand: 'forxiga'})
WITH n, labels(n)[0] as nodeType, count(DISTINCT m) as materialCount, prod
RETURN n, nodeType, materialCount, prod
ORDER BY materialCount DESC`,
    description: 'Cost optimization analysis: $3-7M from capacity rebalancing (Mt Vernon→Puerto Rico), $5-10M from SKU rationalization (382→250 SKUs), $3-6M from distribution consolidation (56→35 nodes)',
    dashboardType: 'formulation-sites'
  },

  'what are the biggest supply chain risks threatening forxiga production': {
    query: `MATCH (critical {brand: 'forxiga'})
WHERE (critical.site_name = 'Mt Vernon' OR critical.site_name = 'Macclesfield Works' OR critical.site_name CONTAINS 'Snäckviken')
  AND (critical:Formulation OR critical:Packing)
OPTIONAL MATCH (critical)-[:HAS_MATERIAL {brand: 'forxiga'}]->(m:Material {brand: 'forxiga'})
OPTIONAL MATCH (critical)<-[r:SUPPLIES_TO {brand: 'forxiga'}]-(supplier {brand: 'forxiga'})
OPTIONAL MATCH (critical)-[:SUPPLIES_TO {brand: 'forxiga'}]->(downstream {brand: 'forxiga'})
RETURN critical, m, r, supplier, downstream`,
    description: 'Critical risks identified: Mt Vernon at 85-90% capacity (206 materials, CRITICAL bottleneck), Macclesfield 384 criticality score (8 suppliers, VERY HIGH risk), SE Snäckviken 17 downstream connections (single-point-of-failure)',
    dashboardType: 'formulation-sites'
  },

  'how can we support 30-50% volume growth in apac markets': {
    query: `MATCH (apac)
WHERE apac.site_country_name IN ['India', 'China', 'Japan', 'Thailand', 'Indonesia', 'Malaysia']
  AND (apac:Formulation OR apac:Packing OR apac:API)
OPTIONAL MATCH (apac)-[:HAS_MATERIAL]->(m:Material)
OPTIONAL MATCH (apac)-[:HAS_PRODUCTION_DATA]->(prod:ProductionDataPoints)
OPTIONAL MATCH (europe:API)
WHERE europe.site_country_name IN ['Ireland', 'Switzerland', 'Germany', 'Sweden']
OPTIONAL MATCH (europe)-[:SUPPLIES_TO*1..3]->(apac)
RETURN apac, m, prod, europe`,
    description: 'Growth enablement strategy: Shift 20-30% production to available capacity (Puerto Rico 40%, Asia sites), develop APAC API sourcing (current 4-6 month lead time from Europe), consolidate India distribution (13→8 locations saves 20-25% logistics costs)',
    dashboardType: 'supply-chain'
  },

  // === TOP 2 BRANDS CHINA MARKET — END-TO-END SUPPLY CHAIN ===
  'top 2 brands in china market and their end to end supply chain': {
    query: `MATCH (market:CustomerMarket {id: 'Customer_Market_CN'})
MATCH (n)-[:SUPPLIES_TO*0..10]->(market)
WHERE n.brand = market.brand AND NOT n.id CONTAINS 'MOCK'
WITH DISTINCT n
OPTIONAL MATCH (n)-[r:SUPPLIES_TO]->(connected {brand: n.brand})
WHERE NOT connected.id CONTAINS 'MOCK'
RETURN n, r, connected
LIMIT 200`,
    description: 'Fetching end-to-end supply chains for Forxiga and Tagrisso serving the China customer market — from API through formulation, packing, and distribution to market delivery',
    dashboardType: 'supply-chain'
  }
};

// Generate NLP answer - Business Insights (NOT node counts!)
const generateNLPAnswer = (userQuestion, graphData) => {
  const normalizedQ = userQuestion.toLowerCase();

  // === TOP 2 BRANDS IN CHINA MARKET — End-to-End Supply Chain ===
  // Checked FIRST to prevent keyword fallthrough from cost/risk/growth matchers
  if (normalizedQ === 'top 2 brands in china market and their end to end supply chain') {
    return `## 🇨🇳 Top 2 Brands in the China Market — End-to-End Supply Chain

Both **Forxiga** (Dapagliflozin) and **Tagrisso** (Osimertinib) serve \`Customer_Market_CN\`. Their supply chain structures are fundamentally different — Forxiga has two parallel paths into China while Tagrisso has a single import-based path.

---

### 🥇 Forxiga — China Market Supply Chains

Forxiga has **two parallel supply chains** serving China:

#### Chain 1 — Local-for-Local (Taizhou, China)

| Stage | Node ID | Site Name | Country |
|-------|---------|-----------|-------|
| **API** | API_Sk_Biotek_Ireland | SK biotek Ireland Limited | Ireland |
| **API** | API_Dottikon_Exclusive_Switzerland | DOTTIKON EXCLUSIVE SYNTHESIS AG | Switzerland |
| **Storage** | STORAGE_Dottikon_Exclusive_Switzerland | DOTTIKON EXCLUSIVE SYNTHESIS AG | Sweden (SSEC) |
| **Formulation** | FORM_CN40 | AstraZeneca China Taizhou (CN40) | China 🇨🇳 |
| **Packing** | FP_CN40 | AstraZeneca China Taizhou (CN40) | China 🇨🇳 |
| **Distribution Hub** | DISTRIBUTION HUB_CN10 | AstraZeneca China Imported FG (CN10) | China 🇨🇳 |
| **Customer Market** | Customer_Market_CN | China Market | China 🇨🇳 |

> FP_CN40 connects to Customer_Market_CN both directly and via DISTRIBUTION HUB_CN10.

#### Chain 2 — Import via US Formulation + China Packing (CN20)

| Stage | Node ID | Site Name | Country |
|-------|---------|-----------|-------|
| **API** | API_Sk_Biotek_Ireland | SK biotek Ireland Limited | Ireland |
| **API** | API_Dottikon_Exclusive_Switzerland | DOTTIKON EXCLUSIVE SYNTHESIS AG | Switzerland |
| **Storage** | STORAGE_Dottikon_Exclusive_Switzerland | DOTTIKON EXCLUSIVE SYNTHESIS AG | Sweden (SSEC) |
| **Formulation** | FORM_1448 | Mt Vernon (1448) | United States |
| **Packing** | FP_CN20 | AstraZeneca Pharma Co., Ltd. (CN20) | China 🇨🇳 |
| **Distribution Hub** | DISTRIBUTION HUB_CN10 | AstraZeneca China Imported FG (CN10) | China 🇨🇳 |
| **Customer Market** | Customer_Market_CN | China Market | China 🇨🇳 |

> FP_CN20 (Forxiga) also feeds 9 APAC distribution hubs: MY10, AU10, ID10, TH10, NZ10, PH10, SG10, HK10, IN1B → Customer_Market_ASIAPAC.

---

### 🥈 Tagrisso — China Market Supply Chain

Tagrisso has a **single supply chain** serving China — formulation in Sweden, packing in China:

| Stage | Node ID | Site Name | Country |
|-------|---------|-----------|-------|
| **API** | API_Lonza_LTD_Switzerland | Lonza LTD (Basel) | Switzerland (SCHC) |
| **API** | API_Dottikon_Exclusive_Switzerland | DOTTIKON EXCLUSIVE SYNTHESIS AG | Switzerland (SCHC) |
| **Storage** | STORAGE_Lonza_LTD_Switzerland | LONZA LTD | Sweden (SSEC) |
| **Storage** | STORAGE_Dottikon_Exclusive_Switzerland | DOTTIKON EXCLUSIVE SYNTHESIS AG | Sweden (SSEC) |
| **Formulation** | FORM_SE01 | SE: Snäckviken / Gärtuna (SE01) | Sweden 🇸🇪 |
| **Packing** | FP_CN20 | AstraZeneca Pharma Co., Ltd. (CN20) | China 🇨🇳 |
| **Customer Market** | Customer_Market_CN | China Market | China 🇨🇳 |

> FORM_SE01 (Tagrisso) also supplies FP_JP10 (Japan), FP_1402 (US), FP_SE01 (Sweden), and others — those are outside the China chain.

---

### 📊 Supply Chain Comparison: Forxiga vs Tagrisso in China

| Dimension | Forxiga | Tagrisso |
|-----------|---------|----------|
| **China supply chains** | 2 (CN40 local + CN20 import) | 1 (CN20 import only) |
| **Local formulation in China** | Yes — FORM_CN40 (Taizhou, CN40) | No |
| **China packing sites** | FP_CN40 (Taizhou) + FP_CN20 | FP_CN20 only |
| **Formulation sites for China** | FORM_CN40 (China) + FORM_1448 (US) | FORM_SE01 (Sweden) |
| **API — Ireland (SK Biotek)** | ✓ | ✗ |
| **API — Switzerland (Lonza)** | ✗ | ✓ |
| **API — Switzerland (Dottikon)** | ✓ | ✓ |
| **API storage location** | Sweden (SSEC) | Sweden (SSEC) |
| **Distribution hub to market** | DISTRIBUTION HUB_CN10 (CN10) | Direct — FP_CN20 → Customer_Market_CN |`;
  }

  // === OPERATIONAL QUESTIONS ===

  // Q4: Tagrisso external vendor sites and countries
  if (normalizedQ === 'which tagrisso nodes are external vendor sites and what countries are they in') {
    return `## 🌍 Tagrisso External Vendor Sites by Country

The Tagrisso supply chain has external vendor and ESM (External Supply Management) nodes spanning **2 identified countries**:

### 🇨🇭 Switzerland — 4 nodes (API & Storage)
- **Lonza LTD (Basel)** — API site (SCHC / GES CM: SE Switzerland). Supplies Osimertinib Mesylate to FORM_SE01 and FORM_1448. This is the sole API supplier for the Snäckviken formulation site.
- **DOTTIKON EXCLUSIVE SYNTHESIS AG** — API site (SCHC / GES CM: SE Switzerland). Supplies to FORM_1448.
- **LONZA LTD** — Storage node (GES CM: SE Sweden, vendor from Switzerland). Feeds into FORM_SE01.
- **DOTTIKON EXCLUSIVE SYNTHESIS AG** — Storage node (GES CM: SE Sweden, vendor from Switzerland). Feeds into FORM_SE01 and FORM_1448.

### 🇯🇵 Japan — 2 nodes (Distribution Hubs)
- **West Distribution Center** (JP11) — serves the Japan customer market.
- **East Distribution Center** (JP12) — also serves the Japan customer market.

> Additionally, there are RSM and Intermediate mock nodes flagged as ExternalESMSite but without country metadata in the graph. The two main external **API vendors** for Tagrisso are **Lonza** and **Dottikon**, both based in Switzerland.`;
  }

  // Q11: Forxiga formulation sites with >5 downstream connections
  if (normalizedQ === 'which forxiga formulation sites supply to more than 5 downstream nodes') {
    const nodeById = {};
    (graphData?.nodes || []).forEach(n => { nodeById[n.id] = n; });
    const connCounts = {};
    (graphData?.relationships || []).filter(r => r.type === 'SUPPLIES_TO').forEach(edge => {
      const siteNode = nodeById[edge.startNode] || nodeById[edge.from];
      if (!siteNode || siteNode.labels?.[0] !== 'Formulation') return;
      const name = siteNode.properties?.site_name || siteNode.properties?.id || '—';
      connCounts[name] = (connCounts[name] || 0) + 1;
    });
    const siteLines = Object.entries(connCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `- **${name}** — ${count} downstream packing site(s)`);
    return `## 🔗 Forxiga Formulation Sites with High Downstream Connectivity (>5 nodes)

${siteLines.join('\n') || 'No formulation sites with >5 downstream connections found in current graph data.'}

> Sites with many downstream connections represent **supply chain hubs** — disruption at these sites would affect the most markets.`;
  }

  // Q10: Customer markets supplied by Forxiga packing sites
  if (normalizedQ === 'show all customer markets supplied by forxiga packing sites') {
    return `## 🏪 Forxiga Customer Markets — Supplied by Packing Sites

Forxiga packing sites supply **13 distinct customer markets** globally, served by **12 packing sites** across 8 countries:

| Customer Market | Market Label | Primary Packing Site(s) |
|----------------|-------------|-------------------------|
| **ASIAPAC** | TW, AU, VN & 14 other countries | CN20 (China), SE01 (Sweden), UK05 (UK), IN11 (India), IN10 (India) |
| **EUROPE** | FR, DE, ES & 32 other countries | SE01 (Sweden), UK05 (UK), SE16 (Sweden) |
| **MEA** | TR, EG, MA & 26 other countries | SE01 (Sweden), UK05 (UK), EG11 (Egypt) |
| **EURASIA** | UA, GE, KZ & 3 other countries | SE01 (Sweden), UK05 (UK) |
| **ASIA** | Myanmar | SE01 (Sweden), UK05 (UK) |
| **China (CN)** | China | CN20 (China), CN40 (China) |
| **Brazil (BR)** | Brazil | FP_1448 (USA), FP_1402 (USA), FP_CE01 (Brazil) |
| **USA (US)** | USA | FP_1448 (USA), FP_1402 (USA) |
| **LATAM** | CO, PA, CL & 3 other countries | FP_1448 (USA) |
| **Canada (CA)** | Canada | FP_1448 (USA) |
| **Mexico (MX)** | Mexico | FP_1448 (USA), FP_1000 (Mexico) |
| **Russia (RU)** | Russian Federation | FP_RU03 (Russia) |
| **Japan (JP)** | Japan | FP_JP10 (Japan) |

> **UK:Macclesfield Works** and **SE: Snäckviken / Gärtuna** are the two most globally connected packing sites, each covering 5+ market regions. **Mt Vernon (FP_1448, USA)** is the broadest single Americas hub, serving US, Brazil, Canada, Mexico, and LATAM.`;
  }

  // Q9: Shared sites across Forxiga and Tagrisso
  if (normalizedQ === 'are there any sites that appear in both forxiga and tagrisso supply chains') {
    return `## 🔄 Sites Shared Across Both Forxiga and Tagrisso Supply Chains

The graph shows **~61 distinct sites** appear in both the Forxiga and Tagrisso supply chains. Each node exists twice in the database (once per brand) with identical site codes.

### Key Shared Manufacturing Sites
| Site | Code | Stage | Country |
|------|------|-------|---------|
| **SE: Snäckviken / Gärtuna** | SE01 | Formulation + Packing | Sweden |
| **Mt Vernon** | 1448 | Formulation | USA |
| **AstraZeneca Industries LLC** | RU03 | Formulation + Packing | Russia |
| **AstraZeneca K.K.** | JP10 | Packing | Japan |
| **AstraZeneca Pharma Co., Ltd.** | CN20 | Packing | China |
| **Newark PLP** | 1402 | Packing | USA |
| **SE: EMEA Sweden** | SE16 | Packing | Sweden |
| **EMEA Russia supplies** | SE20 | API | Sweden |

### Shared Distribution Network
**~50 Distribution Hub sites** are shared across both brands, spanning:
- 🇮🇳 India: 12 city-level hubs (Mumbai, Delhi, Chennai, Bangalore, Hyderabad, Ahmedabad, Chandigarh, Kolkata, Guwahati, Kochi, Indore + ISMO)
- 🇨🇦 Canada: 4 hubs (Accuristix + 3 CPDN locations)
- 🇪🇺 Europe: ~15 hubs (Germany, France, Belgium, Austria, Italy, Spain, Portugal, Switzerland, Poland, Czech, Bulgaria, Greece, Hungary, Netherlands + Sweden)
- 🌏 APAC: ~10 hubs (Australia, NZ, Singapore, Hong Kong, Malaysia, Thailand, Indonesia, Philippines, Japan)
- Other: Russia, Brazil, Mexico, Argentina, Colombia, Chile, Panama, South Africa

> The shared distribution infrastructure means AstraZeneca uses the **same logistics network** for both oncology (Tagrisso) and diabetes (Forxiga) products globally.`;
  }

  // Q8: Countries with both Formulation and Packing for Tagrisso
  if (normalizedQ === 'which countries have both a formulation and a packing site for tagrisso') {
    return `## 🌍 Tagrisso Countries with Both Formulation & Packing Sites

**3 countries** in the Tagrisso network host both a formulation and a packing site:

### 🇷🇺 Russian Federation
- **Formulation:** AstraZeneca Industries LLC (RU03)
- **Packing:** AstraZeneca Industries LLC (RU03) — same site serves both stages

### 🇸🇪 Sweden
- **Formulation:** SE: Snäckviken / Gärtuna (SE01) — the primary global formulation hub
- **Packing (3 sites):** SE: Snäckviken / Gärtuna (SE01) · EMEA Russia supplies (SE20) · SE: EMEA Sweden
- Sweden has the most co-located formulation+packing capacity of any country in the Tagrisso network

### 🇺🇸 United States
- **Formulation:** Mt Vernon (1448) — the primary US formulation site
- **Packing:** Newark PLP (1402) — dedicated US packing, serves the US customer market

> Countries like Japan and China have packing sites but **no formulation** capacity for Tagrisso, making them dependent on finished formulated bulk from Sweden or the US.`;
  }

  // Q7: Forxiga supply chain sites in China
  if (normalizedQ === 'list all forxiga supply chain sites located in china') {
    return `## 🇨🇳 Forxiga Supply Chain Sites Located in China

The Forxiga network has **4 nodes** in China, spanning 3 manufacturing stages:

### Formulation
- **AstraZeneca China Taizhou** (FORM_CN40) — Taizhou, China
  - The only Forxiga formulation site in China. Also serves as the local packing site.
  - Sole API supplier: SK biotek Ireland Limited
  - Downstream: FP_CN40 (local packing) and FP_UK05

### Packing
- **AstraZeneca China Taizhou** (FP_CN40) — dual-role site (formulation + packing)
  - Connects to: China customer market and CN10 distribution hub
- **AstraZeneca Pharma Co., Ltd.** (FP_CN20) — a separate packing-only site
  - The largest Tagrisso packing site by volume, also present in Forxiga network
  - Serves multiple APAC markets: Australia, India, Singapore, Hong Kong, Philippines, Indonesia, Malaysia, New Zealand, Thailand

### Distribution
- **AstraZeneca China Imported FG** (CN10) — distribution hub
  - Receives packed goods from FP_CN40 and FP_CN20
  - Delivers to the **China Customer Market**

> China is both a manufacturing and distribution hub for Forxiga. The Taizhou site handles the full formulation-to-packing cycle locally.`;
  }

  // Q6: Tagrisso packing sites by production total year
  if (normalizedQ === 'which tagrisso packing sites have the highest production total year') {
    return `## 🏭 Tagrisso Packing Sites — Ranked by Annual Production Volume

The graph shows **4 Tagrisso packing sites** with production data, ranked by production_total_year:

| Rank | Site | Country | Production Total (Year) | Budget | Actual YTD |
|------|------|---------|------------------------|--------|------------|
| 1 | **AstraZeneca Pharma Co., Ltd.** (CN20) | China | **60,178,500** | 62,370,000 | 8,199,300 |
| 2 | **SE: Snäckviken / Gärtuna** (SE01) | Sweden | **29,762,129** | 28,598,764 | 4,457,349 |
| 3 | **Newark PLP** (1402) | USA | **8,321,090** | 10,759,920 | 411,720 |
| 4 | **AstraZeneca K.K.** (JP10) | Japan | **6,449,660** | 8,439,816 | 1,549,464 |

**Key observations:**
- **CN20 (China)** is the highest-volume packing site, running at ~96% of budget — the dominant packing hub for Tagrisso globally
- **SE01 (Sweden)** slightly exceeds its budget (104%), the most connected packing site with 53 downstream nodes across all major markets
- **Newark PLP (USA)** is operating significantly below budget (77%) — only serves the US market via 3 distribution hubs
- **JP10 (Japan)** also below budget (76%) — dedicated to the Japan market via West/East distribution centers`;
  }

  // Q5: Forxiga nodes with API inventory projected value > $1M
  if (normalizedQ === 'show forxiga nodes where api inventory projected value is greater than 1 million') {
    return `## 💰 Forxiga Nodes with API Inventory Projected Value > $1M

**9 nodes** across the Forxiga supply chain hold projected API inventory exceeding $1 million, ranked highest to lowest:

1. **GES CM: SE UK** — DOTTIKON EXCLUSIVE SYNTHESIS AG (API, Switzerland) — **$70.0M** projected | 21,489 kg volume
2. **GES CM: SE Sweden** — SK biotek Ireland Limited (API, Ireland) — **$42.5M** projected | 13,088 kg | 11.7 days covered
3. **SE: Snäckviken / Gärtuna** (FORM_SE01, Sweden) — **$37.0M** projected API | actual on-hand: $34.2M | 136.5 days covered
4. **AstraZeneca Industries LLC** (FORM_RU03, Russia) — **$18.9M** projected | 15.6 days covered
5. **Mt Vernon** (FORM_1448, USA) — **$18.4M** projected | actual on-hand: $27.1M | 128.6 days covered
6. **AstraZeneca China Taizhou** (FORM_CN40, China) — **$9.2M** projected | actual on-hand: $5.3M | 35.2 days covered
7. **GES CM: SE Sweden — Storage** (STORAGE_Dottikon, Switzerland) — **$6.8M** projected | actual on-hand: $11.1M | 131.3 days covered
8. **Canovanas Plant** (FORM_KA01, Puerto Rico) — **$3.1M** projected | actual on-hand: $12.1M | 137.1 days covered
9. **EMEA Russia supplies** (API_SE20, Sweden) — **$1.7M** projected | design days: 19

> The two external API vendors — **Dottikon** and **SK biotek** — together account for over **$112M** in combined projected API inventory, representing the largest monetary exposure point in the entire Forxiga supply chain.`;
  }

  // Q3: Forxiga formulation sites with single API supplier
  if (normalizedQ === 'which forxiga formulation sites are dependent on a single api supplier') {
    return `## ⚠️ Forxiga Formulation Sites Dependent on a Single API Supplier

**1 formulation site** has only one direct API supplier in the graph:

- **AstraZeneca China Taizhou** (FORM_CN40) — China
  - Sole API supplier: **SK biotek Ireland Limited** (vendor from Ireland, managed via GES CM: SE Sweden)
  - This formulation site connects downstream to FP_CN40 and FP_UK05

All other Forxiga formulation sites have more than one API supplier and were not returned by this query.`;
  }

  // Q2: Tagrisso API suppliers → SE Snäckviken
  if (normalizedQ === 'which tagrisso api suppliers feed into the snackviken formulation site') {
    return `## 🧪 Tagrisso API Suppliers → SE: Snäckviken / Gärtuna

The Snäckviken / Gärtuna formulation site (FORM_SE01) in Sweden has **only one direct API supplier** — **Lonza LTD (Basel)**, based in Switzerland. This means the entire API input for this formulation site flows from a single external vendor in Switzerland.

The formulation site itself is an AstraZeneca-owned site (AZSite) and once it finishes processing, it supplies forward to multiple packing sites including FP_JP10, FP_CN20, FP_SE01, FP_1402 and others.`;
  }

  // Q1: High Capacity Sites (80%+)
  if (normalizedQ === 'which forxiga sites are operating above 80% capacity') {
    return `## 🏭 High-Capacity Manufacturing & Packing Sites (>80% Utilization)

**CRITICAL CAPACITY CONSTRAINTS IDENTIFIED:**

**Site #1: Mt Vernon (United States) - CRITICAL**
- **Node Type:** Formulation + Packing (Dual Role)
- **Materials Handled:** 123 total (83 formulation + 40 packing)
- **Capacity Utilization:** 85-90% (CRITICAL)
- **Criticality Score:** 249 (VERY HIGH)
- **Risk Level:** Cannot absorb growth or disruptions
- **Impact:** Handles entire North America supply
- **Mitigation:** Shift 20-30% production to Puerto Rico (Canovanas Plant at 40-45% capacity)

**Site #2: SE Snäckviken/Gärtuna (Sweden) - HIGH**
- **Node Type:** Formulation + Packing
- **Materials Handled:** 103 total (78 packing + 25 formulation)
- **Capacity Utilization:** 80-85% (HIGH)
- **Connectivity:** 17 downstream connections (highest in network)
- **Risk Level:** Single-point-of-failure for EMEA
- **Impact:** Disruption affects entire European distribution
- **Mitigation:** Develop parallel routing through Macclesfield (UK) or China/Japan

**Site #3: Macclesfield Works (United Kingdom) - GOOD**
- **Node Type:** Packing
- **Materials Handled:** 48 materials
- **Capacity Utilization:** 70-75% (GOOD - below 80% threshold)
- **Criticality Score:** 384 (HIGHEST in network due to 8 supplier dependencies)
- **Risk Level:** Bottleneck risk due to supplier concentration
- **Brexit Impact:** Potential regulatory/customs delays
- **Status:** Approaching capacity constraints

**CAPACITY SUMMARY:**

| Site | Country | Type | Materials | Capacity | Status |
|------|---------|------|-----------|----------|--------|
| Mt Vernon | USA | Form+Pack | 123 | 85-90% | CRITICAL |
| SE Snäckviken | Sweden | Form+Pack | 103 | 80-85% | HIGH |
| Macclesfield | UK | Packing | 48 | 70-75% | GOOD |

**AVAILABLE CAPACITY (EXPANSION OPPORTUNITIES):**
- **Puerto Rico (Canovanas Plant):** 40-45% utilization, 14 materials - CAN ABSORB 20-30% SHIFT
- **India Sites:** Multiple facilities with expansion capacity
- **China Sites:** Regional manufacturing capacity available

**RECOMMENDATION:**
Immediate capacity rebalancing required. Shift Mt Vernon production to Puerto Rico to free up 30-50% capacity, enabling volume growth and reducing single-point-of-failure risk.

🎯 **The graph shows high-capacity sites (red/orange nodes) and their material distribution, highlighting bottleneck risks.**`;
  }

  // Q2: India Supply Chain Nodes
  if (normalizedQ === 'how many supply chain nodes are in india and what materials do they handle') {
    return `## 🇮🇳 India Supply Chain Network Analysis

**INDIA SUPPLY CHAIN OVERVIEW:**
- **Total Nodes:** 13 sites (12 manufacturing/distribution, 1 market endpoint)
- **Total Materials Handled:** 99 materials across the network
- **Geographic Rank:** #1 by node count (highest distribution density globally)
- **Network Type:** Distribution-heavy (multiple fulfillment centers serving regional markets)

**TOP INDIA SUPPLY CHAIN NODES BY MATERIAL VOLUME:**

**1. AZ India Mumbai (DIST_IN1B) - Distribution Hub**
- **Materials:** 9 materials
- **Connections:** 15 outgoing (2nd highest connectivity in entire network)
- **Role:** Primary distribution hub for Western India
- **Type:** Distribution Center

**2. AZ India ISMO (DIST_IN10) - Distribution Hub**
- **Materials:** 5 materials
- **Connections:** 14 outgoing connections
- **Role:** Central distribution hub
- **Type:** Distribution Center

**3. AZ India ISMO Packing (FP_IN10)**
- **Materials:** 4 materials
- **Connections:** 13 outgoing connections
- **Role:** Packing site with integrated distribution
- **Type:** Packing + Distribution

**4-13. Additional India Sites:**
- 10 additional distribution and fulfillment centers
- Combined materials: 81+ materials
- Strategic locations across major cities

**HIGH-DISTRIBUTION PRODUCTS IN INDIA (SKU Analysis):**

The following FORXIGA products are distributed across **11-13 locations in India** (highest distribution density globally):

| Product Code | Description | India Locations |
|--------------|-------------|-----------------|
| 110037757 | FORXIGA TAB 5MG BL 2X14 EA IN | 13 locations |
| 110037759 | FORXIGA TAB 10MG BL 2X14 EA IN | 13 locations |
| 110025632 | FORXIGA TAB 5MG BL TE 7X14 EA IN | 12 locations |
| 110025611 | FORXIGA TAB 10MG BL 7X14 EA IN | 12 locations |
| 110020781 | FORXIGA TAB 10MG BL TE 2X14 EA IN | 11 locations |
| 110020780 | FORXIGA TAB 5MG BL TE 2X14 EA IN | 11 locations |

**OPTIMIZATION OPPORTUNITY:**

**Current State:** FORXIGA distributed across 13 locations in India (over-distributed)

**Recommendation:** Consolidate from 13 → 8 regional distribution centers

**Impact:**
- **Cost Savings:** 20-25% logistics cost reduction ($2-4M annually for India alone)
- **Inventory Optimization:** Reduced working capital requirements
- **Service Level:** Maintained through strategic regional hub placement
- **Timeline:** 9-18 months implementation

**STRATEGIC INSIGHTS:**
- India represents **APAC's highest-growth diabetes medication market**
- Current 13-location distribution indicates strong market demand signals
- Geographic customization (IN suffix) suggests regional regulatory/packaging requirements
- Consolidation should balance cost vs. service level (maintain regional coverage)

🌏 **The graph shows India's distribution network (green nodes) with material flows and consolidation opportunities highlighted.**`;
  }

  // Q3: API Suppliers
  if (normalizedQ === 'who are the api suppliers for forxiga and how many sources does each material have') {
    return `## 🧪 FORXIGA API Supplier Analysis

**API SUPPLIER OVERVIEW:**
- **Total API Manufacturing Sites:** 3 primary nodes
- **Unique Dapagliflozin Materials:** 15 raw material SKUs
- **Sources per Material:** 4-6 suppliers (GOOD diversification)
- **Geographic Concentration:** Europe-centric (MEDIUM risk)

**PRIMARY API SUPPLIERS:**

**1. GES CM: SE Sweden (SK Biotek Ireland operations)**
- **Location:** Sweden (European operations)
- **Materials Supplied:** 13 Dapagliflozin API materials
- **Connections:** 11 downstream manufacturing sites
- **Primary Material:** Dapagliflozin PWD SK Biotek (4-6 sources)
- **Status:** Primary European API supplier

**2. SK Biotek (South Korea/Ireland)**
- **Locations:** Ireland manufacturing, South Korea R&D
- **Materials:** Dapagliflozin API variants
- **Sources:** 4-5 per material
- **Status:** Major API supplier with multi-country operations

**3. Dottikon (Switzerland)**
- **Location:** Dottikon, Switzerland
- **Materials:** Dapagliflozin Dott Lonza PWD (6 sources)
- **Special:** Integrated storage facility (Tier 2 node)
- **Status:** High-quality Swiss API manufacturing

**KEY API MATERIALS WITH SOURCE DIVERSIFICATION:**

| Material Code | Material Name | Number of Sources |
|---------------|---------------|-------------------|
| 110022854 | Dapagliflozin Dott Lonza Pwd | 6 sources |
| 110037611 | Dapagliflozin Dott Lonza Nansha | 5 sources |
| 110025218 | Dapagliflozin PWD SK Biotek | 4 sources |
| 110040926 | Dapagliflozin PWD BSI | 4 sources |
| 4000930 | Dapagliflozin SK Biotek SJ | 4 sources |

**COMPLETE SUPPLIER ECOSYSTEM:**

**Primary API Manufacturers:**
- ✓ **Lonza** (Switzerland + China Nansha facility)
- ✓ **SK Biotek** (South Korea + Ireland)
- ✓ **Dottikon** (Switzerland)
- ✓ **BASF** (Germany)
- ✓ **Siegfried** (Switzerland + China operations)

**SUPPLIER RISK ASSESSMENT:**

**Strengths:**
- **Good Diversification:** 4-6 suppliers per API material
- **Quality Standards:** European pharmaceutical-grade manufacturing
- **Regulatory Compliance:** All suppliers meet stringent EU/FDA requirements

**Weaknesses:**
- **Geographic Concentration:** ALL suppliers located in Europe
- **Lead Time Impact:** 4-6 months to APAC markets (vs 2-3 months if Asian API available)
- **Regional Risk:** Europe-centric creates single-region dependency

**RISK LEVEL:** MEDIUM

**MITIGATION STRATEGY:**

**Recommendation:** Develop APAC API Sourcing Capacity

**Target Regions:**
- India (leverage local pharmaceutical manufacturing base)
- China (Lonza already has Nansha facility - expand)
- South Korea (SK Biotek home base - increase capacity)

**Impact:**
- Cut lead time 50% (6 months → 3 months) for APAC markets
- Reduce geographic concentration risk
- Lower logistics costs for Asia-Pacific distribution
- Enable 30-50% APAC volume growth

**Timeline:** 18-36 months (includes regulatory approval process)

**Supply Chain Health:** 7.2/10 (Good supplier diversity, BUT Europe-concentrated)

🔬 **The graph shows API suppliers (blue nodes) with their downstream connections to formulation sites, highlighting the Europe→Global flow pattern.**`;
  }

  // Q4: Sites with Highest Material Counts
  if (normalizedQ === 'which sites handle the highest number of materials in the forxiga supply chain') {
    return `## 📊 Forxiga Sites Ranked by Material Count

**TOP 10 SITES BY MATERIAL VOLUME:**

**#1: Mt Vernon (United States) - 123 Materials**
- **Type:** Formulation + Packing (Dual Role)
- **Status:** CRITICAL - Highest material volume globally
- **Capacity:** 85-90% utilization
- **Role:** North America primary manufacturing hub

**#2: SE Snäckviken/Gärtuna (Sweden) - 103 Materials**
- **Type:** Formulation + Packing + Distribution
- **Status:** HIGH - Second highest volume
- **Capacity:** 80-85% utilization
- **Role:** Primary EMEA distribution center

**#3: UK Macclesfield Works (United Kingdom) - 48 Materials**
- **Type:** Packing
- **Status:** GOOD
- **Capacity:** 70-75% utilization
- **Role:** UK/EMEA packing operations

**#4: AstraZeneca K.K. (Japan) - 41 Materials**
- **Type:** Packing
- **Capacity:** 65-70% utilization
- **Role:** Primary APAC packing facility

**#5: AstraZeneca Pharma Co., Ltd. (China) - 35 Materials**
- **Type:** Packing
- **Role:** China local-for-local operations

**#6: Hungary 3PL - UPS - 31 Materials**
- **Type:** Distribution/3PL
- **Role:** European distribution hub

**#7-9: Mexico & US Sites - 18 Materials each**
- Planta Lomas Verdes (Mexico)
- Newark PLP (United States)
- AstraZeneca do Brasil Ltda. (Brazil)

**#10: Multiple Sites - 15-17 Materials**
- AstraZeneca China Taizhou: 17 materials
- Centro de Distribucion 2000: 16 materials
- AstraZeneca Industries LLC: 16 materials
- GES CM SE Sweden: 15 materials

**INDIA DISTRIBUTION NETWORK (13 sites, 8-9 materials each):**
The India network shows consistent distribution with multiple sites handling 8-9 materials each, indicating a well-distributed regional network.

**KEY INSIGHTS:**
- **Top 2 sites (Mt Vernon + SE Snäckviken) handle 226 materials combined** (18% of all materials)
- **Geographic concentration:** Top sites located in US, Europe, and APAC
- **Material distribution range:** 1-123 materials per site (high variance)
- **Regional hubs identified:** North America (Mt Vernon), EMEA (SE Snäckviken), APAC (Japan, China)

📍 **The graph shows all sites sized by material count, with the largest nodes representing the highest-volume sites.**`;
  }

  // Q5: High-Volume Packing Sites (>30 materials)
  if (normalizedQ === 'which forxiga packing sites produce more than 30 materials') {
    return `## 📦 High-Volume Packing Sites (>30 Materials)

**PACKING SITES HANDLING 30+ MATERIALS:**

**RANK #1: SE Snäckviken (Sweden) - HIGHEST VOLUME**
- **Materials Handled:** 78 materials
- **Node Type:** Packing + Distribution
- **Connections:** 17 downstream nodes (HIGHEST connectivity in entire network)
- **Capacity Utilization:** 80-85% (HIGH)
- **Criticality Score:** 156 (HIGH)
- **Geographic Reach:** Primary EMEA distribution hub
- **Role:** Central European packing and distribution center
- **Risk:** Single-point-of-failure for European market
- **Mitigation:** Develop parallel UK or China/Japan routing

**RANK #2: Macclesfield Works (United Kingdom)**
- **Materials Handled:** 48 materials
- **Node Type:** Packing
- **Connections:** 10 downstream nodes
- **Capacity Utilization:** 70-75% (GOOD, approaching constraints)
- **Criticality Score:** 384 (HIGHEST in entire network)
- **High Criticality Reason:** 8 input supplier dependencies creating bottleneck risk
- **Brexit Impact:** Potential regulatory/customs delays
- **Role:** UK/EMEA packing operations
- **Risk:** Supplier dependency bottleneck
- **Mitigation:** Divert 30% volume to SE Snäckviken or qualify China/Japan alternatives

**RANK #3: AstraZeneca K.K. (Japan)**
- **Materials Handled:** 41 materials
- **Node Type:** Packing
- **Connections:** Moderate (regional distribution)
- **Capacity Utilization:** 65-70% (GOOD)
- **Geographic Reach:** Japan + APAC markets
- **Role:** Primary APAC packing facility
- **Status:** Available capacity for growth

**RANK #4: Mt Vernon (United States)**
- **Materials Handled:** 40 packing materials (123 total including formulation)
- **Node Type:** Formulation + Packing (Dual Role)
- **Connections:** 14 downstream nodes
- **Capacity Utilization:** 85-90% (CRITICAL)
- **Role:** North America primary manufacturing and packing
- **Risk:** Dual-role overutilization creating supply chain vulnerability
- **Mitigation:** Shift packing to Puerto Rico or regional alternatives

**RANK #5: AstraZeneca Pharma (China)**
- **Materials Handled:** 35 materials
- **Node Type:** Packing
- **Connections:** 13 downstream nodes
- **Capacity Utilization:** Moderate (expansion capacity available)
- **Geographic Reach:** China + APAC regional markets
- **Role:** China local-for-local packing operations
- **Growth Potential:** Can support APAC expansion

**PACKING VOLUME SUMMARY:**

| Rank | Site | Country | Materials | Capacity | Status |
|------|------|---------|-----------|----------|--------|
| 1 | SE Snäckviken | Sweden | 78 | 80-85% | HIGH |
| 2 | Macclesfield | UK | 48 | 70-75% | GOOD |
| 3 | AZ K.K. | Japan | 41 | 65-70% | GOOD |
| 4 | Mt Vernon | USA | 40 | 85-90% | CRITICAL |
| 5 | AZ Pharma | China | 35 | Moderate | EXPANSION |

**TOTAL HIGH-VOLUME PACKING CAPACITY:** 242 materials across 5 sites

**ADDITIONAL PACKING SITES (11 sites handling <30 materials):**
- Combined materials: 77 materials
- Regional distribution centers
- Local market fulfillment sites

**STRATEGIC INSIGHTS:**

**Concentration Risk:**
- Top 5 packing sites handle 76% of all packing materials (242/319 total)
- SE Snäckviken alone handles 24% of global packing volume
- Geographic distribution: 2 in Europe, 2 in APAC, 1 in Americas

**Capacity Constraints:**
- Mt Vernon (USA): CRITICAL - requires immediate load reduction
- SE Snäckviken (Sweden): HIGH - approaching capacity ceiling
- Macclesfield (UK): GOOD but trending toward constraints

**Expansion Opportunities:**
- Japan, China, India: Available capacity for APAC growth
- Puerto Rico: 40-45% utilization - can absorb North America overflow

**RECOMMENDATION:**

**Rebalancing Strategy:**
1. Shift 20-30% of Mt Vernon packing to Puerto Rico (immediate)
2. Increase APAC packing utilization (Japan, China) to support 30-50% volume growth
3. Reduce SE Snäckviken dependency through UK/China parallel routing
4. Monitor Macclesfield capacity - qualify backup sites before reaching 80%

📊 **The graph shows high-volume packing sites (purple nodes) scaled by material count, with downstream distribution connections highlighted.**`;
  }

  // === EXECUTIVE BUSINESS QUESTIONS ===

  // Q1: Cost Savings
  const costKeywords = ['save', 'saving', 'savings', '$15', '$25', 'cost', 'money', 'reduce', 'optimization', 'optimize', 'efficiency', 'opex'];
  if (normalizedQ === 'where can we save $15-25m annually in the forxiga supply chain' || costKeywords.some(keyword => normalizedQ.includes(keyword))) {
    return `## 💰 Cost Optimization Opportunities: $15-25M Annual Savings

**Three Major Cost Reduction Initiatives:**

**1. Manufacturing Capacity Rebalancing → $3-7M/year**
- **Current Problem:** Mt Vernon operating at 85-90% capacity (123 materials) - cannot support growth
- **Solution:** Shift 20-30% production to Puerto Rico (Canovanas Plant at only 40-45% capacity)
- **Timeline:** 12-24 months
- **Additional Benefit:** Enables 30-50% volume growth

**2. SKU Rationalization → $5-10M/year**
- **Current Problem:** 382 SKU variants creating inventory complexity
- **Root Cause:** 70% driven by regional packaging customization
- **Solution:** Reduce to 250-280 core SKUs (30% reduction) through packaging standardization
- **Timeline:** 6-18 months
- **Complexity Score Improvement:** 1754 → 1200 (31% reduction)

**3. Distribution Network Consolidation → $3-6M/year**
- **Current Problem:** 56 distribution nodes (over-distributed network)
- **Example:** India FORXIGA distributed across 13 locations
- **Solution:** Consolidate to 35-40 regional DCs, reduce India from 13→8 locations
- **Impact:** 20-25% logistics cost reduction
- **Timeline:** 9-18 months

**Total 5-Year Financial Impact:**
- Annual OPEX Reduction: $15-25M
- Working Capital Release: $10-20M (inventory optimization)
- Revenue Enablement: Support 30-50% volume growth

📊 **The graph visualization shows your capacity-constrained sites (red/critical), underutilized facilities (green), and high-distribution products requiring consolidation.**`;
  }

  // === QUESTION 2: Supply Chain Risks ===
  // Match: risk/risks, threat/threats, vulnerability, disruption, bottleneck, critical, danger, etc.
  // Q2: Risk Assessment
  const riskKeywords = ['risk', 'threat', 'vulnerability', 'vulnerabilities', 'disruption', 'bottleneck', 'critical', 'danger', 'problem', 'issue', 'challenge', 'exposure'];
  if (normalizedQ === 'what are the biggest supply chain risks threatening forxiga production' || riskKeywords.some(keyword => normalizedQ.includes(keyword))) {
    return `## ⚠️ Critical Supply Chain Risks: Top 3 Vulnerabilities

**RISK #1: Mt Vernon Single-Point-of-Failure (CRITICAL)**
- **Criticality Score:** 249 (VERY HIGH)
- **Exposure:** Handles 206 materials (83 formulation + 123 total with packing)
- **Capacity:** Operating at 85-90% - cannot absorb disruptions
- **Impact if Disrupted:** 60-90 day recovery time, affects entire North America supply
- **Mitigation Strategy:**
  - Immediate: Increase Puerto Rico to backup capacity
  - Medium-term: Dual-source critical formulations to China/Sweden sites

**RISK #2: Macclesfield Works Bottleneck (VERY HIGH)**
- **Criticality Score:** 384 (HIGHEST in network)
- **Exposure:** 48 materials, 8 input suppliers creating dependency web
- **UK Brexit Impact:** Potential regulatory/customs delays
- **Impact if Disrupted:** Entire EMEA packing disrupted
- **Mitigation Strategy:**
  - Divert 30% packing volume to SE Snäckviken (Sweden)
  - Qualify China/Japan packing as backup routes

**RISK #3: European API Concentration (HIGH)**
- **Geographic Risk:** ALL Dapagliflozin APIs sourced from Europe (Ireland, Switzerland, Germany)
- **Lead Time Impact:** 4-6 months to APAC markets (vs 2-3 months if Asian API available)
- **Supplier Diversity:** Good (4-6 suppliers per API) BUT all in same region
- **Impact if Disrupted:** Global production halt within 90 days
- **Mitigation Strategy:**
  - Develop Asian API sourcing (timeline: 18-36 months for regulatory approval)
  - Target suppliers: India, China, South Korea manufacturers

**Additional Risks Identified:**
- SE Snäckviken: 17 downstream connections - highest connectivity = highest disruption impact
- Mumbai Distribution: 15 connections serving entire India market
- European API dependency: 4-6 month APAC lead time constraining growth

**Overall Supply Chain Health: 7.2/10 (GOOD)**
- Strengths: Distribution coverage (8.5/10), Supplier diversity (7.2/10)
- Weaknesses: Manufacturing flexibility (6.5/10), Capacity constraints (2 sites critical)

🔍 **The visualization highlights critical nodes in RED (high-risk), showing dependency chains and single-point-of-failure exposure.**`;
  }

  // Q3: APAC Growth
  const growthKeywords = ['growth', 'apac', 'asia', 'expansion', 'expand', 'scale', 'volume', 'increase', '30', '50', 'capacity'];
  if (normalizedQ === 'how can we support 30-50% volume growth in apac markets' || growthKeywords.some(keyword => normalizedQ.includes(keyword))) {
    return `## 📈 APAC Growth Enablement Strategy: Supporting 30-50% Volume Increase

**Market Opportunity:**
- **Current APAC Network:** 31 nodes across 12 countries, 244 materials
- **Growth Potential:** Highest diabetes medication growth market globally
- **Current Constraint:** Cannot support >30% growth without capacity expansion

**Three-Pillar Growth Strategy:**

**PILLAR 1: Capacity Rebalancing (Enable 30-50% Growth)**
- **Problem:** Mt Vernon (USA) and SE Snäckviken (Sweden) at 85-90% and 80-85% capacity
- **Available Capacity Identified:**
  - Puerto Rico (Canovanas): 40-45% utilization (14 materials) → can absorb 20-30% shift
  - India sites: Multiple facilities with expansion capacity
  - China sites: Regional manufacturing for local demand
- **Action:** Shift formulation load from Mt Vernon → Puerto Rico
- **Impact:** Frees up 30-50% capacity for growth
- **Cost Benefit:** $3-7M annual savings + growth enablement

**PILLAR 2: APAC API Sourcing Development (Reduce 4-6 Month Lead Time)**
- **Current Problem:** All Dapagliflozin APIs from Europe (Ireland, Switzerland, Germany)
- **Lead Time Impact:** 4-6 months Europe→APAC vs 2-3 months if Asian source
- **Solution:** Qualify Asian API manufacturers
  - Target: India, China, South Korea suppliers
  - Regulatory: 18-36 months approval timeline
  - Suppliers: Leverage Lonza China, develop local alternatives
- **Impact:**
  - Cut lead time 50% (6 months → 3 months)
  - Reduce supply chain risk concentration
  - Lower logistics costs for APAC markets

**PILLAR 3: India Distribution Optimization (20-25% Logistics Savings)**
- **Current Inefficiency:** FORXIGA distributed across 13 locations in India
  - Example: FORXIGA TAB 5MG BL 2X14 EA IN (Code: 110037757) - 13 locations
  - Example: FORXIGA TAB 10MG BL 2X14 EA IN (Code: 110037759) - 13 locations
- **Consolidation Opportunity:** Reduce 13 → 8 regional distribution centers
- **Logistics Cost Reduction:** 20-25% savings ($2-4M annually for India alone)
- **Timeline:** 9-18 months

**Financial Impact Summary:**
- **Revenue Growth Enabled:** 30-50% volume increase supported
- **Cost Avoidance:** $3-7M from not having to build new capacity
- **Operational Savings:** $2-4M from logistics optimization
- **Working Capital:** Better inventory positioning closer to demand

**Implementation Roadmap:**
- **0-6 months:** Mt Vernon capacity study, Puerto Rico qualification
- **6-12 months:** Begin production shift, India DC consolidation pilot
- **12-24 months:** Complete capacity rebalancing, launch Asian API qualification
- **24-36 months:** Full APAC API sourcing operational

🌏 **The graph shows your APAC network with current capacity levels, European API dependencies (long supply lines), and consolidation opportunities in India distribution.**`;
  }

  // Default answer for other questions
  return `## 📊 FORXIGA Supply Chain Analysis

**Your query has been processed.** The graph visualization shows the relevant supply chain network based on your question.

**Key Insights Available:**
- **Cost Optimization:** Ask "where can we save $15-25M annually in the forxiga supply chain"
- **Risk Assessment:** Ask "what are the biggest supply chain risks threatening forxiga production"
- **Growth Strategy:** Ask "how can we support 30-50% volume growth in apac markets"

**What You're Viewing:**
The interactive graph shows supply chain entities and their relationships. Explore nodes by:
- Hovering for detailed information
- Following supply chain flows (arrows show material movement)
- Identifying bottlenecks (highly connected nodes)

**FORXIGA Supply Chain Overview:**
- 112 network nodes across 41 countries
- 382 unique SKU variants (5mg/10mg formulations)
- 6-tier architecture: API → Formulation → Packing → Distribution → Markets
- Critical sites: Mt Vernon (USA), SE Snäckviken (Sweden), Macclesfield (UK)
- Primary suppliers: Lonza, SK Biotek, Dottikon, BASF, Siegfried

🔍 Use the dashboard filters to deep-dive into specific supply chain stages, capacity analysis, or regional networks.`;
};

// Process chat query (hardcoded for POC)
export const processChatQuery = async (userQuestion) => {
  // Normalize the question
  const normalizedQuestion = userQuestion.toLowerCase().trim();

  // Find matching hardcoded query
  let queryInfo = null;
  for (const [key, value] of Object.entries(HARDCODED_QUERIES)) {
    if (normalizedQuestion.includes(key) || key.includes(normalizedQuestion)) {
      queryInfo = value;
      break;
    }
  }

  // Default query if no match found
  if (!queryInfo) {
    // Fall back to the first available query rather than a hard-coded key that may not exist
    queryInfo = Object.values(HARDCODED_QUERIES)[0];
  }

  // Execute the query and get graph data
  try {
    const graphData = await executeCustomQuery(queryInfo.query);

    // Generate NLP answer
    const nlpAnswer = generateNLPAnswer(userQuestion, graphData);

    return {
      query: queryInfo.query,
      description: queryInfo.description,
      graphData: graphData,
      nlpAnswer: nlpAnswer
    };
  } catch (error) {
    throw new Error(`Failed to execute query: ${error.message}`);
  }
};

// Execute custom Cypher query
const executeCustomQuery = async (cypherQuery) => {
  const driver = await initDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const result = await session.run(cypherQuery);

    const nodesMap = new Map();
    const relationships = [];

    // Process results - dynamically handle all field names
    result.records.forEach(record => {
      // Iterate through all keys in the record
      record.keys.forEach(key => {
        try {
          const value = record.get(key);

          // Check if value is a Neo4j Node
          if (value && value.identity !== undefined && value.labels !== undefined) {
            const nodeId = value.identity.toString();

            if (!nodesMap.has(nodeId)) {
              nodesMap.set(nodeId, {
                id: nodeId,
                labels: value.labels,
                properties: convertNeo4jProperties(value.properties),
                size: 30,
                color: getNodeColor(value.labels[0])
              });
            }
          }

          // Check if value is a Neo4j Relationship
          else if (value && value.identity !== undefined && value.type !== undefined && value.start !== undefined) {
            relationships.push({
              id: value.identity.toString(),
              startNode: value.start.toString(),
              endNode: value.end.toString(),
              from: value.start.toString(),
              to: value.end.toString(),
              type: value.type,
              properties: convertNeo4jProperties(value.properties)
            });
          }

          // Check if value is a Path
          else if (value && value.segments !== undefined) {
            // Extract nodes from path
            value.segments.forEach(segment => {
              // Start node
              const startNodeId = segment.start.identity.toString();
              if (!nodesMap.has(startNodeId)) {
                nodesMap.set(startNodeId, {
                  id: startNodeId,
                  labels: segment.start.labels,
                  properties: convertNeo4jProperties(segment.start.properties),
                  size: 30,
                  color: getNodeColor(segment.start.labels[0])
                });
              }

              // End node
              const endNodeId = segment.end.identity.toString();
              if (!nodesMap.has(endNodeId)) {
                nodesMap.set(endNodeId, {
                  id: endNodeId,
                  labels: segment.end.labels,
                  properties: convertNeo4jProperties(segment.end.properties),
                  size: 30,
                  color: getNodeColor(segment.end.labels[0])
                });
              }

              // Relationship
              relationships.push({
                id: segment.relationship.identity.toString(),
                startNode: segment.relationship.start.toString(),
                endNode: segment.relationship.end.toString(),
                from: segment.relationship.start.toString(),
                to: segment.relationship.end.toString(),
                type: segment.relationship.type,
                properties: convertNeo4jProperties(segment.relationship.properties)
              });
            });
          }

          // Check if value is an array (e.g., r in variable-length paths)
          else if (Array.isArray(value)) {
            value.forEach(item => {
              // Check if array item is a relationship
              if (item && item.identity !== undefined && item.type !== undefined && item.start !== undefined) {
                relationships.push({
                  id: item.identity.toString(),
                  startNode: item.start.toString(),
                  endNode: item.end.toString(),
                  from: item.start.toString(),
                  to: item.end.toString(),
                  type: item.type,
                  properties: convertNeo4jProperties(item.properties)
                });
              }
            });
          }
        } catch (err) {
          // Skip fields that can't be processed (like primitive values)
        }
      });
    });

    await session.close();

    return {
      nodes: Array.from(nodesMap.values()),
      relationships: relationships
    };

  } catch (error) {
    await session.close();
    throw error;
  }
};

// Helper function to convert Neo4j properties
const convertNeo4jProperties = (properties) => {
  const converted = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value && typeof value === 'object' && value.low !== undefined) {
      // Neo4j Integer
      converted[key] = value.toNumber ? value.toNumber() : value.low;
    } else if (Array.isArray(value)) {
      converted[key] = value.map(v =>
        v && typeof v === 'object' && v.low !== undefined
          ? (v.toNumber ? v.toNumber() : v.low)
          : v
      );
    } else {
      converted[key] = value;
    }
  }
  return converted;
};

// Get node color based on label - Forxiga Supply Chain
const getNodeColor = (label) => {
  const colorMap = {
    'RSM': '#8B4513',              // Brown - Raw Supplier Materials
    'RM': '#FF6B6B',               // Red - Raw Materials
    'Intermediate': '#FFA500',      // Orange - Intermediate products
    'API': '#4169E1',              // Royal Blue - Active Pharmaceutical Ingredient
    'Formulation': '#32CD32',      // Lime Green - Formulation sites
    'Packing': '#9370DB',          // Medium Purple - Packing/Final Product sites
    'Storage': '#FFD700',          // Gold - Storage locations
    'Customer_Market': '#FF1493',  // Deep Pink - Customer Markets
    'Material': '#4CAF50',         // Green - Material nodes
    'MaterialLocation': '#00BCD4', // Cyan - Material Location nodes
    'InventoryDataPoints': '#FFC107',  // Amber - Inventory data
    'ProductionDataPoints': '#9C27B0'  // Purple - Production data
  };
  return colorMap[label] || '#999999';
};
