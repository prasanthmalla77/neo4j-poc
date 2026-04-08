# Neo4j GDS Algorithm Integration - Implementation Plan

## Overview
Building a Neo4j Graph Data Science (GDS) visualization tool that receives job data from backend, displays graphs, allows users to apply GDS algorithms (Node Similarity & Shortest Path), and integrates NeoDash for custom dashboards.

---

## Phase 1: Data Structure & Sample Data Setup

### 1.1 Create Backend Response Mock Data
**File**: `src/data/backendMockData.js`

**Tasks**:
- Create mock JSON structure matching backend format:
  - `jobId`: Unique identifier for the GDS projection
  - `nodes`: Array of node objects with properties
  - `relationships`: Array of relationship objects
  - `availableAlgorithms`: Array of supported algorithms
- Include sample data for testing both algorithms
- Create multiple job scenarios for testing

**Output**: Mock data that simulates backend API response

---

### 1.2 Create Algorithm Configuration Schema
**File**: `src/data/algorithmConfigs.js`

**Tasks**:
- Define configuration options for **Node Similarity** algorithm:
  - Similarity metric (Jaccard, Overlap, Cosine)
  - Top K results
  - Similarity cutoff threshold
  - Node filter options
- Define configuration options for **Shortest Path** algorithm:
  - Source node selection
  - Target node selection
  - Path weight property
  - Algorithm variant (Dijkstra, A*)
- Create default configurations for each algorithm

**Output**: Configuration schema for dynamic form generation

---

## Phase 2: Core Components Development

### 2.1 Create Algorithm Control Panel Component
**File**: `src/components/AlgorithmPanel.js`
**Styles**: `src/components/AlgorithmPanel.css`

**Tasks**:
- Create dropdown to select from available algorithms
- Build dynamic configuration form that changes based on selected algorithm
- Add submit/run button to execute algorithm
- Create results display area
- Style to match Neo4j theme (blues, consistent spacing)
- Add loading states during algorithm execution
- Add error handling UI

**Output**: Reusable component for algorithm selection and execution

---

### 2.2 Create GDS Service Layer
**File**: `src/services/gdsService.js`

**Tasks**:
- Function: `createGdsProjection(jobId, nodes, relationships)`
  - Create projection name: `graph_gds_<jobId>`
  - Mock GDS projection creation
- Function: `runNodeSimilarity(projectionName, config)`
  - Execute node similarity with provided config
  - Return similarity pairs with scores
- Function: `runShortestPath(projectionName, config)`
  - Execute shortest path with source/target
  - Return path nodes and relationships
- Function: `dropGdsProjection(projectionName)`
  - Clean up GDS projection
- Mock implementations returning realistic data structures

**Output**: Service layer abstracting GDS operations

---

### 2.3 Create Algorithm Results Component
**File**: `src/components/AlgorithmResults.js`
**Styles**: `src/components/AlgorithmResults.css`

**Tasks**:
- Display **Node Similarity** results:
  - Table/list of node pairs with similarity scores
  - Sort by score
  - Filter options
- Display **Shortest Path** results:
  - Path visualization (node1 → node2 → node3)
  - Path length and total weight
  - Step-by-step breakdown
- Add "Highlight on Graph" button for each result
- Add export functionality (CSV, JSON)
- Responsive design

**Output**: Component to display algorithm results

---

## Phase 3: Graph Visualization Integration

### 3.1 Update GraphVisualization Component
**File**: `src/components/GraphVisualization.js`

**Tasks**:
- Keep existing graph display intact (no changes to NVL visualization)
- Add AlgorithmPanel component to layout
- Add AlgorithmResults component to layout
- Add state management for:
  - Current GDS projection name
  - Selected algorithm
  - Algorithm execution status
  - Algorithm results data
  - Highlighted nodes/edges from results
- Update graph styling to highlight algorithm results:
  - Different colors for highlighted paths
  - Different sizes for similar nodes
  - Animation for highlighting
- Create layout: Graph (left 60%) | Algorithm Panel + Results (right 40%)

**Output**: Integrated view with graph and algorithm controls

---

### 3.2 Create Graph Highlighting Utilities
**File**: `src/utils/graphHighlighting.js`

**Tasks**:
- Function: `highlightSimilarNodes(nodes, similarityResults, graphData)`
  - Return modified node objects with highlight colors
  - Scale node sizes based on similarity scores
- Function: `highlightPath(path, graphData)`
  - Return modified nodes and relationships for path
  - Add path arrows and colors
- Function: `resetHighlighting(graphData)`
  - Return original node/relationship styling
- Function: `getHighlightColors(algorithmType)`
  - Return color schemes for different algorithms

**Output**: Utility functions for graph highlighting

---

## Phase 4: NeoDash Integration

### 4.1 Research & Setup NeoDash Embedding
**Files**:
- `docs/NEODASH_INTEGRATION.md` (research findings)
- `src/config/neodashConfig.js`

**Tasks**:
- Research NeoDash embedding options:
  - Iframe embedding
  - Component integration
  - Custom dashboard with charting library
- Choose approach based on requirements
- Install necessary dependencies
- Create configuration for NeoDash connection
- Test basic embedding

**Output**: NeoDash setup and configuration

---

### 4.2 Create Dashboard Component
**File**: `src/components/DashboardPanel.js`
**Styles**: `src/components/DashboardPanel.css`

**Tasks**:
- Embed NeoDash or create custom dashboard interface
- Pass current graph context to dashboard
- Create navigation tabs:
  - Graph View (visualization + algorithms)
  - Dashboard View (NeoDash/custom charts)
- Add dashboard controls:
  - Add new widgets
  - Configure data sources
  - Save/load layouts
- Style consistently with rest of app

**Output**: Dashboard interface component

---

### 4.3 Create Dashboard Integration Service
**File**: `src/services/dashboardService.js`

**Tasks**:
- Function: `saveDashboardConfig(jobId, config)`
  - Save dashboard configuration to localStorage/backend
- Function: `loadDashboardConfig(jobId)`
  - Load saved dashboard for job
- Function: `exportDashboardData(dashboardId, format)`
  - Export dashboard data (JSON, CSV)
- Function: `createDefaultDashboard(graphData)`
  - Generate default dashboard with common widgets

**Output**: Service for dashboard persistence

---

## Phase 5: State Management & Data Flow

### 5.1 Create Context/State Management
**File**: `src/context/GraphContext.js`

**Tasks**:
- Create React Context for global state
- Define state structure:
  ```javascript
  {
    currentJob: { jobId, nodes, relationships, availableAlgorithms },
    gdsProjection: { name, status, createdAt },
    algorithmExecution: { algorithm, status, config, results },
    highlighting: { type, data },
    dashboardConfig: { widgets, layout }
  }
  ```
- Create actions/reducers:
  - `loadJob(jobData)`
  - `createProjection()`
  - `executeAlgorithm(algorithm, config)`
  - `updateHighlighting(highlightData)`
  - `saveDashboard(config)`
- Add error handling and loading states

**Output**: Centralized state management

---

### 5.2 Update App Structure
**File**: `src/App.js`

**Tasks**:
- Wrap app with GraphContext provider
- Create main layout:
  - Header with job information (Job ID, status)
  - Tab navigation (Graph View | Dashboard View)
  - Footer with connection status
- Add job selector (if multiple jobs)
- Add global loading/error states
- Update styling for new layout
- Ensure responsive design

**Output**: Updated app structure with context

---

## Phase 6: Backend Integration Preparation

### 6.1 Create API Service Layer
**File**: `src/services/apiService.js`

**Tasks**:
- Function: `fetchJobData(jobId)`
  - GET request to backend for job data
  - Parse and validate response
- Function: `executeAlgorithmRequest(jobId, algorithm, config)`
  - POST request to execute algorithm on backend
  - Handle response with results
- Function: `getAlgorithmStatus(executionId)`
  - Check status of long-running algorithms
- Add error handling, retries, timeouts
- Create mock mode flag to switch between mock/real data
- Add request interceptors for auth if needed

**Output**: API service ready for backend integration

---

### 6.2 Create Neo4j Connection Service
**File**: `src/services/neo4jService.js`

**Tasks**:
- Setup Neo4j driver configuration
- Function: `createConnection(uri, username, password)`
  - Initialize Neo4j driver
- Function: `executeQuery(cypher, params)`
  - Execute Cypher queries
  - Handle sessions and transactions
- Function: `executeGdsProcedure(procedure, params)`
  - Execute GDS procedures
  - Handle projection lifecycle
- Function: `closeConnection()`
  - Clean up connections
- Add connection pooling and error handling

**Output**: Neo4j connection service

---

## Implementation Order

### Sprint 1: Foundation
1. ✅ Phase 1.1 - Backend Mock Data
2. ✅ Phase 1.2 - Algorithm Configuration Schema
3. ✅ Phase 2.2 - GDS Service Layer (mock)

### Sprint 2: UI Components
4. ✅ Phase 2.1 - Algorithm Control Panel
5. ✅ Phase 2.3 - Algorithm Results Component
6. ✅ Phase 3.2 - Graph Highlighting Utilities

### Sprint 3: Integration
7. ✅ Phase 3.1 - Update GraphVisualization
8. ✅ Phase 5.1 - State Management
9. ✅ Phase 5.2 - App Structure Update

### Sprint 4: Dashboard
10. ✅ Phase 4.1 - NeoDash Research & Setup
11. ✅ Phase 4.2 - Dashboard Component
12. ✅ Phase 4.3 - Dashboard Service

### Sprint 5: Backend Ready
13. ✅ Phase 6.1 - API Service Layer
14. ✅ Phase 6.2 - Neo4j Connection Service
15. ✅ Testing & Refinement

---

## Technical Decisions Needed

### 1. NeoDash Integration Approach
- **Option A**: Iframe embedding (simpler, limited customization)
- **Option B**: Direct component integration (more control, more complex)
- **Option C**: Build custom dashboard with recharts/d3 (most flexible)

**Recommendation**: Start with Option C (custom) for better control, can add NeoDash iframe later if needed.

---

### 2. State Management
- **Option A**: React Context (suitable for current project size)
- **Option B**: Redux (if scaling significantly)
- **Option C**: Zustand (lightweight alternative)

**Recommendation**: React Context for now, can migrate to Redux/Zustand if complexity grows.

---

### 3. Neo4j Connection
- **Question**: Will algorithms run client-side or backend?
- **Question**: Direct Neo4j connection from frontend or proxy through backend?

**Recommendation**: Backend proxy for security (credentials not exposed), frontend for visualization only.

---

### 4. Algorithm Execution
- **Option A**: Synchronous execution (wait for results)
- **Option B**: Async with polling (for long-running algorithms)

**Recommendation**: Start synchronous, add async for Phase 6 if needed.

---

## Dependencies to Add

### Required
```bash
npm install @emotion/react @emotion/styled
npm install recharts  # For custom dashboards
```

### Optional (Phase 6)
```bash
npm install neo4j-driver  # If direct Neo4j connection needed
npm install axios  # For API calls
```

---

## Current Status
- ✅ Existing graph visualization working
- ✅ Sample data structure in place
- 🔲 Ready to start Phase 1

---

## Notes
- Keep existing GraphVisualization component intact during integration
- All new components should follow Neo4j design patterns (blues, clean layout)
- Test with mock data before backend integration
- Ensure responsive design for different screen sizes
- Add comprehensive error handling at each phase
