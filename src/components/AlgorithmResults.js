import React, { useState } from 'react';
import { ALGORITHM_TYPES } from '../data/algorithmConfigs';
import './AlgorithmResults.css';

const AlgorithmResults = ({ results, onHighlight, onClearHighlight, onExport }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

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
            <span className="stat-label">Metric:</span>
            <span className="stat-value">{results.stats.similarityMetric}</span>
          </div>
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
                          {result.node1Data?.properties?.name || result.node1}
                        </span>
                      </div>
                      <span className="similarity-arrow">↔</span>
                      <div className="node-info">
                        <span className="node-label">{result.node2Data?.labels[0]}</span>
                        <span className="node-name">
                          {result.node2Data?.properties?.name || result.node2}
                        </span>
                      </div>
                    </div>
                    <div className="result-actions-inline">
                      <button
                        className="action-btn highlight-btn"
                        onClick={() => onHighlight([result.node1, result.node2], 'similarity')}
                      >
                        Highlight
                      </button>
                      <button
                        className="action-btn expand-btn"
                        onClick={() => toggleExpand(index)}
                      >
                        {isExpanded ? 'Less' : 'More'}
                      </button>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="result-details">
                    <h4>Node 1 Details</h4>
                    <div className="properties-grid">
                      {Object.entries(result.node1Data?.properties || {}).map(([key, value]) => (
                        <div key={key} className="property-item">
                          <span className="property-key">{key}:</span>
                          <span className="property-value">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <h4>Node 2 Details</h4>
                    <div className="properties-grid">
                      {Object.entries(result.node2Data?.properties || {}).map(([key, value]) => (
                        <div key={key} className="property-item">
                          <span className="property-key">{key}:</span>
                          <span className="property-value">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
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
                        Total Cost: <strong>{result.totalCost.toFixed(2)}</strong>
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
                        <div key={node.id} className="path-node-item">
                          <span className="node-index">{idx + 1}</span>
                          <span className="node-label">{node.labels[0]}</span>
                          <span className="node-name">
                            {node.properties?.name || node.id}
                          </span>
                        </div>
                      ))}
                    </div>
                    <h4>Path Relationships</h4>
                    <div className="path-relationships-list">
                      {result.relationships.map((rel, idx) => (
                        <div key={rel.id} className="path-rel-item">
                          <span className="rel-index">{idx + 1}</span>
                          <span className="rel-type">{rel.type}</span>
                          {rel.properties && Object.keys(rel.properties).length > 0 && (
                            <div className="rel-properties">
                              {Object.entries(rel.properties).map(([key, value]) => (
                                <span key={key} className="rel-prop">
                                  {key}: {value}
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

  return (
    <div className="algorithm-results">
      {results.algorithmType === ALGORITHM_TYPES.NODE_SIMILARITY && renderNodeSimilarityResults()}
      {results.algorithmType === ALGORITHM_TYPES.SHORTEST_PATH && renderShortestPathResults()}
    </div>
  );
};

export default AlgorithmResults;
