import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { fetchDashboardData } from '../services/dashboardDataService';
import './AnalyticsDashboard.css';

const COLORS = ['#0B6FCC', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#CDDC39', '#FF5722'];

const AnalyticsDashboard = ({ neo4jConfig, jobId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [jobId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="error-container">
          <h3>⚠️ Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="dashboard-title">📊 Analytics Dashboard</h2>
          <p className="dashboard-subtitle">Real-time insights from Neo4j Graph Database</p>
        </div>
        <div className="header-actions">
          <button onClick={loadDashboardData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-section">
        <div className="kpi-card">
          <div className="kpi-icon">🔵</div>
          <div className="kpi-content">
            <div className="kpi-value">{dashboardData?.totalNodes || 0}</div>
            <div className="kpi-label">Total Nodes</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🔗</div>
          <div className="kpi-content">
            <div className="kpi-value">{dashboardData?.totalRelationships || 0}</div>
            <div className="kpi-label">Relationships</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🏷️</div>
          <div className="kpi-content">
            <div className="kpi-value">{dashboardData?.nodeTypes?.length || 0}</div>
            <div className="kpi-label">Node Types</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🔀</div>
          <div className="kpi-content">
            <div className="kpi-value">{dashboardData?.relationshipTypes?.length || 0}</div>
            <div className="kpi-label">Relationship Types</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Node Types Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Node Types Distribution</h3>
            <span className="chart-icon">📊</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData?.nodeTypes || []}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ type, count }) => `${type}: ${count}`}
              >
                {dashboardData?.nodeTypes?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* City Populations */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>City Populations</h3>
            <span className="chart-icon">🏙️</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.cityPopulations || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="population" fill="#0B6FCC" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Relationship Types Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Relationship Types</h3>
            <span className="chart-icon">🔗</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.relationshipTypes || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="type" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most Visited Cities */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Most Visited Cities</h3>
            <span className="chart-icon">✈️</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.mostVisitedCities || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visitors" fill="#FF9800" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* People by Occupation */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>People by Occupation</h3>
            <span className="chart-icon">👥</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData?.peopleByOccupation || []}
                dataKey="count"
                nameKey="occupation"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {dashboardData?.peopleByOccupation?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Road Network Stats */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Road Connections</h3>
            <span className="chart-icon">🛣️</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Distance (km)</th>
                  <th>Time (hrs)</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.roadConnections?.slice(0, 10).map((road, index) => (
                  <tr key={index}>
                    <td>{road.from}</td>
                    <td>{road.to}</td>
                    <td>{road.distance}</td>
                    <td>{road.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="dashboard-footer">
        <div className="footer-info">
          <span>🔌 Connected to: {neo4jConfig.uri}</span>
          <span>📁 Database: {neo4jConfig.database}</span>
          <span>⏱️ Last Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
