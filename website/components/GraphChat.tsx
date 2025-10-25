'use client';

/**
 * GraphChat Component
 * Interactive chat interface for querying the knowledge graph with ASI:One + MeTTa reasoning
 */

import React, { useState, useRef, useEffect } from 'react';
import './GraphChat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: string; // MeTTa reasoning path
}

interface GraphChatProps {
  userId: string | null;
  onInsightNode?: (content: string) => void; // Callback to insert insight as graph node
}

export function GraphChat({ userId, onInsightNode }: GraphChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hello! Ask me anything about your knowledge graph. I can help you explore connections, find learning paths, or identify gaps.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call agent graph-analysis endpoint
      const response = await fetch('http://localhost:8010/graph-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_type: 'overview', // Could be dynamic based on query
          user_context: input.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent returned ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.analysis || 'No analysis available.',
        timestamp: new Date(),
        reasoning: data.insights?.join('\n') || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[Graph Chat] Error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the agent is running (http://localhost:8010).',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsightNode = (content: string) => {
    if (onInsightNode) {
      onInsightNode(content);
    }
  };

  const exampleQueries = [
    'What are the main clusters in my graph?',
    'Suggest a learning path for DeFi',
    'What knowledge gaps do I have?',
    'How are L2s and DeFi connected?',
  ];

  return (
    <div className={`graph-chat ${isExpanded ? 'graph-chat--expanded' : ''}`}>
      {/* Toggle Button */}
      {!isExpanded && (
        <button
          className="graph-chat__toggle"
          onClick={() => setIsExpanded(true)}
          aria-label="Open chat"
        >
          💬 Ask about your graph
        </button>
      )}

      {/* Chat Panel */}
      {isExpanded && (
        <div className="graph-chat__panel">
          {/* Header */}
          <div className="graph-chat__header">
            <div className="graph-chat__title">
              <span className="graph-chat__icon">🤖</span>
              <span>Graph Assistant</span>
            </div>
            <button
              className="graph-chat__close"
              onClick={() => setIsExpanded(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="graph-chat__messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`graph-chat__message graph-chat__message--${message.role}`}
              >
                <div className="graph-chat__message-content">{message.content}</div>

                {message.reasoning && (
                  <details className="graph-chat__reasoning">
                    <summary>🧠 Reasoning</summary>
                    <div className="graph-chat__reasoning-content">
                      {message.reasoning.split('\n').map((line, index) => (
                        <div key={index}>• {line}</div>
                      ))}
                    </div>
                  </details>
                )}

                {message.role === 'assistant' && !isLoading && (
                  <button
                    className="graph-chat__insert-node"
                    onClick={() => handleInsightNode(message.content)}
                    title="Insert as insight node"
                  >
                    ➕ Add to Graph
                  </button>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="graph-chat__message graph-chat__message--assistant">
                <div className="graph-chat__loading">
                  <span className="graph-chat__loading-dot"></span>
                  <span className="graph-chat__loading-dot"></span>
                  <span className="graph-chat__loading-dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Example Queries */}
          {messages.length === 1 && (
            <div className="graph-chat__examples">
              <div className="graph-chat__examples-title">Try asking:</div>
              {exampleQueries.map((query, index) => (
                <button
                  key={index}
                  className="graph-chat__example-button"
                  onClick={() => setInput(query)}
                >
                  {query}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form className="graph-chat__form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="graph-chat__input"
              placeholder="Ask about your knowledge graph..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || !userId}
            />
            <button
              type="submit"
              className="graph-chat__submit"
              disabled={!input.trim() || isLoading || !userId}
              aria-label="Send message"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </form>

          {!userId && (
            <div className="graph-chat__auth-warning">
              Please log in to use the chat feature.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

