// Mock data simulating backend API response
// This represents what your colleague's backend engine will send

export const mockJobResponse = {
  jobId: 'job_12345',
  createdAt: '2026-04-07T10:30:00Z',
  status: 'ready',
  nodes: [
    {
      id: 'person_1',
      labels: ['Person'],
      properties: {
        name: 'Alice Johnson',
        age: 28,
        department: 'Engineering',
        skills: ['Python', 'Neo4j', 'React']
      }
    },
    {
      id: 'person_2',
      labels: ['Person'],
      properties: {
        name: 'Bob Smith',
        age: 32,
        department: 'Engineering',
        skills: ['Java', 'Neo4j', 'Spring']
      }
    },
    {
      id: 'person_3',
      labels: ['Person'],
      properties: {
        name: 'Carol Williams',
        age: 29,
        department: 'Data Science',
        skills: ['Python', 'Machine Learning', 'Neo4j']
      }
    },
    {
      id: 'person_4',
      labels: ['Person'],
      properties: {
        name: 'David Brown',
        age: 35,
        department: 'Management',
        skills: ['Leadership', 'Strategy', 'Agile']
      }
    },
    {
      id: 'person_5',
      labels: ['Person'],
      properties: {
        name: 'Eve Davis',
        age: 27,
        department: 'Engineering',
        skills: ['JavaScript', 'React', 'Node.js']
      }
    },
    {
      id: 'person_6',
      labels: ['Person'],
      properties: {
        name: 'Frank Miller',
        age: 30,
        department: 'Data Science',
        skills: ['Python', 'TensorFlow', 'Statistics']
      }
    },
    {
      id: 'company_1',
      labels: ['Company'],
      properties: {
        name: 'TechCorp Inc',
        founded: 2010,
        industry: 'Technology',
        size: 'Large'
      }
    },
    {
      id: 'project_1',
      labels: ['Project'],
      properties: {
        name: 'GraphDB Migration',
        status: 'active',
        budget: 500000,
        priority: 'high'
      }
    },
    {
      id: 'project_2',
      labels: ['Project'],
      properties: {
        name: 'ML Pipeline',
        status: 'active',
        budget: 300000,
        priority: 'medium'
      }
    },
    {
      id: 'skill_1',
      labels: ['Skill'],
      properties: {
        name: 'Neo4j',
        category: 'Database',
        level: 'Advanced'
      }
    },
    {
      id: 'skill_2',
      labels: ['Skill'],
      properties: {
        name: 'Python',
        category: 'Programming',
        level: 'Advanced'
      }
    }
  ],
  relationships: [
    {
      id: 'rel_1',
      type: 'KNOWS',
      startNode: 'person_1',
      endNode: 'person_2',
      properties: {
        since: 2018,
        strength: 0.9
      }
    },
    {
      id: 'rel_2',
      type: 'KNOWS',
      startNode: 'person_1',
      endNode: 'person_3',
      properties: {
        since: 2019,
        strength: 0.75
      }
    },
    {
      id: 'rel_3',
      type: 'KNOWS',
      startNode: 'person_2',
      endNode: 'person_4',
      properties: {
        since: 2017,
        strength: 0.8
      }
    },
    {
      id: 'rel_4',
      type: 'KNOWS',
      startNode: 'person_3',
      endNode: 'person_5',
      properties: {
        since: 2020,
        strength: 0.85
      }
    },
    {
      id: 'rel_5',
      type: 'KNOWS',
      startNode: 'person_3',
      endNode: 'person_6',
      properties: {
        since: 2019,
        strength: 0.95
      }
    },
    {
      id: 'rel_6',
      type: 'KNOWS',
      startNode: 'person_5',
      endNode: 'person_6',
      properties: {
        since: 2021,
        strength: 0.7
      }
    },
    {
      id: 'rel_7',
      type: 'WORKS_AT',
      startNode: 'person_1',
      endNode: 'company_1',
      properties: {
        since: 2019,
        role: 'Senior Engineer'
      }
    },
    {
      id: 'rel_8',
      type: 'WORKS_AT',
      startNode: 'person_2',
      endNode: 'company_1',
      properties: {
        since: 2017,
        role: 'Lead Engineer'
      }
    },
    {
      id: 'rel_9',
      type: 'WORKS_AT',
      startNode: 'person_3',
      endNode: 'company_1',
      properties: {
        since: 2019,
        role: 'Data Scientist'
      }
    },
    {
      id: 'rel_10',
      type: 'WORKS_AT',
      startNode: 'person_4',
      endNode: 'company_1',
      properties: {
        since: 2015,
        role: 'Project Manager'
      }
    },
    {
      id: 'rel_11',
      type: 'WORKS_AT',
      startNode: 'person_5',
      endNode: 'company_1',
      properties: {
        since: 2020,
        role: 'Frontend Developer'
      }
    },
    {
      id: 'rel_12',
      type: 'WORKS_AT',
      startNode: 'person_6',
      endNode: 'company_1',
      properties: {
        since: 2019,
        role: 'ML Engineer'
      }
    },
    {
      id: 'rel_13',
      type: 'WORKS_ON',
      startNode: 'person_1',
      endNode: 'project_1',
      properties: {
        role: 'Developer',
        hoursPerWeek: 40
      }
    },
    {
      id: 'rel_14',
      type: 'WORKS_ON',
      startNode: 'person_2',
      endNode: 'project_1',
      properties: {
        role: 'Tech Lead',
        hoursPerWeek: 35
      }
    },
    {
      id: 'rel_15',
      type: 'WORKS_ON',
      startNode: 'person_3',
      endNode: 'project_2',
      properties: {
        role: 'Data Scientist',
        hoursPerWeek: 40
      }
    },
    {
      id: 'rel_16',
      type: 'WORKS_ON',
      startNode: 'person_6',
      endNode: 'project_2',
      properties: {
        role: 'ML Engineer',
        hoursPerWeek: 40
      }
    },
    {
      id: 'rel_17',
      type: 'MANAGES',
      startNode: 'person_4',
      endNode: 'project_1',
      properties: {
        since: 2023
      }
    },
    {
      id: 'rel_18',
      type: 'MANAGES',
      startNode: 'person_4',
      endNode: 'project_2',
      properties: {
        since: 2024
      }
    },
    {
      id: 'rel_19',
      type: 'HAS_SKILL',
      startNode: 'person_1',
      endNode: 'skill_1',
      properties: {
        proficiency: 0.9,
        yearsOfExperience: 4
      }
    },
    {
      id: 'rel_20',
      type: 'HAS_SKILL',
      startNode: 'person_1',
      endNode: 'skill_2',
      properties: {
        proficiency: 0.85,
        yearsOfExperience: 6
      }
    },
    {
      id: 'rel_21',
      type: 'HAS_SKILL',
      startNode: 'person_2',
      endNode: 'skill_1',
      properties: {
        proficiency: 0.95,
        yearsOfExperience: 5
      }
    },
    {
      id: 'rel_22',
      type: 'HAS_SKILL',
      startNode: 'person_3',
      endNode: 'skill_1',
      properties: {
        proficiency: 0.8,
        yearsOfExperience: 3
      }
    },
    {
      id: 'rel_23',
      type: 'HAS_SKILL',
      startNode: 'person_3',
      endNode: 'skill_2',
      properties: {
        proficiency: 0.9,
        yearsOfExperience: 5
      }
    },
    {
      id: 'rel_24',
      type: 'HAS_SKILL',
      startNode: 'person_6',
      endNode: 'skill_2',
      properties: {
        proficiency: 0.88,
        yearsOfExperience: 4
      }
    }
  ],
  availableAlgorithms: [
    {
      id: 'nodeSimilarity',
      name: 'Node Similarity',
      description: 'Computes similarity between nodes based on their neighborhoods',
      category: 'similarity',
      tier: 'beta'
    },
    {
      id: 'shortestPath',
      name: 'Shortest Path',
      description: 'Finds the shortest path between two nodes',
      category: 'path-finding',
      tier: 'production'
    }
  ]
};

// Additional mock job for testing
export const mockJobResponse2 = {
  jobId: 'job_67890',
  createdAt: '2026-04-06T15:20:00Z',
  status: 'ready',
  nodes: [
    {
      id: 'city_1',
      labels: ['City'],
      properties: {
        name: 'New York',
        population: 8336817,
        country: 'USA'
      }
    },
    {
      id: 'city_2',
      labels: ['City'],
      properties: {
        name: 'London',
        population: 8982000,
        country: 'UK'
      }
    },
    {
      id: 'city_3',
      labels: ['City'],
      properties: {
        name: 'Paris',
        population: 2161000,
        country: 'France'
      }
    },
    {
      id: 'city_4',
      labels: ['City'],
      properties: {
        name: 'Berlin',
        population: 3645000,
        country: 'Germany'
      }
    },
    {
      id: 'city_5',
      labels: ['City'],
      properties: {
        name: 'Tokyo',
        population: 13960000,
        country: 'Japan'
      }
    }
  ],
  relationships: [
    {
      id: 'route_1',
      type: 'FLIGHT_TO',
      startNode: 'city_1',
      endNode: 'city_2',
      properties: {
        distance: 5585,
        duration: 7.5,
        cost: 450
      }
    },
    {
      id: 'route_2',
      type: 'FLIGHT_TO',
      startNode: 'city_2',
      endNode: 'city_3',
      properties: {
        distance: 344,
        duration: 1.25,
        cost: 120
      }
    },
    {
      id: 'route_3',
      type: 'FLIGHT_TO',
      startNode: 'city_3',
      endNode: 'city_4',
      properties: {
        distance: 878,
        duration: 1.75,
        cost: 150
      }
    },
    {
      id: 'route_4',
      type: 'FLIGHT_TO',
      startNode: 'city_1',
      endNode: 'city_3',
      properties: {
        distance: 5837,
        duration: 8,
        cost: 500
      }
    },
    {
      id: 'route_5',
      type: 'FLIGHT_TO',
      startNode: 'city_2',
      endNode: 'city_5',
      properties: {
        distance: 9584,
        duration: 12,
        cost: 800
      }
    },
    {
      id: 'route_6',
      type: 'FLIGHT_TO',
      startNode: 'city_4',
      endNode: 'city_5',
      properties: {
        distance: 8918,
        duration: 11.5,
        cost: 750
      }
    }
  ],
  availableAlgorithms: [
    {
      id: 'nodeSimilarity',
      name: 'Node Similarity',
      description: 'Computes similarity between nodes based on their neighborhoods',
      category: 'similarity',
      tier: 'beta'
    },
    {
      id: 'shortestPath',
      name: 'Shortest Path',
      description: 'Finds the shortest path between two nodes',
      category: 'path-finding',
      tier: 'production'
    }
  ]
};

// Helper function to get job by ID
export const getJobById = (jobId) => {
  if (jobId === 'job_12345') return mockJobResponse;
  if (jobId === 'job_67890') return mockJobResponse2;
  return null;
};

// Helper function to get all available jobs
export const getAllJobs = () => [
  {
    jobId: mockJobResponse.jobId,
    createdAt: mockJobResponse.createdAt,
    status: mockJobResponse.status,
    nodeCount: mockJobResponse.nodes.length,
    relationshipCount: mockJobResponse.relationships.length
  },
  {
    jobId: mockJobResponse2.jobId,
    createdAt: mockJobResponse2.createdAt,
    status: mockJobResponse2.status,
    nodeCount: mockJobResponse2.nodes.length,
    relationshipCount: mockJobResponse2.relationships.length
  }
];
