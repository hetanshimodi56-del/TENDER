import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  BarChart2, 
  FolderKanban, 
  ListTodo, 
  Users, 
  Settings, 
  CreditCard,
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Building, 
  Scale,
  Send,
  UserCheck,
  FileSpreadsheet,
  History,
  Crown,
  Building2,
  Briefcase,
  Eye,
  PlusCircle,
  Tag,
  Search,
  Bell,
  Sliders,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  IndianRupee
} from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

export default function TenderSidebar({ 
  currentTab, 
  setCurrentTab, 
  user, 
  collapsed = false,
  onOpenAddTender,
  onOpenVault,
  onOpenMIS,
  onOpenFiles,
  onOpenRoles,
  onOpenFinance
}) {
  const { t } = useLanguage();
  const role = user?.role || 'company_user';
  const [dashboardExpanded, setDashboardExpanded] = useState(true);

  const isSalesActive = currentTab === 'dashboard' || currentTab === 'sales';
  const isFinanceActive = currentTab === 'finance';
  const isDashboardActive = isSalesActive || isFinanceActive;

  // Navigation items strictly mapped to Section 12 with support for exact Sales & Finance layout
  const getNavItems = () => {
    if (role === 'super_admin') {
      return [
        { id: 'admin', label: 'Admin Overview', icon: Crown },
        { id: 'admin_users', label: t('users') || 'Users', icon: Users },
        { id: 'admin_companies', label: t('companies') || 'Companies', icon: Building2 },
        { id: 'admin_authorities', label: t('authorities') || 'Authorities', icon: UserCheck },
        { id: 'admin_tenders', label: t('tenders') || 'Tenders', icon: FileText },
        { id: 'admin_bids', label: t('bids') || 'Bids', icon: Send },
        { id: 'admin_documents', label: t('documents') || 'Documents', icon: FolderKanban, action: onOpenVault },
        { id: 'admin_reports', label: t('reports') || 'MIS & Reports', icon: BarChart2, action: onOpenMIS },
        { id: 'admin_audits', label: t('audit_logs') || 'Audit Logs', icon: History },
        { id: 'admin_settings', label: t('settings') || 'Settings', icon: Sliders }
      ];
    }

    if (role === 'tender_authority') {
      return [
        { id: 'authority', label: t('dashboard') || 'Authority Dashboard', icon: LayoutDashboard },
        { id: 'authority_my_tenders', label: t('my_tenders') || 'My Tenders', icon: FileText },
        { id: 'authority_create', label: t('create_tender') || 'Create Tender', icon: PlusCircle },
        { id: 'authority_bids', label: t('received_bids') || 'Received Bids', icon: Send },
        { id: 'authority_evaluation', label: t('evaluation') || 'Evaluation', icon: Scale },
        { id: 'authority_reports', label: t('reports') || 'MIS & Reports', icon: BarChart2 },
        { id: 'authority_notifications', label: t('notifications') || 'Notifications', icon: Bell }
      ];
    }

    if (role === 'viewer' || role === 'guest') {
      return [
        { id: 'tenders', label: t('browse_tenders') || 'Browse Tenders', icon: FileText },
        { id: 'viewer', label: t('dashboard') || 'Public Portal', icon: LayoutDashboard },
        { id: 'viewer_categories', label: t('categories') || 'Categories', icon: Tag },
        { id: 'viewer_search', label: t('search') || 'Search Tenders', icon: Search }
      ];
    }

    // Default: Company / Bidder matching exact user uploaded screenshot
    return [
      { id: 'tenders', label: 'Tenders', icon: FileText },
      { id: 'tender_tasks', label: 'Tender Tasks', icon: CheckSquare, hasChevron: true, action: () => setCurrentTab('tasks') },
      { id: 'mis_reports', label: 'MIS & Reports', icon: FileSpreadsheet, action: onOpenMIS },
      { id: 'manage_files', label: 'Manage Files', icon: FolderKanban, hasChevron: true, action: onOpenFiles },
      { id: 'tasks', label: 'Tasks', icon: ListTodo, action: () => setCurrentTab('tasks') },
      { id: 'roles_rights', label: 'Roles & Rights', icon: Users, hasChevron: true, action: onOpenRoles },
      { id: 'configuration', label: 'Configuration', icon: Settings, hasChevron: true, action: () => setCurrentTab('profile') },
      { id: 'finance_manage', label: 'Finance Manage', icon: IndianRupee, hasChevron: true, action: onOpenFinance }
    ];
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    if (!user) {
      return { label: 'Guest Visitor', color: '#0d9488', bg: '#ccfbf1', icon: Eye };
    }
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', color: '#7c3aed', bg: '#ede9fe', icon: Crown };
      case 'tender_authority':
        return { label: 'Tender Authority', color: '#00796b', bg: '#e0f2f1', icon: Building2 };
      case 'viewer':
        return { label: 'Public Viewer', color: '#d97706', bg: '#fef3c7', icon: Eye };
      default:
        return { label: 'Company / Bidder', color: '#0284c7', bg: '#e0f2fe', icon: Briefcase };
    }
  };

  const badge = getRoleBadge();
  const BadgeIcon = badge.icon;

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      height: '100vh',
      maxHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
      transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      userSelect: 'none',
      position: 'relative',
      zIndex: 20
    }}>
      {/* Brand Logo Header */}
      <div style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid #e2e8f0',
        gap: 10,
        flexShrink: 0
      }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} 
          onClick={() => {
            if (role === 'super_admin') setCurrentTab('admin');
            else if (role === 'tender_authority') setCurrentTab('authority');
            else if (role === 'viewer') setCurrentTab('viewer');
            else setCurrentTab('dashboard');
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #00796b, #004d40)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 121, 107, 0.3)',
            flexShrink: 0
          }}>
            <ShieldCheck size={19} color="#ffffff" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 3 }}>
                Tender<span style={{ color: '#00796b', fontWeight: 900 }}>Hub</span>
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
                SECURE RBAC PORTAL
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Pill Banner */}
      {!collapsed && (
        <div style={{ padding: '12px 14px 4px', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 10px',
            borderRadius: 8,
            background: badge.bg,
            border: `1px solid ${badge.color}30`
          }}>
            <BadgeIcon size={14} color={badge.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: badge.color, textTransform: 'uppercase' }}>
                {badge.label}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name?.split(' ')[0] || (user ? 'User' : 'Public Auditor')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation List with Independent Scrolling */}
      <div 
        className="sidebar-scroll-container" 
        style={{ 
          flex: 1, 
          padding: '10px 10px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 4, 
          overflowY: 'auto', 
          overflowX: 'hidden' 
        }}
      >
        
        {/* Expandable Dashboard Item (as shown in images for Company/Vendor and Super Admin) */}
        {(role === 'company_user' || role === 'super_admin' || !role) && (
          <div style={{ marginBottom: 4 }}>
            {/* Dashboard Parent Trigger */}
            <div
              onClick={() => setDashboardExpanded(!dashboardExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 8,
                fontSize: '0.84rem',
                fontWeight: isDashboardActive ? 700 : 600,
                color: isDashboardActive ? '#00594C' : '#334155',
                background: isDashboardActive ? '#e6f4ea' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Dashboard"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={18} color={isDashboardActive ? '#00796b' : '#64748b'} />
                {!collapsed && <span>Dashboard</span>}
              </div>
              {!collapsed && (
                dashboardExpanded 
                  ? <ChevronUp size={15} color={isDashboardActive ? '#00594C' : '#94a3b8'} /> 
                  : <ChevronDown size={15} color={isDashboardActive ? '#00594C' : '#94a3b8'} />
              )}
            </div>

            {/* Dashboard Sub-Items (- Sales, - Finance) */}
            {!collapsed && dashboardExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3, paddingLeft: 22 }}>
                {/* - Sales */}
                <div
                  onClick={() => setCurrentTab('dashboard')}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 6,
                    fontSize: '0.82rem',
                    fontWeight: isSalesActive ? 700 : 500,
                    color: isSalesActive ? '#00594C' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onMouseEnter={e => {
                    if (!isSalesActive) e.currentTarget.style.color = '#00594C';
                  }}
                  onMouseLeave={e => {
                    if (!isSalesActive) e.currentTarget.style.color = '#475569';
                  }}
                >
                  <span style={{ fontWeight: 800 }}>-</span>
                  <span>Sales</span>
                </div>

                {/* - Finance */}
                <div
                  onClick={() => setCurrentTab('finance')}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 6,
                    fontSize: '0.82rem',
                    fontWeight: isFinanceActive ? 700 : 500,
                    color: isFinanceActive ? '#00594C' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onMouseEnter={e => {
                    if (!isFinanceActive) e.currentTarget.style.color = '#00594C';
                  }}
                  onMouseLeave={e => {
                    if (!isFinanceActive) e.currentTarget.style.color = '#475569';
                  }}
                >
                  <span style={{ fontWeight: 800 }}>-</span>
                  <span>Finance</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regular Navigation Items */}
        {navItems.map(item => {
          const ItemIcon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  setCurrentTab(item.id);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 8,
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#00594C' : '#475569',
                background: isActive ? '#e6f4ea' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
              title={item.label}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ItemIcon size={17} color={isActive ? '#00796b' : '#64748b'} />
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && item.hasChevron && (
                <ChevronDown size={14} color="#94a3b8" />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Status */}
      {!collapsed && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          fontSize: '0.72rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{user?.name?.split(' ')[0] || 'TenderHub'}</div>
                  <div style={{ color: '#64748b', fontSize: '0.66rem' }}>Session Active • RBAC</div>
                </div>
              </div>
              {user?.user_id && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#00796b',
                  background: '#e0f2f1',
                  padding: '2px 7px',
                  borderRadius: 6,
                  border: '1px solid rgba(0,121,107,0.2)'
                }}>
                  {user.user_id}
                </span>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0284c7' }}></div>
                <span style={{ fontWeight: 600, color: '#475569' }}>Public Mode</span>
              </div>
              <button
                onClick={() => setCurrentTab('login')}
                style={{
                  background: 'linear-gradient(135deg, #00796b, #004d40)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
