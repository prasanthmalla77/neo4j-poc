import React from 'react';
import './NeoDashPanel.css';

const NeoDashPanel = ({ neo4jConfig, jobId }) => {
  const openNeoDash = () => {
    window.open('https://neodash.graphapp.io/', '_blank');
  };

  const downloadDashboardConfig = () => {
    // Create a dashboard configuration that can be imported into NeoDash
    const dashboard = {
      title: "Neo4j GDS Analysis Dashboard",
      version: "2.4",
      settings: {
        pagenumber: 0,
        editable: true,
        fullscreenEnabled: false,
        parameters: {}
      },
      pages: [
        {
          title: "Network Overview",
          reports: [
            {
              title: "Total Nodes",
              query: "MATCH (n) RETURN count(n) as value",
              width: 3,
              height: 2,
              x: 0,
              y: 0,
              type: "value",
              selection: {},
              settings: {}
            },
            {
              title: "Total Relationships",
              query: "MATCH ()-[r]->() RETURN count(r) as value",
              width: 3,
              height: 2,
              x: 3,
              y: 0,
              type: "value",
              selection: {},
              settings: {}
            },
            {
              title: "Node Types Distribution",
              query: "MATCH (n) RETURN labels(n)[0] as Type, count(n) as Count",
              width: 6,
              height: 3,
              x: 0,
              y: 2,
              type: "pie",
              selection: {
                index: "Type",
                value: "Count",
                key: "(none)"
              },
              settings: {}
            },
            {
              title: "Network Graph",
              query: "MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 50",
              width: 6,
              height: 5,
              x: 6,
              y: 0,
              type: "graph",
              selection: {},
              settings: {
                nodeColorScheme: "paired"
              }
            },
            {
              title: "City Populations",
              query: "MATCH (c:City) RETURN c.name as City, c.population as Population ORDER BY c.population DESC",
              width: 6,
              height: 4,
              x: 0,
              y: 5,
              type: "bar",
              selection: {
                index: "City",
                value: "Population",
                key: "(none)"
              },
              settings: {}
            },
            {
              title: "Road Network",
              query: "MATCH (c1:City)-[r:ROAD]->(c2:City) RETURN c1.name as From, c2.name as To, r.distance as Distance ORDER BY r.distance DESC LIMIT 15",
              width: 6,
              height: 4,
              x: 6,
              y: 5,
              type: "table",
              selection: {},
              settings: {}
            }
          ]
        },
        {
          title: "People & Connections",
          reports: [
            {
              title: "People Network",
              query: "MATCH (p:Person) OPTIONAL MATCH (p)-[r]-(connected) WHERE connected:Person OR connected:City RETURN p, r, connected LIMIT 50",
              width: 12,
              height: 6,
              x: 0,
              y: 0,
              type: "graph",
              selection: {},
              settings: {}
            },
            {
              title: "Most Visited Cities",
              query: "MATCH (p:Person)-[:VISITED]->(c:City) RETURN c.name as City, count(p) as Visitors ORDER BY Visitors DESC",
              width: 6,
              height: 3,
              x: 0,
              y: 6,
              type: "bar",
              selection: {
                index: "City",
                value: "Visitors",
                key: "(none)"
              },
              settings: {}
            },
            {
              title: "People by Occupation",
              query: "MATCH (p:Person) RETURN p.occupation as Occupation, count(p) as Count",
              width: 6,
              height: 3,
              x: 6,
              y: 6,
              type: "pie",
              selection: {
                index: "Occupation",
                value: "Count",
                key: "(none)"
              },
              settings: {}
            }
          ]
        }
      ],
      parameters: {},
      extensions: {
        "advanced-charts": true,
        "styling": true,
        "actions": true
      }
    };

    // Create downloadable JSON file
    const dataStr = JSON.stringify(dashboard, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neodash-gds-dashboard.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="neodash-panel">
      <div className="neodash-header">
        <div className="neodash-title-section">
          <h3 className="neodash-title">NeoDash Analytics Dashboard</h3>
          <span className="neodash-subtitle">
            Pre-configured dashboard with GDS-ready visualizations
          </span>
        </div>
        <div className="neodash-controls">
          <span className="status-badge">
            ✅ Dashboard Loaded
          </span>
          <button className="neodash-help-btn" onClick={() => window.open('https://neo4j.com/labs/neodash/', '_blank')}>
            📖 NeoDash Help
          </button>
        </div>
      </div>

      <div className="neodash-info-banner">
        <div className="info-item">
          <strong>📊 2 Dashboard Pages</strong>
          <span>Network Overview & People Connections</span>
        </div>
        <div className="info-item">
          <strong>📈 8 Visualization Cards</strong>
          <span>Graphs, Charts, Tables & Metrics</span>
        </div>
        <div className="info-item">
          <strong>🚀 Quick Setup</strong>
          <span>3 simple steps to launch your dashboard</span>
        </div>
      </div>

      <div className="neodash-setup-container">
        <div className="setup-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Launch NeoDash</h4>
            <p>Click the button below to open NeoDash in a new window</p>
            <button className="neodash-launch-btn" onClick={openNeoDash}>
              🚀 Open NeoDash Dashboard
            </button>
          </div>
        </div>

        <div className="setup-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Connect to Neo4j</h4>
            <p>Use these credentials to connect (copy-paste ready):</p>
            <div className="credentials-box">
              <div className="credential-row">
                <span className="cred-label">Protocol + URL:</span>
                <code className="cred-value">{neo4jConfig.uri}</code>
              </div>
              <div className="credential-row">
                <span className="cred-label">Database:</span>
                <code className="cred-value">{neo4jConfig.database}</code>
              </div>
              <div className="credential-row">
                <span className="cred-label">Username:</span>
                <code className="cred-value">{neo4jConfig.username}</code>
              </div>
              <div className="credential-row">
                <span className="cred-label">Password:</span>
                <code className="cred-value">{neo4jConfig.password}</code>
              </div>
            </div>
          </div>
        </div>

        <div className="setup-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Import Pre-configured Dashboard</h4>
            <p>Download and import our ready-to-use dashboard configuration</p>
            <button className="neodash-download-btn" onClick={downloadDashboardConfig}>
              📥 Download Dashboard Config
            </button>
            <p className="import-instructions">
              In NeoDash: Click "Load Dashboard" → "Import from file" → Select the downloaded JSON
            </p>
          </div>
        </div>
      </div>

      <div className="neodash-footer">
        <div className="dashboard-features">
          <strong>📋 What's Included:</strong>
          <div className="feature-grid">
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div className="feature-content">
                <strong>Network Overview</strong>
                <p>Node counts, relationship counts, type distributions, and full network graph</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <div className="feature-content">
                <strong>People & Connections</strong>
                <p>Social network visualization, visit patterns, and occupation breakdown</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🗺️</span>
              <div className="feature-content">
                <strong>City Analytics</strong>
                <p>Population charts, road network tables, and geographic connections</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✏️</span>
              <div className="feature-content">
                <strong>Fully Editable</strong>
                <p>Customize queries, add new cards, and create additional pages</p>
              </div>
            </div>
          </div>
        </div>

        <div className="connection-info-compact">
          <strong>🔐 Connection Details (if needed):</strong>
          <code>
            {neo4jConfig.uri} | Database: {neo4jConfig.database} | User: {neo4jConfig.username}
          </code>
        </div>
      </div>
    </div>
  );
};

export default NeoDashPanel;
