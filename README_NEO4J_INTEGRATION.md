# Neo4j Real Data Integration Guide

## Overview

Your application is now set up to work with **real Neo4j data** from your local database. This guide explains what's been created and how to use it.

---

## Files Created

### 1. **neo4j-setup.cypher**
Complete Cypher script to populate your Neo4j database with:
- **10 Cities**: US cities with realistic properties (population, coordinates, type)
- **8 People**: Professional personas with occupations and interests
- **ROAD relationships**: Highway connections with distance, time, traffic data
- **LIVES_IN relationships**: Where people reside
- **VISITED relationships**: Travel history (perfect for Node Similarity)
- **KNOWS relationships**: Social connections (also great for similarity)

**Total**: ~18 nodes, ~40+ relationships

### 2. **src/services/neo4jService.js**
Full Neo4j driver integration with:
- Connection management
- Data fetching from Neo4j
- GDS projection creation
- Node Similarity execution
- Shortest Path execution
- Query execution utilities

### 3. **NEO4J_SETUP_INSTRUCTIONS.md**
Step-by-step guide to:
- Load data into Neo4j
- Install GDS plugin
- Configure the application
- Verify everything works
- Troubleshooting tips

### 4. **.env.example**
Configuration template for Neo4j credentials

---

## Quick Start Guide

### Step 1: Load Data into Neo4j

1. **Open Neo4j Browser** at `http://localhost:7474`

2. **Copy and paste** the contents of `neo4j-setup.cypher`

3. **Run the script** (it will clear existing data first!)

4. **Verify** the data loaded:
   ```cypher
   MATCH (n) RETURN labels(n) as Type, count(n) as Count
   ```
   You should see:
   - City: 10
   - Person: 8

### Step 2: Configure Connection

1. **Update password** in `src/services/neo4jService.js`:
   ```javascript
   const NEO4J_CONFIG = {
     uri: 'bolt://localhost:7687',
     username: 'neo4j',
     password: 'YOUR_PASSWORD',  // <-- Change this!
     database: 'neo4j'
   };
   ```

### Step 3: Switch to Real Data

The application is currently using **mock data**. To switch to real Neo4j data:

**Option A**: Update `GraphVisualization.js` (line 28):
```javascript
// Change from:
const job = mockJobResponse;

// To:
import { fetchGraphData } from '../services/neo4jService';
const job = await fetchGraphData('neo4j_job_001');
```

**Option B**: I can create a toggle switch component for you to switch between mock and real data dynamically.

---

## What the Graph Contains

### Graph Structure
```
Cities (10 nodes)
├── New York (Metropolitan)
├── Boston (Metropolitan)
├── Philadelphia (Metropolitan)
├── Washington DC (Capital)
├── Chicago (Metropolitan)
├── Detroit (Metropolitan)
├── Cleveland (Urban)
├── Pittsburgh (Urban)
├── Buffalo (Urban)
└── Atlanta (Metropolitan)

Connected by ROAD relationships (distance, time, traffic)
```

```
People (8 nodes)
├── Alice Johnson (Software Engineer) → Lives in NYC
├── Bob Smith (Data Scientist) → Lives in Boston
├── Carol Williams (Product Manager) → Lives in Chicago
├── David Brown (Sales Director) → Lives in Washington DC
├── Eve Davis (UX Designer) → Lives in Philadelphia
├── Frank Miller (DevOps Engineer) → Lives in Detroit
├── Grace Lee (Marketing Manager) → Lives in Atlanta
└── Henry Wilson (CEO) → Lives in NYC

With VISITED, KNOWS, and LIVES_IN relationships
```

---

## Perfect for GDS Algorithms

### Node Similarity
**Use Case**: Find people with similar travel patterns

**Why it works**:
- People have VISITED relationships to multiple cities
- People have KNOWS relationships to each other
- Similarity can be based on:
  - Cities they've visited
  - People they know
  - Shared interests

**Example**: Alice and Bob both visited Philadelphia and are connected through their tech interests.

### Shortest Path
**Use Case**: Find optimal route between cities

**Why it works**:
- Cities connected by ROAD relationships
- Each road has realistic distance property
- Multiple paths available between major cities
- Can use distance, time, or traffic as weights

**Example**: Find shortest route from New York to Chicago:
- Via Pittsburgh and Cleveland
- Via Philadelphia and Detroit
- Via Buffalo and Detroit

---

## Testing the Setup

### Test 1: Connection
```cypher
RETURN 1 as test
```

### Test 2: View Cities
```cypher
MATCH (c:City)
RETURN c.name, c.population, c.type
ORDER BY c.population DESC
```

### Test 3: View Roads
```cypher
MATCH (start:City)-[r:ROAD]->(end:City)
RETURN start.name, end.name, r.distance, r.time
ORDER BY r.distance
```

### Test 4: Find a Path
```cypher
MATCH (start:City {name: 'New York'}), (end:City {name: 'Chicago'})
MATCH path = shortestPath((start)-[:ROAD*]-(end))
RETURN [node IN nodes(path) | node.name] as cities,
       reduce(dist = 0, r IN relationships(path) | dist + r.distance) as totalDistance
```

### Test 5: Similar People
```cypher
MATCH (p1:Person)-[:VISITED]->(c:City)<-[:VISITED]-(p2:Person)
WHERE id(p1) < id(p2)
RETURN p1.name, p2.name, collect(c.name) as commonCities
```

---

## Application Features with Real Data

Once connected to real Neo4j:

### 1. Live Graph Visualization
- See your actual Neo4j graph
- Interactive node/relationship exploration
- Real-time updates

### 2. Node Similarity Algorithm
- Select similarity metric (Jaccard, Overlap, Cosine)
- Configure Top K results
- Set similarity threshold
- See results with actual person names
- Highlight similar nodes on graph

### 3. Shortest Path Algorithm
- Select source city from dropdown (with real city names!)
- Select target city from dropdown
- Choose weight property (distance, time)
- See the actual path on the graph
- Export results

### 4. Data Export
- Export algorithm results as JSON
- Export as CSV for analysis
- Real node IDs and properties

---

## Architecture

```
┌─────────────────────────────────────────┐
│   GraphVisualization Component          │
│   - Manages UI and state                │
└────────────┬────────────────────────────┘
             │
             ├─→ Uses mock data (current)
             │   └─ backendMockData.js
             │
             └─→ OR uses real Neo4j data
                 └─ neo4jService.js
                     ├─ fetchGraphData()
                     ├─ createGdsProjection()
                     ├─ runNodeSimilarityGds()
                     └─ runShortestPathGds()
                         │
                         ▼
                 ┌──────────────────┐
                 │   Neo4j Database │
                 │   localhost:7687 │
                 └──────────────────┘
```

---

## GDS Plugin Requirement

**IMPORTANT**: You need the Neo4j Graph Data Science plugin installed!

### Check if installed:
```cypher
RETURN gds.version()
```

### If not installed:
1. Neo4j Desktop → Plugins → Graph Data Science Library → Install
2. Restart your database
3. Verify: `RETURN gds.version()`

---

## Benefits of Real Data

1. **Realistic Testing**: See how algorithms perform on actual graph structures
2. **Better Understanding**: Visual representation helps understand GDS concepts
3. **Live Updates**: Modify data in Neo4j, refresh to see changes
4. **Scalability Testing**: Add more nodes/relationships to test performance
5. **Integration Ready**: When backend is ready, same service layer works

---

## Next Steps

### Immediate:
1. ✅ Load data using `neo4j-setup.cypher`
2. ✅ Verify data in Neo4j Browser
3. ✅ Update password in `neo4jService.js`
4. ⏳ Switch `GraphVisualization.js` to use real data
5. ⏳ Test algorithms with real data

### Optional Enhancements:
1. Add data source toggle (mock vs real)
2. Add connection status indicator
3. Add error handling UI
4. Add data refresh button
5. Add custom Cypher query executor

---

## Troubleshooting

### "Connection Refused"
- Check Neo4j is running: Open Neo4j Desktop
- Verify port 7687 is open
- Test connection: `RETURN 1 as test` in Neo4j Browser

### "Authentication Failed"
- Update password in `neo4jService.js`
- Ensure username is 'neo4j' (default)
- Reset password if needed

### "Procedure not found: gds.*"
- GDS plugin not installed
- Follow GDS installation steps in instructions
- Restart Neo4j after installation

### "Graph not found"
- GDS projection wasn't created
- Run `createGdsProjection()` first
- Check projection exists: `CALL gds.graph.list()`

### Application doesn't show data
- Check browser console for errors
- Verify `fetchGraphData()` returns data
- Check Neo4j connection in Network tab

---

## Sample Data Characteristics

### Why This Data is Ideal:

**For Node Similarity:**
- Multiple people visiting same cities (creates similarity)
- People knowing each other (shared connections)
- Interests overlap (additional similarity factor)
- Different strengths of relationships

**For Shortest Path:**
- Multiple paths between cities
- Varying distances (10km - 1000km+)
- Different traffic conditions
- Realistic highway network
- Can test weighted vs unweighted paths

---

## Want to Add More Data?

### Add a new city:
```cypher
CREATE (miami:City {
  id: 'city_miami',
  name: 'Miami',
  country: 'USA',
  population: 442241,
  type: 'Metropolitan'
})
```

### Connect to existing cities:
```cypher
MATCH (atlanta:City {name: 'Atlanta'}), (miami:City {name: 'Miami'})
CREATE (atlanta)-[:ROAD {distance: 1078, time: 11.5, traffic: 'medium'}]->(miami)
```

### Add a new person:
```cypher
CREATE (john:Person {
  id: 'person_john',
  name: 'John Doe',
  age: 33,
  occupation: 'Data Engineer'
})

MATCH (john:Person {name: 'John Doe'}), (miami:City {name: 'Miami'})
CREATE (john)-[:LIVES_IN {since: 2022}]->(miami)
```

---

## Support

If you need help:
1. Check Neo4j logs: `logs/neo4j.log` in Neo4j directory
2. Test queries in Neo4j Browser first
3. Check JavaScript console for errors
4. Verify GDS plugin version compatibility

---

**Ready to proceed?**
Let me know if you want me to:
1. Switch the app to use real Neo4j data
2. Add a toggle between mock and real data
3. Add more features to the Neo4j integration
