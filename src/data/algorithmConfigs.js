// Algorithm configuration schemas for Neo4j GDS algorithms
// Defines available parameters and defaults for each algorithm

export const ALGORITHM_TYPES = {
  NODE_SIMILARITY: 'nodeSimilarity',
  SHORTEST_PATH: 'shortestPath',
  BETWEENNESS: 'betweenness'
};

// Node Similarity Algorithm Configuration
export const nodeSimilarityConfig = {
  id: 'nodeSimilarity',
  name: 'Node Similarity',
  description: 'Computes similarity between nodes in the graph',
  category: 'similarity',

  // Configuration parameters
  parameters: {
    similarityMode: {
      label: 'Similarity Mode',
      type: 'select',
      required: true,
      default: 'neighbours',
      options: [
        {
          value: 'neighbours',
          label: 'Similar Neighbours',
          description: 'Finds nodes that share the most common connections (Jaccard on shared neighbors)'
        },
        {
          value: 'properties',
          label: 'Similar Properties',
          description: 'Finds nodes whose property feature vectors point in the same direction (Cosine similarity)'
        }
      ],
      helpText: 'Choose how similarity is measured between nodes'
    },

    targetNodeLabel: {
      label: 'Node Label to Compare',
      type: 'select',
      required: true,
      default: '',
      options: [], // Populated dynamically from graph
      helpText: 'Only nodes with this label will be compared'
    },

    targetProperties: {
      label: 'Properties to Consider',
      type: 'multiselect',
      required: false,
      default: [],
      options: [], // Populated dynamically based on selected targetNodeLabel
      helpText: 'Which node properties to match (leave empty = use all)',
      showWhen: { similarityMode: 'properties' }
    },

    similarityThreshold: {
      label: 'Similarity Cutoff',
      type: 'number',
      required: true,
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      helpText: 'Minimum similarity score (0–1) to include in results'
    },

    degreeCutoff: {
      label: 'Degree Cutoff',
      type: 'number',
      required: false,
      default: 1,
      min: 1,
      helpText: 'Minimum number of relationships a node must have to be included',
      showWhen: { similarityMode: 'neighbours' }
    },

    relationshipFilter: {
      label: 'Relationship Types',
      type: 'multiselect',
      required: false,
      default: [],
      options: [], // Populated dynamically from graph
      helpText: 'Consider only these relationship types when comparing neighbours (leave empty for all)'
    }
  },

  // Default configuration
  defaultConfig: {
    similarityMode: 'neighbours',
    targetNodeLabel: '',
    targetProperties: [],
    similarityThreshold: 0.5,
    degreeCutoff: 1,
    relationshipFilter: []
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
          value: 'yens',
          label: "Yen's K-Shortest Paths",
          description: 'Finds K alternative shortest paths'
        }
      ],
      helpText: 'The pathfinding algorithm to use'
    },

    weightProperty: {
      label: 'Weight Property',
      type: 'select',
      required: false,
      default: '',
      options: [], // Populated dynamically from selected relationship types
      helpText: 'Relationship property to use as edge weight — leave empty for unweighted (shortest by hops)'
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

// Betweenness Centrality Algorithm Configuration
export const betweennessConfig = {
  id: 'betweenness',
  name: 'Betweenness Centrality',
  description: 'Counts how many shortest paths between all node pairs pass through each node — identifies single points of failure',
  category: 'centrality',

  parameters: {
    normalized: {
      label: 'Normalise Scores',
      type: 'select',
      required: true,
      default: 'true',
      options: [
        {
          value: 'true',
          label: 'Yes — scale to 0–1',
          description: 'Divides each score by (n−1)(n−2)/2, making results comparable across different graph sizes'
        }
      ],
      helpText: 'Normalised scores allow comparison across different graph sizes'
    },

    samplingRatio: {
      label: 'Sampling Ratio',
      type: 'number',
      required: false,
      default: 1.0,
      min: 0.01,
      max: 1.0,
      step: 0.01,
      helpText: 'Fraction of nodes used as sources when calling Neo4j GDS (1.0 = exact). Ignored when running in-memory.'
    }
  },

  defaultConfig: {
    normalized: 'true',
    samplingRatio: 1.0
  },

  outputSchema: {
    type: 'centrality-scores',
    fields: ['nodeId', 'score', 'rank']
  }
};

// Map of all algorithm configurations
export const algorithmConfigs = {
  [ALGORITHM_TYPES.NODE_SIMILARITY]: nodeSimilarityConfig,
  [ALGORITHM_TYPES.SHORTEST_PATH]: shortestPathConfig,
  [ALGORITHM_TYPES.BETWEENNESS]: betweennessConfig
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

// Helper function to populate dynamic options (node labels, relationship types, per-label properties)
// currentConfig is optional — used to derive property options for the currently selected node label
export const populateDynamicOptions = (algorithmId, graphData, currentConfig = {}) => {
  const config = getAlgorithmConfig(algorithmId);
  if (!config) return config;

  const updatedConfig = JSON.parse(JSON.stringify(config)); // Deep clone

  // Extract unique node labels
  const nodeLabels = [...new Set(
    graphData.nodes.flatMap(node => node.labels)
  )].map(label => ({ value: label, label }));

  // Extract unique relationship types
  const relationshipTypes = [...new Set(
    graphData.relationships.map(rel => rel.type)
  )].map(type => ({ value: type, label: type }));

  // Build per-label property map: label -> sorted list of property keys
  const labelPropertyMap = {};
  graphData.nodes.forEach(node => {
    (node.labels || []).forEach(lbl => {
      if (!labelPropertyMap[lbl]) labelPropertyMap[lbl] = new Set();
      Object.keys(node.properties || {}).forEach(k => labelPropertyMap[lbl].add(k));
    });
  });

  Object.keys(updatedConfig.parameters).forEach(key => {
    const param = updatedConfig.parameters[key];
    if (key === 'targetNodeLabel') {
      param.options = nodeLabels;
    }
    if (key === 'targetProperties') {
      // Derive property options from the currently selected label
      const selectedLabel = currentConfig.targetNodeLabel || '';
      const propKeys = selectedLabel && labelPropertyMap[selectedLabel]
        ? [...labelPropertyMap[selectedLabel]].sort()
        : [...new Set(graphData.nodes.flatMap(n => Object.keys(n.properties || {})))].sort();
      param.options = propKeys.map(k => ({ value: k, label: k }));
    }
    if (param.type === 'multiselect' && key === 'nodeFilter') {
      param.options = nodeLabels;
    }
    if (param.type === 'multiselect' && key === 'relationshipFilter') {
      param.options = relationshipTypes;
    }
    if (key === 'weightProperty' && param.type === 'select') {
      const selectedRelTypes = currentConfig.relationshipFilter || [];
      const activeRels = selectedRelTypes.length > 0
        ? graphData.relationships.filter(r => selectedRelTypes.includes(r.type))
        : graphData.relationships;
      const relPropKeys = [...new Set(
        activeRels.flatMap(r => Object.keys(r.properties || {}))
      )].sort();
      param.options = [
        { value: '', label: '— None (shortest by hops) —' },
        ...relPropKeys.map(k => ({ value: k, label: k })),
      ];
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
