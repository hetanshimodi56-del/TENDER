import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  FileText, 
  Quote, 
  HelpCircle, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function AskTenderAIDrawer({ tender, initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const samplePrompts = [
    'What is the required EMD amount & tender fee?',
    'What are the mandatory quality certifications?',
    'Can Joint Ventures (JV) participate?',
    'What are the penalty clauses for project delay?'
  ];

  useEffect(() => {
    // If no initial messages, load past chat history or greeting
    if (tender && messages.length === 0) {
      loadHistory();
    }
  }, [tender]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const res = await api.getChatHistory(tender.id);
      if (res.data && res.data.length > 0) {
        setMessages(res.data);
      } else {
        setMessages([
          {
            role: 'assistant',
            message: `Hello! I am your **Grounded Tender AI Assistant** for ${tender.tender_reference_no}. I answer queries strictly using verified tender facts and RFP clauses with source citations. How can I assist your bid preparation today?`,
            sources_cited: []
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleSend = async (queryText) => {
    const text = queryText || inputQuery;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', message: text };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askTenderAI(tender.id, text);
      const aiMsg = {
        role: 'assistant',
        message: res.data.answer,
        sources_cited: res.data.citations || []
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          message: 'Sorry, I encountered an issue analyzing this query. Please try again.',
          sources_cited: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 520,
      background: 'rgba(11, 16, 28, 0.85)',
      borderRadius: 12,
      border: '1px solid var(--border-accent)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 18px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Ask Your Tender AI</div>
            <div style={{ fontSize: '0.68rem', color: '#93c5fd' }}>Grounded in RFP Document Context • Anti-Hallucination</div>
          </div>
        </div>
        <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>Verified Grounding</span>
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{
        padding: '8px 14px',
        background: 'rgba(15, 23, 42, 0.5)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 9999 }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div style={{
        flex: 1,
        padding: 16,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: 10,
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {!isUser && (
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={16} color="#fff" />
                </div>
              )}

              <div style={{
                background: isUser ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(30, 41, 59, 0.7)',
                border: isUser ? 'none' : '1px solid var(--border-subtle)',
                color: '#fff',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>

                {/* Grounded Source Citations */}
                {msg.sources_cited && msg.sources_cited.length > 0 && (
                  <div style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.72rem',
                    color: '#93c5fd'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Quote size={12} /> Grounded Document Source:
                    </div>
                    {msg.sources_cited.map((cite, ci) => (
                      <div key={ci} style={{ background: 'rgba(0,0,0,0.25)', padding: '4px 8px', borderRadius: 4, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{cite.section}:</span> "{cite.text}"
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={16} color="#cbd5e1" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start' }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={14} className="spin" color="#fff" />
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '10px 14px', borderRadius: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Analyzing RFP document context & verifying citations...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        style={{
          padding: 12,
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 10
        }}
      >
        <input
          type="text"
          value={inputQuery}
          onChange={e => setInputQuery(e.target.value)}
          placeholder={`Ask about ${tender.tender_reference_no} (dates, turnover, docs, penalties)...`}
          className="form-input"
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="btn btn-primary"
          style={{ padding: '8px 16px' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
