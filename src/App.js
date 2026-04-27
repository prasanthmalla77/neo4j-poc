import React, { useState } from 'react';
import './App.css';
import GraphVisualization from './components/GraphVisualization';
import ChatQuery from './components/ChatQuery';

function App() {
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' or 'chat'

  return (
    <div className="App">
      <div style={{ padding: '20px' }}>
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <span className="tab-icon">📊</span>
            Brand View - Graph & Algorithms
          </button>
          <button
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="tab-icon">💬</span>
            AI Chat Query
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'graph' && (
            <div className="tab-pane active">
              <GraphVisualization />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="tab-pane active">
              <ChatQuery />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
