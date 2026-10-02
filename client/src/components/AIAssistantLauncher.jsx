import React from 'react';
import { Bot, Sparkles, Activity } from 'lucide-react';

export default function AIAssistantLauncher({ onClick, isOpen, hasActiveTender }) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="floating-ai-aura"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        borderRadius: 999,
        background: 'linear-gradient(135deg, rgba(0, 121, 107, 0.95), rgba(15, 23, 42, 0.92))',
        color: '#ffffff',
        border: '1px solid rgba(52, 211, 153, 0.45)',
        cursor: 'pointer',
        userSelect: 'none'
      }}
      title="Ask AI about tenders, eligibility & procurement guidelines"
    >
      {/* Holographic Glowing Orb with Dual Spinning Rings */}
      <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer Orbit Ring */}
        <div style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          border: '1.5px dashed rgba(52, 211, 153, 0.65)',
          animation: 'aiOuterSpin 9s linear infinite',
          pointerEvents: 'none'
        }} />

        {/* Inner Orbit Ring */}
        <div style={{
          position: 'absolute',
          inset: -1,
          borderRadius: '50%',
          border: '1.5px solid rgba(99, 102, 241, 0.45)',
          borderTopColor: 'transparent',
          animation: 'aiInnerSpin 4s linear infinite',
          pointerEvents: 'none'
        }} />

        {/* Center Glowing Core */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(16, 185, 129, 0.75)'
        }}>
          <Bot size={18} color="#ffffff" />
        </div>
      </div>

      {/* AI Label & Soundwave Visualizer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff' }}>
            AI Tender Assistant
          </span>
          
          {/* Animated Audio/Equalizer Bars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 12, paddingLeft: 2 }}>
            <span className="ai-eq-bar" />
            <span className="ai-eq-bar" />
            <span className="ai-eq-bar" />
            <span className="ai-eq-bar" />
          </div>
        </div>

        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          {hasActiveTender ? '⚡ Analyzing selected tender' : 'Ask questions or check eligibility'}
        </span>
      </div>

      <Sparkles size={14} color="#6ee7b7" style={{ animation: 'bellRing 2.4s ease infinite', marginLeft: 4 }} />
    </button>
  );
}
