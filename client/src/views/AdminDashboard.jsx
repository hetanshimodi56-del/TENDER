import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Building2, 
  FileSpreadsheet, 
  ShieldAlert, 
  CircleCheck, 
  CircleX, 
  Upload, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  Ban,
  Plus,
  Trash2,
  Edit2,
  Crown,
  Briefcase,
  Eye,
  Sliders,
  FileText,
  Send,
  History,
  ShieldCheck,
  ArrowRight,
  Filter,
  Download,
  Globe,
  UserCheck,
  X,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building
} from 'lucide-react';
import { formatINR } from '../components/TenderCard';
import { api } from '../services/api';
import { useLanguage } from '../utils/LanguageContext';

export default function AdminDashboard({ user, initialTab = 'overview', onViewDetails, onOpenAddTender, onShowToast }) {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [kpiData, setKpiData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [authoritiesList, setAuthoritiesList] = useState([]);
  const [allTenders, setAllTenders] = useState([]);
  const [allBids, setAllBids] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [tenderSearch, setTenderSearch] = useState('');

  // Client Management state (Requirement 7)
  const [clientsList, setClientsList] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientIndustryFilter, setClientIndustryFilter] = useState('');
  const [clientCityFilter, setClientCityFilter] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [clientTotalPages, setClientTotalPages] = useState(1);
  const [clientTotalCount, setClientTotalCount] = useState(0);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);
  const [clientDetailModal, setClientDetailModal] = useState(false);
  const [clientDetailLoading, setClientDetailLoading] = useState(false);
  const [clientDetailSubTab, setClientDetailSubTab] = useState('profile');

  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Password@123');
  const [newUserRole, setNewUserRole] = useState('company_user');
  const [newUserOrg, setNewUserOrg] = useState('');

  // Import state
  const [fileToImport, setFileToImport] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Tender Document AI RAG Indexing State
  const [docTenderId, setDocTenderId] = useState('');
  const [tenderDocFile, setTenderDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docUploadSuccess, setDocUploadSuccess] = useState(null);
  const [docQuestion, setDocQuestion] = useState('');
  const [docAnswer, setDocAnswer] = useState(null);
  const [docAnswering, setDocAnswering] = useState(false);

  const handleUploadTenderDoc = async (e) => {
    e.preventDefault();
    if (!docTenderId) return alert('Please select a tender to associate the document with.');
    if (!tenderDocFile) return alert('Please select a document file (.pdf, .doc, .docx, .txt).');

    setDocUploading(true);
    setDocUploadSuccess(null);
    try {
      const formData = new FormData();
      formData.append('document', tenderDocFile);
      const res = await api.uploadTenderDocument(docTenderId, formData);
      setDocUploadSuccess(res?.data || { message: 'Document indexed successfully' });
      if (onShowToast) onShowToast('Document uploaded and indexed into AI Knowledge Base!');
      setTenderDocFile(null);
    } catch (err) {
      alert(err.message || 'Failed to upload document');
    } finally {
      setDocUploading(false);
    }
  };

  const handleAskDocAI = async (queryText = docQuestion) => {
    const q = (queryText || '').trim();
    if (!q) return;
    if (!docTenderId) return alert('Please select a tender first.');

    setDocAnswering(true);
    setDocAnswer(null);
    try {
      const res = await api.askTenderAI(docTenderId, q);
      setDocAnswer(res.data);
    } catch (err) {
      alert(err.message || 'Failed to get AI answer');
    } finally {
      setDocAnswering(false);
    }
  };

  useEffect(() => {
    if (initialTab) {
      // Map sidebar tabs to internal tabs
      if (initialTab === 'admin_clients') setActiveTab('clients');
      else if (initialTab === 'admin_users') setActiveTab('users');
      else if (initialTab === 'admin_companies') setActiveTab('companies');
      else if (initialTab === 'admin_authorities') setActiveTab('authorities');
      else if (initialTab === 'admin_tenders') setActiveTab('tenders');
      else if (initialTab === 'admin_bids') setActiveTab('bids');
      else if (initialTab === 'admin_documents') setActiveTab('documents');
      else if (initialTab === 'admin_reports') setActiveTab('reports');
      else if (initialTab === 'admin_audits') setActiveTab('audits');
      else if (initialTab === 'admin_settings') setActiveTab('settings');
      else if (initialTab === 'admin') setActiveTab('overview');
      else setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminClients = async (pg = 1) => {
    setClientsLoading(true);
    try {
      const res = await api.getAdminClients({
        search: clientSearch,
        industry: clientIndustryFilter === 'All' ? '' : clientIndustryFilter,
        city: clientCityFilter === 'All' ? '' : clientCityFilter,
        status: clientStatusFilter === 'All' ? '' : clientStatusFilter,
        page: pg,
        limit: 10
      });
      setClientsList(res.data || []);
      setClientTotalCount(res.total || 0);
      setClientTotalPages(res.totalPages || 1);
      setClientPage(pg);
    } catch (err) {
      console.error('Failed to load admin clients:', err);
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'clients') {
      loadAdminClients(1);
    }
  }, [activeTab, clientIndustryFilter, clientCityFilter, clientStatusFilter]);

  const handleOpenClientDetail = async (id) => {
    setClientDetailModal(true);
    setClientDetailLoading(true);
    setClientDetailSubTab('profile');
    try {
      const res = await api.getAdminClientDetail(id);
      setSelectedClientDetail(res.data);
    } catch (err) {
      if (onShowToast) onShowToast('Failed to load client details: ' + (err.message || 'Error'), 'error');
    } finally {
      setClientDetailLoading(false);
    }
  };

  const handleToggleClientStatus = async (id, currentStatus) => {
    const actionLabel = currentStatus === 'active' ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} this client account?`)) return;
    try {
      const res = await api.toggleAdminClientStatus(id);
      if (onShowToast) onShowToast(res.message || `Client account ${actionLabel}d.`, 'success');
      loadAdminClients(clientPage);
      if (selectedClientDetail && (selectedClientDetail.profile?.user_id === id || selectedClientDetail.profile?.id === id)) {
        handleOpenClientDetail(id);
      }
    } catch (err) {
      if (onShowToast) onShowToast('Failed to update status: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleVerifyClientDocument = async (docId, status, remarks = '') => {
    try {
      const res = await api.verifyAdminClientDocument(docId, status, remarks);
      if (onShowToast) onShowToast(res.message || `Document marked as ${status}.`, 'success');
      if (selectedClientDetail && selectedClientDetail.profile) {
        handleOpenClientDetail(selectedClientDetail.profile.user_id || selectedClientDetail.profile.id);
      }
      loadAdminClients(clientPage);
    } catch (err) {
      if (onShowToast) onShowToast('Failed to verify document: ' + (err.message || 'Error'), 'error');
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [kpis, users, companies, authorities, tendersRes, bidsRes, audits, sysSettings, clientsRes] = await Promise.all([
        api.getAdminKPIs().catch(() => ({})),
        api.getUsers().catch(() => ({ data: [] })),
        api.getCompanies().catch(() => ({ data: [] })),
        api.getAuthorityRequests().catch(() => ({ data: [] })),
        api.getTenders({ status: 'all' }).catch(() => ({ data: [] })),
        api.getAllBids().catch(() => ({ data: [] })),
        api.getAuditLogs().catch(() => ({ data: [] })),
        api.getSystemSettings().catch(() => ({ data: {} })),
        api.getAdminClients().catch(() => ({ data: [] }))
      ]);

      setKpiData(kpis);
      setUsersList(users.data || []);
      setCompaniesList(companies.data || []);
      setAuthoritiesList(authorities.data || []);
      setAllTenders(tendersRes.data || []);
      setAllBids(bidsRes.data || []);
      setAuditLogs(audits.data || []);
      setSettings(sysSettings.data || {});
      setClientsList(clientsRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLedger = async () => {
    setLoading(true);
    try {
      await loadAdminData();
      if (onShowToast) {
        onShowToast('✓ System ledger, live bids, audit logs, and tenders refreshed successfully!', 'success');
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('Failed to refresh ledger: ' + (err.message || 'Server error'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        organization_name: newUserOrg
      });
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserOrg('');
      if (onShowToast) onShowToast(`User '${newUserName}' created with role: ${newUserRole}`, 'success');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUserSubmit = async (e) => {
    e.preventDefault();
    if (!editUserData) return;
    try {
      await api.updateUser(editUserData.id, {
        name: editUserData.name,
        role: editUserData.role,
        phone: editUserData.phone,
        is_active: editUserData.is_active
      });
      setEditUserData(null);
      if (onShowToast) onShowToast('User updated successfully', 'success');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) return;
    try {
      await api.deleteUser(id);
      if (onShowToast) onShowToast(`User "${name}" deleted.`, 'info');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleToggleUser = async (id) => {
    try {
      await api.toggleUserStatus(id);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  const handleVerifyCompany = async (id, currentStatus) => {
    try {
      await api.verifyCompany(id, !currentStatus);
      if (onShowToast) onShowToast(`Company verification updated to ${!currentStatus ? 'Verified ✓' : 'Unverified'}.`, 'success');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update company verification');
    }
  };

  const handleUpdateAuthority = async (id, status) => {
    try {
      await api.updateAuthorityStatus(id, status);
      if (onShowToast) onShowToast(`Authority credentials marked as '${status}'.`, 'success');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update authority');
    }
  };

  const handleDeleteTender = async (id, refNo) => {
    if (!window.confirm(`Permanently delete tender ${refNo} from the platform?`)) return;
    try {
      await api.deleteTender(id);
      if (onShowToast) onShowToast(`Tender ${refNo} deleted.`, 'info');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete tender');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateSystemSettings(settings);
      if (onShowToast) onShowToast('System settings saved successfully!', 'success');
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!fileToImport) return alert('Please select a file.');
    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', fileToImport);

    try {
      const res = await api.importTenders(formData);
      setImportResult(res.summary);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const kpis = kpiData?.kpis || {};
  const distributions = kpiData?.distributions || {};

  const filteredUsers = usersList.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const filteredAuditLogs = auditLogs.filter(l => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      l.formatted_entry?.toLowerCase().includes(q) ||
      l.user_name?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.related_tender?.toLowerCase().includes(q)
    );
  });

  const filteredTenders = allTenders.filter(t => {
    if (!tenderSearch) return true;
    const q = tenderSearch.toLowerCase();
    return t.title?.toLowerCase().includes(q) || t.tender_reference_no?.toLowerCase().includes(q) || t.organization_name?.toLowerCase().includes(q);
  });



  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 28px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        border: '1px solid rgba(124, 58, 237, 0.3)',
        borderRadius: 16,
        padding: '22px 28px',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 9999, background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', marginBottom: 6 }}>
            <Crown size={13} color="#c084fc" />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e9d5ff', letterSpacing: '0.05em' }}>
              SUPER ADMIN GOVERNANCE & CONTROL SUITE
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
            TenderHub Central Management Console
          </h1>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Logged in as <strong style={{ color: '#ffffff' }}>{user?.name}</strong> • System Status: <span style={{ color: '#34d399', fontWeight: 700 }}>● Fully Operational</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onOpenAddTender && (
            <button 
              onClick={onOpenAddTender}
              style={{
                background: 'linear-gradient(135deg, #00796b, #004d40)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 121, 107, 0.4)'
              }}
            >
              <Plus size={15} /> Add Tender
            </button>
          )}
          <button 
            onClick={handleRefreshLedger} 
            disabled={loading}
            className="btn btn-sm btn-secondary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: loading ? 0.7 : 1
            }}
            title="Reload all tender records, user status and system ledger"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Refreshing...' : 'Refresh Ledger'}
          </button>
        </div>
      </div>



      {/* TAB 1: OVERVIEW & EXECUTIVE KPIS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top 6 Core KPIs mandated by Prompt */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: 12 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Users</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{kpis.totalUsers || usersList.length}</div>
              <div style={{ fontSize: '0.72rem', color: '#4f46e5' }}>Across 4 Roles</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: 12 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Companies</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>{kpis.totalCompanies || companiesList.length}</div>
              <div style={{ fontSize: '0.72rem', color: '#0284c7' }}>Verified Bidders</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: 12 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active Tenders</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#00796b', margin: '4px 0' }}>{kpis.activeTenders || allTenders.length}</div>
              <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Live Bidding</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: 12 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Closed Tenders</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#d97706', margin: '4px 0' }}>{kpis.closedTenders || 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#d97706' }}>Completed Cycles</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: 12 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Bids</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#7c3aed', margin: '4px 0' }}>{kpis.totalBids || allBids.length}</div>
              <div style={{ fontSize: '0.72rem', color: '#7c3aed' }}>Submitted Vault Bids</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: 12 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pending Approvals</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#e11d48', margin: '4px 0' }}>{kpis.pendingApprovals || 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#e11d48' }}>Requires Review</div>
            </div>
          </div>

          {/* Cumulative Financials & Activity Log */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 20 }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>
                Recent System Activity & Governance Audit Trail
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {auditLogs.slice(0, 7).map((log, idx) => (
                  <div key={idx} style={{
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={14} color="#4f46e5" />
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>{log.formatted_entry || `${log.user_name} – ${log.action}`}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{log.ip_address || '127.0.0.1'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>
                Administrative Controls
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Plus size={15} /> Add New User
                </button>
                <button
                  onClick={() => setActiveTab('companies')}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Building2 size={15} /> Verify Pending Companies
                </button>
                <button
                  onClick={() => setActiveTab('authorities')}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <ShieldCheck size={15} /> Approve Department Heads
                </button>
                <button
                  onClick={() => setActiveTab('clients')}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <UserCheck size={15} /> Manage Clients & Match Logs
                </button>
                <button
                  onClick={() => setActiveTab('audits')}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <History size={15} /> Export Audit Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CLIENT MANAGEMENT MODULE (Requirement 7) */}
      {activeTab === 'clients' && (
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-card, #e2e8f0)', borderRadius: 12, padding: '20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                  Client Management & Governance Console
                </h3>
                <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                  {clientTotalCount} Registered Clients
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Search and audit clients, verify submitted credentials, review tender history, and manage account statuses.
              </p>
            </div>
            <button
              onClick={() => loadAdminClients(clientPage)}
              className="btn btn-sm btn-secondary"
              disabled={clientsLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} className={clientsLoading ? 'spin' : ''} />
              {clientsLoading ? 'Refreshing...' : 'Refresh Clients'}
            </button>
          </div>

          {/* Filters Bar: Search, Industry, City, Status */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
            gap: 10,
            marginBottom: 18,
            padding: 12,
            background: 'var(--bg-main, #f8fafc)',
            borderRadius: 10,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            alignItems: 'center'
          }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px' }}>
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Search Client ID, Name, Company, Email..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadAdminClients(1)}
                style={{ border: 'none', outline: 'none', fontSize: '0.8rem', width: '100%', background: 'transparent' }}
              />
              {clientSearch && (
                <button onClick={() => { setClientSearch(''); setTimeout(() => loadAdminClients(1), 50); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <X size={13} color="#94a3b8" />
                </button>
              )}
            </div>

            {/* Industry Filter */}
            <select
              value={clientIndustryFilter}
              onChange={e => setClientIndustryFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.78rem', padding: '6px 10px', height: 34 }}
            >
              <option value="">All Industries</option>
              <option value="Renewable Energy">Renewable Energy</option>
              <option value="IT & Software Solutions">IT & Software Solutions</option>
              <option value="Civil & Transportation Infrastructure">Civil & Infrastructure</option>
              <option value="Healthcare & Medical Supplies">Healthcare & Medical</option>
              <option value="Water Treatment & Environmental Services">Water & Environmental</option>
              <option value="Power Transmission & Electrical Grid">Power & Electrical</option>
              <option value="Educational Technology & Training">EdTech & Training</option>
              <option value="Smart City Solutions & IoT">Smart City & IoT</option>
              <option value="Security Systems & Surveillance">Security Systems</option>
              <option value="Facility Management & Services">Facility Management</option>
            </select>

            {/* City Filter */}
            <select
              value={clientCityFilter}
              onChange={e => setClientCityFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.78rem', padding: '6px 10px', height: 34 }}
            >
              <option value="">All Cities</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="New Delhi">New Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
              <option value="Chennai">Chennai</option>
              <option value="Gandhinagar">Gandhinagar</option>
              <option value="Noida">Noida</option>
            </select>

            {/* Status Filter */}
            <select
              value={clientStatusFilter}
              onChange={e => setClientStatusFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.78rem', padding: '6px 10px', height: 34 }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
              <option value="verified">Verified Documents</option>
            </select>

            {/* Apply Button */}
            <button
              onClick={() => loadAdminClients(1)}
              className="btn btn-sm btn-primary"
              style={{ height: 34, padding: '0 14px' }}
            >
              Apply Filter
            </button>
          </div>

          {/* Clients Ledger Table */}
          {clientsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              <div>Loading client records...</div>
            </div>
          ) : clientsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <UserCheck size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div style={{ fontWeight: 600 }}>No clients found matching the selected filters.</div>
              <div style={{ fontSize: '0.78rem' }}>Try clearing the search or changing industry/city filter.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-card, #e2e8f0)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b' }}>Client ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b' }}>Client & Company</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b' }}>Industry & Location</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>Bids Submitted</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>Documents</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>Account Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientsList.map(c => {
                    const isActive = c.status === 'active';
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: '#f1f5f9',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: '0.75rem'
                          }}>
                            {c.user_id || c.id}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>{c.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#00796b', fontWeight: 600 }}>{c.company_name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.email}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: '#334155' }}>{c.industry || 'General Industry'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.city ? `${c.city}, ${c.state || ''}` : 'Location unlisted'}</div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.total_bids || 0}</div>
                          <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>
                            {c.won_bids ? `${c.won_bids} Won` : '0 Won'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: (c.verified_documents === c.total_documents && c.total_documents > 0) ? '#dcfce7' : '#fef3c7',
                            color: (c.verified_documents === c.total_documents && c.total_documents > 0) ? '#166534' : '#92400e'
                          }}>
                            {c.verified_documents || 0} / {c.total_documents || 0} Verified
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: isActive ? '#dcfce7' : '#fee2e2',
                            color: isActive ? '#166534' : '#991b1b'
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16a34a' : '#dc2626' }}></span>
                            {isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenClientDetail(c.id)}
                              className="btn btn-sm btn-secondary"
                              style={{ padding: '4px 9px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 4 }}
                              title="View full dossier, tender history, and submitted documents"
                            >
                              <Eye size={13} /> View Dossier
                            </button>
                            <button
                              onClick={() => handleToggleClientStatus(c.id, c.status)}
                              style={{
                                padding: '4px 9px',
                                borderRadius: 6,
                                border: 'none',
                                background: isActive ? '#fee2e2' : '#dcfce7',
                                color: isActive ? '#dc2626' : '#166534',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title={isActive ? 'Suspend account access' : 'Activate account access'}
                            >
                              {isActive ? <Ban size={12} /> : <Check size={12} />}
                              {isActive ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {clientTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b' }}>
                    Showing page {clientPage} of {clientTotalPages} ({clientTotalCount} total clients)
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => loadAdminClients(clientPage - 1)}
                      disabled={clientPage <= 1}
                      className="btn btn-sm btn-secondary"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => loadAdminClients(clientPage + 1)}
                      disabled={clientPage >= clientTotalPages}
                      className="btn btn-sm btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-card, #e2e8f0)', borderRadius: 12, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>Registered Users & RBAC Roles</h3>
              <span style={{ fontSize: '0.75rem', background: 'var(--bg-main, #f1f5f9)', padding: '2px 8px', borderRadius: 10, color: 'var(--text-muted, #475569)' }}>
                {filteredUsers.length} Users
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border-subtle, #cbd5e1)', borderRadius: 8, padding: '6px 12px' }}>
                <Search size={14} color="#64748b" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: 180, color: 'var(--text-main, #0f172a)' }}
                />
              </div>
              <button onClick={() => setShowAddUserModal(true)} className="btn btn-sm btn-primary">
                <Plus size={14} /> Add User
              </button>
            </div>
          </div>

          <table className="table" style={{ width: '100%', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-card, #e2e8f0)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>User Name</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Email</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Role</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Organization</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted, #64748b)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>{u.name}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted, #64748b)' }}>{u.email}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: u.role === 'super_admin' ? '#ede9fe' : (u.role === 'tender_authority' ? '#e0f2f1' : (u.role === 'viewer' ? '#fef3c7' : '#e0f2fe')),
                      color: u.role === 'super_admin' ? '#7c3aed' : (u.role === 'tender_authority' ? '#00796b' : (u.role === 'viewer' ? '#d97706' : '#0284c7'))
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted, #475569)' }}>{u.organization_name || '—'}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleUser(u.id)}
                      style={{
                        border: 'none',
                        background: u.is_active ? '#dcfce7' : '#fee2e2',
                        color: u.is_active ? '#166534' : '#991b1b',
                        padding: '3px 9px',
                        borderRadius: 12,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {u.is_active ? 'Active ✓' : 'Inactive ✗'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setEditUserData(u)}
                        className="btn btn-sm btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      {u.role !== 'super_admin' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          style={{
                            background: '#fee2e2',
                            border: 'none',
                            color: '#dc2626',
                            padding: '4px 8px',
                            borderRadius: 6,
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: COMPANIES APPROVALS */}
      {activeTab === 'companies' && (
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-card, #e2e8f0)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-main, #0f172a)' }}>
            Registered Corporate Bidders & Verification Ledger
          </h3>
          <table className="table" style={{ width: '100%', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-card, #e2e8f0)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Company Name</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>GSTIN & PAN</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Turnover</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Experience</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Location</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Bids Submitted</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted, #64748b)' }}>Verification Action</th>
              </tr>
            </thead>
            <tbody>
              {companiesList.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>{c.company_name}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#475569' }}>
                    {c.gst_number || '24AAACT1234F1Z8'}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#00796b' }}>
                    {formatINR(c.annual_turnover || 550000000)}
                  </td>
                  <td style={{ padding: '10px 14px' }}>{c.years_of_experience || 8} Years</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{c.city || 'Ahmedabad'}, {c.state || 'Gujarat'}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>{c.submitted_bids_count || 5} Bids</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: c.verified ? '#dcfce7' : '#fef3c7',
                      color: c.verified ? '#166534' : '#92400e'
                    }}>
                      {c.verified ? 'Verified ✓' : 'Pending Verification'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleVerifyCompany(c.id, c.verified)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: c.verified ? '#fee2e2' : '#0284c7',
                        color: c.verified ? '#dc2626' : '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {c.verified ? 'Revoke Verification' : 'Approve & Verify ✓'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: AUTHORITIES APPROVALS */}
      {activeTab === 'authorities' && (
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-card, #e2e8f0)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-main, #0f172a)' }}>
            Tender Authorities & Department Head Registrations
          </h3>
          <table className="table" style={{ width: '100%', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-card, #e2e8f0)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Officer Name</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Official Email</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Government Department</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Designation</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Approval Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted, #64748b)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {authoritiesList.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>{a.user_name}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted, #64748b)' }}>{a.user_email}</td>
                  <td style={{ padding: '10px 14px', color: '#00796b', fontWeight: 600 }}>{a.organization_name}</td>
                  <td style={{ padding: '10px 14px' }}>{a.designation || 'Officer'}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: a.approval_status === 'approved' ? '#dcfce7' : (a.approval_status === 'rejected' ? '#fee2e2' : '#fef3c7'),
                      color: a.approval_status === 'approved' ? '#166534' : (a.approval_status === 'rejected' ? '#991b1b' : '#92400e')
                    }}>
                      {a.approval_status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    {a.approval_status !== 'approved' ? (
                      <button
                        onClick={() => handleUpdateAuthority(a.id, 'approved')}
                        className="btn btn-sm btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                      >
                        Approve Authority
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateAuthority(a.id, 'rejected')}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          color: '#dc2626',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        Revoke Access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: ALL TENDERS MANAGEMENT */}
      {activeTab === 'tenders' && (
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-card, #e2e8f0)', borderRadius: 12, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>System-wide Tenders Master Index</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border-subtle, #cbd5e1)', borderRadius: 8, padding: '6px 12px' }}>
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Search tenders..."
                value={tenderSearch}
                onChange={e => setTenderSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: 200, color: 'var(--text-main, #0f172a)' }}
              />
            </div>
          </div>

          <table className="table" style={{ width: '100%', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-card, #e2e8f0)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Ref No</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Title</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Department</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Estimated Value</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Closing Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted, #64748b)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenders.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                    {t.tender_reference_no}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a', maxWidth: 280 }}>
                    {t.title}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{t.organization_name}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#00796b' }}>{formatINR(t.estimated_value)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#d97706' }}>
                    {new Date(t.closing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: t.status === 'published' ? '#dcfce7' : (t.status === 'closed' ? '#fee2e2' : '#f1f5f9'),
                      color: t.status === 'published' ? '#166534' : (t.status === 'closed' ? '#991b1b' : '#475569')
                    }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => onViewDetails && onViewDetails(t)}
                        className="btn btn-sm btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteTender(t.id, t.tender_reference_no)}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          color: '#dc2626',
                          padding: '4px 8px',
                          borderRadius: 6,
                          cursor: 'pointer'
                        }}
                        title="Delete Tender"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: ALL BIDS MASTER LEDGER */}
      {activeTab === 'bids' && (
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-card, #e2e8f0)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-main, #0f172a)' }}>
            System-Wide Bids & Commercial Quotes Ledger
          </h3>
          <table className="table" style={{ width: '100%', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-card, #e2e8f0)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Tender Ref</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Bidder / Company</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Department</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Quoted Bid Price</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Submitted Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>Evaluation Remarks</th>
              </tr>
            </thead>
            <tbody>
              {allBids.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                    {b.tender_reference_no}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                    {b.company_name}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{b.department}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 800, color: '#00796b' }}>
                    {formatINR(b.bid_amount)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: b.status === 'awarded' ? '#dcfce7' : (b.status === 'shortlisted' ? '#e0f2fe' : (b.status === 'rejected' ? '#fee2e2' : '#f1f5f9')),
                      color: b.status === 'awarded' ? '#166534' : (b.status === 'shortlisted' ? '#0284c7' : (b.status === 'rejected' ? '#991b1b' : '#475569'))
                    }}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b' }}>
                    {new Date(b.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={{ padding: '10px 14px', color: b.rejection_reason ? '#dc2626' : '#64748b', fontSize: '0.78rem' }}>
                    {b.rejection_reason || (b.evaluation_score ? `Score: ${b.evaluation_score}/100` : 'Under technical review')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 7: DOCUMENTS & AI KNOWLEDGE INGESTION */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Document AI Analysis & Knowledge Management (Requirement 5 & 19) */}
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-card, #e2e8f0)',
            borderRadius: 14,
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <FileText size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                  Tender Document AI Analysis & Knowledge Ingestion
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                  Upload official tender documents (.PDF, .DOC, .DOCX, .TXT). Content is automatically parsed and made available to the AI document retrieval engine.
                </div>
              </div>
            </div>

            <form onSubmit={handleUploadTenderDoc} style={{
              marginTop: 18,
              padding: '16px',
              background: 'var(--bg-main, #f8fafc)',
              borderRadius: 10,
              border: '1px solid var(--border-card, #e2e8f0)',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr auto',
              gap: 14,
              alignItems: 'center'
            }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Select Target Tender</label>
                <select
                  value={docTenderId}
                  onChange={e => setDocTenderId(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  <option value="">-- Choose tender to associate document with --</option>
                  {allTenders.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tender_reference_no} – {t.title?.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Select Document (PDF, DOC, DOCX, TXT)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={e => setTenderDocFile(e.target.files[0])}
                  style={{ fontSize: '0.8rem', width: '100%' }}
                />
              </div>

              <div style={{ paddingTop: 18 }}>
                <button
                  type="submit"
                  disabled={docUploading || !docTenderId || !tenderDocFile}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 38,
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}
                >
                  <Upload size={14} />
                  {docUploading ? 'Indexing Document...' : 'Upload & Index AI Knowledge'}
                </button>
              </div>
            </form>

            {docUploadSuccess && (
              <div style={{
                marginTop: 14,
                padding: '12px 16px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 8,
                color: '#065f46',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <CircleCheck size={16} color="#059669" />
                <span>
                  <strong>Success:</strong> Document processed and securely indexed into the AI RAG Knowledge Base. The AI Tender Assistant can now cite this document.
                </span>
              </div>
            )}

            {/* Interactive Q&A Sandbox */}
            <div style={{
              marginTop: 20,
              padding: '18px',
              borderRadius: 12,
              border: '1px solid var(--border-card, #e2e8f0)',
              background: 'var(--bg-card, #ffffff)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Bot size={16} color="#4f46e5" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                  Ask Questions About This Document (RAG Grounded Q&A)
                </h4>
              </div>

              {/* Quick AI Questions Chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {[
                  'What is the EMD?',
                  'What is the eligibility criteria?',
                  'What documents are required?',
                  'What is the last date?',
                  'Is GST required?',
                  'What is the minimum turnover requirement?',
                  'What experience is required?',
                  'Summarize this document.'
                ].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setDocQuestion(q);
                      handleAskDocAI(q);
                    }}
                    style={{
                      background: 'var(--bg-main, #f1f5f9)',
                      border: '1px solid var(--border-card, #e2e8f0)',
                      borderRadius: 14,
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-muted, #475569)',
                      cursor: 'pointer'
                    }}
                  >
                    "{q}"
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={docQuestion}
                  onChange={e => setDocQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAskDocAI(); }}
                  placeholder="Ask any question about the selected tender and uploaded document..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-card, #cbd5e1)',
                    background: 'var(--bg-main, #f8fafc)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAskDocAI()}
                  disabled={docAnswering || !docTenderId || !docQuestion.trim()}
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', padding: '8px 18px' }}
                >
                  {docAnswering ? 'Analyzing...' : 'Ask AI'}
                </button>
              </div>

              {/* Answer display */}
              {docAnswer && (
                <div style={{
                  marginTop: 14,
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: 'var(--bg-main, #f8fafc)',
                  border: '1px solid #c7d2fe',
                  borderLeft: '4px solid #4f46e5'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main, #0f172a)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {docAnswer.answer}
                  </div>
                  {docAnswer.citations && docAnswer.citations.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {docAnswer.citations.map((cite, i) => (
                        <span key={i} style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#4338ca',
                          background: '#e0e7ff',
                          padding: '2px 8px',
                          borderRadius: 6
                        }}>
                          {cite}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bulk CSV / Excel Tender Importer */}
          <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-card, #e2e8f0)', borderRadius: 14, padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-main, #0f172a)' }}>
              Bulk CSV / Excel Tender Importer
            </h3>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.84rem', margin: '0 0 16px' }}>
              Upload large batches of official municipal and state procurement tenders from Excel or GeM CSV exports.
            </p>

            <form onSubmit={handleImportSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={e => setFileToImport(e.target.files[0])}
                style={{ fontSize: '0.82rem' }}
              />
              <button
                type="submit"
                disabled={importing}
                className="btn btn-primary"
              >
                {importing ? 'Processing Sheet...' : 'Execute Bulk Ingestion'}
              </button>
            </form>

            {importResult && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 700, color: '#166534' }}>Import Complete:</span> {importResult.importedCount} tenders added, {importResult.duplicateCount} duplicates ignored.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT LOGS */}
      {activeTab === 'audits' && (
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-card, #e2e8f0)', borderRadius: 12, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main, #0f172a)' }}>Immutable Security Audit Trail</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                Standardized Enterprise Format: <em>User name – User role – Action performed – Date & time – Related tender – IP address</em>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border-subtle, #cbd5e1)', borderRadius: 8, padding: '6px 12px' }}>
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: 220, color: 'var(--text-main, #0f172a)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredAuditLogs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <History size={16} color="#4f46e5" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                      {log.formatted_entry || `${log.user_name || log.user_id} – ${log.action}`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                      Device: {log.device_info || 'Web Browser'} • Timestamp: {new Date(log.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569' }}>
                  {log.ip_address || '127.0.0.1'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: SETTINGS */}
      {activeTab === 'settings' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '24px', maxWidth: 800 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px' }}>TenderHub Platform Security & System Settings</h3>
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Portal Brand Name</label>
              <input
                type="text"
                value={settings?.portal_name || 'TenderHub'}
                onChange={e => setSettings({ ...settings, portal_name: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Portal Tagline</label>
              <input
                type="text"
                value={settings?.portal_tagline || 'Secure Tender Management & Bidding Portal'}
                onChange={e => setSettings({ ...settings, portal_tagline: e.target.value })}
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Minimum Bid Validity (Days)</label>
                <input
                  type="number"
                  value={settings?.min_bid_validity_days || 90}
                  onChange={e => setSettings({ ...settings, min_bid_validity_days: Number(e.target.value) })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Session Inactivity Timeout (Minutes)</label>
                <input
                  type="number"
                  value={settings?.session_timeout_minutes || 60}
                  onChange={e => setSettings({ ...settings, session_timeout_minutes: Number(e.target.value) })}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <input
                type="checkbox"
                id="maintMode"
                checked={Boolean(settings?.maintenance_mode)}
                onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })}
              />
              <label htmlFor="maintMode" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                Enable Platform Maintenance Mode (Temporarily pause public bidding)
              </label>
            </div>

            {/* Portal Language & Regional Localization */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 18, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Globe size={18} color="#4f46e5" />
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  Portal Language & Regional Localization / પ્રાદેશિક ભાષા પસંદગી
                </label>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 12 }}>
                Configure platform display language for navigation, procurement documents, and system telemetry.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { code: 'en', label: '🇬🇧 English (Enterprise)' },
                  { code: 'gu', label: '🇮🇳 ગુજરાતી (ગુજરાત સરકાર)' },
                  { code: 'hi', label: '🇮🇳 हिन्दी (राष्ट्रीय ई-प्रोक्योरमेंट)' }
                ].map(item => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLanguage(item.code);
                      if (onShowToast) onShowToast(`Platform language set to ${item.label}`);
                    }}
                    className={`btn btn-sm ${language === item.code ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: 160, marginTop: 14 }}>
              Save Settings
            </button>
          </form>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700 }}>Add New User Account</h3>
            <form onSubmit={handleCreateUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Full Name *</label>
                <input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} className="form-input" placeholder="e.g. Ramesh Shah" />
              </div>
              <div>
                <label className="form-label">Email Address *</label>
                <input type="email" required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="form-input" placeholder="user@domain.com" />
              </div>
              <div>
                <label className="form-label">Initial Password *</label>
                <input type="text" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Assigned Role *</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="form-select">
                  <option value="super_admin">1. Super Admin</option>
                  <option value="tender_authority">2. Tender Authority / Dept Head</option>
                  <option value="company_user">3. Company / Bidder</option>
                  <option value="viewer">4. Viewer</option>
                </select>
              </div>
              <div>
                <label className="form-label">Department / Company Name</label>
                <input type="text" value={newUserOrg} onChange={e => setNewUserOrg(e.target.value)} className="form-input" placeholder="e.g. GUDM or TechInfra" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700 }}>Edit User: {editUserData.name}</h3>
            <form onSubmit={handleUpdateUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Full Name</label>
                <input type="text" value={editUserData.name} onChange={e => setEditUserData({ ...editUserData, name: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="form-label">Role</label>
                <select value={editUserData.role} onChange={e => setEditUserData({ ...editUserData, role: e.target.value })} className="form-select">
                  <option value="super_admin">Super Admin</option>
                  <option value="tender_authority">Tender Authority</option>
                  <option value="company_user">Company / Bidder</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input type="text" value={editUserData.phone || ''} onChange={e => setEditUserData({ ...editUserData, phone: e.target.value })} className="form-input" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setEditUserData(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Dossier & Document Verification Modal (Requirement 7) */}
      {clientDetailModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 960,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0f172a',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1rem', color: '#ffffff'
                }}>
                  {selectedClientDetail?.profile?.full_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                      {selectedClientDetail?.profile?.full_name || 'Client Dossier'}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.15)',
                      fontFamily: 'monospace', fontSize: '0.74rem', fontWeight: 700
                    }}>
                      {selectedClientDetail?.profile?.user_id_formatted || selectedClientDetail?.profile?.user_id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {selectedClientDetail?.profile?.designation} • <strong style={{ color: '#38bdf8' }}>{selectedClientDetail?.profile?.company_name}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {selectedClientDetail?.profile && (
                  <button
                    onClick={() => handleToggleClientStatus(selectedClientDetail.profile.user_id, selectedClientDetail.profile.account_status)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: selectedClientDetail.profile.account_status === 'active' ? '#ef4444' : '#10b981',
                      color: '#ffffff',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {selectedClientDetail.profile.account_status === 'active' ? <Ban size={13} /> : <Check size={13} />}
                    {selectedClientDetail.profile.account_status === 'active' ? 'Suspend Account' : 'Activate Account'}
                  </button>
                )}
                <button
                  onClick={() => { setClientDetailModal(false); setSelectedClientDetail(null); }}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Sub-tabs */}
            <div style={{
              display: 'flex',
              gap: 8,
              padding: '10px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {[
                { id: 'profile', label: 'Client Profile', icon: UserCheck },
                { id: 'documents', label: `Submitted Documents (${selectedClientDetail?.documents?.length || 0})`, icon: FileText },
                { id: 'tenders', label: `Tender History (${selectedClientDetail?.bids?.length || 0})`, icon: Send },
                { id: 'activity', label: 'Activity Logs', icon: History }
              ].map(t => {
                const isTabActive = clientDetailSubTab === t.id;
                const TabIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setClientDetailSubTab(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      fontSize: '0.8rem', fontWeight: isTabActive ? 700 : 500,
                      background: isTabActive ? '#0284c7' : 'transparent',
                      color: isTabActive ? '#ffffff' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    <TabIcon size={14} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {clientDetailLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                  <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
                  <div>Loading full client dossier...</div>
                </div>
              ) : !selectedClientDetail ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                  No details available.
                </div>
              ) : (
                <>
                  {/* SUBTAB 1: CLIENT PROFILE */}
                  {clientDetailSubTab === 'profile' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* Summary Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>ANNUAL TURNOVER</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                            {selectedClientDetail.profile.annual_turnover_range || '₹25 Cr - ₹100 Cr'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#0284c7' }}>{selectedClientDetail.profile.years_experience || 5}+ Years Experience</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>VERIFICATION STATUS</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', margin: '4px 0', textTransform: 'capitalize' }}>
                            {selectedClientDetail.profile.verification_status || 'Verified'} ✓
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Account: {selectedClientDetail.profile.account_status}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>BIDS SUBMITTED</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                            {selectedClientDetail.stats?.applied || selectedClientDetail.bids?.length || 0}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>Won: {selectedClientDetail.stats?.won || 0} Tenders</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>EMPLOYEES</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                            {selectedClientDetail.profile.employees_count || '50-250'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{selectedClientDetail.profile.business_type}</div>
                        </div>
                      </div>

                      {/* Detailed Fields Grid */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16,
                        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18
                      }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>FULL NAME & DESIGNATION</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                            {selectedClientDetail.profile.full_name} ({selectedClientDetail.profile.designation})
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>COMPANY NAME & TYPE</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0284c7' }}>
                            {selectedClientDetail.profile.company_name} • {selectedClientDetail.profile.business_type}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PRIMARY CONTACT</div>
                          <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                            {selectedClientDetail.profile.email} • {selectedClientDetail.profile.phone}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>INDUSTRY CLUSTER</div>
                          <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                            {selectedClientDetail.profile.industry}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>GSTIN (DUMMY PLACEHOLDER)</div>
                          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                            {selectedClientDetail.profile.gstin || '24AAACT1234F1Z8'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PAN (DUMMY PLACEHOLDER)</div>
                          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                            {selectedClientDetail.profile.pan || 'AAACT1234F'}
                          </div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>REGISTERED ADDRESS</div>
                          <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                            {selectedClientDetail.profile.address}, {selectedClientDetail.profile.city}, {selectedClientDetail.profile.state} - {selectedClientDetail.profile.pincode}
                          </div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>SERVICES & PRODUCTS OFFERED</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                            {(Array.isArray(selectedClientDetail.profile.services_offered)
                              ? selectedClientDetail.profile.services_offered
                              : (selectedClientDetail.profile.services_offered || '').split(',')
                            ).map((s, idx) => (
                              <span key={idx} style={{
                                padding: '3px 10px', borderRadius: 12,
                                background: '#f1f5f9', fontSize: '0.74rem', color: '#334155', fontWeight: 600
                              }}>
                                {typeof s === 'string' ? s.trim() : s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>COMPANY OVERVIEW</div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, marginTop: 3 }}>
                            {selectedClientDetail.profile.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: SUBMITTED DOCUMENTS & VERIFICATION SUITE */}
                  {clientDetailSubTab === 'documents' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700 }}>
                          Submitted Compliance & Qualification Credentials
                        </h4>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Admins can approve or reject credentials with instant client notification.
                        </span>
                      </div>

                      {(!selectedClientDetail.documents || selectedClientDetail.documents.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                          No documents uploaded yet by this client.
                        </div>
                      ) : (
                        <table className="table" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Document Type</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>File Name</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Upload Date</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Expiry Date</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b' }}>Status</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>Admin Verification</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedClientDetail.documents.map(doc => {
                              const isDocVerified = doc.verification_status === 'verified';
                              return (
                                <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                                    {doc.document_type?.replace(/_/g, ' ')?.toUpperCase()}
                                  </td>
                                  <td style={{ padding: '10px 12px', color: '#0284c7' }}>
                                    {doc.document_name}
                                  </td>
                                  <td style={{ padding: '10px 12px', color: '#64748b' }}>
                                    {new Date(doc.upload_date).toLocaleDateString()}
                                  </td>
                                  <td style={{ padding: '10px 12px', color: '#64748b' }}>
                                    {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <span style={{
                                      padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700,
                                      background: isDocVerified ? '#dcfce7' : '#fef3c7',
                                      color: isDocVerified ? '#166534' : '#92400e'
                                    }}>
                                      {doc.verification_status || 'Pending'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                      {!isDocVerified ? (
                                        <button
                                          onClick={() => handleVerifyClientDocument(doc.id, 'verified')}
                                          style={{
                                            padding: '4px 10px', borderRadius: 6, border: 'none',
                                            background: '#16a34a', color: '#ffffff',
                                            fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                                          }}
                                        >
                                          Verify ✓
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            const reason = window.prompt('Enter reason for revoking/rejecting document:');
                                            if (reason !== null) {
                                              handleVerifyClientDocument(doc.id, 'rejected', reason);
                                            }
                                          }}
                                          style={{
                                            padding: '4px 10px', borderRadius: 6, border: 'none',
                                            background: '#fee2e2', color: '#dc2626',
                                            fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                                          }}
                                        >
                                          Reject ✗
                                        </button>
                                      )}
                                      <a
                                        href={doc.file_path || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          padding: '4px 8px', borderRadius: 6,
                                          background: '#f1f5f9', color: '#334155',
                                          fontSize: '0.72rem', textDecoration: 'none', fontWeight: 600,
                                          display: 'inline-flex', alignItems: 'center', gap: 4
                                        }}
                                      >
                                        <Download size={11} /> Download
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* SUBTAB 3: TENDER HISTORY & BIDS */}
                  {clientDetailSubTab === 'tenders' && (
                    <div>
                      <h4 style={{ margin: '0 0 14px', fontSize: '0.96rem', fontWeight: 700 }}>
                        Tender Participation & Bidding Record
                      </h4>
                      {(!selectedClientDetail.bids || selectedClientDetail.bids.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                          No bids submitted yet by this client.
                        </div>
                      ) : (
                        <table className="table" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Tender ID / Title</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>Submitted Bid</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b' }}>Submission Date</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b' }}>Bid Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedClientDetail.bids.map(b => (
                              <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.tender_title || b.tender_id}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>Ref: {b.tender_id}</div>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#00796b' }}>
                                  {formatINR(b.bid_amount || b.price_bid || 0)}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                                  {new Date(b.submitted_at || b.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '3px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700,
                                    background: b.status === 'awarded' ? '#dcfce7' : (b.status === 'rejected' ? '#fee2e2' : '#fef3c7'),
                                    color: b.status === 'awarded' ? '#166534' : (b.status === 'rejected' ? '#991b1b' : '#92400e')
                                  }}>
                                    {(b.status || 'Submitted').toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* SUBTAB 4: ACTIVITY LOGS */}
                  {clientDetailSubTab === 'activity' && (
                    <div>
                      <h4 style={{ margin: '0 0 14px', fontSize: '0.96rem', fontWeight: 700 }}>
                        Client Activity & Audit History
                      </h4>
                      {(!selectedClientDetail.recent_activity || selectedClientDetail.recent_activity.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                          No activity recorded yet for this client.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {selectedClientDetail.recent_activity.map((act, idx) => (
                            <div key={idx} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 12,
                              padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0'
                            }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 6, background: '#e0f2fe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1',
                                flexShrink: 0, marginTop: 2
                              }}>
                                <History size={14} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                                  {act.title || act.type}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                                  {act.description}
                                </div>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                {new Date(act.created_at).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#f8fafc'
            }}>
              <button
                type="button"
                onClick={() => { setClientDetailModal(false); setSelectedClientDetail(null); }}
                className="btn btn-secondary"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
