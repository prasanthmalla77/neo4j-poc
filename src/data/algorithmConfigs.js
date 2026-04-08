// Algorithm configuration schemas for Neo4j GDS algorithms
// Defines available parameters and defaults for each algorithm

export const ALGORITHM_TYPES = {
  NODE_SIMILARITY: 'nodeSimilarity',
  SHORTEST_PATH: 'shortestPath'
};

// Node Similarity Algorithm Configuration
export const nodeSimilarityConfig = {
  id: 'nodeSimilarity',
  name: 'Node Similarity',
  description: 'Computes similarity between nodes based on their neighborhoods and properties',
  category: 'similarity',

  // Configuration parameters
  parameters: {
    similarityMetric: {
      label: 'Similarity Metric',
      type: 'select',
      required: true,
      default: 'jaccard',
      options: [
        {
          value: 'jaccard',
          label: 'Jaccard',
          description: 'Measures similarity as intersection over union of neighbors'
        },
        {
          value: 'overlap',
          label: 'Overlap',
          description: 'Measures similarity as intersection over minimum set size'
        },
        {
          value: 'cosine',
          label: 'Cosine',
          description: 'Measures similarity using cosine of the angle between vectors'
        },
        {
          value: 'pearson',
          label: 'Pearson',
          description: 'Measures linear correlation between nodes'
        }
      ],
      helpText: 'The metric used to compute similarity between nodes'
    },

    topK: {
      label: 'Top K Results',
      type: 'number',
      required: true,
      default: 10,
      min: 1,
      max: 100,
      helpText: 'Number of most similar nodes to return for each node'
    },

    similarityThreshold: {
      label: 'Similarity Cutoff',
      type: 'number',
      required: true,
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      helpText: 'Minimum similarity score (0-1) to include in results'
    },

    nodeFilter: {
      label: 'Node Filter',
      type: 'multiselect',
      required: false,
      default: [],
      options: [], // Will be populated dynamically from available node labels
      helpText: 'Filter by node labels (leave empty for all nodes)'
    },

    relationshipFilter: {
      label: 'Relationship Types',
      type: 'multiselect',
      required: false,
      default: [],
      options: [], // Will be populated dynamically from available relationship types
      helpText: 'Consider only these relationship types (leave empty for all)'
    },

    degreeCutoff: {
      label: 'Degree Cutoff',
      type: 'number',
      required: false,
      default: 1,
      min: 1,
      helpText: 'Minimum number of relationships a node must have to be included'
    }
  },

  // Default configuration
  defaultConfig: {
    similarityMetric: 'jaccard',
    topK: 10,
    similarityThreshold: 0.5,
    nodeFilter: [],
    relationshipFilter: [],
    degreeCutoff: 1
  },

  // Expected output structure
  outputSchema: {
    type: 'similarity-pairs',
    fields: ['node1', 'node2', 'score']
  }
};

// Shortest Path Algorithm Configuration
export const shortestPathConfig = {
  id: 'shortestPath',
  name: 'Shortest Path',
  description: 'Finds the shortest path between two nodes in the graph',
  category: 'path-finding',

  // Configuration parameters
  parameters: {
    sourceNode: {
      label: 'Source Node',
      type: 'node-select',
      required: true,
      default: null,
      helpText: 'Starting node for path finding'
    },

    targetNode: {
      label: 'Target Node',
      type: 'node-select',
      required: true,
      default: null,
      helpText: 'Destination node for path finding'
    },

    algorithm: {
      label: 'Algorithm Variant',
      type: 'select',
      required: true,
      default: 'dijkstra',
      options: [
        {
          value: 'dijkstra',
          label: 'Dijkstra',
          description: 'Classic shortest path algorithm with optional weights'
        },
        {
          value: 'astar',
          label: 'A* (A-Star)',
          description: 'Heuristic-based algorithm, faster for spatial data'
        },
        {
          value: 'yens',
          label: "Yen's K-Shortest Paths",
          description: 'Finds K alternative shortest paths'
        }
      ],
      helpText: 'The pathfinding algorithm to use'
    },

    weightProperty: {
      label: 'Weight Property',
      type: 'text',
      required: false,
      default: '',
      placeholder: 'e.g., distance, cost, duration',
      helpText: 'Relationship property to use as weight (leave empty for unweighted)'
    },

    relationshipFilter: {
      label: 'Relationship Types',
      type: 'multiselect',
      required: false,
      default: [],
      options: [], // Will be populated dynamically
      helpText: 'Consider only these relationship types (leave empty for all)'
    },

    maxDepth: {
      label: 'Max Path Length',
      type: 'number',
      required: false,
      default: 10,
      min: 1,
      max: 50,
      helpText: 'Maximum number of hops in the path'
    },

    kPaths: {
      label: 'K Paths',
      type: 'number',
      required: false,
      default: 1,
      min: 1,
      max: 10,
      helpText: 'Number of alternative paths to find (for Yen\'s algorithm)',
      showWhen: { algorithm: 'yens' }
    }
  },

  // Default configuration
  defaultConfig: {
    sourceNode: null,
    targetNode: null,
    algorithm: 'dijkstra',
    weightProperty: '',
    relationshipFilter: [],
    maxDepth: 10,
    kPaths: 1
  },

  // Expected output structure
  outputSchema: {
    type: 'path',
    fields: ['nodeIds', 'relationshipIds', 'totalCost', 'pathLength']
  }
};

// Map of all algorithm configurations
export const algorithmConfigs = {
  [ALGORITHM_TYPES.NODE_SIMILARITY]: nodeSimilarityConfig,
  [ALGORITHM_TYPES.SHORTEST_PATH]: shortestPathConfig
};

// Helper function to get algorithm config by ID
export const getAlgorithmConfig = (algorithmId) => {
  return algorithmConfigs[algorithmId] || null;
};

// Helper function to get default config for an algorithm
export const getDefaultConfig = (algorithmId) => {
  const config = getAlgorithmConfig(algorithmId);
  return config ? { ...config.defaultConfig } : null;
};

// Helper function to validate algorithm configuration
export const validateAlgorithmConfig = (algorithmId, config) => {
  const algorithmConfig = getAlgorithmConfig(algorithmId);
  if (!algorithmConfig) {
    return { valid: false, errors: ['Invalid algorithm ID'] };
  }

  const errors = [];
  const parameters = algorithmConfig.parameters;

  // Check required parameters
  Object.entries(parameters).forEach(([key, param]) => {
    if (param.required && (config[key] === null || config[key] === undefined || config[key] === '')) {
      errors.push(`${param.label} is required`);
    }

    // Validate number ranges
    if (param.type === 'number' && config[key] !== null && config[key] !== undefined) {
      if (param.min !== undefined && config[key] < param.min) {
        errors.push(`${param.label} must be at least ${param.min}`);
      }
      if (param.max !== undefined && config[key] > param.max) {
        errors.push(`${param.label} must be at most ${param.max}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// Helper function to populate dynamic options (node labels, relationship types)
export const populateDynamicOptions = (algorithmId, graphData) => {
  const config = getAlgorithmConfig(algorithmId);
  if (!config) return config;

  const updatedConfig = JSON.parse(JSON.stringify(config)); // Deep clone

  // Extract unique node labels
  const nodeLabels = [...new Set(
    graphData.nodes.flatMap(node => node.labels)
  )].map(label => ({
    value: label,
    label: label
  }));

  // Extract unique relationship types
  const relationshipTypes = [...new Set(
    graphData.relationships.map(rel => rel.type)
  )].map(type => ({
    value: type,
    label: type
  }));

  // Update options for node and relationship filters
  Object.keys(updatedConfig.parameters).forEach(key => {
    const param = updatedConfig.parameters[key];
    if (param.type === 'multiselect' && key === 'nodeFilter') {
      param.options = nodeLabels;
    }
    if (param.type === 'multiselect' && key === 'relationshipFilter') {
      param.options = relationshipTypes;
    }
  });

  return updatedConfig;
};

// Helper function to format algorithm results for display
export const formatAlgorithmResults = (algorithmId, results) => {
  const config = getAlgorithmConfig(algorithmId);
  if (!config) return results;

  switch (config.outputSchema.type) {
    case 'similarity-pairs':
      return results.map(result => ({
        ...result,
        formattedScore: (result.score * 100).toFixed(2) + '%'
      }));

    case 'path':
      return results.map(result => ({
        ...result,
        formattedCost: result.totalCost ? result.totalCost.toFixed(2) : 'N/A',
        pathDescription: `${result.pathLength} hops`
      }));

    default:
      return results;
  }
};
