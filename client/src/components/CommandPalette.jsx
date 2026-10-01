import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Tag, 
  Compass, 
  FolderLock, 
  BarChart3, 
  X,
  Clock
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigateToTab,
  onSelectTender,
  onOpenAIAssistant,
  onOpenVault
}) {
  const [query, setQuery] = useState('');
  const [tenders, setTenders] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Fetch quick list of tenders for search index
  useEffect(() => {
    if (isOpen) {
      fetch('/api/tenders?limit=25')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.tenders)) {
            setTenders(data.tenders);
          } else if (Array.isArray(data)) {
            setTenders(data);
          }
        })
        .catch(() => {});
      
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener handled in parent, but also handle Escape here
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter tenders based on query
  const q = query.trim().toLowerCase();
  const matchedTenders = q
    ? tenders.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.tenderId && t.tenderId.toLowerCase().includes(q)) ||
        (t.department && t.department.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      ).slice(0, 5)
    : tenders.slice(0, 4);

  // Quick navigation action items
  const quickActions = [
    { id: 'tenders', label: 'Explore All Active Tenders', icon: Compass, action: () => { onNavigateToTab('tenders'); onClose(); } },
    { id: 'ai', label: 'Ask AI Tender Assistant', icon: Sparkles, badge: 'AI Powered', action: () => { onOpenAIAssistant(); onClose(); } },
    { id: 'vault', label: 'Company Document Vault (Encrypted)', icon: FolderLock, action: () => { if (onOpenVault) onOpenVault(); onClose(); } },
    { id: 'dashboard', label: 'Analytics & Pipeline Dashboard', icon: BarChart3, action: () => { onNavigateToTab('dashboard'); onClose(); } },
  ].filter(act => !q || act.label.toLowerCase().includes(q));

  const totalItems = matchedTenders.length + quickActions.length;

  const handleKeyDownNav = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (totalItems || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (totalItems || 1)) % (totalItems || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < matchedTenders.length) {
        const sel = matchedTenders[selectedIndex];
        if (sel && onSelectTender) {
          onSelectTender(sel);
          onClose();
        }
      } else {
        const actIndex = selectedIndex - matchedTenders.length;
        if (quickActions[actIndex]) {
          quickActions[actIndex].action();
        }
      }
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: 620,
          background: '#ffffff',
          borderRadius: 14,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onKeyDown={handleKeyDownNav}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff'
        }}>
          <Search size={20} color="#00796b" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a tender title, ID, buyer, or command..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              color: '#0f172a',
              background: 'transparent'
            }}
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: 4,
            background: '#f1f5f9',
            color: '#64748b',
            fontFamily: 'monospace',
            border: '1px solid #cbd5e1'
          }}>
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px' }}>
          {/* Section 1: Matching Tenders */}
          {matchedTenders.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                padding: '6px 12px',
                letterSpacing: '0.05em'
              }}>
                Matching Tenders ({matchedTenders.length})
              </div>
              {matchedTenders.map((tender, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={tender._id || tender.tenderId || idx}
                    onClick={() => {
                      if (onSelectTender) onSelectTender(tender);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: isSelected ? '#f0fdfa' : 'transparent',
                      borderLeft: isSelected ? '3px solid #00796b' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <FileText size={16} color={isSelected ? '#00796b' : '#64748b'} style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          color: isSelected ? '#00796b' : '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {tender.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', gap: 8 }}>
                          <span>ID: {tender.tenderId || 'N/A'}</span>
                          <span>•</span>
                          <span>{tender.department || tender.category || 'General'}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={14} color={isSelected ? '#00796b' : '#cbd5e1'} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 2: Quick Navigation Actions */}
          {quickActions.length > 0 && (
            <div>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                padding: '6px 12px',
                letterSpacing: '0.05em'
              }}>
                Quick Actions
              </div>
              {quickActions.map((act, aIdx) => {
                const idx = matchedTenders.length + aIdx;
                const isSelected = selectedIndex === idx;
                const IconComponent = act.icon;
                return (
                  <div
                    key={act.id}
                    onClick={act.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: isSelected ? '#f8fafc' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <IconComponent size={16} color={isSelected ? '#0f172a' : '#64748b'} />
                      <span style={{ fontSize: '0.86rem', fontWeight: 500, color: '#1e293b' }}>
                        {act.label}
                      </span>
                      {act.badge && (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          padding: '1px 6px',
                          borderRadius: 4
                        }}>
                          {act.badge}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Jump to</span>
                  </div>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
              No tenders or commands found matching "{query}".
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          fontSize: '0.72rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00796b', fontWeight: 600 }}>
            <Sparkles size={12} /> BidSphere Spotlight
          </span>
        </div>
      </div>
    </div>
  );
}
