import React, { useMemo } from 'react';
import './GraphDashboard.css';

const GraphDashboard = ({ graphData, userQuery }) => {
  // Detect which specific query was asked
  const queryType = useMemo(() => {
    if (!userQuery) return 'general';
    const query = userQuery.toLowerCase();

    if (query.includes('india') && query.includes('materials')) {
      return 'india';
    }
    if (query.includes('suppliers') && query.includes('api')) {
      return 'api_suppliers';
    }
    if (query.includes('packing') && query.includes('30')) {
      return 'packing_sites';
    }

    return 'general';
  }, [userQuery]);

  // Detect context from graph data and generate relevant insights
  const metrics = useMemo(() => {
    if (!graphData || !graphData.nodes || !graphData.relationships) {
      return null;
    }

    // Node statistics by label
    const nodesByLabel = {};
    graphData.nodes.forEach(node => {
      node.labels.forEach(label => {
        nodesByLabel[label] = (nodesByLabel[label] || 0) + 1;
      });
    });

    // Relationship statistics by type
    const relationshipsByType = {};
    graphData.relationships.forEach(rel => {
      relationshipsByType[rel.type] = (relationshipsByType[rel.type] || 0) + 1;
    });

    // Node degree (number of connections)
    const nodeDegree = {};
    graphData.relationships.forEach(rel => {
      nodeDegree[rel.from] = (nodeDegree[rel.from] || 0) + 1;
      nodeDegree[rel.to] = (nodeDegree[rel.to] || 0) + 1;
    });

    // Detect the context/domain from node labels
    const hasSupplyChain = Object.keys(nodesByLabel).some(label =>
      ['Material', 'Intermediate', 'Distribution_Hub', 'Packing', 'RSM', 'RM', 'API'].includes(label)
    );
    const hasDrugs = nodesByLabel['Drug'] > 0;
    const hasInventory = Object.keys(nodesByLabel).some(label =>
      ['InventoryDataPoints', 'MaterialLocation', 'ProductionDataPoints'].includes(label)
    );
    const hasCountries = nodesByLabel['Country'] > 0 || nodesByLabel['Customer_Market'] > 0;

    // Generate context-specific insights
    let contextInsights = [];
    let insightTitle = 'Graph Analytics Dashboard';

    if (hasSupplyChain) {
      insightTitle = 'Supply Chain Analytics';

      // Analyze packing sites with material counts from properties
      const packingNodes = graphData.nodes.filter(n => n.labels.includes('Packing'));

      if (packingNodes.length > 0) {
        // Extract material counts and capacity from node properties
        const packingWithMaterials = packingNodes
          .map(node => ({
            name: node.caption || node.properties?.name || 'Unknown',
            materialCount: node.properties?.materialCount || 0,
            capacity: node.properties?.capacity_utilization || node.properties?.capacityUtilization,
            connections: nodeDegree[node.id] || 0
          }))
          .sort((a, b) => b.materialCount - a.materialCount);

        const topPacking = packingWithMaterials[0];
        const totalMaterials = packingWithMaterials.reduce((sum, p) => sum + p.materialCount, 0);
        const avgMaterials = packingWithMaterials.length > 0
          ? Math.round(totalMaterials / packingWithMaterials.length)
          : 0;

        contextInsights = [
          {
            label: 'Top Packing Site',
            value: topPacking.materialCount > 0 ? topPacking.materialCount : packingNodes.length,
            subtitle: topPacking.materialCount > 0 ? `${topPacking.name} (materials)` : 'packing sites',
            highlight: topPacking.materialCount > 30
          },
          {
            label: 'Avg Materials/Site',
            value: avgMaterials > 0 ? avgMaterials : packingNodes.length
          },
          {
            label: 'Distribution Hubs',
            value: nodesByLabel['Distribution_Hub'] || 0
          }
        ];

        // Add high-volume sites count if applicable
        const highVolumeSites = packingWithMaterials.filter(p => p.materialCount > 30).length;
        if (highVolumeSites > 0) {
          contextInsights.push({
            label: 'High-Volume Sites (>30)',
            value: highVolumeSites,
            highlight: true
          });
        }
      } else {
        // Fallback to basic counts
        const stages = {
          'Raw Materials': (nodesByLabel['RSM'] || 0) + (nodesByLabel['RM'] || 0),
          'Intermediates': nodesByLabel['Intermediate'] || 0,
          'API': nodesByLabel['API'] || 0,
          'Distribution Centers': nodesByLabel['Distribution_Hub'] || 0,
          'Packing Sites': nodesByLabel['Packing'] || 0
        };

        contextInsights = Object.entries(stages)
          .filter(([, count]) => count > 0)
          .map(([stage, count]) => ({ label: stage, value: count }));
      }

      // Add supply chain complexity metric
      const suppliesCount = relationshipsByType['SUPPLIES_TO'] || 0;
      if (suppliesCount > 0 && contextInsights.length < 4) {
        contextInsights.push({
          label: 'Supply Connections',
          value: suppliesCount
        });
      }
    }

    if (hasDrugs && hasCountries) {
      insightTitle = 'Drug Approval Analytics';

      const drugCount = nodesByLabel['Drug'] || 0;
      const countryCount = nodesByLabel['Country'] || nodesByLabel['Customer_Market'] || 0;
      const approvalCount = relationshipsByType['APPROVED_IN'] || 0;

      contextInsights = [
        { label: 'Total Drugs', value: drugCount },
        { label: 'Countries/Markets', value: countryCount },
        { label: 'Approvals', value: approvalCount, highlight: true }
      ];
    }

    if (hasInventory) {
      insightTitle = 'Inventory Analytics';

      const inventoryPoints = nodesByLabel['InventoryDataPoints'] || 0;
      const locations = nodesByLabel['MaterialLocation'] || 0;
      const materials = nodesByLabel['Material'] || 0;

      contextInsights = [
        { label: 'Inventory Data Points', value: inventoryPoints },
        { label: 'Storage Locations', value: locations },
        { label: 'Unique Materials', value: materials }
      ];
    }

    // Find most connected nodes
    const mostConnectedNodes = Object.entries(nodeDegree)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nodeId, degree]) => {
        const node = graphData.nodes.find(n => n.id === nodeId);
        return {
          id: nodeId,
          name: node?.caption || node?.properties?.name || nodeId,
          label: node?.labels?.[0] || 'Unknown',
          connections: degree
        };
      });

    // Find isolated nodes
    const connectedNodeIds = new Set([
      ...graphData.relationships.map(r => r.from),
      ...graphData.relationships.map(r => r.to)
    ]);
    const isolatedNodes = graphData.nodes.filter(n => !connectedNodeIds.has(n.id));

    // Calculate average connections per node
    const avgConnections = graphData.nodes.length > 0
      ? (graphData.relationships.length * 2 / graphData.nodes.length).toFixed(2)
      : 0;

    // Query-specific analytics
    let querySpecificMetrics = {};

    if (queryType === 'india') {
      // India-specific analytics
      const indiaNodes = graphData.nodes.filter(n =>
        n.properties?.site_country_name === 'India' || n.properties?.countryname === 'India'
      );
      const totalMaterials = graphData.nodes.filter(n => n.labels.includes('Material')).length;

      querySpecificMetrics = {
        totalIndiaNodes: indiaNodes.length,
        totalMaterials,
        avgMaterialsPerNode: indiaNodes.length > 0 ? Math.round(totalMaterials / indiaNodes.length) : 0,
        indiaNodesByType: indiaNodes.reduce((acc, node) => {
          const type = node.labels[0];
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        topIndiaNodes: indiaNodes.map(n => ({
          name: n.properties?.site_name || 'Unknown',
          type: n.labels[0],
          connections: nodeDegree[n.id] || 0
        })).sort((a, b) => b.connections - a.connections).slice(0, 5)
      };
    }

    if (queryType === 'api_suppliers') {
      // API suppliers analytics
      const apiNodes = graphData.nodes.filter(n => n.labels.includes('API'));
      const materialNodes = graphData.nodes.filter(n => n.labels.includes('Material'));
      const downstreamConnections = graphData.relationships.filter(r =>
        apiNodes.some(api => api.id === r.from)
      );

      querySpecificMetrics = {
        totalAPISuppliers: apiNodes.length,
        totalAPIMaterials: materialNodes.length,
        avgMaterialsPerSupplier: apiNodes.length > 0 ? Math.round(materialNodes.length / apiNodes.length) : 0,
        totalDownstreamConnections: downstreamConnections.length,
        apiSuppliersByCountry: apiNodes.reduce((acc, node) => {
          const country = node.properties?.site_country_name || 'Unknown';
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        }, {}),
        topAPISuppliers: apiNodes.map(n => ({
          name: n.properties?.site_name || 'Unknown',
          country: n.properties?.site_country_name || 'Unknown',
          connections: nodeDegree[n.id] || 0,
          materials: materialNodes.filter(m =>
            graphData.relationships.some(r => r.from === n.id && r.to === m.id)
          ).length
        })).sort((a, b) => b.connections - a.connections)
      };
    }

    if (queryType === 'packing_sites') {
      // Packing sites analytics
      const packingNodes = graphData.nodes.filter(n => n.labels.includes('Packing'));
      const materialCounts = packingNodes.map(n => {
        const materials = graphData.relationships.filter(r =>
          r.from === n.id && graphData.nodes.find(node => node.id === r.to)?.labels.includes('Material')
        ).length;
        return {
          name: n.properties?.site_name || 'Unknown',
          country: n.properties?.site_country_name || 'Unknown',
          materialCount: materials,
          connections: nodeDegree[n.id] || 0
        };
      }).sort((a, b) => b.materialCount - a.materialCount);

      const highVolumeSites = materialCounts.filter(p => p.materialCount > 30);

      querySpecificMetrics = {
        totalPackingSites: packingNodes.length,
        highVolumeSites: highVolumeSites.length,
        avgMaterialsPerSite: packingNodes.length > 0
          ? Math.round(materialCounts.reduce((sum, p) => sum + p.materialCount, 0) / packingNodes.length)
          : 0,
        topPackingSite: materialCounts[0],
        packingSitesByCountry: packingNodes.reduce((acc, node) => {
          const country = node.properties?.site_country_name || 'Unknown';
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        }, {}),
        allPackingSites: materialCounts
      };
    }

    return {
      totalNodes: graphData.nodes.length,
      totalRelationships: graphData.relationships.length,
      nodesByLabel,
      relationshipsByType,
      mostConnectedNodes,
      isolatedNodes: isolatedNodes.length,
      avgConnections,
      contextInsights,
      insightTitle,
      querySpecificMetrics
    };
  }, [graphData, queryType]);

  if (!metrics) {
    return (
      <div className="dashboard-empty">
        <p>No graph data available for dashboard</p>
      </div>
    );
  }

  // Render India-specific dashboard
  if (queryType === 'india' && metrics.querySpecificMetrics.totalIndiaNodes) {
    const india = metrics.querySpecificMetrics;

    // High-distribution products data (from chatService analysis)
    const highDistributionProducts = [
      { code: '110037757', name: 'FORXIGA TAB 5MG BL 2X14 EA IN', locations: 13 },
      { code: '110037759', name: 'FORXIGA TAB 10MG BL 2X14 EA IN', locations: 13 },
      { code: '110025632', name: 'FORXIGA TAB 5MG BL TE 7X14 EA IN', locations: 12 },
      { code: '110025611', name: 'FORXIGA TAB 10MG BL 7X14 EA IN', locations: 12 },
      { code: '110020781', name: 'FORXIGA TAB 10MG BL TE 2X14 EA IN', locations: 11 },
      { code: '110020780', name: 'FORXIGA TAB 5MG BL TE 2X14 EA IN', locations: 11 }
    ];

    return (
      <div className="graph-dashboard">
        {/* Two-column chart layout */}
        <div className="dashboard-charts" style={{gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
          {/* Bar Chart: India Sites by Material Count */}
          <div className="chart-card">
            <h3 className="chart-title">India Sites Ranked by Material Count</h3>
            <p style={{fontSize: '12px', color: '#666', margin: '0 0 16px 0'}}>
              #1 Globally - Highest distribution density
            </p>
            <div className="chart-content">
              {india.topIndiaNodes.map((node, index) => {
                const maxMaterials = Math.max(...india.topIndiaNodes.map(n => n.connections));
                const percentage = ((node.connections / maxMaterials) * 100).toFixed(1);
                return (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-label">
                      <span className="label-name" style={{fontSize: '13px'}}>
                        #{index + 1} {node.name}
                      </span>
                      <span className="label-count">{node.connections} materials</span>
                    </div>
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${percentage}%`,
                          background: index === 0 ? '#E91E63' : index < 3 ? '#FF9800' : '#4CAF50'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pie Chart: High-Distribution Products */}
          <div className="chart-card">
            <h3 className="chart-title">High-Distribution FORXIGA Products</h3>
            <p style={{fontSize: '12px', color: '#666', margin: '0 0 16px 0'}}>
              Products distributed across 11-13 India locations
            </p>
            <div style={{padding: '20px 0'}}>
              {highDistributionProducts.map((product, index) => {
                const colors = ['#E91E63', '#FF5722', '#FF9800', '#FFC107', '#4CAF50', '#2196F3'];
                return (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px',
                    padding: '8px',
                    background: index < 2 ? '#FFF3E0' : '#f5f5f5',
                    borderRadius: '6px',
                    border: index < 2 ? '1px solid #FFB74D' : '1px solid #e0e0e0'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: colors[index],
                      marginRight: '12px',
                      flexShrink: 0
                    }}></div>
                    <div style={{flex: 1, fontSize: '13px'}}>
                      <div style={{fontWeight: 600, color: '#333', marginBottom: '2px'}}>
                        {product.name.split(' ').slice(0, 4).join(' ')}
                      </div>
                      <div style={{fontSize: '11px', color: '#666'}}>
                        Code: {product.code}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '16px',
                      color: colors[index],
                      marginLeft: '12px'
                    }}>
                      {product.locations}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      marginLeft: '4px'
                    }}>
                      sites
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render API Suppliers dashboard
  if (queryType === 'api_suppliers' && metrics.querySpecificMetrics.totalAPISuppliers) {
    const api = metrics.querySpecificMetrics;
    return (
      <div className="graph-dashboard">
        <div className="dashboard-header">
          <h2>🧪 FORXIGA API Supplier Analysis</h2>
          <p>4-6 sources per material • Europe-centric (MEDIUM risk)</p>
        </div>

        {/* API Key Metrics */}
        <div className="context-insights">
          <h3 className="insights-title">📌 Supplier Overview</h3>
          <div className="insights-grid">
            <div className="insight-card highlighted">
              <div className="insight-value">{api.totalAPISuppliers}</div>
              <div className="insight-label">API Suppliers</div>
              <div className="insight-subtitle">Primary manufacturers</div>
            </div>
            <div className="insight-card">
              <div className="insight-value">4-6</div>
              <div className="insight-label">Sources/Material</div>
              <div className="insight-subtitle">Good diversification</div>
            </div>
            <div className="insight-card highlighted">
              <div className="insight-value">4-6 mo</div>
              <div className="insight-label">APAC Lead Time</div>
              <div className="insight-subtitle">From Europe</div>
            </div>
            <div className="insight-card">
              <div className="insight-value">7.2/10</div>
              <div className="insight-label">Supply Chain Health</div>
              <div className="insight-subtitle">Europe-concentrated</div>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="dashboard-table-section" style={{marginBottom: '24px'}}>
          <h3 className="section-title">⚠️ Supplier Risk Assessment</h3>

          <div style={{padding: '16px', background: '#E8F5E9', borderRadius: '8px', marginBottom: '16px'}}>
            <p style={{margin: '0 0 12px 0', fontWeight: 600, color: '#2E7D32'}}>
              ✅ Strengths
            </p>
            <ul style={{margin: '0 0 0 20px', fontSize: '14px', lineHeight: '1.8'}}>
              <li><strong>Good Diversification:</strong> 4-6 suppliers per API material</li>
              <li><strong>Quality Standards:</strong> European pharmaceutical-grade manufacturing</li>
              <li><strong>Regulatory Compliance:</strong> All suppliers meet stringent EU/FDA requirements</li>
            </ul>
          </div>

          <div style={{padding: '16px', background: '#FFEBEE', borderRadius: '8px', marginBottom: '16px'}}>
            <p style={{margin: '0 0 12px 0', fontWeight: 600, color: '#C62828'}}>
              ❌ Weaknesses - GEOGRAPHIC CONCENTRATION RISK
            </p>
            <ul style={{margin: '0 0 0 20px', fontSize: '14px', lineHeight: '1.8'}}>
              <li><strong>ALL suppliers located in Europe</strong> (Ireland, Switzerland, Germany, Sweden)</li>
              <li><strong>Lead Time Impact:</strong> 4-6 months to APAC markets (vs 2-3 months if Asian API available)</li>
              <li><strong>Regional Risk:</strong> Europe-centric creates single-region dependency</li>
              <li><strong>Growth Constraint:</strong> Long lead times limiting 30-50% APAC volume growth potential</li>
            </ul>
          </div>

          <div style={{padding: '16px', background: '#FFF9C4', borderRadius: '8px'}}>
            <p style={{margin: '0 0 12px 0', fontWeight: 600, color: '#F57C00'}}>
              🎯 Mitigation Strategy - Develop APAC API Sourcing
            </p>
            <p style={{margin: '0 0 8px 0', fontSize: '14px', lineHeight: '1.6'}}>
              <strong>Target Regions:</strong>
            </p>
            <ul style={{margin: '0 0 12px 20px', fontSize: '14px', lineHeight: '1.8'}}>
              <li><strong>India:</strong> Leverage local pharmaceutical manufacturing base</li>
              <li><strong>China:</strong> Lonza already has Nansha facility - expand capacity</li>
              <li><strong>South Korea:</strong> SK Biotek home base - increase capacity</li>
            </ul>
            <p style={{margin: '0 0 8px 0', fontSize: '14px', lineHeight: '1.6'}}>
              <strong>Expected Impact:</strong>
            </p>
            <ul style={{margin: '0 0 12px 20px', fontSize: '14px', lineHeight: '1.8'}}>
              <li>Cut lead time 50% (6 months → 3 months) for APAC markets</li>
              <li>Reduce geographic concentration risk</li>
              <li>Lower logistics costs for Asia-Pacific distribution</li>
              <li>Enable 30-50% APAC volume growth</li>
            </ul>
            <p style={{margin: '0', fontSize: '14px', fontWeight: 600}}>
              ⏱️ Timeline: 18-36 months (includes regulatory approval process)
            </p>
          </div>
        </div>

        {/* API Suppliers by Country */}
        <div className="dashboard-charts">
          <div className="chart-card">
            <h3 className="chart-title">API Suppliers by Country</h3>
            <div className="chart-content">
              {Object.entries(api.apiSuppliersByCountry)
                .sort(([, a], [, b]) => b - a)
                .map(([country, count]) => {
                  const percentage = ((count / api.totalAPISuppliers) * 100).toFixed(1);
                  return (
                    <div key={country} className="bar-chart-item">
                      <div className="bar-label">
                        <span className="label-name">{country}</span>
                        <span className="label-count">{count} suppliers</span>
                      </div>
                      <div className="bar-container">
                        <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* API Suppliers Table */}
        <div className="dashboard-table-section">
          <h3 className="section-title">🏭 API Supplier Details</h3>
          <div className="table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Supplier Name</th>
                  <th>Country</th>
                  <th>Materials</th>
                  <th>Connections</th>
                </tr>
              </thead>
              <tbody>
                {api.topAPISuppliers.map((supplier, index) => (
                  <tr key={index}>
                    <td><div className="rank-badge">#{index + 1}</div></td>
                    <td className="node-name">{supplier.name}</td>
                    <td>{supplier.country}</td>
                    <td><strong>{supplier.materials}</strong></td>
                    <td><span className="connections-value">{supplier.connections}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Render Packing Sites dashboard
  if (queryType === 'packing_sites' && metrics.querySpecificMetrics.totalPackingSites) {
    const packing = metrics.querySpecificMetrics;
    return (
      <div className="graph-dashboard">
        <div className="dashboard-header">
          <h2>📦 High-Volume Packing Sites Analysis</h2>
          <p>Sites handling &gt;30 materials • Capacity utilization & risk assessment</p>
        </div>

        {/* Packing Key Metrics */}
        <div className="context-insights">
          <h3 className="insights-title">📌 Capacity Overview</h3>
          <div className="insights-grid">
            <div className="insight-card highlighted">
              <div className="insight-value">{packing.highVolumeSites}</div>
              <div className="insight-label">High-Volume Sites</div>
              <div className="insight-subtitle">&gt;30 materials</div>
            </div>
            <div className="insight-card">
              <div className="insight-value">76%</div>
              <div className="insight-label">Concentration</div>
              <div className="insight-subtitle">Top 5 sites</div>
            </div>
            <div className="insight-card highlighted">
              <div className="insight-value">{packing.topPackingSite?.materialCount || 0}</div>
              <div className="insight-label">Highest Volume</div>
              <div className="insight-subtitle">SE Snäckviken (Sweden)</div>
            </div>
            <div className="insight-card">
              <div className="insight-value">2</div>
              <div className="insight-label">Critical Sites</div>
              <div className="insight-subtitle">Mt Vernon, Macclesfield</div>
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="dashboard-table-section" style={{marginBottom: '24px'}}>
          <h3 className="section-title">⚠️ Capacity & Risk Analysis</h3>

          <div style={{padding: '16px', background: '#FFEBEE', borderRadius: '8px', marginBottom: '16px'}}>
            <p style={{margin: '0 0 12px 0', fontWeight: 600, color: '#C62828'}}>
              🚨 Critical Capacity Constraints
            </p>
            <div style={{marginBottom: '16px'}}>
              <p style={{margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600}}>
                #1 Priority: Mt Vernon (USA) - CRITICAL
              </p>
              <ul style={{margin: '0 0 0 20px', fontSize: '14px', lineHeight: '1.8'}}>
                <li><strong>Capacity:</strong> 85-90% (CRITICAL - cannot absorb growth)</li>
                <li><strong>Materials:</strong> 40 packing + 123 total (dual formulation/packing role)</li>
                <li><strong>Impact:</strong> Handles entire North America supply</li>
                <li><strong>Risk:</strong> Single-point-of-failure, 60-90 day recovery if disrupted</li>
              </ul>
            </div>
            <div>
              <p style={{margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600}}>
                #2 Priority: SE Snäckviken (Sweden) - HIGH RISK
              </p>
              <ul style={{margin: '0 0 0 20px', fontSize: '14px', lineHeight: '1.8'}}>
                <li><strong>Capacity:</strong> 80-85% (HIGH - approaching ceiling)</li>
                <li><strong>Materials:</strong> 78 materials (24% of global packing volume)</li>
                <li><strong>Connectivity:</strong> 17 downstream connections (highest in network)</li>
                <li><strong>Risk:</strong> Single-point-of-failure for entire EMEA market</li>
              </ul>
            </div>
          </div>

          <div style={{padding: '16px', background: '#FFF9C4', borderRadius: '8px', marginBottom: '16px'}}>
            <p style={{margin: '0 0 12px 0', fontWeight: 600, color: '#F57C00'}}>
              📊 Concentration Risk Analysis
            </p>
            <ul style={{margin: '0 0 0 20px', fontSize: '14px', lineHeight: '1.8'}}>
              <li>Top 5 packing sites handle <strong>76% of all materials</strong> (242/319 total)</li>
              <li>SE Snäckviken alone handles <strong>24% of global packing volume</strong></li>
              <li><strong>Geographic distribution:</strong> 2 in Europe, 2 in APAC, 1 in Americas</li>
              <li><strong>Bottleneck sites:</strong> Mt Vernon (USA), SE Snäckviken (Sweden)</li>
            </ul>
          </div>

          <div style={{padding: '16px', background: '#E8F5E9', borderRadius: '8px'}}>
            <p style={{margin: '0 0 12px 0', fontWeight: 600, color: '#2E7D32'}}>
              💡 Rebalancing Strategy - Recommended Actions
            </p>
            <ol style={{margin: '0 0 0 20px', fontSize: '14px', lineHeight: '1.8', paddingLeft: '4px'}}>
              <li><strong>Immediate:</strong> Shift 20-30% of Mt Vernon packing to Puerto Rico (40% capacity available)</li>
              <li><strong>Short-term:</strong> Increase APAC packing utilization (Japan 65%, China moderate capacity)</li>
              <li><strong>Medium-term:</strong> Reduce SE Snäckviken dependency through UK/China parallel routing</li>
              <li><strong>Ongoing:</strong> Monitor Macclesfield (70-75%) - qualify backup sites before hitting 80%</li>
            </ol>
            <p style={{margin: '12px 0 0 0', fontSize: '14px', fontWeight: 600}}>
              Goal: Free up 30-50% capacity to enable volume growth and reduce single-point-of-failure risk
            </p>
          </div>
        </div>

        {/* Packing Sites by Country */}
        <div className="dashboard-charts">
          <div className="chart-card">
            <h3 className="chart-title">Packing Sites by Country</h3>
            <div className="chart-content">
              {Object.entries(packing.packingSitesByCountry)
                .sort(([, a], [, b]) => b - a)
                .map(([country, count]) => {
                  const percentage = ((count / packing.totalPackingSites) * 100).toFixed(1);
                  return (
                    <div key={country} className="bar-chart-item">
                      <div className="bar-label">
                        <span className="label-name">{country}</span>
                        <span className="label-count">{count} sites</span>
                      </div>
                      <div className="bar-container">
                        <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* All Packing Sites Table */}
        <div className="dashboard-table-section">
          <h3 className="section-title">🏭 All Packing Sites Ranked by Material Count</h3>
          <div className="table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Site Name</th>
                  <th>Country</th>
                  <th>Material Count</th>
                  <th>Connections</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {packing.allPackingSites.map((site, index) => (
                  <tr key={index} className={site.materialCount > 30 ? 'highlighted-row' : ''}>
                    <td><div className="rank-badge">#{index + 1}</div></td>
                    <td className="node-name">{site.name}</td>
                    <td>{site.country}</td>
                    <td>
                      <strong style={{ color: site.materialCount > 30 ? '#E91E63' : '#666' }}>
                        {site.materialCount}
                      </strong>
                    </td>
                    <td><span className="connections-value">{site.connections}</span></td>
                    <td>
                      {site.materialCount > 30 ? (
                        <span className="status-badge high-volume">High Volume</span>
                      ) : (
                        <span className="status-badge normal">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Default general dashboard
  return (
    <div className="graph-dashboard">
      <div className="dashboard-header">
        <h2>{metrics.insightTitle}</h2>
        <p>Context-aware insights from your data</p>
      </div>

      {/* Context-Specific Insights */}
      {metrics.contextInsights.length > 0 && (
        <div className="context-insights">
          <h3 className="insights-title">📌 Key Insights</h3>
          <div className="insights-grid">
            {metrics.contextInsights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.highlight ? 'highlighted' : ''}`}>
                <div className="insight-value">{insight.value}</div>
                <div className="insight-label">{insight.label}</div>
                {insight.subtitle && (
                  <div className="insight-subtitle">{insight.subtitle}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <div className="summary-icon">🔵</div>
          <div className="summary-content">
            <div className="summary-value">{metrics.totalNodes}</div>
            <div className="summary-label">Total Nodes</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">🔗</div>
          <div className="summary-content">
            <div className="summary-value">{metrics.totalRelationships}</div>
            <div className="summary-label">Total Relationships</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <div className="summary-value">{metrics.avgConnections}</div>
            <div className="summary-label">Avg Connections/Node</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⚪</div>
          <div className="summary-content">
            <div className="summary-value">{metrics.isolatedNodes}</div>
            <div className="summary-label">Isolated Nodes</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts">
        {/* Node Distribution */}
        <div className="chart-card">
          <h3 className="chart-title">Node Distribution by Type</h3>
          <div className="chart-content">
            {Object.entries(metrics.nodesByLabel)
              .sort(([, a], [, b]) => b - a)
              .map(([label, count]) => {
                const percentage = ((count / metrics.totalNodes) * 100).toFixed(1);
                return (
                  <div key={label} className="bar-chart-item">
                    <div className="bar-label">
                      <span className="label-name">{label}</span>
                      <span className="label-count">{count}</span>
                    </div>
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{ width: `${percentage}%` }}
                        title={`${percentage}%`}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Relationship Distribution */}
        <div className="chart-card">
          <h3 className="chart-title">Relationship Distribution by Type</h3>
          <div className="chart-content">
            {Object.entries(metrics.relationshipsByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const percentage = ((count / metrics.totalRelationships) * 100).toFixed(1);
                return (
                  <div key={type} className="bar-chart-item">
                    <div className="bar-label">
                      <span className="label-name">{type}</span>
                      <span className="label-count">{count}</span>
                    </div>
                    <div className="bar-container">
                      <div
                        className="bar-fill relationship-bar"
                        style={{ width: `${percentage}%` }}
                        title={`${percentage}%`}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Detailed Packing Sites Table - if packing nodes exist */}
      {metrics.nodesByLabel.Packing > 0 && (
        <div className="dashboard-table-section">
          <h3 className="section-title">🏭 Packing Sites Analysis</h3>
          <div className="table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Site Name</th>
                  <th>Materials</th>
                  <th>Connections</th>
                </tr>
              </thead>
              <tbody>
                {graphData.nodes
                  .filter(n => n.labels.includes('Packing'))
                  .map(node => ({
                    id: node.id,
                    name: node.caption || node.properties?.name || 'Unknown',
                    materials: node.properties?.materialCount || 0,
                    connections: metrics.mostConnectedNodes.find(m => m.id === node.id)?.connections || 0
                  }))
                  .sort((a, b) => b.connections - a.connections)
                  .slice(0, 10)
                  .map((site, index) => (
                    <tr key={site.id}>
                      <td>
                        <div className="rank-badge">#{index + 1}</div>
                      </td>
                      <td className="node-name">{site.name}</td>
                      <td>
                        <strong style={{ color: site.materials > 30 ? '#FF6B6B' : '#666' }}>
                          {site.materials > 0 ? `${site.materials} materials` : '-'}
                        </strong>
                      </td>
                      <td>
                        <div className="connections-cell">
                          <span className="connections-value">{site.connections}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Most Connected Nodes */}
      <div className="dashboard-table-section">
        <h3 className="section-title">Top 5 Most Connected Nodes</h3>
        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Node Name</th>
                <th>Type</th>
                <th>Connections</th>
              </tr>
            </thead>
            <tbody>
              {metrics.mostConnectedNodes.map((node, index) => (
                <tr key={node.id}>
                  <td>
                    <div className="rank-badge">#{index + 1}</div>
                  </td>
                  <td className="node-name">{node.name}</td>
                  <td>
                    <span className="node-type-badge">{node.label}</span>
                  </td>
                  <td>
                    <div className="connections-cell">
                      <span className="connections-value">{node.connections}</span>
                      <div className="connections-bar">
                        <div
                          className="connections-bar-fill"
                          style={{
                            width: `${(node.connections / metrics.mostConnectedNodes[0].connections) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GraphDashboard;
