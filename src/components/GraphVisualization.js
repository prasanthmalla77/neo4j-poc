import React, { useRef, useState, useEffect } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import { mockJobResponse } from '../data/backendMockData';
import { fetchGraphData, testConnection } from '../services/neo4jService';
import { prepareGraphData, highlightSimilarNodes, highlightPath, resetHighlighting } from '../utils/graphHighlighting';
import { createGdsProjection, runNodeSimilarity, runShortestPath } from '../services/gdsService';
import { ALGORITHM_TYPES } from '../data/algorithmConfigs';
import AlgorithmPanel from './AlgorithmPanel';
import AlgorithmResults from './AlgorithmResults';
import './GraphVisualization.css';

// Toggle between mock and real Neo4j data
const USE_REAL_NEO4J = true; // Set to false to use mock data

const GraphVisualization = ({ externalJobData = null, externalGraphData = null }) => {
  const nvlRef = useRef(null);

  // State management
  const [jobData, setJobData] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], relationships: [] });
  const [gdsProjection, setGdsProjection] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [algorithmResults, setAlgorithmResults] = useState(null);
  const [error, setError] = useState(null);

  // Handle external data from chat query
  useEffect(() => {
    if (externalJobData && externalGraphData) {
      console.log('[GraphViz] Received external data:', externalJobData);
      setJobData(externalJobData);
      const preparedData = prepareGraphData(externalJobData);
      console.log('[GraphViz] Prepared data:', preparedData);
      setGraphData(preparedData);

      // Create GDS projection for external data
      createGdsProjection(
        externalJobData.jobId,
        externalJobData.nodes,
        externalJobData.relationships
      ).then(projection => {
        console.log('[GraphViz] GDS projection created:', projection);
        setGdsProjection(projection);
      }).catch(err => {
        console.error('[GraphViz] Failed to create GDS projection:', err);
        setError(err.message);
      });
    }
  }, [externalJobData, externalGraphData]);

  // Initialize job data and create GDS projection (only if no external data)
  useEffect(() => {
    if (externalJobData) return; // Skip if using external data

    const initializeJob = async () => {
      try {
        let job;

        if (USE_REAL_NEO4J) {
          console.log('[App] Using real Neo4j data');

          // Test connection first
          const connected = await testConnection();
          if (!connected) {
            throw new Error('Failed to connect to Neo4j. Please check your connection settings.');
          }

          // Fetch data from Neo4j
          job = await fetchGraphData('neo4j_job_001');
          console.log('[App] Fetched real Neo4j data:', job.nodes.length, 'nodes');
        } else {
          console.log('[App] Using mock data');
          job = mockJobResponse;
        }

        setJobData(job);

        // Prepare graph data for visualization
        const preparedData = prepareGraphData(job);
        setGraphData(preparedData);

        // Create GDS projection
        const projection = await createGdsProjection(
          job.jobId,
          job.nodes,
          job.relationships
        );
        setGdsProjection(projection);

        console.log('Job initialized:', job.jobId);
        console.log('GDS Projection created:', projection.name);
      } catch (err) {
        console.error('Failed to initialize job:', err);
        setError(err.message || 'Failed to initialize graph data');
      }
    };

    initializeJob();
  }, []);

  // NVL configuration options
  const nvlOptions = {
    layout: 'force',
    initialZoom: 1,
    minZoom: 0.1,
    maxZoom: 3,
    allowDynamicMinZoom: true,
    relationshipThreshold: 0.55,
    useWebGL: true,
  };

  // Mouse event callbacks for interactions
  const mouseEventCallbacks = {
    onNodeClick: (node) => {
      console.log('Node clicked:', node);
      const clickedNode = graphData.nodes.find(n => n.id === node.id);
      if (clickedNode) {
        setSelectedItem({
          type: 'node',
          data: clickedNode
        });
      }
    },
    onRelationshipClick: (rel) => {
      console.log('Relationship clicked:', rel);
      const clickedRel = graphData.relationships.find(r => r.id === rel.id);
      if (clickedRel) {
        setSelectedItem({
          type: 'relationship',
          data: clickedRel
        });
      }
    },
    onCanvasClick: () => {
      setSelectedItem(null);
    },
    onDrag: (nodes) => {
      console.log('Dragging nodes:', nodes);
    },
    onPan: (evt) => {
      console.log('Panning:', evt);
    },
    onZoom: (zoomLevel) => {
      console.log('Zoom level:', zoomLevel);
    }
  };

  // Handle algorithm execution
  const handleAlgorithmExecute = async (algorithmId, config) => {
    if (!gdsProjection) {
      setError('GDS projection not ready');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setAlgorithmResults(null);

    try {
      let results;

      if (algorithmId === ALGORITHM_TYPES.NODE_SIMILARITY) {
        results = await runNodeSimilarity(gdsProjection.name, config);
      } else if (algorithmId === ALGORITHM_TYPES.SHORTEST_PATH) {
        results = await runShortestPath(gdsProjection.name, config);
      } else {
        throw new Error(`Unknown algorithm: ${algorithmId}`);
      }

      setAlgorithmResults(results);
      console.log('Algorithm results:', results);
    } catch (err) {
      console.error('Algorithm execution failed:', err);
      setError(err.message || 'Algorithm execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle highlighting from results
  const handleHighlight = (data, type) => {
    if (type === 'similarity') {
      // Highlight similar nodes
      const highlighted = highlightSimilarNodes(data, graphData);
      setGraphData(highlighted);
    } else if (type === 'path') {
      // Highlight path
      const highlighted = highlightPath(data, graphData);
      setGraphData(highlighted);
    }
  };

  // Clear all highlights
  const handleClearHighlight = () => {
    const reset = resetHighlighting(graphData);
    setGraphData(reset);
  };

  // Export results
  const handleExport = (results, format) => {
    if (format === 'json') {
      const dataStr = JSON.stringify(results, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `algorithm-results-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      let csvContent = '';

      if (results.algorithmType === ALGORITHM_TYPES.NODE_SIMILARITY) {
        csvContent = 'Node 1,Node 2,Score\n';
        results.results.forEach(r => {
          csvContent += `${r.node1},${r.node2},${r.score}\n`;
        });
      } else if (results.algorithmType === ALGORITHM_TYPES.SHORTEST_PATH) {
        csvContent = 'Source,Target,Path Length,Total Cost,Path\n';
        results.results.forEach(r => {
          csvContent += `${r.sourceNode},${r.targetNode},${r.pathLength},${r.totalCost},"${r.pathDescription}"\n`;
        });
      }

      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `algorithm-results-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Generate dynamic legend from graph data
  const getLegendItems = () => {
    if (!graphData.nodes.length) return [];

    const labelMap = new Map();
    graphData.nodes.forEach(node => {
      const label = node.labels[0];
      if (!labelMap.has(label)) {
        labelMap.set(label, {
          label,
          color: node._originalColor || node.color,
          size: node._originalSize || node.size
        });
      }
    });

    return Array.from(labelMap.values());
  };

  if (error && !jobData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#D32F2F' }}>Error Loading Graph</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!jobData || !gdsProjection) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading Graph Data...</h2>
        <p>Initializing GDS projection for job...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Job Information Header */}
      <div className="job-header">
        <div className="job-info">
          <div>
            <h2 className="job-title">Job: {jobData.jobId}</h2>
            <span style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '4px 12px',
              background: USE_REAL_NEO4J ? '#4CAF50' : '#FF9800',
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {USE_REAL_NEO4J ? '🔗 Connected to Neo4j' : '📦 Mock Data'}
            </span>
          </div>
          <div className="job-stats">
            <span className="job-stat">
              <strong>{graphData.nodes.length}</strong> nodes
            </span>
            <span className="job-stat">
              <strong>{graphData.relationships.length}</strong> relationships
            </span>
            <span className="job-stat">
              GDS: <strong>{gdsProjection.name}</strong>
            </span>
          </div>
        </div>
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="graph-layout">
        {/* Left Side: Graph Visualization */}
        <div className="graph-view-container">
          <div
            className="neo4j-graph-container"
            style={{
              height: '600px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div className="nvl-container">
              <InteractiveNvlWrapper
                nodes={graphData.nodes}
                rels={graphData.relationships}
                nvlOptions={nvlOptions}
                ref={nvlRef}
                mouseEventCallbacks={mouseEventCallbacks}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="neo4j-legend">
            <h3 className="neo4j-legend-title">Graph Legend</h3>
            <div className="neo4j-legend-items">
              {getLegendItems().map(item => (
                <div key={item.label} className="neo4j-legend-item">
                  <div
                    className="neo4j-legend-circle"
                    style={{
                      width: `${item.size}px`,
                      height: `${item.size}px`,
                      backgroundColor: item.color
                    }}
                  ></div>
                  <span className="neo4j-legend-text">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Algorithm Panel and Results */}
        <div className="algorithm-container">
          <AlgorithmPanel
            availableAlgorithms={jobData.availableAlgorithms}
            graphData={jobData}
            onExecute={handleAlgorithmExecute}
            isExecuting={isExecuting}
          />

          {algorithmResults && (
            <AlgorithmResults
              results={algorithmResults}
              onHighlight={handleHighlight}
              onClearHighlight={handleClearHighlight}
              onExport={handleExport}
            />
          )}
        </div>
      </div>

      {/* Node/Relationship Details Panel (Bottom) */}
      {selectedItem && (
        <div className="details-panel">
          <div className="details-panel-header">
            <h3 className="details-panel-title">
              {selectedItem.type === 'node' ? 'Node Details' : 'Relationship Details'}
            </h3>
            <button onClick={() => setSelectedItem(null)} className="neo4j-close-button">
              ×
            </button>
          </div>

          <div className="details-panel-content">
            {selectedItem.type === 'node' ? (
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{selectedItem.data.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Labels:</span>
                  <span className="detail-value">{selectedItem.data.labels.join(', ')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedItem.data.caption}</span>
                </div>
                {selectedItem.data.properties && Object.entries(selectedItem.data.properties).map(([key, value]) => (
                  <div key={key} className="detail-item">
                    <span className="detail-label">{key}:</span>
                    <span className="detail-value">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{selectedItem.data.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedItem.data.caption}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">From:</span>
                  <span className="detail-value">{selectedItem.data.from}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">To:</span>
                  <span className="detail-value">{selectedItem.data.to}</span>
                </div>
                {selectedItem.data.properties && Object.entries(selectedItem.data.properties).map(([key, value]) => (
                  <div key={key} className="detail-item">
                    <span className="detail-label">{key}:</span>
                    <span className="detail-value">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphVisualization;
