import React, { useRef, useState, useEffect, useMemo } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import { mockJobResponse } from '../data/backendMockData';
import { fetchGraphData, fetchFilteredGraphData, testConnection } from '../services/neo4jService';
import { prepareGraphData, getNodeColorByLabel } from '../utils/graphHighlighting';
import { createGdsProjection, registerProjection, runNodeSimilarity, runShortestPath, runBetweenness } from '../services/gdsService';
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

    const hasNodes = config.nodeLabels.length > 0;
    const hasRels  = config.relationshipTypes.length > 0;

    // If nothing selected, show empty graph
    if (!hasNodes && !hasRels) {
      setGraphData({ nodes: [], relationships: [] });
      console.log('[GraphViz] Nothing selected, showing empty graph');
      return;
    }

    try {
      setIsLoadingConfig(true);
      setError(null);

      if (externalJobData) {
        // ── In-memory filtering (chat query result) ─────────────────────────
        console.log('[GraphViz] Filtering within chat query result (in-memory)...');

        let filteredNodes;
        let filteredRelationships;

        if (hasRels && !hasNodes) {
          // Case 1: Only relationships selected → keep all nodes touched by those rels
          const matchingRels = fullGraphData.relationships.filter(rel =>
            rel.type && config.relationshipTypes.includes(rel.type)
          );
          const touchedIds = new Set(matchingRels.flatMap(r => [r.from, r.to]));
          filteredNodes = fullGraphData.nodes.filter(n => touchedIds.has(n.id));
          filteredRelationships = matchingRels;
        } else {
          // Case 2 (nodes + rels) or Case 3 (only nodes): filter by label first
          filteredNodes = fullGraphData.nodes.filter(node => {
            const hasLabel = node.labels && node.labels.some(l => config.nodeLabels.includes(l));
            if (config.brands?.length > 0) {
              return hasLabel && config.brands.includes(node.properties?.brand);
            }
            return hasLabel;
          });

          const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
          filteredRelationships = fullGraphData.relationships.filter(rel => {
            const validNodes = filteredNodeIds.has(rel.from) && filteredNodeIds.has(rel.to);
            if (!hasRels) return validNodes; // no rel filter → all rels between selected nodes
            return rel.type && config.relationshipTypes.includes(rel.type) && validNodes;
          });
        }

        // Apply brand filter on nodes regardless of case
        if (config.brands?.length > 0) {
          filteredNodes = filteredNodes.filter(n => config.brands.includes(n.properties?.brand));
          const ids = new Set(filteredNodes.map(n => n.id));
          filteredRelationships = filteredRelationships.filter(r => ids.has(r.from) && ids.has(r.to));
        }

        setGraphData({ nodes: filteredNodes, relationships: filteredRelationships });
        console.log(`[GraphViz] Filtered in-memory: ${filteredNodes.length} nodes, ${filteredRelationships.length} relationships`);

      } else {
        // ── Neo4j fetch ─────────────────────────────────────────────────────
        console.log('[GraphViz] Fetching filtered data from Neo4j...');

        // Pass the config as-is; fetchFilteredGraphData is updated to handle the three cases
        const filteredJob = await fetchFilteredGraphData(
          jobData?.jobId || 'neo4j_job_001',
          config.nodeLabels,
          config.relationshipTypes,
          config.brands || []
        );

        console.log('[GraphViz] Fetched filtered data:', filteredJob);
        const preparedData = prepareGraphData(filteredJob);
        setGraphData(preparedData);
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
    setAlgorithmResults(null); // Always clear before new run so stale results never linger

    try {
      // Lazily create (or recreate) the GDS projection using current graph data
      const currentNodes = graphData.nodes.map(n => ({
        id: n.id,
        caption: n.caption,
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
        // Shortest path and Betweenness use GDS on Neo4j (with JS fallback for Betweenness).
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
      } else if (algorithmId === ALGORITHM_TYPES.BETWEENNESS) {
        console.log('[AlgoExec] Running Betweenness Centrality on projection:', projection.name);
        results = await runBetweenness(projection.name, config);
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
      setAlgorithmResults(null);
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
      // data is the full result object with node1, node2, and detail.shared/onlyIn1/onlyIn2
      const node1Id = String(data.node1);
      const node2Id = String(data.node2);

      // Build ID sets — coerce all IDs to string for consistent comparison
      const toIdSet = (arr) => new Set((arr || []).map(n => String(n.id)));

      const sharedIds    = toIdSet(data.detail?.shared);
      const onlyIn1Ids   = toIdSet(data.detail?.onlyIn1);
      const onlyIn2Ids   = toIdSet(data.detail?.onlyIn2);

      // Exclude the two compared nodes from non-common sets (they get orange instead)
      [node1Id, node2Id].forEach(id => {
        sharedIds.delete(id); onlyIn1Ids.delete(id); onlyIn2Ids.delete(id);
      });

      const nonCommonIds   = new Set([...onlyIn1Ids, ...onlyIn2Ids]);
      const comparedIds    = new Set([node1Id, node2Id]);
      const allHighlighted = new Set([...comparedIds, ...sharedIds, ...nonCommonIds]);

      console.log('[Highlight] compared:', [...comparedIds], '| shared:', [...sharedIds], '| nonCommon:', [...nonCommonIds]);
      console.log('[Highlight] sample graphData IDs:', graphData.nodes.slice(0, 4).map(n => `${n.id}`));

      nvlRef.current.updateElementsInGraph(
        graphData.nodes.map(n => {
          const nid = String(n.id);
          if (comparedIds.has(nid))   return { id: n.id, color: '#F39C12', size: 42 };
          if (sharedIds.has(nid))     return { id: n.id, color: '#1A7A1A', size: 36 };
          if (nonCommonIds.has(nid))  return { id: n.id, color: '#8B0000', size: 34 };
          return { id: n.id, color: getNodeColorByLabel(n.labels?.[0]), size: 25 };
        }),
        graphData.relationships.map(r => {
          const fs = String(r.from), ft = String(r.to);
          const highlightedFrom = allHighlighted.has(fs);
          const highlightedTo   = allHighlighted.has(ft);
          const toShared = sharedIds.has(fs) || sharedIds.has(ft);
          return {
            id: r.id,
            color: toShared ? '#1A7A1A' : (highlightedFrom && highlightedTo) ? '#8B0000' : undefined,
            width: (highlightedFrom && highlightedTo) ? 3 : 1,
          };
        })
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
    } else if (type === 'betweenness') {
      // data is a single { nodeId, score, rank } — highlight that node prominently
      const targetId = String(data.nodeId);
      nvlRef.current.updateElementsInGraph(
        graphData.nodes.map(n => {
          if (String(n.id) === targetId) return { id: n.id, color: '#E53935', size: 50 };
          return { id: n.id, color: getNodeColorByLabel(n.labels?.[0]), size: 22, opacity: 0.35 };
        }),
        graphData.relationships.map(r => ({ id: r.id, width: 1 }))
      );
    } else if (type === 'betweenness-all') {
      // data is the full results array — colour every node as a heat map (red=high, blue=low)
      const allResults = Array.isArray(data) ? data : [];
      const maxScore   = allResults[0]?.score || 1;
      const scoreById  = new Map(allResults.map(r => [String(r.nodeId), r.score]));
      const heatColor  = (score) => {
        const t = maxScore > 0 ? score / maxScore : 0;
        if (t > 0.7) return '#E53935';   // red   — critical
        if (t > 0.4) return '#FB8C00';   // amber — significant
        if (t > 0.1) return '#0B6FCC';   // blue  — moderate
        return '#9E9E9E';                 // grey  — minimal
      };
      nvlRef.current.updateElementsInGraph(
        graphData.nodes.map(n => {
          const score = scoreById.get(String(n.id)) ?? 0;
          return { id: n.id, color: heatColor(score), size: score > 0 ? 28 + Math.round((score / maxScore) * 20) : 22 };
        }),
        graphData.relationships.map(r => ({ id: r.id, width: 1 }))
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
        csvContent = 'Source,Target,Path Length,Total Hours,Path\n';
        results.results.forEach(r => {
          csvContent += `${r.sourceNode},${r.targetNode},${r.pathLength},${r.totalCost},"${r.pathDescription}"\n`;
        });
      } else if (results.algorithmType === ALGORITHM_TYPES.BETWEENNESS) {
        csvContent = 'Rank,Node ID,Node Name,Node Type,Score\n';
        results.results.forEach(r => {
          const name = r.nodeData?.properties?.site_name || r.nodeData?.properties?.vendor_name || r.nodeData?.properties?.id || r.nodeId;
          const type = r.nodeData?.labels?.[0] || '';
          csvContent += `${r.rank},${r.nodeId},"${name}",${type},${r.score}\n`;
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

          {isExecuting && (
            <div className="algo-running-overlay">
              <span className="algo-running-spinner"></span>
              Running algorithm…
            </div>
          )}

          {!isExecuting && algorithmResults && (
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
