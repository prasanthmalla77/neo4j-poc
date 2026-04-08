// Sample Neo4j graph data - simulating nodes and relationships
// This represents a simple social network with people and their relationships

export const sampleGraphData = {
  nodes: [
    {
      id: '1',
      size: 25,
      color: '#4CAF50',
      caption: 'Alice Johnson',
      labels: ['Person']
    },
    {
      id: '2',
      size: 25,
      color: '#4CAF50',
      caption: 'Bob Smith',
      labels: ['Person']
    },
    {
      id: '3',
      size: 25,
      color: '#4CAF50',
      caption: 'Carol Williams',
      labels: ['Person']
    },
    {
      id: '4',
      size: 25,
      color: '#4CAF50',
      caption: 'David Brown',
      labels: ['Person']
    },
    {
      id: '5',
      size: 25,
      color: '#4CAF50',
      caption: 'Eve Davis',
      labels: ['Person']
    },
    {
      id: '6',
      size: 40,
      color: '#2196F3',
      caption: 'TechCorp',
      labels: ['Company']
    },
    {
      id: '7',
      size: 35,
      color: '#FF9800',
      caption: 'GraphDB Project',
      labels: ['Project']
    }
  ],
  relationships: [
    {
      id: 'r1',
      from: '1',
      to: '2',
      caption: 'KNOWS'
    },
    {
      id: 'r2',
      from: '1',
      to: '3',
      caption: 'KNOWS'
    },
    {
      id: 'r3',
      from: '2',
      to: '4',
      caption: 'KNOWS'
    },
    {
      id: 'r4',
      from: '3',
      to: '5',
      caption: 'KNOWS'
    },
    {
      id: 'r5',
      from: '1',
      to: '6',
      caption: 'WORKS_AT'
    },
    {
      id: 'r6',
      from: '2',
      to: '6',
      caption: 'WORKS_AT'
    },
    {
      id: 'r7',
      from: '5',
      to: '6',
      caption: 'WORKS_AT'
    },
    {
      id: 'r8',
      from: '1',
      to: '7',
      caption: 'WORKS_ON'
    },
    {
      id: 'r9',
      from: '2',
      to: '7',
      caption: 'WORKS_ON'
    },
    {
      id: 'r10',
      from: '4',
      to: '7',
      caption: 'MANAGES'
    }
  ]
};
