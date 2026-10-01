import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Menu, 
  LogOut, 
  ShieldCheck, 
  Search,
  Scale,
  Plus,
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

export default function TenderHeader({
  user,
  onLogout,
  onToggleSidebar,
  compareCount = 0,
  onOpenCompare,
  onOpenAddTender,
  onOpenVault,
  onOpenAIAssistant,
  onOpenLogin,
  onOpenCommandPalette,
  onShowToast
}) {
  const { t } = useLanguage();
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('etender_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('etender_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (onShowToast) {
      onShowToast(nextTheme === 'dark' ? '🌙 Dark Mode activated' : '☀️ Light Mode activated', 'info');
    }
  };

  const handleNotificationToggle = async () => {
    const nextState = !notificationEnabled;
    setNotificationEnabled(nextState);

    if (nextState) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            await Notification.requestPermission();
          }
        } catch (e) {
          // ignore error
        }
      }
      if (onShowToast) {
        onShowToast('🔔 Real-time desktop tender notifications activated!', 'success');
      }
    } else {
      if (onShowToast) {
        onShowToast('Desktop notifications paused.', 'info');
      }
    }
  };

  const getRoleDisplay = () => {
    switch (user?.role) {
      case 'super_admin':
        return { label: 'Super Admin', icon: '👑', color: '#7c3aed', bg: '#ede9fe' };
      case 'tender_authority':
        return { label: 'Tender Authority', icon: '🏛️', color: '#00796b', bg: '#e0f2f1' };
      case 'viewer':
        return { label: 'Public Viewer', icon: '👁️', color: '#d97706', bg: '#fef3c7' };
      case 'evaluator':
        return { label: 'Evaluator', icon: '⚖️', color: '#0284c7', bg: '#e0f2fe' };
      default:
        return { label: 'Company / Bidder', icon: '🏢', color: '#00796b', bg: '#e6f4ea' };
    }
  };

  const roleInfo = getRoleDisplay();

  return (
    <header style={{
      height: 60,
      background: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Left side: Hamburger + Search + Compact Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onToggleSidebar}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            cursor: 'pointer',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>

        {/* Global Quick Search Input (Click or Ctrl+K triggers Command Palette) */}
        <div 
          onClick={() => { if (onOpenCommandPalette) onOpenCommandPalette(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '7px 12px',
            width: 280,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00796b'; e.currentTarget.style.background = '#f0fdfa'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
          title="Press Ctrl+K or Cmd+K to search anything"
        >
          <Search size={14} color="#00796b" />
          <span style={{
            fontSize: '0.8rem',
            color: '#64748b',
            flex: 1,
            userSelect: 'none'
          }}>
            Search tenders, GEM IDs...
          </span>
          <kbd style={{
            fontSize: '0.62rem',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 4,
            padding: '2px 6px',
            color: '#00796b',
            fontFamily: 'monospace',
            fontWeight: 700,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>⌘K</kbd>
        </div>

        {/* Compact RBAC Secure Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#f0fdf4',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '4px 10px',
          borderRadius: 16,
          fontSize: '0.72rem',
          color: '#065f46',
          fontWeight: 600
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 5px #10b981'
          }}></span>
          <span>RBAC Secure</span>
        </div>
      </div>

      {/* Right side: Vault, Compare, Notification Bell, Role Pill, User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        
        {/* Company Document Vault Button */}
        {onOpenVault && (
          <button
            onClick={onOpenVault}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
            title="Open Document Vault"
          >
            <ShieldCheck size={15} color="#00796b" />
            <span>{t('docVault') || 'docVault'}</span>
          </button>
        )}



        {/* Tender Compare Button (only when 1+ selected) */}
        {compareCount > 0 && (
          <button
            onClick={onOpenCompare}
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0284c7',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Scale size={14} /> Compare ({compareCount})
          </button>
        )}

        {/* Sleek Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            height: 36,
            padding: '0 10px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: theme === 'dark' ? '#1e293b' : '#f8fafc',
            color: theme === 'dark' ? '#fbbf24' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.78rem',
            fontWeight: 600,
            transition: 'all 0.15s ease'
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#64748b" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {/* Sleek Notification Bell Button */}
        <button
          onClick={handleNotificationToggle}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: notificationEnabled ? '#f0fdf4' : 'var(--bg-card)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.15s ease'
          }}
          title={notificationEnabled ? 'Notifications Active (Click to disable)' : 'Enable Real-time Tender Alerts'}
        >
          <Bell size={16} color={notificationEnabled ? '#15803d' : '#64748b'} />
          {notificationEnabled && (
            <span style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid #ffffff'
            }}></span>
          )}
        </button>


        {/* Verified Role Badge or Guest Sign-In */}
        {user ? (
          <>
            <div style={{
              background: roleInfo.bg,
              border: `1px solid ${roleInfo.color}30`,
              borderRadius: 8,
              padding: '5px 11px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: roleInfo.color,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }} title={`Authenticated Role: ${user?.role}`}>
              <span>{roleInfo.icon}</span>
              <span>{roleInfo.label}</span>
            </div>

            {/* Subtle Vertical Divider */}
            <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 2px' }}></div>

            {/* User Profile Info & Logout */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              {/* Avatar Circle */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.8rem',
                border: '1px solid #bae6fd'
              }}>
                {user?.name?.charAt(0) || 'U'}
              </div>

              {/* Name & User ID */}
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                {user?.user_id && (
                  <span style={{ 
                    fontSize: '0.64rem', 
                    fontWeight: 800, 
                    color: '#00796b', 
                    background: '#e6f4ea', 
                    padding: '1px 5px', 
                    borderRadius: 4, 
                    marginTop: 2,
                    display: 'inline-block' 
                  }}>
                    {user.user_id}
                  </span>
                )}
              </div>

              {/* Logout Icon Button */}
              <button
                onClick={onLogout}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.background = '#fef2f2';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Sign out of TenderHub"
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onOpenLogin}
            style={{
              background: 'linear-gradient(135deg, #00796b 0%, #004d40 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0, 121, 107, 0.3)'
            }}
          >
            <span>🔐</span> Sign In / Register
          </button>
        )}

      </div>
    </header>
  );
}
