// Sample Neo4j graph data - simulating supply chain network
// This represents a simple supply chain with materials, sites, and markets

export const sampleGraphData = {
  nodes: [
    {
      id: '1',
      size: 25,
      color: '#4CAF50',
      caption: 'Material 1',
      labels: ['Material']
    },
    {
      id: '2',
      size: 25,
      color: '#4CAF50',
      caption: 'Material 2',
      labels: ['Material']
    },
    {
      id: '3',
      size: 25,
      color: '#4CAF50',
      caption: 'Material 3',
      labels: ['Material']
    },
    {
      id: '4',
      size: 30,
      color: '#0B6FCC',
      caption: 'Site 1',
      labels: ['Site']
    },
    {
      id: '5',
      size: 30,
      color: '#0B6FCC',
      caption: 'Site 2',
      labels: ['Site']
    },
    {
      id: '6',
      size: 30,
      color: '#FF9800',
      caption: 'Market 1',
      labels: ['Market']
    },
    {
      id: '7',
      size: 35,
      color: '#9C27B0',
      caption: 'Warehouse 1',
      labels: ['Warehouse']
    }
  ],
  relationships: [
    {
      id: 'r1',
      from: '1',
      to: '4',
      caption: 'LOCATED_AT'
    },
    {
      id: 'r2',
      from: '2',
      to: '4',
      caption: 'LOCATED_AT'
    },
    {
      id: 'r3',
      from: '3',
      to: '5',
      caption: 'LOCATED_AT'
    },
    {
      id: 'r4',
      from: '1',
      to: '6',
      caption: 'SOLD_IN'
    },
    {
      id: 'r5',
      from: '2',
      to: '6',
      caption: 'SOLD_IN'
    },
    {
      id: 'r6',
      from: '4',
      to: '7',
      caption: 'SHIPS_TO'
    },
    {
      id: 'r7',
      from: '5',
      to: '7',
      caption: 'SHIPS_TO'
    }
  ]
};
