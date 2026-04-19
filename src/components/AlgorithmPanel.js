import React, { useState, useMemo } from 'react';
import { populateDynamicOptions, validateAlgorithmConfig, getDefaultConfig } from '../data/algorithmConfigs';
import './AlgorithmPanel.css';

const AlgorithmPanel = ({ availableAlgorithms, graphData, onExecute, isExecuting }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('');
  const [config, setConfig] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);

  // Derive the algorithm schema + dynamic options synchronously.
  // Full `config` is in deps so ANY config change (label, mode, etc.) refreshes options.
  const algorithmConfig = useMemo(() => {
    if (!selectedAlgorithm || !graphData?.nodes) return null;
    return populateDynamicOptions(selectedAlgorithm, graphData, config);
  }, [selectedAlgorithm, graphData, config]);

  const handleAlgorithmChange = (e) => {
    const algo = e.target.value;
    setSelectedAlgorithm(algo);
    // Config reset only here — the ONLY place it should ever reset
    setConfig(algo ? getDefaultConfig(algo) : {});
    setValidationErrors([]);
  };

  const handleConfigChange = (paramKey, value) => {
    if (paramKey === 'targetNodeLabel') {
      // Clear previously selected properties when label changes
      setConfig(prev => ({ ...prev, [paramKey]: value, targetProperties: [] }));
    } else if (paramKey === 'relationshipFilter') {
      // Clear weight property when relationship filter changes — options will repopulate
      setConfig(prev => ({ ...prev, [paramKey]: value, weightProperty: '' }));
    } else {
      setConfig(prev => ({ ...prev, [paramKey]: value }));
    }
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
              {param.helpText && (
                <span className="info-icon" title={param.helpText}>ℹ️</span>
              )}
            </label>
            <select
              className="algo-select"
              value={value || ''}
              onChange={(e) => handleConfigChange(paramKey, e.target.value)}
              disabled={isExecuting}
            >
              <option value="">Select {param.label}</option>
              {param.options.map(opt => (
                <option key={opt.value} value={opt.value} title={opt.description || ''}>
                  {opt.label}
                </option>
              ))}
            </select>
            {param.helpText && <small className="algo-help-text">{param.helpText}</small>}
            {value && param.options.find(opt => opt.value === value)?.description && (
              <div className="option-description">
                💡 {param.options.find(opt => opt.value === value).description}
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={paramKey} className="algo-form-group">
            <label className="algo-label">
              {param.label}
              {param.required && <span className="required">*</span>}
              {param.helpText && (
                <span className="info-icon" title={param.helpText}>ℹ️</span>
              )}
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
              placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}`}
            />
            {param.helpText && <small className="algo-help-text">{param.helpText}</small>}
            {(param.min !== undefined || param.max !== undefined) && (
              <small className="algo-range-text">
                Range: {param.min ?? 'no min'} - {param.max ?? 'no max'}
              </small>
            )}
          </div>
        );

      case 'text':
        return (
          <div key={paramKey} className="algo-form-group">
            <label className="algo-label">
              {param.label}
              {param.required && <span className="required">*</span>}
              {param.helpText && (
                <span className="info-icon" title={param.helpText}>ℹ️</span>
              )}
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
        // For targetProperties: always compute options live from graphData filtered by the
        // currently selected label so the checklist immediately reflects the label change.
        if (paramKey === 'targetProperties' && graphData?.nodes) {
          const selectedLabel = config.targetNodeLabel || '';
          const labelPropMap = {};
          graphData.nodes.forEach(n => {
            (n.labels || []).forEach(lbl => {
              if (!labelPropMap[lbl]) labelPropMap[lbl] = new Set();
              Object.keys(n.properties || {}).forEach(k => labelPropMap[lbl].add(k));
            });
          });
          const propKeys = selectedLabel && labelPropMap[selectedLabel]
            ? [...labelPropMap[selectedLabel]].sort()
            : [...new Set(graphData.nodes.flatMap(n => Object.keys(n.properties || {})))].sort();
          param = { ...param, options: propKeys.map(k => ({ value: k, label: k })) };
        }
        return (
          <div key={paramKey} className="algo-form-group">
            <label className="algo-label">
              {param.label}
              {param.required && <span className="required">*</span>}
              {param.helpText && (
                <span className="info-icon" title={param.helpText}>ℹ️</span>
              )}
            </label>
            {param.helpText && <small className="algo-help-text">{param.helpText}</small>}
            <div className="algo-multiselect">
              {param.options.length === 0 ? (
                <small className="algo-empty-text">No options available</small>
              ) : (
                param.options.map(opt => (
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
                ))
              )}
            </div>
          </div>
        );

      case 'node-select':
        return (
          <div key={paramKey} className="algo-form-group">
            <label className="algo-label">
              {param.label}
              {param.required && <span className="required">*</span>}
              {param.helpText && (
                <span className="info-icon" title={param.helpText}>ℹ️</span>
              )}
            </label>
            <select
              className="algo-select"
              value={value || ''}
              onChange={(e) => handleConfigChange(paramKey, e.target.value)}
              disabled={isExecuting}
            >
              <option value="">Select {param.label}</option>
              {graphData.nodes.map(node => {
                const dataId = node.properties?.id || '';
                const siteName = node.properties?.site_name || node.properties?.vendor_name || '';
                const label = node.labels?.[0] || '';
                const display = dataId
                  ? (siteName ? `${dataId} — ${siteName} (${label})` : `${dataId} (${label})`)
                  : `${node.id} (${label})`;
                return (
                  <option key={node.id} value={node.id} title={display}>
                    {display}
                  </option>
                );
              })}
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
            <span className="info-icon" title="Choose a graph algorithm to analyze your network">ℹ️</span>
          </label>
          <select
            className="algo-select"
            value={selectedAlgorithm}
            onChange={handleAlgorithmChange}
            disabled={isExecuting}
          >
            <option value="">Choose an algorithm...</option>
            {availableAlgorithms.map(algo => (
              <option key={algo.id} value={algo.id} title={algo.description || ''}>
                {algo.name}
              </option>
            ))}
          </select>
          <small className="algo-help-text">Select a graph algorithm to run on your data</small>
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
