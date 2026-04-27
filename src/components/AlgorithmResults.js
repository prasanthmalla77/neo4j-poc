import React, { useState, useEffect } from 'react';
import { ALGORITHM_TYPES } from '../data/algorithmConfigs';
import './AlgorithmResults.css';

const AlgorithmResults = ({ results, onHighlight, onClearHighlight, onExport }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const isPropertiesMode = results?.stats?.similarityMode === 'properties';

  // Reset expanded state every time a new result set arrives
  useEffect(() => {
    setExpandedItems(new Set());
  }, [results?.executedAt]);

  // Helper function to safely convert Neo4j values to displayable strings
  const toDisplayValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object' && value.low !== undefined && value.high !== undefined) {
      // Neo4j Integer object
      return value.toNumber ? value.toNumber().toString() : String(value.low);
    }
    if (Array.isArray(value)) return value.map(v => toDisplayValue(v)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (!results || !results.results || results.results.length === 0) {
    return null;
  }

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const handleExport = (format) => {
    if (onExport) {
      onExport(results, format);
    }
  };

  const renderPropertyDetail = (result) => {
    const propsA = result.node1Data?.properties || {};
    const propsB = result.node2Data?.properties || {};
    const name1 = toDisplayValue(propsA.site_name || propsA.name || result.node1);
    const name2 = toDisplayValue(propsB.site_name || propsB.name || result.node2);
    const allKeys = [...new Set([...Object.keys(propsA), ...Object.keys(propsB)])].sort();
    const matched   = new Set(result.detail?.matchedProps   || []);
    const unmatched = new Set(result.detail?.unmatchedProps || []);

    return (
      <div className="detail-property-table-wrap">
        <table className="detail-property-table">
          <thead>
            <tr>
              <th className="col-property">Property</th>
              <th className="col-node">{name1}</th>
              <th className="col-node">{name2}</th>
              <th className="col-match">Match</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map(k => {
              const vA = toDisplayValue(propsA[k]);
              const vB = toDisplayValue(propsB[k]);
              const isMatch    = matched.has(k);
              const isMismatch = unmatched.has(k);
              return (
                <tr key={k} className={isMatch ? 'row-match' : isMismatch ? 'row-mismatch' : ''}>
                  <td className="col-property">{k}</td>
                  <td>{vA}</td>
                  <td>{vB}</td>
                  <td className="col-match">
                    {isMatch ? '✅' : isMismatch ? '❌' : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderNeighbourDetail = (result) => {
    const detail = result.detail || {};
    const shared   = detail.shared   || [];
    const onlyIn1  = detail.onlyIn1  || [];
    const onlyIn2  = detail.onlyIn2  || [];
    const name1 = toDisplayValue((result.node1Data?.properties?.site_name || result.node1Data?.properties?.name || result.node1));
    const name2 = toDisplayValue((result.node2Data?.properties?.site_name || result.node2Data?.properties?.name || result.node2));
    const nodeName = (n) => toDisplayValue(n.properties?.site_name || n.properties?.name || n.id);

    return (
      <div className="detail-neighbour-wrap">
        <div className="neighbour-venn">
          {/* Left-only column */}
          <div className="venn-col venn-left">
            <div className="venn-col-title">Only in {name1}</div>
            {onlyIn1.length === 0
              ? <span className="venn-empty">—</span>
              : onlyIn1.map(n => (
                  <div key={n.id} className="venn-node venn-node-left">
                    <span className="venn-node-label">{n.labels?.[0]}</span>
                    <span className="venn-node-name">{nodeName(n)}</span>
                  </div>
                ))}
          </div>

          {/* Shared centre column */}
          <div className="venn-col venn-center">
            <div className="venn-col-title">Shared ({shared.length})</div>
            {shared.length === 0
              ? <span className="venn-empty">None</span>
              : shared.map(n => (
                  <div key={n.id} className="venn-node venn-node-shared">
                    <span className="venn-node-label">{n.labels?.[0]}</span>
                    <span className="venn-node-name">{nodeName(n)}</span>
                  </div>
                ))}
          </div>

          {/* Right-only column */}
          <div className="venn-col venn-right">
            <div className="venn-col-title">Only in {name2}</div>
            {onlyIn2.length === 0
              ? <span className="venn-empty">—</span>
              : onlyIn2.map(n => (
                  <div key={n.id} className="venn-node venn-node-right">
                    <span className="venn-node-label">{n.labels?.[0]}</span>
                    <span className="venn-node-name">{nodeName(n)}</span>
                  </div>
                ))}
          </div>
        </div>
        <div className="neighbour-summary">
          Shared: <strong>{shared.length}</strong> &nbsp;|&nbsp;
          Only {name1}: <strong>{onlyIn1.length}</strong> &nbsp;|&nbsp;
          Only {name2}: <strong>{onlyIn2.length}</strong>
        </div>
      </div>
    );
  };

  const renderNodeSimilarityResults = () => {
    return (
      <div className="results-container">
        <div className="results-header">
          <div className="results-title-section">
            <h3 className="results-title">Node Similarity Results</h3>
            <span className="results-count">{results.resultCount} pairs found</span>
          </div>
          <div className="results-actions">
            <button className="export-btn" onClick={() => handleExport('json')}>
              Export JSON
            </button>
            <button className="export-btn" onClick={() => handleExport('csv')}>
              Export CSV
            </button>
            <button className="clear-btn" onClick={onClearHighlight}>
              Clear Highlights
            </button>
          </div>
        </div>

        <div className="results-stats">
          <div className="stat-item">
            <span className="stat-label">Mode:</span>
            <span className="stat-value">
              {results.stats.similarityMode === 'properties' ? 'Similar Properties' : 'Similar Neighbours'}
              <small className="stat-sub"> ({results.stats.gdsMetric})</small>
            </span>
          </div>
          {results.stats.targetNodeLabel && results.stats.targetNodeLabel !== 'all' && (
            <div className="stat-item">
              <span className="stat-label">Label:</span>
              <span className="stat-value">{results.stats.targetNodeLabel}</span>
            </div>
          )}
          {results.stats.targetProperties && results.stats.targetProperties !== 'all' && (
            <div className="stat-item">
              <span className="stat-label">Properties:</span>
              <span className="stat-value">{results.stats.targetProperties.join(', ')}</span>
            </div>
          )}
          <div className="stat-item">
            <span className="stat-label">Threshold:</span>
            <span className="stat-value">{(results.stats.threshold * 100).toFixed(0)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Nodes Compared:</span>
            <span className="stat-value">{results.stats.nodesCompared}</span>
          </div>
        </div>

        <div className="results-list">
          {results.results.map((result, index) => {
            const isExpanded = expandedItems.has(index);
            return (
              <div key={index} className="result-item similarity-item">
                <div className="result-main">
                  <div className="result-score">
                    <div className="score-circle" style={{
                      background: `conic-gradient(#0B6FCC ${result.score * 100}%, #E0E0E0 0)`
                    }}>
                      <span className="score-text">{(result.score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="result-content">
                    <div className="node-pair">
                      <div className="node-info">
                        <span className="node-label">{result.node1Data?.labels[0]}</span>
                        <span className="node-name">
                          {result.node1Data?.properties?.site_name || result.node1Data?.properties?.name || result.node1Data?.properties?.id || result.node1}
                        </span>
                      </div>
                      <span className="similarity-arrow">↔</span>
                      <div className="node-info">
                        <span className="node-label">{result.node2Data?.labels[0]}</span>
                        <span className="node-name">
                          {result.node2Data?.properties?.site_name || result.node2Data?.properties?.name || result.node2Data?.properties?.id || result.node2}
                        </span>
                      </div>
                    </div>
                    <div className="result-actions-inline">
                      <button
                        className="action-btn highlight-btn"
                        onClick={() => onHighlight(result, 'similarity')}
                      >
                        Highlight
                      </button>
                      <button
                        className="action-btn expand-btn"
                        onClick={() => toggleExpand(index)}
                      >
                        {isExpanded ? 'Hide Details' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="result-details">
                    {isPropertiesMode
                      ? renderPropertyDetail(result)
                      : renderNeighbourDetail(result)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderShortestPathResults = () => {
    return (
      <div className="results-container">
        <div className="results-header">
          <div className="results-title-section">
            <h3 className="results-title">Shortest Path Results</h3>
            <span className="results-count">{results.resultCount} path(s) found</span>
          </div>
          <div className="results-actions">
            <button className="export-btn" onClick={() => handleExport('json')}>
              Export JSON
            </button>
            <button className="clear-btn" onClick={onClearHighlight}>
              Clear Highlights
            </button>
          </div>
        </div>

        <div className="results-stats">
          {(() => {
            const firstPath = results.results?.[0];
            const srcNode = firstPath?.nodes?.[0];
            const tgtNode = firstPath?.nodes?.[firstPath.nodes.length - 1];
            const nodeName = (n) => n?.properties?.site_name || n?.properties?.vendor_name || n?.properties?.id || n?.id || '—';
            return (
              <>
                {srcNode && (
                  <div className="stat-item">
                    <span className="stat-label">Source:</span>
                    <span className="stat-value">{nodeName(srcNode)} <small>({srcNode.labels?.[0]})</small></span>
                  </div>
                )}
                {tgtNode && (
                  <div className="stat-item">
                    <span className="stat-label">Target:</span>
                    <span className="stat-value">{nodeName(tgtNode)} <small>({tgtNode.labels?.[0]})</small></span>
                  </div>
                )}
              </>
            );
          })()}
          <div className="stat-item">
            <span className="stat-label">Algorithm:</span>
            <span className="stat-value">{results.stats.algorithm}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Weighted:</span>
            <span className="stat-value">{results.stats.weighted ? 'Yes' : 'No'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max Depth:</span>
            <span className="stat-value">{results.stats.maxDepth}</span>
          </div>
        </div>

        <div className="results-list">
          {results.results.map((result, index) => {
            const isExpanded = expandedItems.has(index);
            return (
              <div key={index} className="result-item path-item">
                <div className="result-main">
                  <div className="path-badge">
                    <div className="path-length">{result.pathLength}</div>
                    <div className="path-label">hops</div>
                  </div>
                  <div className="result-content">
                    <div className="path-description">
                      {result.pathDescription}
                    </div>
                    {result.totalCost > 0 && (
                      <div className="path-cost">
                        Total Hours: <strong>{result.totalCost.toFixed(2)}</strong>
                      </div>
                    )}
                    <div className="result-actions-inline">
                      <button
                        className="action-btn highlight-btn"
                        onClick={() => onHighlight(result, 'path')}
                      >
                        Highlight Path
                      </button>
                      <button
                        className="action-btn expand-btn"
                        onClick={() => toggleExpand(index)}
                      >
                        {isExpanded ? 'Less' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="result-details">
                    <h4>Path Nodes</h4>
                    <div className="path-nodes-list">
                      {result.nodes.map((node, idx) => (
                        <div key={toDisplayValue(node.id)} className="path-node-item">
                          <span className="node-index">{idx + 1}</span>
                          <span className="node-label">{node.labels[0]}</span>
                          <span className="node-name">
                            {(() => {
                              if (node.caption) return node.caption;
                              const props = node.properties || {};
                              const labelsTag = props.labels || props.LABELS || '';
                              return labelsTag
                                ? `${node.labels?.[0] || ''}_${labelsTag}`
                                : props.site_name || props.vendor_name || props.name || props.id || node.id;
                            })()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <h4>Path Relationships</h4>
                    <div className="path-relationships-list">
                      {result.relationships.map((rel, idx) => (
                        <div key={toDisplayValue(rel.id)} className="path-rel-item">
                          <span className="rel-index">{idx + 1}</span>
                          <span className="rel-type">{rel.type}</span>
                          {rel.properties && Object.keys(rel.properties).length > 0 && (
                            <div className="rel-properties">
                              {Object.entries(rel.properties).map(([key, value]) => (
                                <span key={key} className="rel-prop">
                                  {key}: {toDisplayValue(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBetweennessResults = () => {
    const allResults = results.results;
    const maxScore   = allResults[0]?.score || 1;
    const isNorm     = results.stats?.normalized;
    const n          = results.stats?.nodeCount || allResults.length;
    const denom      = n > 2 ? ((n - 1) * (n - 2)) / 2 : 1;

    // Criticality Index: 0–100, relative to the top node. Always interpretable.
    const critIndex = (score) => Math.round((score / maxScore) * 100);

    // % of all routes this node sits on — uses same rounded count as rawLabel
    const routeShare = (score) => {
      const rawCount = isNorm ? Math.round(score * denom) : Math.round(score);
      return denom > 0 ? ((rawCount / denom) * 100).toFixed(1) + '%' : '0%';
    };

    // Actual number of shortest paths this node sits on, out of total possible
    const rawLabel = (score) => {
      const rawCount = isNorm ? Math.round(score * denom) : Math.round(score);
      return rawCount.toLocaleString() + ' of ' + Math.round(denom).toLocaleString() + ' routes';
    };

    const riskTier = (score) => {
      const t = maxScore > 0 ? score / maxScore : 0;
      if (t > 0.7) return { label: 'Critical',    cls: 'tier-critical' };
      if (t > 0.4) return { label: 'Significant', cls: 'tier-significant' };
      if (t > 0.1) return { label: 'Moderate',    cls: 'tier-moderate' };
      return               { label: 'Low',         cls: 'tier-low' };
    };

    const barColor = (score) => {
      const t = maxScore > 0 ? score / maxScore : 0;
      if (t > 0.7) return '#E53935';
      if (t > 0.4) return '#FB8C00';
      if (t > 0.1) return '#0B6FCC';
      return '#9E9E9E';
    };

    return (
      <div className="results-container">
        <div className="results-header betweenness-header">
          <div className="results-title-section">
            <h3 className="results-title">Betweenness Centrality</h3>
            <span className="results-count">{allResults.length} nodes ranked</span>
          </div>
          <div className="results-actions">
            <button className="export-btn" onClick={() => handleExport('csv')}>Export CSV</button>
            <button
              className="heatmap-btn"
              onClick={() => onHighlight(allResults, 'betweenness-all')}
            >
              Heat Map
            </button>
            <button className="clear-btn" onClick={onClearHighlight}>Clear</button>
          </div>
        </div>

        <div className="betweenness-explainer">
          <span className="explainer-icon">💡</span>
          <span>
            <strong>Criticality Index (0–100)</strong> — how many shortest supply routes pass through
            each node relative to the most critical node. A score of 100 means this node sits on
            more routes than any other; disrupting it breaks the most connections.
          </span>
        </div>

        <div className="results-stats">
          <div className="stat-item">
            <span className="stat-label">Highest Risk Node:</span>
            <span className="stat-value stat-critical">{results.stats?.topNode || '—'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Controls:</span>
            <span className="stat-value">{routeShare(results.stats?.topScore ?? 0)} of all routes</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Computed via:</span>
            <span className="stat-value">{results.stats?.usedGds ? 'Neo4j GDS' : 'In-memory JS'}</span>
          </div>
        </div>

        <div className="betweenness-legend">
          <span className="legend-dot" style={{ background: '#E53935' }} /> Critical (index ≥ 70) &nbsp;
          <span className="legend-dot" style={{ background: '#FB8C00' }} /> Significant (≥ 40) &nbsp;
          <span className="legend-dot" style={{ background: '#0B6FCC' }} /> Moderate (≥ 10) &nbsp;
          <span className="legend-dot" style={{ background: '#9E9E9E' }} /> Low
        </div>

        <div className="results-list">
          {allResults.map((result) => {
            const pct      = maxScore > 0 ? (result.score / maxScore) * 100 : 0;
            const idx      = critIndex(result.score);
            const tier     = riskTier(result.score);
            const nodeName = result.nodeData?.properties?.site_name
              || result.nodeData?.properties?.vendor_name
              || result.nodeData?.properties?.id
              || result.nodeId;
            const nodeLabel = result.nodeData?.labels?.[0] || '';

            return (
              <div key={result.nodeId} className="result-item betweenness-item">
                <div className="result-main">
                  <div className="centrality-rank">
                    <span className="rank-number">#{result.rank}</span>
                  </div>

                  {/* Criticality Index badge */}
                  <div className="centrality-index-badge" style={{ borderColor: barColor(result.score) }}>
                    <span className="ci-value">{idx}</span>
                    <span className="ci-label">/100</span>
                  </div>

                  <div className="result-content">
                    <div className="betweenness-row">
                      <div className="node-info">
                        <div className="node-name-row">
                          <span className="node-label">{nodeLabel}</span>
                          <span className={`risk-badge ${tier.cls}`}>{tier.label}</span>
                        </div>
                        <span className="node-name">{nodeName}</span>
                        <span className="route-share-label">
                          Controls {routeShare(result.score)} of all routes
                          &nbsp;·&nbsp;
                          <span className="raw-score-label">{rawLabel(result.score)}</span>
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="centrality-bar-wrap">
                      <div
                        className="centrality-bar"
                        style={{ width: `${pct}%`, background: barColor(result.score) }}
                      />
                    </div>
                    <div className="result-actions-inline">
                      <button
                        className="action-btn highlight-btn"
                        onClick={() => onHighlight(result, 'betweenness')}
                      >
                        Highlight
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="algorithm-results">
      {results.algorithmType === ALGORITHM_TYPES.NODE_SIMILARITY && renderNodeSimilarityResults()}
      {results.algorithmType === ALGORITHM_TYPES.SHORTEST_PATH && renderShortestPathResults()}
      {results.algorithmType === ALGORITHM_TYPES.BETWEENNESS && renderBetweennessResults()}
    </div>
  );
};

export default AlgorithmResults;
