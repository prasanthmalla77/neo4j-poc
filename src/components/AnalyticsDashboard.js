import { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer
} from 'recharts';
import './AnalyticsDashboard.css';

const COLORS = ['#0B6FCC', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

const AnalyticsDashboard = () => {
  const [selectedProduct, setSelectedProduct] = useState('forxiga');

  // Chart 1: Material Composition (Pie Chart)
  const materialCompositionData = [
    { name: 'Finished Products', value: 68.2, count: 527 },
    { name: 'Semi-Finished', value: 23.7, count: 183 },
    { name: 'Raw Materials (APIs)', value: 8.1, count: 63 }
  ];

  // Chart 2: Regional Distribution (Pie Chart)
  const regionalDistributionData = [
    { name: 'EMEA', value: 279, percentage: 41 },
    { name: 'APAC', value: 244, percentage: 36 },
    { name: 'Americas', value: 159, percentage: 23 }
  ];

  // Chart 3: Top Countries by Materials (Bar Chart)
  const topCountriesData = [
    { country: 'USA', materials: 153 },
    { country: 'Sweden', materials: 133 },
    { country: 'India', materials: 99 },
    { country: 'China', materials: 57 },
    { country: 'Japan', materials: 56 },
    { country: 'UK', materials: 54 }
  ];

  // Chart 4: Top Inventory Locations (Bar Chart)
  const topInventoryData = [
    { location: 'Mt Vernon', materials: 123, risk: 'Critical' },
    { location: 'SE Snäckviken', materials: 103, risk: 'High' },
    { location: 'Macclesfield UK', materials: 48, risk: 'Medium' },
    { location: 'Japan KK', materials: 41, risk: 'Low' },
    { location: 'China Pharma', materials: 35, risk: 'Low' }
  ];

  // Chart 6: Manufacturing Stages (Pie Chart)
  const manufacturingStagesData = [
    { name: 'FP@PS (Packing)', value: 23, count: 176 },
    { name: 'FP@MCDC (Distribution)', value: 18, count: 140 },
    { name: 'FP@MC&MTOP (Market)', value: 12, count: 95 },
    { name: 'BULK@PS', value: 9, count: 67 },
    { name: 'Other Stages', value: 38, count: 295 }
  ];

  const getBarColor = (value) => {
    if (value >= 85) return '#E91E63'; // Critical - Red
    if (value >= 70) return '#FF9800'; // High - Orange
    return '#4CAF50'; // Good - Green
  };

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="dashboard-title">📊 FORXIGA Supply Chain Analytics</h2>
          <p className="dashboard-subtitle">
            Pharmaceutical Supply Chain Intelligence • 41 Countries • 72 Manufacturing Sites • 382 SKUs
          </p>
        </div>
        <div className="header-actions">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="query-selector"
          >
            <option value="forxiga">📋 FORXIGA - Complete Analysis</option>
          </select>
        </div>
      </div>

      {/* Charts Grid - 6 Strategic Visualizations */}
      <div className="charts-grid">
        {/* Chart 1: Material Composition */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Material Composition</h3>
              <p className="chart-subtitle">What type of materials dominate the supply chain?</p>
            </div>
            <span className="chart-icon">📦</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={materialCompositionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {materialCompositionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            💡 <strong>Insight:</strong> Heavy tilt towards finished goods → downstream complexity risk
          </div>
        </div>

        {/* Chart 2: Regional Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Region-wise Material Distribution</h3>
              <p className="chart-subtitle">Where is most supply chain activity happening?</p>
            </div>
            <span className="chart-icon">🌍</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={regionalDistributionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {regionalDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            💡 <strong>Insight:</strong> Strong Europe + APAC dominance = diversified geographic risk
          </div>
        </div>

        {/* Chart 3: Top Countries by Materials */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Top Countries by Material Count</h3>
              <p className="chart-subtitle">Which countries are most critical?</p>
            </div>
            <span className="chart-icon">🏆</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCountriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="materials" fill="#0B6FCC" name="Materials" />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            💡 <strong>Insight:</strong> US + Sweden = core manufacturing backbone (286 materials combined)
          </div>
        </div>

        {/* Chart 4: Top Inventory Locations */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Top Inventory Locations</h3>
              <p className="chart-subtitle">Where is inventory concentrated?</p>
            </div>
            <span className="chart-icon">📍</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topInventoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" angle={-15} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="materials" fill="#4CAF50" name="Material Count" />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            💡 <strong>Insight:</strong> High concentration at Mt Vernon & Sweden → working capital lock + risk
          </div>
        </div>

        {/* Chart 5: Capacity Utilization */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Capacity Utilization by Site</h3>
              <p className="chart-subtitle">Which sites are at risk of overload?</p>
            </div>
            <span className="chart-icon">⚠️</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={capacityUtilizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="site" angle={-15} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="utilization" name="Utilization %">
                {capacityUtilizationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.utilization)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            💡 <strong>Insight:</strong> Clear bottleneck at Mt Vernon/Sweden vs available capacity in Puerto Rico
          </div>
        </div>

        {/* Chart 6: Manufacturing Stages */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Manufacturing Stage Distribution</h3>
              <p className="chart-subtitle">Where do most materials sit in the process?</p>
            </div>
            <span className="chart-icon">🏭</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={manufacturingStagesData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {manufacturingStagesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            💡 <strong>Insight:</strong> Majority in finished/near-market stages → fast distribution model
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <div className="footer-info">
          <span>📅 Analysis Date: 2026-04-13</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
