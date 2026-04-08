# NeoDash Integration Research & Decision

## What is NeoDash?

NeoDash is Neo4j's official dashboard builder for creating interactive visualizations and dashboards from Neo4j data. It allows users to:
- Create custom dashboards with multiple visualizations
- Run Cypher queries and display results
- Create charts (bar, line, pie, graph visualizations)
- Share dashboards
- Build analytics interfaces

---

## Integration Options

### Option 1: Iframe Embedding ⭐ RECOMMENDED
**Approach**: Embed NeoDash as an iframe

**Pros**:
- ✅ Easiest to implement
- ✅ Full NeoDash functionality
- ✅ No maintenance overhead
- ✅ Works immediately
- ✅ Official NeoDash UI

**Cons**:
- ❌ Limited customization
- ❌ Separate authentication
- ❌ Communication requires postMessage

**Implementation**:
```javascript
<iframe
  src="https://neodash.graphapp.io"
  width="100%"
  height="800px"
/>
```

---

### Option 2: Custom Dashboard with Recharts
**Approach**: Build custom dashboard using React charting library

**Pros**:
- ✅ Full control over UI/UX
- ✅ Matches your app's theme
- ✅ Tight integration with Neo4j data
- ✅ Custom visualizations
- ✅ Better for your use case

**Cons**:
- ❌ More development time
- ❌ Need to build chart components
- ❌ Maintenance required

**Libraries**:
- Recharts (recommended - simple, composable)
- Victory (powerful)
- Chart.js (popular)
- Nivo (beautiful, D3-based)

---

### Option 3: NeoDash Self-Hosted
**Approach**: Run NeoDash locally and integrate

**Pros**:
- ✅ Full NeoDash features
- ✅ Can customize
- ✅ Local control

**Cons**:
- ❌ Complex setup
- ❌ Requires separate server
- ❌ Overkill for current needs

---

## Decision: Custom Dashboard with Recharts

**Why?**
1. **Better fit for your use case**: You need to show GDS algorithm results, not general-purpose dashboards
2. **Seamless integration**: No iframe communication complexity
3. **Consistent UI**: Matches your Neo4j-themed interface
4. **Specific to GDS**: Can create visualizations tailored to Node Similarity and Shortest Path results
5. **Learning opportunity**: Better understanding of data visualization

---

## Custom Dashboard Features

### Dashboard 1: Algorithm Performance Metrics
**Charts**:
1. **Algorithm Execution Times** (Bar Chart)
   - Compare execution times of different algorithms
   - X-axis: Algorithm name
   - Y-axis: Time in milliseconds

2. **Result Distribution** (Pie Chart)
   - For Node Similarity: Distribution of similarity scores
   - For Shortest Path: Path length distribution

3. **Timeline** (Line Chart)
   - Algorithm executions over time
   - Track performance trends

### Dashboard 2: Node Similarity Analysis
**Charts**:
1. **Top Similar Pairs** (Horizontal Bar Chart)
   - Top 10 most similar node pairs
   - Bars colored by similarity score

2. **Similarity Score Distribution** (Histogram)
   - Frequency of similarity scores
   - Shows clustering patterns

3. **Network Metrics** (Cards/Stats)
   - Average similarity
   - Number of pairs above threshold
   - Most connected nodes

### Dashboard 3: Shortest Path Analysis
**Charts**:
1. **Path Length Distribution** (Bar Chart)
   - Histogram of path lengths found
   - Shows network connectivity

2. **Cost Analysis** (Line Chart)
   - Path cost vs path length
   - Identify efficiency

3. **Route Comparison** (Table)
   - Alternative paths
   - Compare costs, distances, times

---

## Implementation Plan

### Phase 4.1: Setup Charting Library
```bash
npm install recharts
```

### Phase 4.2: Create Dashboard Components
1. `DashboardPanel.js` - Main dashboard container
2. `AlgorithmMetricsChart.js` - Performance metrics
3. `SimilarityDistributionChart.js` - Similarity analysis
4. `PathAnalysisChart.js` - Path analysis
5. `StatsCard.js` - Metric cards

### Phase 4.3: Create Dashboard Service
1. `dashboardService.js`:
   - Store algorithm execution history
   - Calculate metrics
   - Format data for charts
   - Export dashboard data

### Phase 4.4: Update App Layout
1. Add tab navigation: Graph View | Dashboard View
2. Store algorithm results history
3. Update results in real-time

---

## Specific Dashboards to Build

### 1. Overview Dashboard
```
┌─────────────────┬─────────────────┐
│ Total Nodes     │ Total Rels      │
│     18          │      40+        │
├─────────────────┼─────────────────┤
│ Algorithms Run  │ Avg Exec Time   │
│     5           │   1.2s          │
└─────────────────┴─────────────────┘

┌─────────────────────────────────────┐
│   Algorithm Execution Timeline      │
│   (Line chart showing runs)         │
└─────────────────────────────────────┘
```

### 2. Node Similarity Dashboard
```
┌─────────────────────────────────────┐
│   Similarity Score Distribution     │
│   (Histogram)                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   Top 10 Similar Pairs              │
│   (Horizontal bar chart)            │
└─────────────────────────────────────┘
```

### 3. Shortest Path Dashboard
```
┌─────────────────────────────────────┐
│   Path Metrics                      │
│   Total Distance: 1234 km           │
│   Travel Time: 15.5 hours           │
│   Hops: 4                           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   City-to-City Routes               │
│   (Network visualization)           │
└─────────────────────────────────────┘
```

---

## Data Structure for Dashboards

### Algorithm Execution History
```javascript
{
  id: 'exec_001',
  timestamp: '2026-04-07T10:30:00Z',
  algorithmType: 'nodeSimilarity',
  config: { ... },
  results: { ... },
  executionTime: 1200, // ms
  resultCount: 10
}
```

### Dashboard State
```javascript
{
  selectedDashboard: 'overview',
  executionHistory: [],
  currentMetrics: {
    totalExecutions: 5,
    averageTime: 1200,
    lastRun: '2026-04-07T10:30:00Z'
  }
}
```

---

## Technologies

**Charting**: Recharts
- Simple API
- Composable components
- Good documentation
- React-friendly

**Icons**: React Icons (already lightweight)

**Layout**: CSS Grid (already using)

---

## Benefits of Custom Dashboard

1. **GDS-Focused**: Tailored to your specific algorithms
2. **Real-time Updates**: Update as algorithms run
3. **Export Friendly**: Easy to export chart data
4. **Theme Consistent**: Matches your Neo4j blue theme
5. **Responsive**: Works on all screen sizes
6. **Interactive**: Click charts to filter results

---

## Next Steps

1. Install Recharts
2. Create basic dashboard layout
3. Build chart components for algorithm results
4. Add tab navigation (Graph | Dashboard)
5. Connect to algorithm execution data
6. Add export functionality

Ready to proceed with custom dashboard implementation?
