import { useState, useEffect, useRef } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Label
} from 'recharts';
import GraphVisualization from './GraphVisualization';
import { processChatQuery } from '../services/chatService';
import './ChatQuery.css';

// Typing Animation Component
const TypingIndicator = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

// Animated Text Component
const AnimatedText = ({ text, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      {!isComplete && <span className="cursor-blink">|</span>}
    </span>
  );
};

// Question-aware business dashboard
const LABEL_COLORS = {
  API: '#4A90D9',
  Formulation: '#7B68EE',
  Packing: '#F5A623',
  Storage: '#50C878',
  Customer_Market: '#E74C3C',
  Intermediate: '#9B59B6',
  RSM: '#1ABC9C',
  RM: '#E67E22',
  Unknown: '#95A5A6',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
      <strong>{label || payload[0].payload?.name}</strong>: {payload[0].value}
    </div>
  );
};

const buildChartConfig = (question, nodes, relationships = []) => {
  const q = question.toLowerCase();

  // Q: single API supplier / dependent → show formulation sites and their sole supplier
  if (q.includes('single api') || (q.includes('dependent') && q.includes('supplier'))) {
    const formSites = nodes
      .filter(n => n.labels?.[0] === 'Formulation')
      .map(n => ({ name: n.properties?.site_name || n.properties?.id || '—', value: 1, country: n.properties?.site_country_name || '' }));
    return { title: 'Single-Source Formulation Sites (API Dependency Risk)', dataKey: 'value', labelKey: 'name', data: formSites, type: 'bar', color: '#E74C3C', xLabel: 'Site', yLabel: 'Single Supplier' };
  }

  // Q: suppliers / vendor / api feeding into a site → show vendor names as bars
  if (q.includes('supplier') || q.includes('feed into') || (q.includes('api') && q.includes('supplier'))) {
    const data = nodes
      .filter(n => n.properties?.vendor_name)
      .map(n => ({
        name: n.properties.vendor_name,
        country: n.properties.vendor_country_name || '—',
        type: n.labels?.[0] || '—',
      }));
    // De-duplicate by vendor_name
    const seen = new Set();
    const unique = data.filter(d => { if (seen.has(d.name)) return false; seen.add(d.name); return true; });
    const chartData = unique.map(d => ({ name: d.name, value: 1, country: d.country }));
    return { title: 'API Vendors Supplying this Site', dataKey: 'value', labelKey: 'name', data: chartData, type: 'bar', color: '#4A90D9', xLabel: 'Vendor', yLabel: 'Connections' };
  }

  // Q: production / highest production → bar of site_name vs production_total_year
  if (q.includes('production')) {
    const nodeById = {};
    nodes.forEach(n => { nodeById[n.id] = n; });
    const prodEdges = relationships.filter(r => r.type === 'HAS_PRODUCTION_DATA');
    let data = [];
    if (prodEdges.length > 0) {
      const seen = new Set();
      prodEdges.forEach(edge => {
        const siteNode = nodeById[edge.startNode] || nodeById[edge.from];
        const pdNode = nodeById[edge.endNode] || nodeById[edge.to];
        if (!siteNode || !pdNode) return;
        const val = pdNode.properties?.production_total_year || 0;
        const name = siteNode.properties?.site_name || siteNode.properties?.id || '—';
        if (!seen.has(name) && val > 0) { seen.add(name); data.push({ name, value: Math.round(val) }); }
      });
      data = data.sort((a, b) => b.value - a.value).slice(0, 8);
    } else {
      data = nodes
        .filter(n => n.properties?.production_total_year > 0)
        .map(n => ({ name: n.properties?.site_name || n.properties?.id || '—', value: Math.round(n.properties.production_total_year) }))
        .sort((a, b) => b.value - a.value).slice(0, 8);
    }
    return { title: 'Production Total (Year)', dataKey: 'value', labelKey: 'name', data, type: 'bar', color: '#F5A623', xLabel: 'Site', yLabel: 'Production Volume' };
  }

  // Q: inventory → bar of site_name vs inventory_projected_value_API
  if (q.includes('inventory')) {
    const nodeById = {};
    nodes.forEach(n => { nodeById[n.id] = n; });
    const invEdges = relationships.filter(r => r.type === 'HAS_INVENTORY_DATA');
    let data = [];
    if (invEdges.length > 0) {
      const seen = new Set();
      invEdges.forEach(edge => {
        const siteNode = nodeById[edge.startNode] || nodeById[edge.from];
        const invNode = nodeById[edge.endNode] || nodeById[edge.to];
        if (!siteNode || !invNode) return;
        const val = invNode.properties?.inventory_projected_value_API || 0;
        const name = siteNode.properties?.site_name || siteNode.properties?.vendor_name || siteNode.properties?.id || '—';
        if (!seen.has(name) && val > 0) { seen.add(name); data.push({ name, value: val }); }
      });
      data = data.sort((a, b) => b.value - a.value).slice(0, 8);
    } else {
      data = nodes
        .filter(n => (n.properties?.inventory_projected_value_API || 0) > 0)
        .map(n => ({ name: n.properties?.site_name || n.properties?.id || '—', value: n.properties.inventory_projected_value_API }))
        .sort((a, b) => b.value - a.value).slice(0, 8);
    }
    return { title: 'API Inventory Projected Value ($)', dataKey: 'value', labelKey: 'name', data, type: 'bar', color: '#50C878', xLabel: 'Site', yLabel: 'Value ($)' };
  }

  // Q: countries with both formulation and packing → donut by country (node count per country)
  if ((q.includes('formulation') && q.includes('packing')) || (q.includes('both') && q.includes('formulation'))) {
    const countryMap = {};
    nodes.forEach(n => {
      const c = n.properties?.site_country_name;
      if (c) countryMap[c] = (countryMap[c] || 0) + 1;
    });
    const data = Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    return { title: 'Countries with Formulation & Packing Sites', data, type: 'pie' };
  }

  // Q: list sites in a specific country → bar of site names by stage
  if (q.includes('located in') || q.includes('in china') || q.includes('in india') || q.includes('in japan') || q.includes('in sweden') || q.includes('in usa') || q.includes('in us')) {
    const data = nodes
      .filter(n => n.properties?.site_name)
      .map(n => ({ name: n.properties.site_name, stage: n.labels?.[0] || 'Unknown', value: 1 }))
      .reduce((acc, n) => { if (!acc.find(x => x.name === n.name && x.stage === n.stage)) acc.push(n); return acc; }, [])
      .map(n => ({ name: `${n.name} (${n.stage})`, value: 1 }));
    return { title: 'Supply Chain Sites in Region', dataKey: 'value', labelKey: 'name', data, type: 'bar', color: '#E67E22', xLabel: 'Site', yLabel: 'Count' };
  }

  // Q: countries / external vendor / located in → donut by country
  if (q.includes('countr') || q.includes('external') || q.includes('located')) {
    const countryMap = nodes.reduce((acc, n) => {
      const c = n.properties?.vendor_country_name || n.properties?.site_country_name;
      if (c) acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const data = Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    return { title: 'Sites by Country', data, type: 'pie' };
  }

  // Q: downstream / connectivity / supply to → bar of formulation sites by downstream count
  if (q.includes('downstream') || q.includes('supply to') || q.includes('connectivity')) {
    const nodeById = {};
    nodes.forEach(n => { nodeById[n.id] = n; });
    const connMap = {};
    relationships.filter(r => r.type === 'SUPPLIES_TO').forEach(edge => {
      const siteNode = nodeById[edge.startNode] || nodeById[edge.from];
      if (!siteNode || siteNode.labels?.[0] !== 'Formulation') return;
      const name = siteNode.properties?.site_name || siteNode.properties?.id || '—';
      connMap[name] = (connMap[name] || 0) + 1;
    });
    const data = Object.entries(connMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    return { title: 'Downstream Connections per Formulation Site', dataKey: 'value', labelKey: 'name', data, type: 'bar', color: '#7B68EE', xLabel: 'Formulation Site', yLabel: 'Downstream Count' };
  }

  // Q: shared sites / both brands → bar by node type
  if (q.includes('both') || q.includes('shared')) {
    const typeMap = nodes.reduce((acc, n) => { const t = n.labels?.[0] || 'Unknown'; acc[t] = (acc[t] || 0) + 1; return acc; }, {});
    const data = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
    return { title: 'Shared Sites by Node Type', data, type: 'pie' };
  }

  // Q: customer markets → bar of customer market names (properties.labels has the display name)
  if (q.includes('customer') || q.includes('market')) {
    const seen = new Set();
    const markets = nodes
      .filter(n => n.labels?.[0] === 'Customer_Market')
      .map(n => {
        const label = n.properties?.labels;
        const name = (typeof label === 'string' && label) ? label : (n.properties?.id || '—');
        return { name, value: 1 };
      })
      .filter(m => { if (seen.has(m.name)) return false; seen.add(m.name); return true; });
    return { title: 'Customer Markets Served by Forxiga Packing Sites', dataKey: 'value', labelKey: 'name', data: markets, type: 'bar', color: '#E74C3C', xLabel: 'Market', yLabel: 'Count' };
  }

  // Default: node type breakdown as donut
  const typeMap = nodes.reduce((acc, n) => { const t = n.labels?.[0] || 'Unknown'; acc[t] = (acc[t] || 0) + 1; return acc; }, {});
  const data = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  return { title: 'Node Types in Result', data, type: 'pie' };
};

const QueryResultsDashboard = ({ graphData, userQuestion }) => {
  if (!graphData || graphData.nodes.length === 0) return null;
  const chart = buildChartConfig(userQuestion || '', graphData.nodes, graphData.relationships || []);

  return (
    <div className="query-dashboard">
      <div className="qd-header">📊 {chart.title}</div>
      <div className="qd-chart-body">
        <ResponsiveContainer width="100%" height={240}>
          {chart.type === 'pie' ? (
            <PieChart>
              <Pie data={chart.data} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                {chart.data.map((entry, i) => (
                  <Cell key={i} fill={LABEL_COLORS[entry.name] || `hsl(${i * 47}, 65%, 55%)`} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          ) : (
            <BarChart data={chart.data} margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={chart.labelKey} tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0}>
                {chart.xLabel && <Label value={chart.xLabel} position="insideBottom" offset={-15} style={{ fontSize: 12, fill: '#555', fontWeight: 600 }} />}
              </XAxis>
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false}>
                {chart.yLabel && <Label value={chart.yLabel} angle={-90} position="insideLeft" offset={10} style={{ fontSize: 12, fill: '#555', fontWeight: 600 }} />}
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={chart.dataKey} fill={chart.color || '#0B6FCC'} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ChatQuery = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [showTyping, setShowTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  // Hardcoded questions from chatService.js - User can ONLY click these
  const sampleQuestions = [
    {
      text: "which tagrisso api suppliers feed into the snackviken formulation site",
      icon: "🧪",
      description: "Tagrisso API Suppliers → SE Snäckviken"
    },
    {
      text: "which forxiga formulation sites are dependent on a single api supplier",
      icon: "⚠️",
      description: "Forxiga Single-Source API Risk"
    },
    {
      text: "which tagrisso nodes are external vendor sites and what countries are they in",
      icon: "🌍",
      description: "Tagrisso External Vendor Sites"
    },
    {
      text: "show forxiga nodes where api inventory projected value is greater than 1 million",
      icon: "💰",
      description: "Forxiga High API Inventory"
    },
    {
      text: "which tagrisso packing sites have the highest production total year",
      icon: "📦",
      description: "Tagrisso Top Packing Production"
    },
    {
      text: "list all forxiga supply chain sites located in china",
      icon: "🇨🇳",
      description: "Forxiga China Sites"
    },
    {
      text: "which countries have both a formulation and a packing site for tagrisso",
      icon: "🗺️",
      description: "Tagrisso Formulation + Packing Countries"
    },
    {
      text: "are there any sites that appear in both forxiga and tagrisso supply chains",
      icon: "🔄",
      description: "Shared Sites Across Both Brands"
    },
    {
      text: "show all customer markets supplied by forxiga packing sites",
      icon: "🏪",
      description: "Forxiga Customer Markets"
    },
    {
      text: "which forxiga formulation sites supply to more than 5 downstream nodes",
      icon: "🔗",
      description: "Forxiga High-Connectivity Formulation Sites"
    }
  ];

  const handleSampleClick = async (question) => {
    if (isProcessing) return;

    // Create user message showing the selected question
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setShowTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setShowTyping(false);

    // Add thinking message
    const thinkingMessage = {
      id: Date.now() + 1,
      type: 'agent',
      step: 'thinking',
      text: '🤔 Understanding your question...',
      timestamp: new Date(),
      animated: true
    };
    setMessages(prev => [...prev, thinkingMessage]);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Add query generation message
    const queryGenMessage = {
      id: Date.now() + 2,
      type: 'agent',
      step: 'generating',
      text: '🔍 Generating Cypher query...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, queryGenMessage]);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Process the query
    try {
      const result = await processChatQuery(question);

      // Add query display message
      const queryMessage = {
        id: Date.now() + 3,
        type: 'agent',
        step: 'query',
        text: '📝 Generated Query:',
        query: result.query,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, queryMessage]);

      await new Promise(resolve => setTimeout(resolve, 800));

      // Add executing message
      const executingMessage = {
        id: Date.now() + 4,
        type: 'agent',
        step: 'executing',
        text: '⚡ Executing on Neo4j database...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, executingMessage]);

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add NLP analysis message
      const nlpAnalysisMessage = {
        id: Date.now() + 4.5,
        type: 'agent',
        step: 'analyzing',
        text: '🤖 Analyzing results with NLP...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, nlpAnalysisMessage]);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add NLP answer
      const nlpAnswerMessage = {
        id: Date.now() + 4.7,
        type: 'agent',
        step: 'nlp-answer',
        text: '💡 AI Analysis:',
        nlpAnswer: result.nlpAnswer,
        timestamp: new Date(),
        animated: true
      };
      setMessages(prev => [...prev, nlpAnswerMessage]);

      await new Promise(resolve => setTimeout(resolve, 800));

      // Prepare job data for GraphVisualization
      const job = {
        jobId: 'chat_query_001',
        userQuestion: question, // Pass the user's question for context-aware dashboards
        nodes: result.graphData.nodes,
        relationships: result.graphData.relationships,
        availableAlgorithms: [
          {
            id: 'nodeSimilarity',
            name: 'Node Similarity',
            description: 'Computes similarity between nodes based on their neighborhoods',
            category: 'similarity',
            tier: 'beta'
          },
          {
            id: 'shortestPath',
            name: 'Shortest Path',
            description: 'Finds the shortest path between two nodes',
            category: 'path-finding',
            tier: 'production'
          },
          {
            id: 'betweenness',
            name: 'Betweenness Centrality',
            description: 'Identify single points of failure — nodes that control the most supply routes',
            category: 'centrality',
            tier: 'production'
          }
        ]
      };

      setJobData(job);
      setGraphData(result.graphData);

      // Generate detailed summary based on graph data
      const nodeTypes = result.graphData.nodes.reduce((acc, node) => {
        const label = node.labels[0];
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {});

      const summaryParts = Object.entries(nodeTypes)
        .map(([label, count]) => `${count} ${label}${count > 1 ? 's' : ''}`)
        .join(', ');

      // Add success message with rich summary
      const successMessage = {
        id: Date.now() + 5,
        type: 'agent',
        step: 'success',
        text: `✅ Query executed successfully!`,
        summary: `📊 **Results Summary:**\n\n` +
                 `• Total Nodes: ${result.graphData.nodes.length}\n` +
                 `• Total Relationships: ${result.graphData.relationships.length}\n` +
                 `• Breakdown: ${summaryParts}\n\n` +
                 `The graph visualization on the right shows the complete network structure with interactive nodes and relationships.`,
        timestamp: new Date(),
        animated: true
      };
      setMessages(prev => [...prev, successMessage]);

    } catch (error) {
      console.error('Error processing query:', error);
      const errorMessage = {
        id: Date.now() + 6,
        type: 'agent',
        step: 'error',
        text: `❌ Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`chat-query-container ${isExpanded ? 'expanded' : ''}`}>
      {/* Left Side - Chat Interface */}
      <div className="chat-panel">
        <div className="chat-header">
          <div className="header-left">
            <h3>💬 AI Graph Query Assistant</h3>
            <p>Ask questions in natural language</p>
          </div>
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? '⬅️ Collapse' : '⬆️ Expand'}
          </button>
        </div>

        {/* Sample Questions - Show only when no messages */}
        {messages.length === 0 && (
          <div className="sample-questions">
            <h4>📋 Select a Question:</h4>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                className="sample-question-btn"
                onClick={() => handleSampleClick(q.text)}
                disabled={isProcessing}
              >
                <span className="question-icon">{q.icon}</span>
                <div className="question-content">
                  <div className="question-desc">{q.text}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.type}`}>
              {msg.type === 'user' ? (
                <div className="message-content user-message">
                  <div className="message-text">{msg.text}</div>
                </div>
              ) : (
                <div className={`message-content agent-message step-${msg.step}`}>
                  <div className="message-text">
                    {msg.animated ? <AnimatedText text={msg.text} speed={20} /> : msg.text}
                  </div>
                  {msg.query && (
                    <div className="query-block">
                      <code>{msg.query}</code>
                    </div>
                  )}
                  {msg.nlpAnswer && (
                    <div className="nlp-answer-block">
                      {msg.nlpAnswer.split('\n').map((line, i) => (
                        <div key={i} className="nlp-line">
                          {line.includes('**') ? (
                            <span dangerouslySetInnerHTML={{
                              __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }} />
                          ) : (
                            line
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.summary && (
                    <div className="summary-block">
                      {msg.summary.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {showTyping && (
            <div className="message agent">
              <div className="message-content agent-message">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Hidden, questions are selected from buttons above */}
        <div className="chat-input-container" style={{ display: 'none' }}>
          <textarea
            className="chat-input"
            placeholder="Select a question above..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={true}
            rows={2}
          />
        </div>
      </div>

      {/* Right Side - Graph Visualization + Dashboard */}
      <div className="graph-panel">
        {!graphData ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No Results Yet</h3>
            <p>Ask a question to see the graph visualization</p>
          </div>
        ) : (
          <div className="graph-and-dashboard">
            <div className="chat-graph-wrapper">
              <GraphVisualization
                externalJobData={jobData}
                externalGraphData={graphData}
              />
            </div>
            <QueryResultsDashboard graphData={graphData} userQuestion={jobData?.userQuestion} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatQuery;
