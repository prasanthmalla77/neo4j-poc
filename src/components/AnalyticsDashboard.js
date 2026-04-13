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

const QUERY_OPTIONS = [
  { value: 'all', label: '📊 FORXIGA Overview - Complete Supply Chain' },
  { value: 'formulation-sites', label: '🏭 Manufacturing Sites - Production Analysis' },
  { value: 'supply-chain', label: '🔗 End-to-End Flow - API to Markets' },
  { value: 'materials-inventory', label: '📦 Inventory & Stock Management' }
];

const AnalyticsDashboard = ({ neo4jConfig, jobId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, [jobId, selectedQuery]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardData(selectedQuery);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    setSelectedQuery(e.target.value);
  };

  // Get dynamic chart configuration based on selected query
  const getChartConfig = () => {
    switch (selectedQuery) {
      case 'formulation-sites':
        return {
          chart1: { title: 'Material Distribution Across Sites', subtitle: 'Supply diversification analysis', icon: '🌐' },
          chart2: { title: 'Formulation Site Production Capacity', subtitle: 'Actual production vs budget capacity', icon: '⚙️', type: 'grouped-bar' },
          chart3: { title: 'Top Materials by Site Usage', subtitle: 'Most utilized materials across formulation sites', icon: '📈' },
          chart4: { title: 'Site-Material Production Matrix', subtitle: 'Material-level production breakdown', icon: '📋' }
        };
      case 'supply-chain':
        return {
          chart1: { title: 'Customer Market Sales Volume', subtitle: 'Market demand distribution', icon: '📊' },
          chart2: { title: 'Supply Chain Stages Distribution', subtitle: 'Node count by supply chain tier', icon: '🚚' },
          chart3: { title: 'Top API Sites by Downstream Reach', subtitle: 'API sites with most connections', icon: '⚠️' },
          chart4: { title: 'End-to-End Supply Chain Flow', subtitle: 'API → Formulation → Packing → Market', icon: '🔗' }
        };
      case 'materials-inventory':
        return {
          chart1: { title: 'Top Materials by Inventory Volume', subtitle: 'Highest stock level materials', icon: '📦' },
          chart2: { title: 'Inventory Value by Site', subtitle: 'Stock value across manufacturing sites', icon: '⚖️', type: 'grouped-bar' },
          chart3: { title: 'Inventory Days Covered Analysis', subtitle: 'Stock risk - materials with low coverage', icon: '🔴' },
          chart4: { title: 'Material Location Inventory Details', subtitle: 'Stock levels by site and material', icon: '🏬' }
        };
      default:
        return {
          chart1: { title: 'Production Volume by Site Type', subtitle: 'API vs Formulation vs Packing production', icon: '🎯' },
          chart2: { title: 'Top Sites by Production Volume', subtitle: 'Production vs inventory capacity', icon: '🏭', type: 'grouped-bar' },
          chart3: { title: 'Supply Chain Connectivity Analysis', subtitle: 'Most connected supply chain nodes', icon: '🔩' },
          chart4: { title: 'End-to-End Supply Chain Paths', subtitle: 'Source → Intermediate → Destination flow', icon: '🌐' }
        };
    }
  };

  const chartConfig = getChartConfig();

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
          <h2 className="dashboard-title">📊 FORXIGA Supply Chain Analytics</h2>
          <p className="dashboard-subtitle">Real-time pharmaceutical supply chain insights - 41 Countries, 72 Manufacturing Sites, 382 SKUs</p>
        </div>
        <div className="header-actions">
          <select
            value={selectedQuery}
            onChange={handleQueryChange}
            className="query-selector"
          >
            {QUERY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button onClick={loadDashboardData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards - FORXIGA Supply Chain Metrics */}
      <div className="kpi-section">
        <div className="kpi-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-content">
            <div className="kpi-value">{dashboardData?.totalMaterials || 773}</div>
            <div className="kpi-label">Total Materials (SKUs)</div>
            <div className="kpi-sublabel" style={{fontSize: '0.75rem', color: '#888', marginTop: '4px'}}>382 Unique Products</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🏭</div>
          <div className="kpi-content">
            <div className="kpi-value">{dashboardData?.totalSites || 5}</div>
            <div className="kpi-label">Formulation Sites</div>
            <div className="kpi-sublabel" style={{fontSize: '0.75rem', color: '#888', marginTop: '4px'}}>+ 15 Packing Centers</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🌍</div>
          <div className="kpi-content">
            <div className="kpi-value">{dashboardData?.totalMarkets || 32}</div>
            <div className="kpi-label">Customer Markets</div>
            <div className="kpi-sublabel" style={{fontSize: '0.75rem', color: '#888', marginTop: '4px'}}>41 Countries</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">⚡</div>
          <div className="kpi-content">
            <div className="kpi-value">{dashboardData?.totalAPISites || 3}</div>
            <div className="kpi-label">API Sources</div>
            <div className="kpi-sublabel" style={{fontSize: '0.75rem', color: '#888', marginTop: '4px'}}>Primary Suppliers</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <div className="kpi-value">{dashboardData?.totalProduction?.toLocaleString() || 0}</div>
            <div className="kpi-label">Total Production</div>
            <div className="kpi-sublabel" style={{fontSize: '0.75rem', color: '#888', marginTop: '4px'}}>Annual Output</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🔗</div>
          <div className="kpi-content">
            <div className="kpi-value">{dashboardData?.totalRelationships || 262}</div>
            <div className="kpi-label">Supply Connections</div>
            <div className="kpi-sublabel" style={{fontSize: '0.75rem', color: '#888', marginTop: '4px'}}>Network Links</div>
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

        {/* Dynamic Chart 1 */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>{chartConfig.chart1.title}</h3>
              <p className="chart-subtitle">{chartConfig.chart1.subtitle}</p>
            </div>
            <span className="chart-icon">{chartConfig.chart1.icon}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {chartConfig.chart1.type === 'grouped-bar' ? (
              <BarChart data={dashboardData?.materialInventory || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="material" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="forecast" fill="#0B6FCC" name="Forecast" />
                <Bar dataKey="actual" fill="#4CAF50" name="Actual" />
              </BarChart>
            ) : (
              <BarChart data={dashboardData?.materialInventory || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="material" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="inventory" fill="#0B6FCC" name="Value" />
              </BarChart>
            )}
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

        {/* Dynamic Chart 2 */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>{chartConfig.chart2.title}</h3>
              <p className="chart-subtitle">{chartConfig.chart2.subtitle}</p>
            </div>
            <span className="chart-icon">{chartConfig.chart2.icon}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {chartConfig.chart2.type === 'grouped-bar' ? (
              <BarChart data={dashboardData?.sitesWithMaterials || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="site" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="production" fill="#0B6FCC" name="Production" />
                <Bar dataKey="inventory" fill="#FF9800" name="Inventory" />
                <Bar dataKey="capacity" fill="#4CAF50" name="Capacity" />
              </BarChart>
            ) : (
              <BarChart data={dashboardData?.sitesWithMaterials || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="site" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="materialCount" fill="#FF9800" name="Count" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Dynamic Chart 3 */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>{chartConfig.chart3.title}</h3>
              <p className="chart-subtitle">{chartConfig.chart3.subtitle}</p>
            </div>
            <span className="chart-icon">{chartConfig.chart3.icon}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.topForecasts || []} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="material" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#E91E63" name="Value" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamic Chart 4 - Supply Chain Details */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>{chartConfig.chart4.title}</h3>
              <p className="chart-subtitle">{chartConfig.chart4.subtitle}</p>
            </div>
            <span className="chart-icon">{chartConfig.chart4.icon}</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {selectedQuery === 'supply-chain' ? (
                    <>
                      <th>Supplier</th>
                      <th>Material</th>
                      <th>Market</th>
                      <th>Demand</th>
                    </>
                  ) : selectedQuery === 'materials-inventory' ? (
                    <>
                      <th>Site</th>
                      <th>Material</th>
                      <th>Quantity</th>
                    </>
                  ) : selectedQuery === 'materials-sites' ? (
                    <>
                      <th>Site</th>
                      <th>Material</th>
                      <th>Production</th>
                    </>
                  ) : (
                    <>
                      <th>Supplier</th>
                      <th>Material</th>
                      <th>Component</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {dashboardData?.supplyChainConnections?.slice(0, 10).map((conn, index) => (
                  <tr key={index}>
                    {selectedQuery === 'supply-chain' ? (
                      <>
                        <td>{conn.supplier}</td>
                        <td>{conn.material}</td>
                        <td>{conn.market}</td>
                        <td>{conn.demand || '-'}</td>
                      </>
                    ) : selectedQuery === 'materials-inventory' ? (
                      <>
                        <td>{conn.supplier}</td>
                        <td>{conn.material}</td>
                        <td>{conn.quantity || '-'}</td>
                      </>
                    ) : selectedQuery === 'materials-sites' ? (
                      <>
                        <td>{conn.supplier}</td>
                        <td>{conn.material}</td>
                        <td>{conn.production || '-'}</td>
                      </>
                    ) : (
                      <>
                        <td>{conn.supplier}</td>
                        <td>{conn.material}</td>
                        <td>{conn.market}</td>
                      </>
                    )}
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
