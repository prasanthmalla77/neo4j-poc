// Graph Highlighting Utilities
// Functions to highlight nodes and relationships based on algorithm results

/**
 * Color schemes for different highlight types
 */
const HIGHLIGHT_COLORS = {
  similarity: {
    primary: '#FF6B6B',
    secondary: '#FFA07A',
    relationship: '#FF8C8C'
  },
  path: {
    primary: '#4ECDC4',
    secondary: '#45B7B8',
    relationship: '#95E1D3',
    gradient: ['#4ECDC4', '#44A08D', '#45B7B8', '#37A08A']
  },
  default: {
    node: '#757575',
    relationship: '#BDBDBD'
  }
};

/**
 * Convert backend node format to NVL format
 * @param {Object} node - Node from backend
 * @returns {Object} NVL-formatted node
 */
export const convertToNvlNode = (node) => {
  return {
    id: node.id,
    size: 25,
    color: getNodeColorByLabel(node.labels[0]),
    caption: node.properties?.name || node.id,
    labels: node.labels,
    properties: node.properties
  };
};

/**
 * Convert backend relationship format to NVL format
 * @param {Object} relationship - Relationship from backend
 * @returns {Object} NVL-formatted relationship
 */
export const convertToNvlRelationship = (relationship) => {
  return {
    id: relationship.id,
    from: relationship.startNode,
    to: relationship.endNode,
    caption: relationship.type,
    type: relationship.type,
    properties: relationship.properties
  };
};

/**
 * Get default color for a node label
 * @param {string} label - Node label
 * @returns {string} Hex color
 */
export const getNodeColorByLabel = (label) => {
  const colorMap = {
    'Person': '#4CAF50',
    'Company': '#2196F3',
    'Project': '#FF9800',
    'Skill': '#9C27B0',
    'City': '#00BCD4',
    'Country': '#795548'
  };
  return colorMap[label] || '#757575';
};

/**
 * Highlight similar nodes from Node Similarity results
 * @param {Array} nodeIds - Array of node IDs to highlight
 * @param {Object} graphData - Current graph data with nodes and relationships
 * @returns {Object} Modified graph data with highlighting
 */
export const highlightSimilarNodes = (nodeIds, graphData) => {
  const highlightSet = new Set(nodeIds);

  const highlightedNodes = graphData.nodes.map(node => {
    if (highlightSet.has(node.id)) {
      return {
        ...node,
        color: HIGHLIGHT_COLORS.similarity.primary,
        size: node.size * 1.5, // Increase size by 50%
        _highlighted: true
      };
    }
    return {
      ...node,
      color: node._originalColor || node.color,
      size: node._originalSize || node.size,
      _highlighted: false
    };
  });

  // Find relationships between highlighted nodes
  const highlightedRelationships = graphData.relationships.map(rel => {
    const isConnected = highlightSet.has(rel.from) && highlightSet.has(rel.to);
    if (isConnected) {
      return {
        ...rel,
        color: HIGHLIGHT_COLORS.similarity.relationship,
        width: 3,
        _highlighted: true
      };
    }
    return {
      ...rel,
      color: rel._originalColor || undefined,
      width: rel._originalWidth || undefined,
      _highlighted: false
    };
  });

  return {
    nodes: highlightedNodes,
    relationships: highlightedRelationships
  };
};

/**
 * Highlight a path from Shortest Path results
 * @param {Object} pathResult - Path result from algorithm
 * @param {Object} graphData - Current graph data
 * @returns {Object} Modified graph data with path highlighting
 */
export const highlightPath = (pathResult, graphData) => {
  const pathNodeIds = new Set(pathResult.nodeIds);
  const pathRelIds = new Set(pathResult.relationshipIds);

  // Create gradient colors for path nodes
  const pathLength = pathResult.nodeIds.length;
  const gradient = HIGHLIGHT_COLORS.path.gradient;

  const highlightedNodes = graphData.nodes.map(node => {
    if (pathNodeIds.has(node.id)) {
      const pathIndex = pathResult.nodeIds.indexOf(node.id);
      const colorIndex = Math.floor((pathIndex / (pathLength - 1)) * (gradient.length - 1));

      return {
        ...node,
        color: gradient[colorIndex] || HIGHLIGHT_COLORS.path.primary,
        size: node.size * 1.8, // Increase size significantly for path nodes
        _highlighted: true,
        _pathIndex: pathIndex
      };
    }
    return {
      ...node,
      color: node._originalColor || node.color,
      size: node._originalSize || node.size,
      _highlighted: false
    };
  });

  const highlightedRelationships = graphData.relationships.map(rel => {
    if (pathRelIds.has(rel.id)) {
      return {
        ...rel,
        color: HIGHLIGHT_COLORS.path.relationship,
        width: 4,
        _highlighted: true
      };
    }
    return {
      ...rel,
      color: rel._originalColor || undefined,
      width: rel._originalWidth || undefined,
      _highlighted: false
    };
  });

  return {
    nodes: highlightedNodes,
    relationships: highlightedRelationships
  };
};

/**
 * Reset all highlighting to original state
 * @param {Object} graphData - Current graph data
 * @returns {Object} Graph data with original colors and sizes
 */
export const resetHighlighting = (graphData) => {
  const resetNodes = graphData.nodes.map(node => ({
    ...node,
    color: node._originalColor || getNodeColorByLabel(node.labels[0]),
    size: node._originalSize || 25,
    _highlighted: false
  }));

  const resetRelationships = graphData.relationships.map(rel => ({
    ...rel,
    color: rel._originalColor || undefined,
    width: rel._originalWidth || undefined,
    _highlighted: false
  }));

  return {
    nodes: resetNodes,
    relationships: resetRelationships
  };
};

/**
 * Store original colors and sizes before first highlight
 * @param {Object} graphData - Graph data
 * @returns {Object} Graph data with stored original values
 */
export const storeOriginalStyles = (graphData) => {
  const nodesWithOriginals = graphData.nodes.map(node => ({
    ...node,
    _originalColor: node._originalColor || node.color,
    _originalSize: node._originalSize || node.size
  }));

  const relationshipsWithOriginals = graphData.relationships.map(rel => ({
    ...rel,
    _originalColor: rel._originalColor || rel.color,
    _originalWidth: rel._originalWidth || rel.width
  }));

  return {
    nodes: nodesWithOriginals,
    relationships: relationshipsWithOriginals
  };
};

/**
 * Prepare graph data for visualization (convert backend format to NVL format)
 * @param {Object} backendData - Data from backend API
 * @returns {Object} NVL-formatted graph data
 */
export const prepareGraphData = (backendData) => {
  const nodes = backendData.nodes.map(convertToNvlNode);
  const relationships = backendData.relationships.map(convertToNvlRelationship);

  return storeOriginalStyles({ nodes, relationships });
};

/**
 * Get highlight color scheme for algorithm type
 * @param {string} algorithmType - Type of algorithm
 * @returns {Object} Color scheme
 */
export const getHighlightColors = (algorithmType) => {
  return HIGHLIGHT_COLORS[algorithmType] || HIGHLIGHT_COLORS.default;
};

/**
 * Apply multiple highlights (useful for showing multiple similar pairs)
 * @param {Array} highlightGroups - Array of node ID arrays
 * @param {Object} graphData - Current graph data
 * @returns {Object} Modified graph data
 */
export const highlightMultipleGroups = (highlightGroups, graphData) => {
  const allHighlightedNodes = new Set();
  highlightGroups.forEach(group => {
    group.forEach(nodeId => allHighlightedNodes.add(nodeId));
  });

  return highlightSimilarNodes(Array.from(allHighlightedNodes), graphData);
};

/**
 * Dim non-highlighted elements (alternative to complete reset)
 * @param {Set} highlightedIds - Set of IDs to keep bright
 * @param {Object} graphData - Current graph data
 * @returns {Object} Modified graph data
 */
export const dimNonHighlighted = (highlightedIds, graphData) => {
  const highlightSet = new Set(highlightedIds);

  const modifiedNodes = graphData.nodes.map(node => {
    if (!highlightSet.has(node.id) && !node._highlighted) {
      return {
        ...node,
        color: HIGHLIGHT_COLORS.default.node,
        size: node.size * 0.8
      };
    }
    return node;
  });

  const modifiedRelationships = graphData.relationships.map(rel => {
    if (!rel._highlighted) {
      return {
        ...rel,
        color: HIGHLIGHT_COLORS.default.relationship,
        width: 1
      };
    }
    return rel;
  });

  return {
    nodes: modifiedNodes,
    relationships: modifiedRelationships
  };
};

/**
 * Export highlighted graph data for analysis
 * @param {Object} graphData - Current graph data with highlights
 * @returns {Object} Filtered data with only highlighted elements
 */
export const exportHighlightedData = (graphData) => {
  const highlightedNodes = graphData.nodes.filter(node => node._highlighted);
  const highlightedRels = graphData.relationships.filter(rel => rel._highlighted);

  return {
    nodes: highlightedNodes,
    relationships: highlightedRels,
    summary: {
      nodeCount: highlightedNodes.length,
      relationshipCount: highlightedRels.length
    }
  };
};
