import { useState, useEffect } from 'react';
import './NeoDashPanel.css';

const NeoDashPanel = ({ neo4jConfig, jobId }) => {
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    // Create the pre-configured dashboard
    const dashboard = {
      title: "Neo4j GDS Analysis Dashboard",
      version: "2.4",
      settings: {
        pagenumber: 0,
        editable: true,
        fullscreenEnabled: false,
        parameters: {},
        connectionDetails: {
          protocol: neo4jConfig.uri.split('://')[0],
          url: neo4jConfig.uri.split('://')[1],
          database: neo4jConfig.database,
          username: neo4jConfig.username,
          password: neo4jConfig.password
        }
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

    // Encode the dashboard as base64
    const encodedDashboard = btoa(JSON.stringify(dashboard));

    // Create NeoDash URL with embedded dashboard
    // IMPORTANT: Using HTTP (not HTTPS) to allow bolt:// connection to local Neo4j
    const baseUrl = 'http://neodash.graphapp.io';
    const url = `${baseUrl}/?dashboard=${encodedDashboard}`;

    setIframeUrl(url);
  }, [neo4jConfig]);

  return (
    <div className="neodash-panel">
      <div className="neodash-header">
        <div className="neodash-title-section">
          <h3 className="neodash-title">NeoDash Analytics Dashboard</h3>
          <span className="neodash-subtitle">
            Integrated NeoDash with pre-configured visualizations
          </span>
        </div>
        <div className="neodash-controls">
          <span className="status-badge connected">
            ✅ NeoDash Loaded
          </span>
          <button
            className="neodash-help-btn"
            onClick={() => window.open('http://neodash.graphapp.io/', '_blank')}
          >
            📖 Open in New Tab
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
          <strong>🔌 Connection Required</strong>
          <span>Click "Connect" in NeoDash and use credentials below</span>
        </div>
      </div>

      <div className="neodash-connection-banner">
        <strong>🔐 Neo4j Connection Details:</strong>
        <div className="connection-details">
          <code>URL: {neo4jConfig.uri}</code>
          <code>Database: {neo4jConfig.database}</code>
          <code>Username: {neo4jConfig.username}</code>
          <code>Password: {neo4jConfig.password}</code>
        </div>
      </div>

      <div className="neodash-iframe-wrapper">
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            title="NeoDash Dashboard"
            className="neodash-iframe"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading NeoDash...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeoDashPanel;
