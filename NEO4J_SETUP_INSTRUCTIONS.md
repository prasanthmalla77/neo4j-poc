# Neo4j Setup Instructions

This guide will help you set up your local Neo4j database with realistic graph data for GDS algorithm demonstration.

---

## Step 1: Start Your Local Neo4j Database

1. Make sure Neo4j Desktop or Neo4j Server is running
2. Default connection details:
   - **URI**: `bolt://localhost:7687`
   - **Username**: `neo4j`
   - **Password**: Your Neo4j password

---

## Step 2: Load the Graph Data

### Option A: Using Neo4j Browser

1. Open Neo4j Browser at `http://localhost:7474`
2. Open the file: `neo4j-setup.cypher`
3. Copy the entire contents
4. Paste into Neo4j Browser
5. Click "Run" or press `Ctrl+Enter`

### Option B: Using Cypher Shell

```bash
cat neo4j-setup.cypher | cypher-shell -u neo4j -p yourpassword
```

---

## Step 3: Verify the Data

Run these queries in Neo4j Browser to verify:

### Count all nodes and relationships:
```cypher
MATCH (n)
RETURN labels(n) as Type, count(n) as Count
```

**Expected Output:**
- City: 10 nodes
- Person: 8 nodes
- Total Relationships: ~40+

### View the graph:
```cypher
MATCH (n)
RETURN n
LIMIT 50
```

### Test a shortest path:
```cypher
MATCH (start:City {name: 'New York'}), (end:City {name: 'Chicago'})
MATCH path = shortestPath((start)-[:ROAD*]-(end))
RETURN path
```

---

## Step 4: Install GDS Plugin (Required for Algorithms)

If you haven't installed the Graph Data Science plugin:

### For Neo4j Desktop:
1. Open Neo4j Desktop
2. Select your database
3. Click "Plugins" tab
4. Find "Graph Data Science Library"
5. Click "Install"
6. Restart the database

### For Neo4j Server:
1. Download GDS plugin from: https://neo4j.com/download-center/
2. Place the JAR file in the `plugins/` directory
3. Restart Neo4j

### Verify GDS Installation:
```cypher
RETURN gds.version()
```

---

## Step 5: Configure the Application

Edit `src/services/neo4jService.js` and update the configuration:

```javascript
const NEO4J_CONFIG = {
  uri: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'YOUR_PASSWORD_HERE',  // Change this!
  database: 'neo4j'
};
```

---

## Step 6: Create Environment File (Optional)

Create a `.env` file in the project root:

```env
REACT_APP_NEO4J_URI=bolt://localhost:7687
REACT_APP_NEO4J_USERNAME=neo4j
REACT_APP_NEO4J_PASSWORD=yourpassword
REACT_APP_NEO4J_DATABASE=neo4j
```

---

## What the Graph Contains

### Cities (10 nodes)
- Major US cities: New York, Boston, Philadelphia, Washington DC, Chicago, Detroit, Cleveland, Pittsburgh, Buffalo, Atlanta
- Properties: population, latitude, longitude, type

### People (8 nodes)
- Professional personas with occupations and interests
- Properties: name, age, occupation, interests

### Relationships

**ROAD** (Between cities):
- Properties: distance (km), time (hours), traffic level, highway name, condition
- Creates a realistic US highway network

**LIVES_IN** (Person → City):
- Properties: since (year), status

**VISITED** (Person → City):
- Properties: date, duration (days), purpose
- Useful for Node Similarity (people who visit similar cities)

**KNOWS** (Person → Person):
- Properties: since (year), strength (0-1), type (colleague/friend)
- Social network for similarity analysis

---

## Example GDS Use Cases

### 1. Node Similarity
Find people with similar travel patterns:
```cypher
CALL gds.graph.project(
  'graph_gds_demo',
  ['Person', 'City'],
  ['VISITED', 'LIVES_IN']
)

CALL gds.nodeSimilarity.stream('graph_gds_demo')
YIELD node1, node2, similarity
RETURN gds.util.asNode(node1).name, gds.util.asNode(node2).name, similarity
ORDER BY similarity DESC
```

### 2. Shortest Path
Find shortest route between cities:
```cypher
MATCH (start:City {name: 'New York'}), (end:City {name: 'Chicago'})
CALL gds.shortestPath.dijkstra.stream('graph_gds_demo', {
  sourceNode: start,
  targetNode: end,
  relationshipWeightProperty: 'distance'
})
YIELD path
RETURN [node IN nodes(path) | node.name] as cities
```

---

## Troubleshooting

### Connection Refused
- Check if Neo4j is running: `systemctl status neo4j` (Linux) or check Neo4j Desktop
- Verify the port: `bolt://localhost:7687`

### Authentication Failed
- Update password in `src/services/neo4jService.js`
- Reset password using: `neo4j-admin set-initial-password newpassword`

### GDS Procedures Not Found
- Verify GDS installation: `RETURN gds.version()`
- Restart Neo4j after installing GDS plugin

### CORS Issues
- Neo4j driver connects directly via Bolt protocol (no CORS)
- If using HTTP API, enable CORS in `neo4j.conf`

---

## Next Steps

After loading the data:

1. Update the password in `neo4jService.js`
2. Switch `GraphVisualization.js` to use real Neo4j data instead of mock data
3. Test the algorithms with real data
4. Explore the graph visually

---

## Useful Cypher Commands

### Clear all data (⚠️ Use with caution!):
```cypher
MATCH (n) DETACH DELETE n
```

### Drop a GDS projection:
```cypher
CALL gds.graph.drop('graph_gds_demo')
```

### List all GDS projections:
```cypher
CALL gds.graph.list()
```

### View specific node types:
```cypher
MATCH (c:City) RETURN c.name, c.population ORDER BY c.population DESC
```

```cypher
MATCH (p:Person) RETURN p.name, p.occupation
```

### Find all paths between two cities:
```cypher
MATCH path = (start:City {name: 'Boston'})-[:ROAD*1..5]-(end:City {name: 'Atlanta'})
RETURN path
LIMIT 10
```

---

## Support

If you encounter issues:
1. Check Neo4j logs: `logs/neo4j.log`
2. Verify database status: `CALL dbms.components()`
3. Test connection: `RETURN 1 as test`

---

Happy Graph Exploring! 🚀
