# Testing Your Neo4j Connection

## Current Status

✅ **Password Updated**: `14071407`
✅ **Database**: `test`
✅ **Data Loaded**: Cities and People loaded in Neo4j
✅ **Application Updated**: Now fetching from real Neo4j

---

## What to Check in Your Browser

### 1. Open the Application
- URL: `http://localhost:3000`
- The app should now be loading

### 2. Look for the Connection Badge
In the blue header at the top, you should see:
- **Green badge**: "🔗 Connected to Neo4j" (if successful)
- **Orange badge**: "📦 Mock Data" (if using mock data)

### 3. Check Browser Console
Open Developer Tools (F12) and look for these messages:

**Success Messages**:
```
[App] Using real Neo4j data
[Neo4j Service] Connection successful
[Neo4j Service] Fetched 18 nodes and XX relationships
[App] Fetched real Neo4j data: 18 nodes
Job initialized: neo4j_job_001
[GDS Service] Created projection: graph_gds_neo4j_job_001
```

**If You See Errors**:
- Connection refused → Neo4j not running
- Authentication failed → Check password in neo4jService.js
- Cannot read property → Data format issue

---

## What You Should See

### Graph Visualization
- **10 City nodes** (circles with city names)
- **8 Person nodes** (circles with people names)
- **Roads connecting cities** (lines between cities)
- **Various relationships** (LIVES_IN, VISITED, KNOWS)

### Node Colors
- Cities: Blue/Teal
- People: Green

### Interactive Features
1. **Click on a city** → Details panel appears at bottom
2. **Click on a person** → Details panel shows their info
3. **Use mouse wheel** → Zoom in/out
4. **Drag canvas** → Pan around

---

## Test the Algorithms

### Test 1: Node Similarity
1. Click "Select Algorithm" dropdown on the right
2. Choose "Node Similarity"
3. Configure:
   - Similarity Metric: Jaccard
   - Top K: 10
   - Similarity Threshold: 0.3
4. Click "Run Node Similarity"
5. Wait for results
6. Click "Highlight" on any result pair
7. See nodes highlighted in red on the graph

**Expected**: Should find similar people based on cities visited and people they know

### Test 2: Shortest Path
1. Click "Select Algorithm" dropdown
2. Choose "Shortest Path"
3. Configure:
   - Source Node: New York
   - Target Node: Chicago
   - Algorithm: Dijkstra
   - Weight Property: distance
4. Click "Run Shortest Path"
5. Wait for results
6. Click "Highlight Path"
7. See path highlighted on graph with gradient colors

**Expected**: Should show route like: New York → Pittsburgh → Cleveland → Chicago

---

## Common Issues & Solutions

### Issue: "Error Loading Graph"
**Solution**:
- Check Neo4j is running
- Verify database name is "test" not "neo4j"
- Run `SHOW DATABASES` in Neo4j Browser to confirm

### Issue: No nodes showing
**Solution**:
- Verify data loaded: `MATCH (n) RETURN count(n)` should return 18
- Check browser console for errors
- Refresh the page

### Issue: "Authentication failed"
**Solution**:
- Password might be wrong
- Update `src/services/neo4jService.js` line 10
- Current password: `14071407`

### Issue: Algorithms not working
**Solution**:
- GDS plugin not installed
- Install from Neo4j Desktop → Plugins tab
- Restart Neo4j

### Issue: Graph looks weird
**Solution**:
- Wait a few seconds for force layout to stabilize
- Try zooming out (mouse wheel)
- Refresh page to reset layout

---

## Verify Your Neo4j Data

Run these queries in Neo4j Browser to confirm:

### 1. Count nodes:
```cypher
MATCH (n) RETURN labels(n) as Type, count(n) as Count
```
**Expected**:
- City: 10
- Person: 8

### 2. See cities:
```cypher
MATCH (c:City) RETURN c.name ORDER BY c.name
```
**Expected**: Atlanta, Boston, Buffalo, Chicago, Cleveland, Detroit, New York, Philadelphia, Pittsburgh, Washington DC

### 3. See people:
```cypher
MATCH (p:Person) RETURN p.name ORDER BY p.name
```
**Expected**: Alice Johnson, Bob Smith, Carol Williams, David Brown, Eve Davis, Frank Miller, Grace Lee, Henry Wilson

### 4. Test a path:
```cypher
MATCH (start:City {name: 'New York'}), (end:City {name: 'Chicago'})
MATCH path = shortestPath((start)-[:ROAD*]-(end))
RETURN [node IN nodes(path) | node.name] as cities
```
**Expected**: Should return a path of cities

---

## Switch Between Mock and Real Data

To switch back to mock data:

1. Open `src/components/GraphVisualization.js`
2. Find line 13: `const USE_REAL_NEO4J = true;`
3. Change to: `const USE_REAL_NEO4J = false;`
4. Save and refresh browser

The badge will change from green (Neo4j) to orange (Mock Data)

---

## Performance Notes

**Real Neo4j Data**:
- ✅ Realistic graph structure
- ✅ Works with GDS algorithms
- ⏱️ Slightly slower load time (network call)

**Mock Data**:
- ✅ Instant loading
- ✅ No Neo4j required
- ⚠️ Simpler graph structure

---

## Next Steps

Once everything is working:

1. ✅ Test both algorithms with real data
2. ✅ Explore the graph interactively
3. ✅ Export algorithm results
4. ⏳ Add more data to Neo4j
5. ⏳ Integrate with backend when ready

---

## Debug Checklist

If something's not working, check:

- [ ] Neo4j Desktop/Server is running
- [ ] Database name is "test" in neo4jService.js
- [ ] Password is "14071407" in neo4jService.js
- [ ] URI is "bolt://localhost:7687"
- [ ] Data is loaded in Neo4j (18 nodes)
- [ ] GDS plugin is installed
- [ ] Browser console shows no errors
- [ ] React dev server is running (port 3000)

---

## Contact Points

If you see errors, check:
1. Browser console (F12 → Console tab)
2. Neo4j logs (in Neo4j Desktop)
3. Terminal running `npm start`

---

Happy testing! 🎉

The graph should now show your real Neo4j data with cities and people!
