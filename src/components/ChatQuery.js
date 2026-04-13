import { useState, useEffect, useRef } from 'react';
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

const ChatQuery = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  // Hardcoded questions from chatService.js - User can ONLY click these
  const sampleQuestions = [
    // === OPERATIONAL QUESTIONS ===
    {
      text: "which forxiga manufacturing and packing sites are operating above 80% capacity",
      icon: "🏭",
      description: "High-Capacity Sites (>80%)"
    },
    {
      text: "which forxiga supply chain nodes are located in india and how many materials do they handle",
      icon: "🇮🇳",
      description: "India Supply Chain Network"
    },
    {
      text: "which suppliers provide forxiga api materials and how many sources exist per material",
      icon: "🧪",
      description: "API Suppliers & Sources"
    },
    {
      text: "which forxiga packing sites handle more than 30 materials",
      icon: "📦",
      description: "High-Volume Packing Sites"
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
    <div className="chat-query-container">
      {/* Left Side - Chat Interface */}
      <div className="chat-panel">
        <div className="chat-header">
          <h3>💬 AI Graph Query Assistant</h3>
          <p>Ask questions in natural language</p>
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

      {/* Right Side - Graph Visualization */}
      <div className="graph-panel">
        {!graphData ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No Results Yet</h3>
            <p>Ask a question to see the graph visualization</p>
          </div>
        ) : (
          <GraphVisualization
            externalJobData={jobData}
            externalGraphData={graphData}
          />
        )}
      </div>
    </div>
  );
};

export default ChatQuery;
