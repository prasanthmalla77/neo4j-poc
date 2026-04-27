# GDS Algorithm — Future Scope
> Pharma Supply Chain (Forxiga & Tagrisso) — AstraZeneca Neo4j Demo

---

## Current Algorithms ✅

| Algorithm | Mode | Implementation | Business Use |
|---|---|---|---|
| **Node Similarity** | Jaccard (neighbours) | In-memory JS | Find substitutable formulation/packing sites |
| **Node Similarity** | Property Match (cosine) | In-memory JS | Compare sites by structural properties |
| **Shortest Path** | Dijkstra | Neo4j GDS | Supplier → market lead time tracing |
| **Shortest Path** | Yen's K-Shortest | Neo4j GDS | Top-K alternative supply routes |
| **Shortest Path** | A* | Neo4j GDS | Heuristic path (requires lat/lon properties) |

---

## Future Algorithms — Priority Roadmap 🔭

### 🔴 Priority 1 — Risk & Criticality

#### Betweenness Centrality
- **What:** Counts how many shortest paths between all node pairs pass through each node
- **GDS call:** `gds.betweenness.stream`
- **Supply chain use:** Mathematically identifies single points of failure
- **Expected output:** SE01 (Snäckviken) and FORM_1448 (Mt Vernon) will score highest — proves network dependency quantitatively
- **Business question:** *"Which site, if disrupted, breaks the most supply routes?"*

#### PageRank / Degree Centrality
- **What:** Assigns importance score based on in/out connections weighted by neighbour importance
- **GDS call:** `gds.pageRank.stream`
- **Supply chain use:** Auto-generates a risk-ranked list of all sites without hardcoding
- **Expected output:** API nodes with single downstream target score low; Formulation hubs feeding many packing sites score high
- **Business question:** *"Which nodes are most critical to the entire network?"*

---

### 🟠 Priority 2 — Cluster & Regional Analysis

#### Community Detection — Louvain
- **What:** Groups nodes into natural clusters based on connection density
- **GDS call:** `gds.louvain.stream`
- **Supply chain use:** Auto-discovers EMEA / Americas / APAC supply clusters without manual labelling
- **Expected clusters:**
  - EMEA cluster → SE01, RU03, UK05, EG11 → EUROPE / MEA / EURASIA markets
  - Americas cluster → FORM_1448, 1402, CE01, 1000 → US / LATAM / Brazil / Canada
  - APAC cluster → CN20, CN40, JP10, IN10/IN11 → ASIAPAC / China / Japan
- **Business question:** *"If the EMEA cluster is disrupted, exactly which markets are affected?"*

#### Weakly Connected Components
- **What:** Finds subgraphs that have no path connecting them to the rest
- **GDS call:** `gds.wcc.stream`
- **Supply chain use:** After brand/label filtering in Graph Config, instantly shows isolated or broken nodes
- **Business question:** *"After filtering, are any nodes completely cut off from their markets?"*

---

### 🟡 Priority 3 — Similarity Extensions

#### Overlap Similarity
- **What:** `|A ∩ B| / min(|A|, |B|)` — checks if a smaller set is fully contained in a larger one
- **Implementation:** In-memory JS (no GDS call needed)
- **Supply chain use:** Checks if a small distribution hub is a complete operational subset of a larger one → consolidation opportunity
- **Business question:** *"Is the Mumbai hub fully covered by the ISMO hub? Can we merge them?"*

#### Cosine Similarity (Numeric Vectors)
- **What:** Dot product of numeric property vectors / product of magnitudes
- **Implementation:** In-memory JS (no GDS call needed)
- **Properties to use:** `production_total_year`, `inventory_projected_value_API`, `capacity_utilization`
- **Supply chain use:** Find packing sites with similar financial/volume profiles
- **Business question:** *"Which packing sites have the most similar production + inventory profile to CN20?"*

#### Pearson Correlation
- **What:** Correlation coefficient between two nodes' numeric vectors — normalises for scale
- **Implementation:** In-memory JS (no GDS call needed)
- **Supply chain use:** Detects sites that follow the same utilisation pattern even if one is 10x larger
- **Business question:** *"Do JP10 and 1402 follow the same seasonal capacity pattern despite different volumes?"*

---

## Implementation Notes

### Algorithms runnable in-memory (no Neo4j GDS required)
These can be added as JS implementations in `gdsService.js` alongside the existing `runNodeSimilarity`:
- Overlap Similarity
- Cosine Similarity
- Pearson Correlation
- Betweenness Centrality (small graphs, BFS-based)
- Weakly Connected Components (union-find)

### Algorithms that require Neo4j GDS calls
These need `gds.graph.project` + a stream call, same pattern as `runShortestPath`:
- PageRank → `gds.pageRank.stream`
- Louvain → `gds.louvain.stream`
- Full Betweenness Centrality → `gds.betweenness.stream` (for large graphs)

### Files to modify when implementing
| File | Change needed |
|---|---|
| `src/data/algorithmConfigs.js` | Add new config + defaultConfig + outputSchema |
| `src/services/gdsService.js` | Add `runBetweenness`, `runPageRank`, `runLouvain` etc. |
| `src/components/GraphVisualization.js` | Add new `ALGORITHM_TYPES` branch in `handleAlgorithmExecute` |
| `src/components/AlgorithmResults.js` | Add render function for each new output type |

---

## Data Properties Available for Algorithms

### Numeric (usable in Cosine / Pearson)
- `production_total_year` — Packing, Formulation nodes
- `production_budget` — Packing nodes
- `production_actual_ytd` — Packing nodes
- `inventory_projected_value_API` — InventoryDataPoints nodes
- `inventory_actual_value_API` — InventoryDataPoints nodes
- `inventory_days_cover` — InventoryDataPoints nodes
- `capacity_utilization` — Formulation, Packing nodes

### Categorical (usable in Property Match)
- `site_country_name` — all site nodes
- `site_type` — AZSite, ExternalESMSite, ExternalCMSite
- `brand` — forxiga, tagrisso
- `stage_of_manufacture` — API, Formulation, Packing, etc.

### Structural (usable in Jaccard / Overlap)
- `SUPPLIES_TO` edges — primary supply chain flow
- `HAS_INVENTORY_DATA` edges — site → inventory
- `HAS_PRODUCTION_DATA` edges — site → production
- `HAS_MATERIAL` edges — site → material handled

---

*Last updated: April 2026*
