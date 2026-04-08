import React, { useState, useEffect } from 'react';
import { getAlgorithmConfig, populateDynamicOptions, validateAlgorithmConfig, getDefaultConfig } from '../data/algorithmConfigs';
import './AlgorithmPanel.css';

const AlgorithmPanel = ({ availableAlgorithms, graphData, onExecute, isExecuting }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('');
  const [config, setConfig] = useState({});
  const [algorithmConfig, setAlgorithmConfig] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Update algorithm config when selection changes
  useEffect(() => {
    if (selectedAlgorithm) {
      const baseConfig = getAlgorithmConfig(selectedAlgorithm);
      const configWithOptions = populateDynamicOptions(selectedAlgorithm, graphData);
      setAlgorithmConfig(configWithOptions);
      setConfig(getDefaultConfig(selectedAlgorithm));
      setValidationErrors([]);
    } else {
      setAlgorithmConfig(null);
      setConfig({});
    }
  }, [selectedAlgorithm, graphData]);

  const handleAlgorithmChange = (e) => {
    setSelectedAlgorithm(e.target.value);
  };

  const handleConfigChange = (paramKey, value) => {
    setConfig(prev => ({
      ...prev,
      [paramKey]: value
    }));
    // Clear validation errors when user makes changes
    setValidationErrors([]);
  };

  const handleExecute = () => {
    // Validate configuration
    const validation = validateAlgorithmConfig(selectedAlgorithm, config);

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Execute algorithm
    onExecute(selectedAlgorithm, config);
  };

  const renderFormField = (paramKey, param) => {
    const value = config[paramKey];

    // Check conditional display
    if (param.showWhen) {
      const [conditionKey, conditionValue] = Object.entries(param.showWhen)[0];
      if (config[conditionKey] !== conditionValue) {
        return null;
      }
    }

    switch (param.type) {
      case 'select':
        return (
          <div key={paramKey} className="algo-form-group">
            <label className="algo-label">
              {param.label}
              {param.required && <span className="required">*</span>}
            </label>
            <select
              className="algo-select"
              value={value || ''}
              onChange={(e) => handleConfigChange(paramKey, e.target.value)}
              disabled={isExecuting}
            >
              <option value="">Select {param.label}</option>
              {param.options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {param.helpText && <small className="algo-help-text">{param.helpText}</small>}
          </div>
        );

      case 'number':
        return (
          <div key={paramKey} className="algo-form-group">
            <label className="algo-label">
              {param.label}
              {param.required && <span className="required">*</span>}
            </label>
            <input
              type="number"
              className="algo-input"
              value={value ?? ''}
              min={param.min}
              max={param.max}
              step={param.step || 1}
              onChange={(e) => handleConfigChange(paramKey, parseFloat(e.target.value))}
              disabled={isExecuting}
            />
            {param.helpText && <small className="algo-help-text">{param.helpText}</small>}
          </div>
        );

      case 'text':
        return (
          <div key={paramKey} className="algo-form-group">
            <label className="algo-label">
              {param.label}
              {param.required && <span className="required">*</span>}
            </label>
            <input
              type="text"
              className="algo-input"
              value={value || ''}
              placeholder={param.placeholder}
              onChange={(e) => handleConfigChange(paramKey, e.target.value)}
              disabled={isExecuting}
            />
            {param.helpText && <small className="algo-help-text">{param.helpText}</small>}
          </div>
        );

      case 'multiselect':
        return (
          <div key={paramKey} className="algo-form-group">
            <label className="algo-label">
              {param.label}
              {param.required && <span className="required">*</span>}
            </label>
            <div className="algo-multiselect">
              {param.options.map(opt => (
                <label key={opt.value} className="algo-checkbox-label">
                  <input
                    type="checkbox"
                    checked={(value || []).includes(opt.value)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...(value || []), opt.value]
                        : (value || []).filter(v => v !== opt.value);
                      handleConfigChange(paramKey, newValue);
                    }}
                    disabled={isExecuting}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {param.helpText && <small className="algo-help-text">{param.helpText}</small>}
          </div>
        );

      case 'node-select':
        return (
          <div key={paramKey} className="algo-form-group">
            <label className="algo-label">
              {param.label}
              {param.required && <span className="required">*</span>}
            </label>
            <select
              className="algo-select"
              value={value || ''}
              onChange={(e) => handleConfigChange(paramKey, e.target.value)}
              disabled={isExecuting}
            >
              <option value="">Select {param.label}</option>
              {graphData.nodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.properties?.name || node.id} ({node.labels.join(', ')})
                </option>
              ))}
            </select>
            {param.helpText && <small className="algo-help-text">{param.helpText}</small>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="algorithm-panel">
      <div className="algo-panel-header">
        <h3 className="algo-panel-title">Graph Algorithms</h3>
      </div>

      <div className="algo-panel-content">
        {/* Algorithm Selection */}
        <div className="algo-form-group">
          <label className="algo-label">
            Select Algorithm
            <span className="required">*</span>
          </label>
          <select
            className="algo-select"
            value={selectedAlgorithm}
            onChange={handleAlgorithmChange}
            disabled={isExecuting}
          >
            <option value="">Choose an algorithm...</option>
            {availableAlgorithms.map(algo => (
              <option key={algo.id} value={algo.id}>
                {algo.name}
              </option>
            ))}
          </select>
        </div>

        {/* Algorithm Description */}
        {algorithmConfig && (
          <div className="algo-description">
            <p>{algorithmConfig.description}</p>
            <span className="algo-category">{algorithmConfig.category}</span>
          </div>
        )}

        {/* Configuration Form */}
        {algorithmConfig && (
          <div className="algo-config-form">
            <h4 className="algo-section-title">Configuration</h4>
            {Object.entries(algorithmConfig.parameters).map(([key, param]) =>
              renderFormField(key, param)
            )}
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="algo-errors">
            <strong>Please fix the following errors:</strong>
            <ul>
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Execute Button */}
        {algorithmConfig && (
          <button
            className={`algo-execute-button ${isExecuting ? 'executing' : ''}`}
            onClick={handleExecute}
            disabled={isExecuting || !selectedAlgorithm}
          >
            {isExecuting ? (
              <>
                <span className="spinner"></span>
                Running Algorithm...
              </>
            ) : (
              <>Run {algorithmConfig.name}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AlgorithmPanel;
