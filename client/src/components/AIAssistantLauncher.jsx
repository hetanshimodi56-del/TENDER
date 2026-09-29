import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

export default function AIAssistantLauncher({ onClick, isOpen, hasActiveTender }) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 18px',
        borderRadius: 999,
        background: 'linear-gradient(135deg, #00796b, #004d40)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 8px 24px rgba(0, 121, 107, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 121, 107, 0.55), 0 4px 10px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 121, 107, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15)';
      }}
      title="Ask AI about tenders, eligibility & procurement guidelines"
    >
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981, #06b6d4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
      }}>
        <Bot size={18} color="#ffffff" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            AI Tender Assistant
          </span>
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            padding: '1px 5px',
            borderRadius: 4,
            background: 'rgba(52, 211, 153, 0.3)',
            color: '#a7f3d0'
          }}>
            AI
          </span>
        </div>
        <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
          {hasActiveTender ? 'Analyzing current tender' : 'Ask questions or check eligibility'}
        </span>
      </div>

      <Sparkles size={14} color="#6ee7b7" className="pulse-badge" />
    </button>
  );
}
