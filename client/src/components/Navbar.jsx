import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Bookmark, 
  Calendar, 
  Scale, 
  Bell, 
  User, 
  LogOut, 
  CircleCheck, 
  AlertTriangle,
  Building,
  BarChart3,
  FileCheck,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ 
  user, 
  currentTab, 
  setCurrentTab, 
  onLogout, 
  onDemoSwitch, 
  alerts = [], 
  onMarkAlertRead,
  compareCount = 0,
  onOpenCompare
}) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const unreadAlerts = alerts.filter(a => !a.is_read);

  const roles = [
    { role: 'company_user', label: 'Company / Bidder', name: 'Aarav Mehta (TechInfra)', icon: '🏢' },
    { role: 'tender_authority', label: 'Tender Authority', name: 'Dr. Rajeshwari Patel (GUDM)', icon: '🏛️' },
    { role: 'super_admin', label: 'Super Admin', name: 'Vikramaditya Sharma', icon: '👑' },
    { role: 'evaluator', label: 'Technical Evaluator', name: 'Prof. S. N. Bannerjee', icon: '⚖️' }
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(9, 13, 22, 0.88)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 24px'
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 70
      }}>
        {/* Logo & Brand */}
        <div 
          onClick={() => setCurrentTab('discover')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
          }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                BidSphere <span style={{ color: '#3b82f6' }}>AI</span>
              </span>
              <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>Enterprise</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Procurement Intelligence & Bidding Suite
            </div>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button 
            className={`btn btn-sm ${currentTab === 'discover' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('discover')}
          >
            <Search size={15} /> Discover Tenders
          </button>

          {user?.role === 'company_user' && (
            <>
              <button 
                className={`btn btn-sm ${currentTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentTab('saved')}
              >
                <Bookmark size={15} /> My Tenders
              </button>

              <button 
                className={`btn btn-sm ${currentTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentTab('calendar')}
              >
                <Calendar size={15} /> Deadlines
              </button>

              <button 
                className={`btn btn-sm ${currentTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentTab('profile')}
              >
                <Building size={15} /> Company Profile
              </button>
            </>
          )}

          {/* Role-Specific Navigation */}
          {user?.role === 'tender_authority' && (
            <button 
              className={`btn btn-sm ${currentTab === 'authority' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentTab('authority')}
            >
              <FileCheck size={15} /> Authority Portal
            </button>
          )}

          {user?.role === 'super_admin' && (
            <button 
              className={`btn btn-sm ${currentTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentTab('admin')}
            >
              <BarChart3 size={15} /> Super Admin Governance
            </button>
          )}

          {user?.role === 'evaluator' && (
            <button 
              className={`btn btn-sm ${currentTab === 'evaluator' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentTab('evaluator')}
            >
              <Scale size={15} /> Bid Evaluations
            </button>
          )}

          {/* Tender Compare Button */}
          {compareCount > 0 && (
            <button 
              className="btn btn-sm btn-ai"
              onClick={onOpenCompare}
              style={{ position: 'relative' }}
            >
              <Scale size={15} /> Compare ({compareCount})
            </button>
          )}
        </div>

        {/* Right Action Bar: Demo Switcher, Alerts & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Quick Demo Persona Switcher */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-sm btn-secondary glow-border"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Switch demo persona for viva demonstration"
            >
              <span style={{ fontSize: '1rem' }}>
                {roles.find(r => r.role === user?.role)?.icon || '👤'}
              </span>
              <span style={{ fontWeight: 600 }}>
                {roles.find(r => r.role === user?.role)?.label || 'Switch Persona'}
              </span>
              <ChevronDown size={14} />
            </button>

            {showRoleDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 42,
                width: 280,
                background: '#0f172a',
                border: '1px solid var(--border-accent)',
                borderRadius: 12,
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                padding: 8,
                zIndex: 200
              }}>
                <div style={{ padding: '6px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                  ⚡ QUICK DEMO SWITCHER (FOR VIVA)
                </div>
                {roles.map(r => (
                  <div
                    key={r.role}
                    onClick={() => {
                      onDemoSwitch(r.role);
                      setShowRoleDropdown(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: user?.role === r.role ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      border: user?.role === r.role ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                      marginBottom: 4,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = user?.role === r.role ? 'rgba(59, 130, 246, 0.15)' : 'transparent'}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{r.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.name}</div>
                    </div>
                    {user?.role === r.role && <CircleCheck size={16} color="#34d399" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              style={{ width: 36, height: 36, padding: 0, position: 'relative' }}
              title="Notifications & Alerts"
            >
              <Bell size={16} />
              {unreadAlerts.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {showAlertsDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 42,
                width: 320,
                background: '#0f172a',
                border: '1px solid var(--border-accent)',
                borderRadius: 12,
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                padding: 12,
                zIndex: 200,
                maxHeight: 380,
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Personalized Alerts</span>
                  {unreadAlerts.length > 0 && (
                    <button 
                      onClick={() => onMarkAlertRead('all')} 
                      style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No alerts at this time
                  </div>
                ) : (
                  alerts.slice(0, 6).map(alert => (
                    <div 
                      key={alert.id}
                      onClick={() => onMarkAlertRead(alert.id)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        background: alert.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.08)',
                        borderLeft: alert.is_read ? '2px solid transparent' : '2px solid #3b82f6',
                        marginBottom: 6,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', color: alert.is_read ? 'var(--text-muted)' : '#f8fafc', lineHeight: 1.4 }}>
                        {alert.message}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 4 }}>
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {alert.alert_type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid var(--border-subtle)', paddingLeft: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{user?.name?.split(' ')[0]}</div>
              <div style={{ fontSize: '0.68rem', color: '#60a5fa', textTransform: 'capitalize' }}>
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
            <button 
              className="btn btn-sm btn-secondary" 
              onClick={onLogout}
              style={{ width: 34, height: 34, padding: 0 }}
              title="Logout"
            >
              <LogOut size={15} color="#f87171" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
