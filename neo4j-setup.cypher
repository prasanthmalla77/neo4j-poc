// ============================================
// Neo4j Graph Setup for GDS Demo
// ============================================
// This script creates a geographic network with cities, people, and roads
// Perfect for demonstrating Node Similarity and Shortest Path algorithms
// ============================================

// Clear existing data (use with caution!)
MATCH (n) DETACH DELETE n;

// ============================================
// 1. CREATE CITIES (Places)
// ============================================

CREATE (nyc:City {
  id: 'city_nyc',
  name: 'New York',
  country: 'USA',
  population: 8336817,
  latitude: 40.7128,
  longitude: -74.0060,
  type: 'Metropolitan'
})

CREATE (boston:City {
  id: 'city_boston',
  name: 'Boston',
  country: 'USA',
  population: 692600,
  latitude: 42.3601,
  longitude: -71.0589,
  type: 'Metropolitan'
})

CREATE (philly:City {
  id: 'city_philadelphia',
  name: 'Philadelphia',
  country: 'USA',
  population: 1584064,
  latitude: 39.9526,
  longitude: -75.1652,
  type: 'Metropolitan'
})

CREATE (dc:City {
  id: 'city_washington',
  name: 'Washington DC',
  country: 'USA',
  population: 705749,
  latitude: 38.9072,
  longitude: -77.0369,
  type: 'Capital'
})

CREATE (chicago:City {
  id: 'city_chicago',
  name: 'Chicago',
  country: 'USA',
  population: 2716000,
  latitude: 41.8781,
  longitude: -87.6298,
  type: 'Metropolitan'
})

CREATE (detroit:City {
  id: 'city_detroit',
  name: 'Detroit',
  country: 'USA',
  population: 670031,
  latitude: 42.3314,
  longitude: -83.0458,
  type: 'Metropolitan'
})

CREATE (cleveland:City {
  id: 'city_cleveland',
  name: 'Cleveland',
  country: 'USA',
  population: 381009,
  latitude: 41.4993,
  longitude: -81.6944,
  type: 'Urban'
})

CREATE (pittsburgh:City {
  id: 'city_pittsburgh',
  name: 'Pittsburgh',
  country: 'USA',
  population: 302971,
  latitude: 40.4406,
  longitude: -79.9959,
  type: 'Urban'
})

CREATE (buffalo:City {
  id: 'city_buffalo',
  name: 'Buffalo',
  country: 'USA',
  population: 255284,
  latitude: 42.8864,
  longitude: -78.8784,
  type: 'Urban'
})

CREATE (atlanta:City {
  id: 'city_atlanta',
  name: 'Atlanta',
  country: 'USA',
  population: 498715,
  latitude: 33.7490,
  longitude: -84.3880,
  type: 'Metropolitan'
});

// ============================================
// 2. CREATE PEOPLE (Residents and Travelers)
// ============================================

CREATE (alice:Person {
  id: 'person_alice',
  name: 'Alice Johnson',
  age: 28,
  occupation: 'Software Engineer',
  interests: ['Technology', 'Travel', 'Photography']
})

CREATE (bob:Person {
  id: 'person_bob',
  name: 'Bob Smith',
  age: 35,
  occupation: 'Data Scientist',
  interests: ['Data Science', 'Machine Learning', 'Neo4j']
})

CREATE (carol:Person {
  id: 'person_carol',
  name: 'Carol Williams',
  age: 31,
  occupation: 'Product Manager',
  interests: ['Business', 'Travel', 'Food']
})

CREATE (david:Person {
  id: 'person_david',
  name: 'David Brown',
  age: 42,
  occupation: 'Sales Director',
  interests: ['Sales', 'Networking', 'Golf']
})

CREATE (eve:Person {
  id: 'person_eve',
  name: 'Eve Davis',
  age: 27,
  occupation: 'UX Designer',
  interests: ['Design', 'Art', 'Technology']
})

CREATE (frank:Person {
  id: 'person_frank',
  name: 'Frank Miller',
  age: 38,
  occupation: 'DevOps Engineer',
  interests: ['Cloud', 'Automation', 'Cycling']
})

CREATE (grace:Person {
  id: 'person_grace',
  name: 'Grace Lee',
  age: 29,
  occupation: 'Marketing Manager',
  interests: ['Marketing', 'Social Media', 'Travel']
})

CREATE (henry:Person {
  id: 'person_henry',
  name: 'Henry Wilson',
  age: 45,
  occupation: 'CEO',
  interests: ['Leadership', 'Strategy', 'Innovation']
});

// ============================================
// 3. CREATE ROADS (Connections between cities)
// ============================================

// Format: (City1)-[:ROAD {distance: km, time: hours, traffic: level}]->(City2)

// East Coast Corridor
MATCH (nyc:City {name: 'New York'}), (boston:City {name: 'Boston'})
CREATE (nyc)-[:ROAD {
  distance: 346,
  time: 4.5,
  traffic: 'high',
  highway: 'I-95',
  condition: 'excellent'
}]->(boston);

MATCH (nyc:City {name: 'New York'}), (philly:City {name: 'Philadelphia'})
CREATE (nyc)-[:ROAD {
  distance: 152,
  time: 2.0,
  traffic: 'high',
  highway: 'I-95',
  condition: 'excellent'
}]->(philly);

MATCH (philly:City {name: 'Philadelphia'}), (dc:City {name: 'Washington DC'})
CREATE (philly)-[:ROAD {
  distance: 225,
  time: 3.0,
  traffic: 'medium',
  highway: 'I-95',
  condition: 'good'
}]->(dc);

MATCH (boston:City {name: 'Boston'}), (buffalo:City {name: 'Buffalo'})
CREATE (boston)-[:ROAD {
  distance: 684,
  time: 8.5,
  traffic: 'low',
  highway: 'I-90',
  condition: 'good'
}]->(buffalo);

// Northeast to Midwest
MATCH (nyc:City {name: 'New York'}), (pittsburgh:City {name: 'Pittsburgh'})
CREATE (nyc)-[:ROAD {
  distance: 584,
  time: 7.0,
  traffic: 'medium',
  highway: 'I-76',
  condition: 'good'
}]->(pittsburgh);

MATCH (philly:City {name: 'Philadelphia'}), (pittsburgh:City {name: 'Pittsburgh'})
CREATE (philly)-[:ROAD {
  distance: 490,
  time: 6.0,
  traffic: 'low',
  highway: 'I-76',
  condition: 'excellent'
}]->(pittsburgh);

MATCH (pittsburgh:City {name: 'Pittsburgh'}), (cleveland:City {name: 'Cleveland'})
CREATE (pittsburgh)-[:ROAD {
  distance: 217,
  time: 2.5,
  traffic: 'low',
  highway: 'I-76',
  condition: 'good'
}]->(cleveland);

MATCH (cleveland:City {name: 'Cleveland'}), (detroit:City {name: 'Detroit'})
CREATE (cleveland)-[:ROAD {
  distance: 266,
  time: 3.5,
  traffic: 'medium',
  highway: 'I-90',
  condition: 'good'
}]->(detroit);

MATCH (buffalo:City {name: 'Buffalo'}), (cleveland:City {name: 'Cleveland'})
CREATE (buffalo)-[:ROAD {
  distance: 305,
  time: 4.0,
  traffic: 'low',
  highway: 'I-90',
  condition: 'good'
}]->(cleveland);

MATCH (detroit:City {name: 'Detroit'}), (chicago:City {name: 'Chicago'})
CREATE (detroit)-[:ROAD {
  distance: 454,
  time: 5.5,
  traffic: 'high',
  highway: 'I-94',
  condition: 'excellent'
}]->(chicago);

// South Connections
MATCH (dc:City {name: 'Washington DC'}), (atlanta:City {name: 'Atlanta'})
CREATE (dc)-[:ROAD {
  distance: 1077,
  time: 12.0,
  traffic: 'medium',
  highway: 'I-85',
  condition: 'good'
}]->(atlanta);

MATCH (pittsburgh:City {name: 'Pittsburgh'}), (dc:City {name: 'Washington DC'})
CREATE (pittsburgh)-[:ROAD {
  distance: 383,
  time: 5.0,
  traffic: 'medium',
  highway: 'I-70',
  condition: 'good'
}]->(dc);

// Additional connections for more paths
MATCH (chicago:City {name: 'Chicago'}), (cleveland:City {name: 'Cleveland'})
CREATE (chicago)-[:ROAD {
  distance: 554,
  time: 6.5,
  traffic: 'medium',
  highway: 'I-90',
  condition: 'good'
}]->(cleveland);

MATCH (buffalo:City {name: 'Buffalo'}), (detroit:City {name: 'Detroit'})
CREATE (buffalo)-[:ROAD {
  distance: 413,
  time: 5.5,
  traffic: 'low',
  highway: 'Route 5',
  condition: 'fair'
}]->(detroit);

// ============================================
// 4. CREATE PERSON-CITY RELATIONSHIPS
// ============================================

// LIVES_IN relationships
MATCH (alice:Person {name: 'Alice Johnson'}), (nyc:City {name: 'New York'})
CREATE (alice)-[:LIVES_IN {since: 2018, status: 'permanent'}]->(nyc);

MATCH (bob:Person {name: 'Bob Smith'}), (boston:City {name: 'Boston'})
CREATE (bob)-[:LIVES_IN {since: 2015, status: 'permanent'}]->(boston);

MATCH (carol:Person {name: 'Carol Williams'}), (chicago:City {name: 'Chicago'})
CREATE (carol)-[:LIVES_IN {since: 2020, status: 'permanent'}]->(chicago);

MATCH (david:Person {name: 'David Brown'}), (dc:City {name: 'Washington DC'})
CREATE (david)-[:LIVES_IN {since: 2012, status: 'permanent'}]->(dc);

MATCH (eve:Person {name: 'Eve Davis'}), (philly:City {name: 'Philadelphia'})
CREATE (eve)-[:LIVES_IN {since: 2019, status: 'permanent'}]->(philly);

MATCH (frank:Person {name: 'Frank Miller'}), (detroit:City {name: 'Detroit'})
CREATE (frank)-[:LIVES_IN {since: 2017, status: 'permanent'}]->(detroit);

MATCH (grace:Person {name: 'Grace Lee'}), (atlanta:City {name: 'Atlanta'})
CREATE (grace)-[:LIVES_IN {since: 2021, status: 'permanent'}]->(atlanta);

MATCH (henry:Person {name: 'Henry Wilson'}), (nyc:City {name: 'New York'})
CREATE (henry)-[:LIVES_IN {since: 2010, status: 'permanent'}]->(nyc);

// VISITED relationships (for similarity)
MATCH (alice:Person {name: 'Alice Johnson'}), (boston:City {name: 'Boston'})
CREATE (alice)-[:VISITED {date: '2024-03', duration: 3, purpose: 'vacation'}]->(boston);

MATCH (alice:Person {name: 'Alice Johnson'}), (philly:City {name: 'Philadelphia'})
CREATE (alice)-[:VISITED {date: '2024-01', duration: 2, purpose: 'business'}]->(philly);

MATCH (bob:Person {name: 'Bob Smith'}), (nyc:City {name: 'New York'})
CREATE (bob)-[:VISITED {date: '2024-02', duration: 5, purpose: 'conference'}]->(nyc);

MATCH (bob:Person {name: 'Bob Smith'}), (philly:City {name: 'Philadelphia'})
CREATE (bob)-[:VISITED {date: '2023-11', duration: 2, purpose: 'vacation'}]->(philly);

MATCH (carol:Person {name: 'Carol Williams'}), (detroit:City {name: 'Detroit'})
CREATE (carol)-[:VISITED {date: '2024-02', duration: 1, purpose: 'business'}]->(detroit);

MATCH (carol:Person {name: 'Carol Williams'}), (cleveland:City {name: 'Cleveland'})
CREATE (carol)-[:VISITED {date: '2023-12', duration: 2, purpose: 'business'}]->(cleveland);

MATCH (david:Person {name: 'David Brown'}), (atlanta:City {name: 'Atlanta'})
CREATE (david)-[:VISITED {date: '2024-01', duration: 4, purpose: 'business'}]->(atlanta);

MATCH (eve:Person {name: 'Eve Davis'}), (nyc:City {name: 'New York'})
CREATE (eve)-[:VISITED {date: '2024-03', duration: 3, purpose: 'vacation'}]->(nyc);

MATCH (eve:Person {name: 'Eve Davis'}), (dc:City {name: 'Washington DC'})
CREATE (eve)-[:VISITED {date: '2023-10', duration: 2, purpose: 'vacation'}]->(dc);

MATCH (frank:Person {name: 'Frank Miller'}), (chicago:City {name: 'Chicago'})
CREATE (frank)-[:VISITED {date: '2024-02', duration: 3, purpose: 'conference'}]->(chicago);

// KNOWS relationships (social network for similarity)
MATCH (alice:Person {name: 'Alice Johnson'}), (bob:Person {name: 'Bob Smith'})
CREATE (alice)-[:KNOWS {since: 2019, strength: 0.9, type: 'colleague'}]->(bob);

MATCH (alice:Person {name: 'Alice Johnson'}), (eve:Person {name: 'Eve Davis'})
CREATE (alice)-[:KNOWS {since: 2020, strength: 0.8, type: 'friend'}]->(eve);

MATCH (bob:Person {name: 'Bob Smith'}), (frank:Person {name: 'Frank Miller'})
CREATE (bob)-[:KNOWS {since: 2018, strength: 0.85, type: 'colleague'}]->(frank);

MATCH (carol:Person {name: 'Carol Williams'}), (david:Person {name: 'David Brown'})
CREATE (carol)-[:KNOWS {since: 2017, strength: 0.75, type: 'colleague'}]->(david);

MATCH (david:Person {name: 'David Brown'}), (grace:Person {name: 'Grace Lee'})
CREATE (david)-[:KNOWS {since: 2021, strength: 0.7, type: 'colleague'}]->(grace);

MATCH (eve:Person {name: 'Eve Davis'}), (alice:Person {name: 'Alice Johnson'})
CREATE (eve)-[:KNOWS {since: 2020, strength: 0.8, type: 'friend'}]->(alice);

MATCH (frank:Person {name: 'Frank Miller'}), (carol:Person {name: 'Carol Williams'})
CREATE (frank)-[:KNOWS {since: 2019, strength: 0.65, type: 'friend'}]->(carol);

MATCH (henry:Person {name: 'Henry Wilson'}), (david:Person {name: 'David Brown'})
CREATE (henry)-[:KNOWS {since: 2015, strength: 0.95, type: 'colleague'}]->(david);

// ============================================
// 5. VERIFICATION QUERIES
// ============================================

// Count nodes and relationships
MATCH (n) RETURN labels(n) as Type, count(n) as Count;

// Show sample paths
MATCH path = (start:City {name: 'New York'})-[:ROAD*1..3]->(end:City {name: 'Chicago'})
RETURN path LIMIT 1;

// Show people and their connections
MATCH (p:Person)-[r]->(c:City)
RETURN p.name, type(r), c.name
ORDER BY p.name;
