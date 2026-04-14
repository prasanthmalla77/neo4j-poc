import React, { useState, useEffect } from 'react';
import './GraphConfigModal.css';

const GraphConfigModal = ({ isOpen, onClose, allNodes, allRelationships, onApplyConfig }) => {
  const [selectedNodeLabels, setSelectedNodeLabels] = useState([]);
  const [selectedRelTypes, setSelectedRelTypes] = useState([]);
  const [availableNodeLabels, setAvailableNodeLabels] = useState([]);
  const [availableRelTypes, setAvailableRelTypes] = useState([]);

  // Extract unique node labels and relationship types
  useEffect(() => {
    if (allNodes && allRelationships) {
      // Get unique node labels
      const labels = new Set();
      allNodes.forEach(node => {
        node.labels.forEach(label => labels.add(label));
      });
      setAvailableNodeLabels(Array.from(labels).sort());

      // Get unique relationship types
      const relTypes = new Set();
      allRelationships.forEach(rel => {
        relTypes.add(rel.type);
      });
      setAvailableRelTypes(Array.from(relTypes).sort());

      // Select all by default
      setSelectedNodeLabels(Array.from(labels));
      setSelectedRelTypes(Array.from(relTypes));
    }
  }, [allNodes, allRelationships]);

  const handleNodeLabelToggle = (label) => {
    setSelectedNodeLabels(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const handleRelTypeToggle = (type) => {
    setSelectedRelTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSelectAllNodes = () => {
    setSelectedNodeLabels(availableNodeLabels);
  };

  const handleDeselectAllNodes = () => {
    setSelectedNodeLabels([]);
  };

  const handleSelectAllRels = () => {
    setSelectedRelTypes(availableRelTypes);
  };

  const handleDeselectAllRels = () => {
    setSelectedRelTypes([]);
  };

  const handleApply = () => {
    onApplyConfig({
      nodeLabels: selectedNodeLabels,
      relationshipTypes: selectedRelTypes
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedNodeLabels(availableNodeLabels);
    setSelectedRelTypes(availableRelTypes);
  };

  if (!isOpen) return null;

  return (
    <div className="config-modal-overlay" onClick={onClose}>
      <div className="config-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="config-modal-header">
          <h2>Configure Graph Display</h2>
          <button className="config-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="config-modal-body">
          <p className="config-modal-description">
            Select which node types and relationships you want to display in the graph visualization.
          </p>

          {/* Node Labels Section */}
          <div className="config-section">
            <div className="config-section-header">
              <h3>Node Types</h3>
              <div className="config-section-actions">
                <button className="config-btn-small" onClick={handleSelectAllNodes}>Select All</button>
                <button className="config-btn-small" onClick={handleDeselectAllNodes}>Deselect All</button>
              </div>
            </div>
            <div className="config-checkboxes">
              {availableNodeLabels.map(label => (
                <label key={label} className="config-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedNodeLabels.includes(label)}
                    onChange={() => handleNodeLabelToggle(label)}
                  />
                  <span className="config-checkbox-label">{label}</span>
                  <span className="config-checkbox-count">
                    ({allNodes.filter(n => n.labels.includes(label)).length} nodes)
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Relationship Types Section */}
          <div className="config-section">
            <div className="config-section-header">
              <h3>Relationship Types</h3>
              <div className="config-section-actions">
                <button className="config-btn-small" onClick={handleSelectAllRels}>Select All</button>
                <button className="config-btn-small" onClick={handleDeselectAllRels}>Deselect All</button>
              </div>
            </div>
            <div className="config-checkboxes">
              {availableRelTypes.map(type => (
                <label key={type} className="config-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedRelTypes.includes(type)}
                    onChange={() => handleRelTypeToggle(type)}
                  />
                  <span className="config-checkbox-label">{type}</span>
                  <span className="config-checkbox-count">
                    ({allRelationships.filter(r => r.type === type).length} relationships)
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="config-summary">
            <strong>Selected:</strong> {selectedNodeLabels.length} node type(s), {selectedRelTypes.length} relationship type(s)
          </div>
        </div>

        <div className="config-modal-footer">
          <button className="config-btn config-btn-secondary" onClick={handleReset}>
            Reset to Default
          </button>
          <button className="config-btn config-btn-primary" onClick={handleApply}>
            Apply Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphConfigModal;
