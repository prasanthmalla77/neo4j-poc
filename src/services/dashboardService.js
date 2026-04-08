// Dashboard Service Layer
// Manages algorithm execution history and dashboard data

const STORAGE_KEY = 'neo4j_gds_execution_history';

/**
 * Get execution history from localStorage
 * @returns {Array} Array of execution records
 */
export const getExecutionHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Dashboard Service] Error reading history:', error);
    return [];
  }
};

/**
 * Save algorithm execution to history
 * @param {Object} execution - Execution record
 * @returns {Object} Saved execution with ID
 */
export const saveExecution = (execution) => {
  try {
    const history = getExecutionHistory();

    const record = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...execution
    };

    history.push(record);

    // Keep only last 50 executions
    const trimmed = history.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

    console.log('[Dashboard Service] Saved execution:', record.id);
    return record;
  } catch (error) {
    console.error('[Dashboard Service] Error saving execution:', error);
    return execution;
  }
};

/**
 * Clear execution history
 * @returns {Boolean} Success status
 */
export const clearExecutionHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Dashboard Service] Cleared execution history');
    return true;
  } catch (error) {
    console.error('[Dashboard Service] Error clearing history:', error);
    return false;
  }
};

/**
 * Get dashboard metrics from execution history
 * @returns {Object} Dashboard metrics
 */
export const getDashboardMetrics = () => {
  const history = getExecutionHistory();

  if (history.length === 0) {
    return {
      totalExecutions: 0,
      averageExecutionTime: 0,
      lastExecutionTime: null,
      algorithmBreakdown: {},
      recentExecutions: []
    };
  }

  // Calculate metrics
  const totalExecutions = history.length;
  const totalTime = history.reduce((sum, exec) => sum + (exec.executionTime || 0), 0);
  const averageExecutionTime = totalTime / totalExecutions;
  const lastExecutionTime = history[history.length - 1]?.timestamp;

  // Algorithm breakdown
  const algorithmBreakdown = history.reduce((acc, exec) => {
    const algo = exec.algorithmType;
    if (!acc[algo]) {
      acc[algo] = { count: 0, totalTime: 0 };
    }
    acc[algo].count++;
    acc[algo].totalTime += exec.executionTime || 0;
    return acc;
  }, {});

  // Recent executions (last 10)
  const recentExecutions = history.slice(-10).reverse();

  return {
    totalExecutions,
    averageExecutionTime: Math.round(averageExecutionTime),
    lastExecutionTime,
    algorithmBreakdown,
    recentExecutions
  };
};

/**
 * Get similarity score distribution for charts
 * @param {Array} similarityResults - Results from Node Similarity algorithm
 * @returns {Array} Distribution data for charts
 */
export const getSimilarityDistribution = (similarityResults) => {
  if (!similarityResults || similarityResults.length === 0) {
    return [];
  }

  // Create buckets: 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
  const buckets = [
    { range: '0-20%', min: 0, max: 0.2, count: 0 },
    { range: '20-40%', min: 0.2, max: 0.4, count: 0 },
    { range: '40-60%', min: 0.4, max: 0.6, count: 0 },
    { range: '60-80%', min: 0.6, max: 0.8, count: 0 },
    { range: '80-100%', min: 0.8, max: 1.0, count: 0 }
  ];

  similarityResults.forEach(result => {
    const score = result.score;
    const bucket = buckets.find(b => score >= b.min && score < b.max) || buckets[buckets.length - 1];
    bucket.count++;
  });

  return buckets.map(b => ({
    name: b.range,
    count: b.count
  }));
};

/**
 * Get top similar pairs for display
 * @param {Array} similarityResults - Results from Node Similarity algorithm
 * @param {Number} limit - Number of top pairs to return
 * @returns {Array} Top pairs sorted by score
 */
export const getTopSimilarPairs = (similarityResults, limit = 10) => {
  if (!similarityResults || similarityResults.length === 0) {
    return [];
  }

  return similarityResults
    .slice(0, limit)
    .map(result => ({
      name: `${result.node1Data?.properties?.name || result.node1} - ${result.node2Data?.properties?.name || result.node2}`,
      score: Math.round(result.score * 100),
      fullData: result
    }));
};

/**
 * Get path length distribution for charts
 * @param {Array} pathResults - Results from Shortest Path algorithm executions
 * @returns {Array} Distribution data for charts
 */
export const getPathLengthDistribution = (pathResults) => {
  if (!pathResults || pathResults.length === 0) {
    return [];
  }

  const distribution = {};

  pathResults.forEach(result => {
    const length = result.pathLength;
    if (!distribution[length]) {
      distribution[length] = 0;
    }
    distribution[length]++;
  });

  return Object.entries(distribution)
    .map(([length, count]) => ({
      name: `${length} hops`,
      count
    }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));
};

/**
 * Get execution timeline data for line chart
 * @param {Number} limit - Number of recent executions to show
 * @returns {Array} Timeline data points
 */
export const getExecutionTimeline = (limit = 20) => {
  const history = getExecutionHistory();

  return history
    .slice(-limit)
    .map((exec, index) => ({
      execution: index + 1,
      time: exec.executionTime || 0,
      algorithm: exec.algorithmType === 'nodeSimilarity' ? 'Similarity' : 'Shortest Path',
      timestamp: new Date(exec.timestamp).toLocaleTimeString()
    }));
};

/**
 * Get algorithm comparison data
 * @returns {Array} Comparison data for bar chart
 */
export const getAlgorithmComparison = () => {
  const metrics = getDashboardMetrics();
  const { algorithmBreakdown } = metrics;

  return Object.entries(algorithmBreakdown).map(([algo, data]) => ({
    name: algo === 'nodeSimilarity' ? 'Node Similarity' : 'Shortest Path',
    executions: data.count,
    avgTime: Math.round(data.totalTime / data.count)
  }));
};

/**
 * Export dashboard data as JSON
 * @returns {Object} Complete dashboard data
 */
export const exportDashboardData = () => {
  const metrics = getDashboardMetrics();
  const history = getExecutionHistory();

  return {
    exportedAt: new Date().toISOString(),
    metrics,
    executionHistory: history,
    summary: {
      totalExecutions: metrics.totalExecutions,
      algorithms: Object.keys(metrics.algorithmBreakdown)
    }
  };
};

/**
 * Get stats cards data
 * @param {Object} currentResults - Current algorithm results
 * @returns {Array} Stats card data
 */
export const getStatsCards = (currentResults) => {
  const metrics = getDashboardMetrics();

  const cards = [
    {
      title: 'Total Executions',
      value: metrics.totalExecutions,
      icon: '🎯',
      color: '#0B6FCC'
    },
    {
      title: 'Avg Execution Time',
      value: `${metrics.averageExecutionTime}ms`,
      icon: '⚡',
      color: '#00897B'
    }
  ];

  if (currentResults) {
    if (currentResults.algorithmType === 'nodeSimilarity') {
      cards.push({
        title: 'Similar Pairs Found',
        value: currentResults.resultCount,
        icon: '🔗',
        color: '#FF6B6B'
      });

      if (currentResults.results.length > 0) {
        const avgScore = currentResults.results.reduce((sum, r) => sum + r.score, 0) / currentResults.results.length;
        cards.push({
          title: 'Avg Similarity',
          value: `${Math.round(avgScore * 100)}%`,
          icon: '📊',
          color: '#9C27B0'
        });
      }
    } else if (currentResults.algorithmType === 'shortestPath') {
      if (currentResults.results.length > 0) {
        const result = currentResults.results[0];
        cards.push({
          title: 'Path Length',
          value: `${result.pathLength} hops`,
          icon: '🛤️',
          color: '#4ECDC4'
        });

        if (result.totalCost) {
          cards.push({
            title: 'Total Cost',
            value: Math.round(result.totalCost),
            icon: '💰',
            color: '#FF9800'
          });
        }
      }
    }
  }

  return cards;
};

/**
 * Format data for export
 * @param {Object} data - Data to format
 * @param {String} format - 'json' or 'csv'
 * @returns {String} Formatted data
 */
export const formatExportData = (data, format = 'json') => {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else if (format === 'csv') {
    // Convert execution history to CSV
    if (!data.executionHistory || data.executionHistory.length === 0) {
      return 'No data available';
    }

    const headers = ['Timestamp', 'Algorithm', 'Execution Time (ms)', 'Result Count'];
    const rows = data.executionHistory.map(exec => [
      exec.timestamp,
      exec.algorithmType,
      exec.executionTime || 0,
      exec.resultCount || 0
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  return '';
};
