import { useState } from 'react';
import GraphVisualization from './GraphVisualization';
import { processChatQuery } from '../services/chatService';
import './ChatQuery.css';

const ChatQuery = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [graphData, setGraphData] = useState(null);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Add thinking message
    const thinkingMessage = {
      id: Date.now() + 1,
      type: 'agent',
      step: 'thinking',
      text: '🤔 Understanding your question...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, thinkingMessage]);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

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
      const result = await processChatQuery(inputValue);

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

      // Add success message
      const successMessage = {
        id: Date.now() + 5,
        type: 'agent',
        step: 'success',
        text: `✅ Query executed successfully!`,
        summary: `Found ${result.graphData.nodes.length} nodes and ${result.graphData.relationships.length} relationships.`,
        timestamp: new Date()
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Hardcoded sample questions
  const sampleQuestions = [
    "Show me all materials and their sites",
    "Show supply chain network",
    "Show materials with inventory"
  ];

  const handleSampleClick = (question) => {
    setInputValue(question);
  };

  return (
    <div className="chat-query-container">
      {/* Left Side - Chat Interface */}
      <div className="chat-panel">
        <div className="chat-header">
          <h3>💬 AI Graph Query Assistant</h3>
          <p>Ask questions in natural language</p>
        </div>

        {/* Sample Questions */}
        {messages.length === 0 && (
          <div className="sample-questions">
            <h4>Try asking:</h4>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                className="sample-question-btn"
                onClick={() => handleSampleClick(q)}
              >
                {q}
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
                  <div className="message-text">{msg.text}</div>
                  {msg.query && (
                    <div className="query-block">
                      <code>{msg.query}</code>
                    </div>
                  )}
                  {msg.summary && (
                    <div className="summary-block">
                      {msg.summary}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="chat-input-container">
          <textarea
            className="chat-input"
            placeholder="Ask a question about your graph data..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing}
            rows={2}
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={isProcessing || !inputValue.trim()}
          >
            {isProcessing ? '⏳' : '🚀'} Send
          </button>
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
