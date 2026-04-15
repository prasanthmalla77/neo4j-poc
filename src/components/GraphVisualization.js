import React, { useRef, useState, useEffect, useMemo } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import { mockJobResponse } from '../data/backendMockData';
import { fetchGraphData, fetchFilteredGraphData, testConnection } from '../services/neo4jService';
import { prepareGraphData, getNodeColorByLabel } from '../utils/graphHighlighting';
import { createGdsProjection, registerProjection, runNodeSimilarity, runShortestPath } from '../services/gdsService';
import { ALGORITHM_TYPES } from '../data/algorithmConfigs';
import AlgorithmPanel from './AlgorithmPanel';
import AlgorithmResults from './AlgorithmResults';
import GraphConfigModal from './GraphConfigModal';

import './GraphVisualization.css';

// Toggle between mock and real Neo4j data
const USE_REAL_NEO4J = true; // Set to false to use mock data

const GraphVisualization = ({ externalJobData = null, externalGraphData = null }) => {
  const nvlRef = useRef(null);

  // State management
  const [jobData, setJobData] = useState(null);
  const [fullGraphData, setFullGraphData] = useState({ nodes: [], relationships: [] }); // Original full data
  const [graphData, setGraphData] = useState({ nodes: [], relationships: [] }); // Filtered data for display
  const [gdsProjection, setGdsProjection] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [algorithmResults, setAlgorithmResults] = useState(null);
  const [error, setError] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [graphConfig, setGraphConfig] = useState({ nodeLabels: [], relationshipTypes: [] });
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Handle external data from chat query
  useEffect(() => {
    if (externalJobData && externalGraphData) {
      console.log('[GraphViz] Received external data:', externalJobData);
      setJobData(externalJobData);
      const preparedData = prepareGraphData(externalJobData);
      console.log('[GraphViz] Prepared data:', preparedData);
      setFullGraphData(preparedData);
      setGraphData(preparedData);

      // GDS projection is created lazily on first algorithm execution
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
        setFullGraphData(preparedData);

        // Start with empty graph - user must configure what to load
        setGraphData({ nodes: [], relationships: [] });

        // GDS projection is created lazily on first algorithm execution
        console.log('Job initialized:', job.jobId);
      } catch (err) {
        console.error('Failed to initialize job:', err);
        setError(err.message || 'Failed to initialize graph data');
      }
    };

    initializeJob();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Handle graph configuration
  const handleApplyConfig = async (config) => {
    console.log('[GraphViz] Applying config:', config);
    setGraphConfig(config);

    // If no node labels selected, show nothing
    if (config.nodeLabels.length === 0) {
      setGraphData({ nodes: [], relationships: [] });
      console.log('[GraphViz] No node labels selected, showing empty graph');
      return;
    }

    try {
      setIsLoadingConfig(true);
      setError(null);

      // Check if we have external data from chat query
      if (externalJobData) {
        // Filter within the existing chat query result (in-memory filtering)
        console.log('[GraphViz] Filtering within chat query result (in-memory)...');

        const filteredNodes = fullGraphData.nodes.filter(node => {
          // Filter by node labels
          const hasMatchingLabel = node.labels && node.labels.some(label => config.nodeLabels.includes(label));

          // Filter by brand if brands are selected
          if (config.brands && config.brands.length > 0) {
            const hasMatchingBrand = config.brands.includes(node.properties?.brand);
            return hasMatchingLabel && hasMatchingBrand;
          }

          return hasMatchingLabel;
        });

        const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

        const filteredRelationships = fullGraphData.relationships.filter(rel => {
          const hasValidNodes = filteredNodeIds.has(rel.from) && filteredNodeIds.has(rel.to);
          if (config.relationshipTypes.length === 0) {
            return hasValidNodes; // Show all relationships if none selected
          }
          return rel.type && config.relationshipTypes.includes(rel.type) && hasValidNodes;
        });

        setGraphData({
          nodes: filteredNodes,
          relationships: filteredRelationships
        });

        console.log(`[GraphViz] Filtered in-memory: ${filteredNodes.length} nodes, ${filteredRelationships.length} relationships`);
      } else {
        // Fetch filtered data from Neo4j (for full graph view)
        console.log('[GraphViz] Fetching filtered data from Neo4j...');

        const filteredJob = await fetchFilteredGraphData(
          jobData?.jobId || 'neo4j_job_001',
          config.nodeLabels,
          config.relationshipTypes,
          config.brands || []
        );

        console.log('[GraphViz] Fetched filtered data:', filteredJob);

        // Prepare and set graph data
        const preparedData = prepareGraphData(filteredJob);
        setGraphData(preparedData);

        // Reset stale projection so it gets recreated on next algorithm run
        setGdsProjection(null);

        console.log(`[GraphViz] Applied config from Neo4j: ${filteredJob.nodes.length} nodes, ${filteredJob.relationships.length} relationships`);
      }
    } catch (err) {
      console.error('[GraphViz] Failed to apply configuration:', err);
      setError('Failed to load filtered graph data: ' + err.message);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Handle algorithm execution
  const handleAlgorithmExecute = async (algorithmId, config) => {
    console.log('[AlgoExec] ▶ START', { algorithmId, config });
    console.log('[AlgoExec] Current graphData:', {
      nodeCount: graphData.nodes.length,
      relCount: graphData.relationships.length,
      sampleNode: graphData.nodes[0],
      sampleRel: graphData.relationships[0],
    });

    setIsExecuting(true);
    setError(null);
    // Don't clear previous results during execution — clearing causes the results
    // panel to unmount, shifts the container width, and NVL re-runs force layout.

    try {
      // Lazily create (or recreate) the GDS projection using current graph data
      const currentNodes = graphData.nodes.map(n => ({
        id: n.id,
        labels: n.labels || [],
        properties: n.properties || {},
      }));
      const currentRels = graphData.relationships.map(r => ({
        id: r.id,
        type: r.type || r.caption,
        startNode: r.from,
        endNode: r.to,
        properties: r.properties || {},
      }));

      console.log('[AlgoExec] Mapped nodes for projection:', currentNodes.length, 'sample:', currentNodes[0]);
      console.log('[AlgoExec] Mapped rels for projection:', currentRels.length, 'sample:', currentRels[0]);

      const jobId = jobData?.jobId || externalJobData?.jobId || 'neo4j_job_001';

      let projection;
      if (algorithmId === ALGORITHM_TYPES.NODE_SIMILARITY) {
        // Node similarity runs entirely in JS — no GDS projection needed.
        // Optionally narrow which relationship types feed into neighbour comparison.
        let projRels = currentRels;
        if (config.relationshipFilter?.length > 0) {
          projRels = currentRels.filter(r => config.relationshipFilter.includes(r.type || r.caption));
        }
        projection = registerProjection(jobId, currentNodes, projRels);
      } else {
        // Shortest path still uses GDS on Neo4j.
        projection = await createGdsProjection(jobId, currentNodes, currentRels);
      }
      console.log('[AlgoExec] Projection ready:', projection);
      setGdsProjection(projection);

      let results;
      if (algorithmId === ALGORITHM_TYPES.NODE_SIMILARITY) {
        console.log('[AlgoExec] Running Node Similarity on projection:', projection.name);
        results = await runNodeSimilarity(projection.name, config);
      } else if (algorithmId === ALGORITHM_TYPES.SHORTEST_PATH) {
        console.log('[AlgoExec] Running Shortest Path on projection:', projection.name);
        results = await runShortestPath(projection.name, config);
      } else {
        throw new Error(`Unknown algorithm: ${algorithmId}`);
      }

      console.log('[AlgoExec] ✅ Results received:', {
        algorithmType: results.algorithmType,
        resultCount: results.resultCount,
        stats: results.stats,
        firstResult: results.results?.[0],
      });
      setAlgorithmResults(results);
    } catch (err) {
      console.error('[AlgoExec] ❌ FAILED:', err);
      console.error('[AlgoExec] Error stack:', err.stack);
      setError(err.message || 'Algorithm execution failed');
    } finally {
      setIsExecuting(false);
      console.log('[AlgoExec] ▶ END');
    }
  };

  // Handle highlighting from results — update NVL directly via ref (prop changes
  // to existing nodes do not trigger a visual update in NVL v1.x).
  const handleHighlight = (data, type) => {
    if (!nvlRef.current) return;

    if (type === 'similarity') {
      const highlightSet = new Set(data); // [node1Id, node2Id]
      nvlRef.current.updateElementsInGraph(
        graphData.nodes.map(n => ({
          id: n.id,
          color: highlightSet.has(n.id) ? '#FF6B6B' : getNodeColorByLabel(n.labels?.[0]),
          size: highlightSet.has(n.id) ? 38 : 25,
        })),
        graphData.relationships.map(r => ({
          id: r.id,
          color: (highlightSet.has(r.from) && highlightSet.has(r.to)) ? '#FF8C8C' : undefined,
          width: (highlightSet.has(r.from) && highlightSet.has(r.to)) ? 3 : 1,
        }))
      );
    } else if (type === 'path') {
      // data is a pathResult object with .nodeIds and .relationshipIds
      const pathNodeIds = new Set(data.nodeIds || []);
      const pathRelIds  = new Set(data.relationshipIds || []);
      const gradient    = ['#4ECDC4', '#44A08D', '#45B7B8', '#37A08A'];
      const pathLen     = Math.max((data.nodeIds?.length || 1) - 1, 1);

      nvlRef.current.updateElementsInGraph(
        graphData.nodes.map(n => {
          if (pathNodeIds.has(n.id)) {
            const idx = (data.nodeIds || []).indexOf(n.id);
            const colorIdx = Math.floor((idx / pathLen) * (gradient.length - 1));
            return { id: n.id, color: gradient[colorIdx] || '#4ECDC4', size: 38 };
          }
          return { id: n.id, color: getNodeColorByLabel(n.labels?.[0]), size: 25 };
        }),
        graphData.relationships.map(r => ({
          id: r.id,
          color: pathRelIds.has(r.id) ? '#95E1D3' : undefined,
          width: pathRelIds.has(r.id) ? 4 : 1,
        }))
      );
    }
  };

  // Clear all highlights — restore original label-based colors via nvlRef.
  const handleClearHighlight = () => {
    if (!nvlRef.current) return;
    nvlRef.current.updateElementsInGraph(
      graphData.nodes.map(n => ({
        id: n.id,
        color: getNodeColorByLabel(n.labels?.[0]),
        size: 25,
      })),
      graphData.relationships.map(r => ({ id: r.id, color: undefined, width: 1 }))
    );
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

  // Stable graphData prop for AlgorithmPanel — avoids re-creating the object on
  // every render which would trigger the AlgorithmPanel useEffect and reset the form.
  const algoGraphData = useMemo(() => ({
    ...jobData,
    nodes: graphData.nodes.map(node => ({
      id: node.id,
      labels: node.labels,
      properties: node.properties
    })),
    relationships: graphData.relationships.map(rel => ({
      id: rel.id,
      type: rel.type,
      startNode: rel.from,
      endNode: rel.to,
      properties: rel.properties
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [graphData.nodes, graphData.relationships, jobData]);

  if (error && !jobData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#D32F2F' }}>Error Loading Graph</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading Graph Data...</h2>
        <p>Connecting to Neo4j...</p>
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
            {gdsProjection && (
              <span className="job-stat">
                GDS: <strong>{gdsProjection.name}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Configuration Tip and Button */}
        <div style={{
          marginTop: '12px',
          padding: '10px 16px',
          background: graphData.nodes.length === 0 ? '#FFF3E0' : '#E3F2FD',
          border: graphData.nodes.length === 0 ? '1px solid #FF9800' : '1px solid #2196F3',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '13px',
          color: graphData.nodes.length === 0 ? '#E65100' : '#1976D2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ fontSize: '16px' }}>{graphData.nodes.length === 0 ? '⚠️' : '💡'}</span>
            <span>
              <strong>{graphData.nodes.length === 0 ? 'Action Required:' : 'Tip:'}</strong> {graphData.nodes.length === 0 ? 'Click "Configure Graph" to select brands, nodes, and relationships to display.' : 'You can reconfigure the graph by selecting different nodes and relationships.'}
            </span>
          </div>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            style={{
              padding: '8px 16px',
              background: graphData.nodes.length === 0 ? '#FF9800' : '#1976D2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              animation: graphData.nodes.length === 0 ? 'pulse 2s infinite' : 'none'
            }}
            onMouseEnter={(e) => e.target.style.background = graphData.nodes.length === 0 ? '#F57C00' : '#1565C0'}
            onMouseLeave={(e) => e.target.style.background = graphData.nodes.length === 0 ? '#FF9800' : '#1976D2'}
          >
            ⚙️ Configure Graph
          </button>
        </div>

        {/* Loading Configuration Indicator */}
        {isLoadingConfig && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            background: '#FFF3E0',
            border: '1px solid #FF9800',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            color: '#E65100'
          }}>
            <div className="spinner" style={{
              width: '20px',
              height: '20px',
              border: '3px solid #FFE0B2',
              borderTop: '3px solid #FF9800',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Loading filtered graph data from Neo4j...</span>
          </div>
        )}

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
            graphData={algoGraphData}
            onExecute={handleAlgorithmExecute}
            isExecuting={isExecuting}
          />

          {algorithmResults && (
            <AlgorithmResults
              key={algorithmResults.executedAt}
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

      {/* Graph Configuration Modal */}
      <GraphConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        allNodes={fullGraphData.nodes}
        allRelationships={fullGraphData.relationships}
        onApplyConfig={handleApplyConfig}
      />

    </div>
  );
};

export default GraphVisualization;
