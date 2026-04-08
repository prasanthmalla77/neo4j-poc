# NeoDash Integration - Usage Guide

## Overview

Your application now includes **NeoDash**, Neo4j's official dashboard builder, fully integrated into your POC. You can switch between Graph View (with algorithms) and NeoDash Analytics using the tab navigation.

---

## Accessing NeoDash

1. **Start your application** (`npm start`)
2. **Click the "NeoDash Analytics" tab** at the top
3. You'll see NeoDash embedded in an iframe

---

## Connecting NeoDash to Your Neo4j Database

### Step 1: Find Your Connection Details

When you open the NeoDash tab, you'll see a blue connection info card on the left with:

```
URI: bolt://localhost:7687
Database: test
Username: neo4j
```

### Step 2: Connect in NeoDash

1. In the NeoDash iframe, click **"Connect to Neo4j"**
2. Enter the connection details:
   - **Protocol**: `bolt://`
   - **URL**: `localhost`
   - **Port**: `7687`
   - **Database**: `test`
   - **Username**: `neo4j`
   - **Password**: `14071407` (your password)
3. Click **"Connect"**

---

## Creating Your First Dashboard

### Option 1: Start from Scratch

1. After connecting, click **"New Dashboard"**
2. Give it a name: "GDS Analysis Dashboard"
3. Click **"Create"**

### Option 2: Use Sample Queries

Use the sample queries provided at the bottom of the NeoDash panel:

#### Query 1: All Cities
```cypher
MATCH (c:City)
RETURN c.name, c.population
ORDER BY c.population DESC
```

#### Query 2: City Connections
```cypher
MATCH (c1:City)-[r:ROAD]->(c2:City)
RETURN c1.name, c2.name, r.distance
```

#### Query 3: People & Cities
```cypher
MATCH (p:Person)-[:LIVES_IN]->(c:City)
RETURN p.name, c.name, p.occupation
```

---

## Recommended Dashboards for Your GDS POC

### Dashboard 1: Network Overview

**Card 1 - Total Nodes (Big Number)**
```cypher
MATCH (n)
RETURN count(n) as totalNodes
```

**Card 2 - Total Relationships (Big Number)**
```cypher
MATCH ()-[r]->()
RETURN count(r) as totalRelationships
```

**Card 3 - Node Types (Pie Chart)**
```cypher
MATCH (n)
RETURN labels(n)[0] as Type, count(n) as Count
```

**Card 4 - Full Network (Graph)**
```cypher
MATCH (n)
OPTIONAL MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT 100
```

---

### Dashboard 2: City Network Analysis

**Card 1 - City Map (Graph)**
```cypher
MATCH (c:City)
OPTIONAL MATCH (c)-[r:ROAD]-(other:City)
RETURN c, r, other
```

**Card 2 - Longest Routes (Table)**
```cypher
MATCH (c1:City)-[r:ROAD]->(c2:City)
RETURN c1.name as From, c2.name as To, r.distance as Distance
ORDER BY r.distance DESC
LIMIT 10
```

**Card 3 - City Populations (Bar Chart)**
```cypher
MATCH (c:City)
RETURN c.name as City, c.population as Population
ORDER BY c.population DESC
```

**Card 4 - Traffic Levels (Pie Chart)**
```cypher
MATCH ()-[r:ROAD]->()
RETURN r.traffic as TrafficLevel, count(r) as Count
```

---

### Dashboard 3: People & Travel Patterns

**Card 1 - People Network (Graph)**
```cypher
MATCH (p:Person)
OPTIONAL MATCH (p)-[r]-(connected)
WHERE connected:Person OR connected:City
RETURN p, r, connected
```

**Card 2 - Most Visited Cities (Bar Chart)**
```cypher
MATCH (p:Person)-[:VISITED]->(c:City)
RETURN c.name as City, count(p) as Visitors
ORDER BY Visitors DESC
```

**Card 3 - People by City (Table)**
```cypher
MATCH (p:Person)-[:LIVES_IN]->(c:City)
RETURN c.name as City, collect(p.name) as Residents
ORDER BY c.name
```

**Card 4 - Travel Purposes (Pie Chart)**
```cypher
MATCH ()-[v:VISITED]->()
RETURN v.purpose as Purpose, count(v) as Count
```

---

### Dashboard 4: GDS-Ready Queries

**Card 1 - Node Degrees (Bar Chart)**
```cypher
MATCH (n)
RETURN labels(n)[0] as Type,
       n.name as Node,
       size((n)--()) as Connections
ORDER BY Connections DESC
LIMIT 15
```

**Card 2 - Shortest Paths Preview (Table)**
```cypher
MATCH (start:City {name: 'New York'}), (end:City)
WHERE start <> end
MATCH path = shortestPath((start)-[:ROAD*]-(end))
RETURN
  end.name as Destination,
  length(path) as Hops,
  reduce(dist = 0, r IN relationships(path) | dist + r.distance) as TotalDistance
ORDER BY TotalDistance
LIMIT 10
```

**Card 3 - Similar People (potential Node Similarity preview)**
```cypher
MATCH (p1:Person)-[:VISITED]->(c:City)<-[:VISITED]-(p2:Person)
WHERE id(p1) < id(p2)
WITH p1, p2, collect(c.name) as commonCities, count(c) as commonCount
WHERE commonCount > 0
RETURN p1.name as Person1,
       p2.name as Person2,
       commonCities,
       commonCount
ORDER BY commonCount DESC
```

**Card 4 - Network Connectivity (Graph)**
```cypher
MATCH path = (start)-[*1..3]-(end)
WHERE start:City AND end:City
WITH start, end, path
ORDER BY length(path)
LIMIT 20
RETURN path
```

---

## Dashboard Card Types in NeoDash

### Available Visualizations:

1. **Table** - Tabular data display
2. **Graph** - Network visualization
3. **Bar Chart** - Horizontal or vertical bars
4. **Line Chart** - Time series or trends
5. **Pie Chart** - Category distributions
6. **Map** - Geographic data (if you have coordinates)
7. **Single Value** - Big numbers/KPIs
8. **JSON** - Raw data display
9. **Markdown** - Text and documentation

---

## Tips for Creating Effective Dashboards

### 1. Use Parameterized Queries
Add parameters to make dashboards interactive:
```cypher
MATCH (c:City {name: $cityName})
RETURN c
```

### 2. Limit Results
Always add LIMIT to prevent overloading:
```cypher
MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT 100
```

### 3. Use Aggregations
For performance and clarity:
```cypher
MATCH (p:Person)-[:VISITED]->(c:City)
RETURN c.name, count(p) as visitorCount
```

### 4. Color Code by Type
In graph visualizations, NeoDash automatically colors nodes by label

---

## Saving and Sharing Dashboards

### Save Dashboard
1. Click the **"Save"** button in NeoDash
2. Dashboard is saved to your Neo4j database
3. Can be loaded anytime

### Export Dashboard
1. Click **"Settings"** in NeoDash
2. Choose **"Export"**
3. Download JSON file
4. Share with team members

### Load Saved Dashboard
1. Click **"Load Dashboard"**
2. Select from list of saved dashboards
3. Or import JSON file

---

## Integrating GDS Results into NeoDash

### After Running Node Similarity in Graph View:

You can query the results in NeoDash if they're stored in the database:

```cypher
// This is a preview - actual GDS results would be different
MATCH (n1)-[r:SIMILAR_TO]->(n2)
RETURN n1.name, n2.name, r.score
ORDER BY r.score DESC
LIMIT 20
```

### After Running Shortest Path:

```cypher
// Shortest path between cities with distance
MATCH (start:City {name: 'New York'}), (end:City {name: 'Chicago'})
MATCH path = shortestPath((start)-[:ROAD*]-(end))
RETURN
  [node IN nodes(path) | node.name] as Route,
  length(path) as Hops,
  reduce(dist = 0, r IN relationships(path) | dist + r.distance) as TotalDistance
```

---

## Troubleshooting

### NeoDash Won't Connect
- Check Neo4j is running
- Verify password is `14071407`
- Ensure database name is `test`
- Try hosted NeoDash instead (toggle switch)

### Dashboard Doesn't Show Data
- Verify query syntax in Neo4j Browser first
- Check RETURN clause matches visualization type
- Add LIMIT clause if query is slow

### Iframe Not Loading
- Check browser console for errors
- Disable ad blockers
- Try different browser
- Toggle to hosted NeoDash

---

## Advanced Features

### 1. Dashboard Parameters
Create interactive dashboards with input fields:
```cypher
MATCH (c:City {name: $selectedCity})
RETURN c
```
Add parameter input at top of dashboard

### 2. Dashboard Refresh
Set auto-refresh intervals for real-time data

### 3. Dashboard Themes
Customize colors and styling

### 4. Multi-Dashboard Links
Link dashboards together for navigation

---

## Sample Complete Dashboard Setup

### Step-by-Step:

1. **Connect to Neo4j** (use credentials from panel)

2. **Create New Dashboard** named "GDS Network Analysis"

3. **Add 4 Cards**:
   - Top-left: Node count (Big Number)
   - Top-right: Relationship count (Big Number)
   - Bottom-left: Full network (Graph)
   - Bottom-right: City populations (Bar Chart)

4. **Configure Each Card**:
   - Click **"Add Card"**
   - Select visualization type
   - Paste Cypher query
   - Adjust size and position

5. **Save Dashboard**

---

## Next Steps

1. ✅ Connect NeoDash to your Neo4j database
2. ✅ Create your first dashboard using sample queries
3. ✅ Experiment with different visualizations
4. ⏳ Create GDS-specific dashboards
5. ⏳ Share dashboards with your team

---

## Resources

- **NeoDash Documentation**: https://neo4j.com/labs/neodash/
- **NeoDash Gallery**: https://neodash.graphapp.io/#/gallery
- **Cypher Reference**: https://neo4j.com/docs/cypher-manual/current/

---

**Your NeoDash is ready to use!** Switch to the "NeoDash Analytics" tab and start building your dashboards.
