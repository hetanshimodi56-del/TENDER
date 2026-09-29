import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Minimize2, 
  Maximize2, 
  Copy, 
  Check, 
  Trash2, 
  FileText, 
  ShieldCheck, 
  HelpCircle, 
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function AITenderAssistant({
  isOpen,
  onClose,
  activeTender = null,
  onClearActiveTender,
  onViewTenderDetails
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const suggestedQuestions = activeTender ? [
    'Summarize Tender',
    'Check Eligibility',
    'Required Documents',
    'Important Dates',
    'Explain EMD',
    'Explain Tender Conditions',
    'How to Apply?',
    'Check My Eligibility'
  ] : [
    'What is EMD?',
    'How can I search for tenders?',
    'What are required documents for bidding?',
    'What is a BOQ?',
    'What is Reverse Auction?',
    'How does eligibility checking work?'
  ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
      loadHistory();
    }
  }, [isOpen, activeTender?.id]);

  const loadHistory = async () => {
    const tenderId = activeTender ? activeTender.id : 'general';
    try {
      const res = await api.getChatHistory(tenderId);
      if (res.data && res.data.length > 0) {
        setMessages(res.data);
      } else {
        // Initial greeting
        const greeting = activeTender
          ? `Hello! I am your **AI Tender Assistant** for **${activeTender.tender_reference_no}** ("${activeTender.title}").\n\nI have fully indexed this tender's specifications, commercial values, eligibility rules, and RFP clauses. What would you like to know?`
          : `Hello! I am your **AI Tender Assistant**.\n\nAsk me questions about tenders, eligibility, documents, EMD requirements, or general public procurement and bidding rules.`;

        setMessages([
          {
            id: 'init-1',
            role: 'assistant',
            message: greeting,
            sources_cited: []
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user',
      message: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const tenderId = activeTender ? activeTender.id : 'general';
      const res = await api.askTenderAI(tenderId, query);
      const aiMsg = {
        id: res.data?.id || `ai-${Date.now()}`,
        role: 'assistant',
        message: res.data?.answer || 'I could not generate an answer at this time.',
        sources_cited: res.data?.citations || []
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          message: 'Sorry, I encountered an issue processing your query. Please verify your connection and try again.',
          sources_cited: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear your conversation history with AI Tender Assistant?')) return;
    const tenderId = activeTender ? activeTender.id : 'general';
    try {
      await api.clearChatHistory(tenderId);
      setMessages([
        {
          id: `init-${Date.now()}`,
          role: 'assistant',
          message: 'Conversation cleared. How can I assist you with your tender research?',
          sources_cited: []
        }
      ]);
    } catch (err) {
      console.error('Clear chat error:', err);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="saas-card"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: isExpanded ? 580 : 420,
        height: isExpanded ? 720 : 580,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 40px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.28), 0 0 0 1px var(--border-card)',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Premium Chat Header */}
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg, rgba(0, 121, 107, 0.95), rgba(15, 23, 42, 0.95))',
        color: '#ffffff',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(16, 185, 129, 0.4)'
          }}>
            <Bot size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                AI Tender Assistant
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                background: 'rgba(52, 211, 153, 0.25)',
                color: '#6ee7b7',
                border: '1px solid rgba(52, 211, 153, 0.3)'
              }}>
                RAG Grounded
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
              Ask questions about tenders, eligibility, documents and bidding.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={handleClearHistory}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Clear Chat History"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isExpanded ? 'Restore Normal Size' : 'Expand Window'}
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Assistant"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Active Tender Context Pill Strip */}
      {activeTender && (
        <div style={{
          padding: '8px 14px',
          background: 'rgba(0, 121, 107, 0.08)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <Sparkles size={13} color="#00796b" />
            <span style={{ color: 'var(--text-muted)' }}>Active Context:</span>
            <strong style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
              {activeTender.tender_reference_no}
            </strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {onViewTenderDetails && (
              <button
                onClick={() => onViewTenderDetails(activeTender)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                View RFP <ExternalLink size={11} />
              </button>
            )}
            {onClearActiveTender && (
              <button
                onClick={onClearActiveTender}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
                title="Switch to General Assistant"
              >
                ✕ General
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: 'var(--bg-main)'
      }}>
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                alignSelf: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              {/* Message Bubble */}
              <div style={{
                padding: '10px 14px',
                borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: isUser ? 'linear-gradient(135deg, #00796b, #00594c)' : 'var(--bg-card)',
                color: isUser ? '#ffffff' : 'var(--text-main)',
                border: isUser ? 'none' : '1px solid var(--border-card)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                fontSize: '0.84rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                position: 'relative'
              }}>
                {msg.message}

                {/* Source citations badge (Anti-hallucination source awareness) */}
                {!isUser && msg.sources_cited && msg.sources_cited.length > 0 && (
                  <div style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Verified Grounded Sources:
                    </span>
                    {msg.sources_cited.map((src, sIdx) => (
                      <div
                        key={sIdx}
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#059669',
                          padding: '3px 8px',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <ShieldCheck size={12} color="#059669" />
                        <strong>{src.section}</strong>
                        {src.text && <span style={{ color: 'var(--text-muted)' }}>• {src.text.slice(0, 80)}...</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Footer: Copy & Timestamp */}
              {!isUser && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 4,
                  paddingLeft: 4
                }}>
                  <button
                    onClick={() => copyToClipboard(msg.message, msg.id || index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}
                    title="Copy response"
                  >
                    {copiedId === (msg.id || index) ? (
                      <>
                        <Check size={11} color="#16a34a" /> <span style={{ color: '#16a34a' }}>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} /> Copy
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Loading Indicator */}
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '14px 14px 14px 2px',
            maxWidth: '60%',
            alignSelf: 'flex-start'
          }}>
            <Bot size={16} color="#00796b" className="spin" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Analyzing tender documents & verified facts...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions Carousel */}
      <div style={{
        padding: '8px 12px',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        flexShrink: 0
      }}>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            style={{
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 600,
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 999,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#00796b';
              e.currentTarget.style.color = '#00796b';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-main)';
            }}
          >
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* Input Box Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          padding: '12px 14px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={activeTender ? `Ask about ${activeTender.tender_reference_no}...` : 'Ask questions about tenders, EMD, bidding...'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '0.85rem',
            background: 'var(--bg-main)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            outline: 'none',
            transition: 'border-color 0.15s ease'
          }}
          onFocus={e => e.target.style.borderColor = '#00796b'}
          onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: inputValue.trim() && !loading ? 'linear-gradient(135deg, #00796b, #004d40)' : 'var(--border-subtle)',
            color: '#ffffff',
            border: 'none',
            cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.18s ease',
            boxShadow: inputValue.trim() && !loading ? '0 2px 8px rgba(0, 121, 107, 0.35)' : 'none'
          }}
          title="Send Question"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
