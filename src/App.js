import React, { useState } from 'react';
import './App.css';
import GraphVisualization from './components/GraphVisualization';
import NeoDashPanel from './components/NeoDashPanel';
import { NEO4J_CONFIG } from './services/neo4jService';

function App() {
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' or 'dashboard'

  return (
    <div className="App">
      <div style={{ padding: '20px' }}>
        <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '10px' }}>
          Neo4j GDS Analysis Platform
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Graph Data Science algorithms with interactive visualization and analytics
        </p>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <span className="tab-icon">📊</span>
            Graph View & Algorithms
          </button>
          <button
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="tab-icon">📈</span>
            NeoDash Analytics
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'graph' && (
            <div className="tab-pane active">
              <GraphVisualization />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="tab-pane active">
              <NeoDashPanel neo4jConfig={NEO4J_CONFIG} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
