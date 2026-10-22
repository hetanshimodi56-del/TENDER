import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Building, Mail, Phone, MapPin, Globe, Award, Briefcase,
  FileText, Upload, Download, Trash2, Eye, Search, Filter, Bell,
  CheckCircle, Clock, AlertTriangle, XCircle, Star, Target,
  TrendingUp, BarChart2, PieChart, Send, Bookmark, ExternalLink,
  ChevronDown, ChevronRight, Shield, Edit3, Save, X, RefreshCw,
  Calendar, Hash, CreditCard, Users, Layers, Zap, Activity, Info
} from 'lucide-react';
import { api } from '../services/api';

// ============================================================================
// CLIENT DETAILS & SMART TENDER MATCHING MODULE
// ============================================================================

// Sub-tab definitions
const CLIENT_TABS = [
  { id: 'profile', label: 'Client Profile', icon: User },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'matching', label: 'Smart Matching', icon: Target },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'activity', label: 'Activity & Notifications', icon: Bell }
];

// Document types
const DOCUMENT_TYPES = [
  { value: 'company_registration', label: 'Company Registration Certificate' },
  { value: 'gst_certificate', label: 'GST Certificate' },
  { value: 'pan_document', label: 'PAN Document' },
  { value: 'experience_certificate', label: 'Experience Certificates' },
  { value: 'financial_statement', label: 'Financial Statements' },
  { value: 'other', label: 'Other Required Certificates' }
];

// Status badge helper
function StatusBadge({ status, size = 'sm' }) {
  const styles = {
    active: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.3)', label: 'Active' },
    approved: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.3)', label: 'Verified' },
    verified: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.3)', label: 'Verified' },
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: 'Pending' },
    suspended: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.3)', label: 'Suspended' },
    rejected: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.3)', label: 'Rejected' },
    not_submitted: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: 'rgba(148,163,184,0.3)', label: 'Not Submitted' }
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '3px 8px' : '4px 12px',
      borderRadius: 20, fontSize: size === 'sm' ? '0.68rem' : '0.76rem',
      fontWeight: 700, background: s.bg, color: s.color,
      border: `1px solid ${s.border}`, letterSpacing: '0.02em'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }}></span>
      {s.label}
    </span>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, gradient }) {
  return (
    <div style={{
      background: gradient || 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 14, padding: '20px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: 'var(--shadow-card)', transition: 'all 0.2s ease',
      cursor: 'default', minWidth: 0
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: color ? `${color}18` : 'rgba(0,121,107,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={20} color={color || '#00796b'} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// Simple Bar Chart
function SimpleBarChart({ data, height = 200 }) {
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center', padding: 30 }}>No data available</div>;
  const maxVal = Math.max(...data.map(d => d.bids || d.count || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, padding: '10px 0' }}>
      {data.map((item, i) => {
        const val = item.bids || item.count || 0;
        const h = (val / maxVal) * (height - 40);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-main)' }}>{val}</span>
            <div style={{
              width: '100%', maxWidth: 40, height: Math.max(h, 4), borderRadius: '6px 6px 2px 2px',
              background: `linear-gradient(180deg, #00796b, #004d40)`, transition: 'height 0.5s ease',
              minHeight: 4
            }}></div>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.2 }}>
              {item.month || item.name || ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Donut chart
function DonutChart({ data, size = 140 }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 20, fontSize: '0.82rem' }}>No data</div>;

  const colors = ['#00796b', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  let cumAngle = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, i) => {
          const angle = (item.count / total) * 360;
          const startAngle = cumAngle;
          cumAngle += angle;
          const r = size / 2 - 5;
          const cx = size / 2, cy = size / 2;
          const startRad = (startAngle - 90) * Math.PI / 180;
          const endRad = (startAngle + angle - 90) * Math.PI / 180;
          const largeArc = angle > 180 ? 1 : 0;
          const x1 = cx + r * Math.cos(startRad);
          const y1 = cy + r * Math.sin(startRad);
          const x2 = cx + r * Math.cos(endRad);
          const y2 = cy + r * Math.sin(endRad);
          const color = item.color || colors[i % colors.length];
          if (data.length === 1) {
            return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={20} />;
          }
          return (
            <path key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={color} opacity={0.85}
            />
          );
        })}
        <circle cx={size / 2} cy={size / 2} r={size / 4} fill="var(--bg-card, #fff)" />
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" style={{ fontSize: '1.2rem', fontWeight: 800, fill: 'var(--text-main)' }}>{total}</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" style={{ fontSize: '0.6rem', fill: 'var(--text-muted)', fontWeight: 600 }}>Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color || colors[i % colors.length], flexShrink: 0 }}></span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{item.name}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)', marginLeft: 'auto' }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Match percentage ring
function MatchRing({ percentage, size = 56 }) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 70 ? '#10b981' : percentage >= 45 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.72rem', fontWeight: 800, color
      }}>
        {percentage}%
      </div>
    </div>
  );
}


export default function ClientModuleView({ user, onShowToast, onViewTenderDetails, initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [smartMatches, setSmartMatches] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Documents
  const [documents, setDocuments] = useState([]);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ document_type: 'company_registration', document_name: '', expiry_date: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifFilter, setNotifFilter] = useState('all');

  // Search and pagination for matching
  const [matchSearch, setMatchSearch] = useState('');
  const [matchPage, setMatchPage] = useState(1);

  // Application Modal state
  const [applyModalTender, setApplyModalTender] = useState(null);
  const [applyBidAmount, setApplyBidAmount] = useState('');
  const [applyProposal, setApplyProposal] = useState('');
  const [applyTimeline, setApplyTimeline] = useState('6');
  const [applying, setApplying] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getClientProfile();
      setProfileData(res.data);
      setDocuments(res.data?.documents || []);
      setActivities(res.data?.activities || []);
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      console.error('Failed to load client profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    if (activeTab === 'matching' && !smartMatches) {
      loadSmartMatches();
    }
  }, [activeTab, smartMatches]);

  const loadSmartMatches = async () => {
    try {
      setMatchLoading(true);
      const res = await api.getSmartMatches();
      setSmartMatches(res);
    } catch (err) {
      console.error('Failed to load smart matches:', err);
      onShowToast?.('Failed to generate smart matches', 'error');
    } finally {
      setMatchLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await api.getClientDocuments();
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.getClientNotifications(notifFilter !== 'all' ? notifFilter : '');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const loadActivities = async () => {
    try {
      const res = await api.getClientActivity();
      setActivities(res.data || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'matching' && !smartMatches) loadSmartMatches();
    if (activeTab === 'documents') loadDocuments();
    if (activeTab === 'activity') { loadNotifications(); loadActivities(); }
  }, [activeTab]);

  useEffect(() => { if (activeTab === 'activity') loadNotifications(); }, [notifFilter]);

  // Profile editing
  const startEditing = () => {
    const p = profileData?.profile || {};
    setEditForm({
      full_name: p.full_name || profileData?.user?.name?.split(' (')[0] || '',
      designation: p.designation || '',
      company_name: p.company_name || profileData?.companyProfile?.company_name || '',
      business_type: p.business_type || '',
      industry: p.industry || '',
      gstin: p.gstin || '',
      pan: p.pan || '',
      address: p.address || '',
      city: p.city || '',
      state: p.state || '',
      pin_code: p.pin_code || '',
      website: p.website || '',
      description: p.description || '',
      years_experience: p.years_experience || 0,
      annual_turnover: p.annual_turnover || '',
      employee_count: p.employee_count || '',
      services_products: (p.services_products || []).join(', '),
      mobile: p.mobile || profileData?.user?.phone || ''
    });
    setIsEditing(true);
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const data = {
        ...editForm,
        services_products: editForm.services_products.split(',').map(s => s.trim()).filter(Boolean),
        years_experience: Number(editForm.years_experience) || 0
      };
      await api.updateClientProfile(data);
      onShowToast?.('Profile updated successfully!', 'success');
      setIsEditing(false);
      loadProfile();
    } catch (err) {
      onShowToast?.('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Document upload
  const handleUploadDocument = async () => {
    try {
      setUploading(true);
      const formData = new FormData();
      if (uploadFile) formData.append('file', uploadFile);
      formData.append('document_type', uploadForm.document_type);
      formData.append('document_name', uploadForm.document_name || uploadFile?.name || 'Document');
      if (uploadForm.expiry_date) formData.append('expiry_date', uploadForm.expiry_date);

      await api.uploadClientDocument(formData);
      onShowToast?.('Document uploaded successfully!', 'success');
      setUploadModal(false);
      setUploadFile(null);
      setUploadForm({ document_type: 'company_registration', document_name: '', expiry_date: '' });
      loadDocuments();
    } catch (err) {
      onShowToast?.('Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteClientDocument(docId);
      onShowToast?.('Document deleted', 'success');
      loadDocuments();
    } catch (err) {
      onShowToast?.('Failed to delete document', 'error');
    }
  };

  // Notification actions
  const handleMarkRead = async (id) => {
    try {
      await api.markClientNotificationRead(id);
      loadNotifications();
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markClientNotificationRead('all');
      onShowToast?.('All notifications marked as read', 'success');
      loadNotifications();
    } catch (err) { console.error(err); }
  };

  // Tender actions
  const handleSaveTender = async (tenderId) => {
    try {
      await api.saveClientTender(tenderId);
      onShowToast?.('Tender saved to your shortlist!', 'success');
    } catch (err) {
      onShowToast?.('Failed to save tender', 'error');
    }
  };

  const handleOpenApplyModal = (tender) => {
    setApplyModalTender(tender);
    setApplyBidAmount(tender.estimated_value ? String(tender.estimated_value) : '');
    setApplyProposal(`Proposal for ${tender.title}. We confirm full compliance with technical requirements, safety standards, and project schedule.`);
    setApplyTimeline('6');
  };

  const handleConfirmApply = async (e) => {
    e.preventDefault();
    if (!applyModalTender) return;
    try {
      setApplying(true);
      await api.applyClientTender({
        tender_id: applyModalTender.id,
        bid_amount: Number(applyBidAmount) || 0,
        technical_proposal: applyProposal,
        commercial_terms: 'Government e-procurement guidelines and standard terms accepted',
        delivery_timeline_months: Number(applyTimeline) || 6
      });
      onShowToast?.(`Bid application submitted for tender ${applyModalTender.tender_reference_no}!`, 'success');
      setApplyModalTender(null);
      loadSmartMatches();
      loadProfile();
    } catch (err) {
      onShowToast?.(err.message || 'Failed to submit application', 'error');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-muted)' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: 10 }}>Loading client profile...</span>
      </div>
    );
  }

  const profile = profileData?.profile || {};
  const stats = profileData?.stats || {};
  const uData = profileData?.user || {};

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px' }}>
      {/* Module Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={24} color="#00796b" />
            Client Details & Smart Matching
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Complete client profile, AI tender recommendations, documents, and activity tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <StatusBadge status={profile.verification_status || 'pending'} size="md" />
          <span style={{
            background: 'rgba(0,121,107,0.1)', border: '1px solid rgba(0,121,107,0.2)',
            padding: '4px 12px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 700, color: '#00796b'
          }}>
            {uData.user_id || 'N/A'}
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto',
        borderBottom: '2px solid var(--border-subtle)', paddingBottom: 0
      }}>
        {CLIENT_TABS.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
              border: 'none', borderBottom: isActive ? '2px solid #00796b' : '2px solid transparent',
              background: 'transparent', cursor: 'pointer', fontSize: '0.84rem',
              fontWeight: isActive ? 700 : 500, color: isActive ? '#00796b' : 'var(--text-muted)',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap', marginBottom: -2
            }}>
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB: CLIENT PROFILE                                          */}
      {/* ============================================================ */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Profile Header Card */}
          <div className="glass-card" style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 88, height: 88, borderRadius: 18,
              background: 'linear-gradient(135deg, #00796b, #004d40)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 800, color: '#fff', flexShrink: 0,
              boxShadow: '0 6px 20px rgba(0,121,107,0.3)'
            }}>
              {(profile.full_name || uData.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {profile.full_name || uData.name?.split(' (')[0] || 'Client'}
              </h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 2 }}>
                {profile.designation || 'N/A'} • {profile.company_name || 'Company Not Set'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  <Mail size={13} /> {uData.email || 'N/A'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  <Phone size={13} /> {profile.mobile || uData.phone || 'N/A'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  <MapPin size={13} /> {profile.city || 'N/A'}, {profile.state || 'N/A'}
                </span>
                {profile.website && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#00796b', cursor: 'pointer' }}>
                    <Globe size={13} /> {profile.website}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!isEditing ? (
                <button onClick={startEditing} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--bg-card)',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)',
                  transition: 'all 0.15s'
                }}>
                  <Edit3 size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={saveProfile} disabled={saving} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                    border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #00796b, #004d40)',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#fff'
                  }}>
                    <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setIsEditing(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                    border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--bg-card)',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)'
                  }}>
                    <X size={14} /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Details Grid */}
          {isEditing ? (
            // EDIT MODE
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 18 }}>Edit Client Profile</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {[
                  { key: 'full_name', label: 'Full Name', type: 'text' },
                  { key: 'designation', label: 'Designation', type: 'text' },
                  { key: 'company_name', label: 'Company Name', type: 'text' },
                  { key: 'business_type', label: 'Business Type', type: 'text' },
                  { key: 'industry', label: 'Industry', type: 'text' },
                  { key: 'mobile', label: 'Mobile Number', type: 'text' },
                  { key: 'gstin', label: 'GSTIN (Demo Placeholder)', type: 'text' },
                  { key: 'pan', label: 'PAN (Demo Placeholder)', type: 'text' },
                  { key: 'address', label: 'Address', type: 'text' },
                  { key: 'city', label: 'City', type: 'text' },
                  { key: 'state', label: 'State', type: 'text' },
                  { key: 'pin_code', label: 'PIN Code', type: 'text' },
                  { key: 'website', label: 'Company Website', type: 'text' },
                  { key: 'years_experience', label: 'Years of Experience', type: 'number' },
                  { key: 'annual_turnover', label: 'Annual Turnover Range', type: 'text' },
                  { key: 'employee_count', label: 'Number of Employees', type: 'text' }
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={editForm[field.key] || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>
                    Services & Products (comma separated)
                  </label>
                  <textarea
                    value={editForm.services_products || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, services_products: e.target.value }))}
                    className="form-input"
                    rows={2}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>
                    Company Description
                  </label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input"
                    rows={3}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            // VIEW MODE
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
              {/* Company Information */}
              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <Building size={18} color="#3b82f6" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Company Information</h3>
                </div>
                {[
                  { label: 'Client ID', value: uData.user_id, icon: Hash },
                  { label: 'Company Name', value: profile.company_name || 'N/A', icon: Building },
                  { label: 'Business Type', value: profile.business_type || 'N/A', icon: Briefcase },
                  { label: 'Industry', value: profile.industry || 'N/A', icon: Layers },
                  { label: 'GSTIN', value: profile.gstin || 'N/A (Demo)', icon: CreditCard, mono: true },
                  { label: 'PAN', value: profile.pan || 'N/A (Demo)', icon: CreditCard, mono: true }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <item.icon size={13} /> {item.label}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: item.mono ? 'monospace' : 'inherit', textAlign: 'right', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Location & Contact */}
              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <MapPin size={18} color="#f59e0b" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Location & Contact</h3>
                </div>
                {[
                  { label: 'Address', value: profile.address || 'N/A' },
                  { label: 'City', value: profile.city || 'N/A' },
                  { label: 'State', value: profile.state || 'N/A' },
                  { label: 'PIN Code', value: profile.pin_code || 'N/A' },
                  { label: 'Website', value: profile.website || 'N/A' },
                  { label: 'Email', value: uData.email || 'N/A' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Business Details */}
              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <TrendingUp size={18} color="#10b981" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Business Details</h3>
                </div>
                {[
                  { label: 'Years of Experience', value: profile.years_experience ? `${profile.years_experience} Years` : 'N/A' },
                  { label: 'Annual Turnover', value: profile.annual_turnover || 'N/A' },
                  { label: 'Employees', value: profile.employee_count || 'N/A' },
                  { label: 'Registration Date', value: profile.registration_date ? new Date(profile.registration_date).toLocaleDateString('en-IN') : 'N/A' },
                  { label: 'Last Login', value: uData.last_login ? new Date(uData.last_login).toLocaleString('en-IN') : 'N/A' },
                  { label: 'Account Status', value: <StatusBadge status={uData.status || 'active'} /> }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Services & Capabilities */}
              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <Zap size={18} color="#8b5cf6" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Services & Products</h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(profile.services_products || []).length > 0 ? (
                    profile.services_products.map((svc, i) => (
                      <span key={i} style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 600,
                        background: 'rgba(0,121,107,0.08)', color: '#00796b', border: '1px solid rgba(0,121,107,0.15)'
                      }}>{svc}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>No services listed</span>
                  )}
                </div>
                {profile.description && (
                  <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-glass)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {profile.description}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: DASHBOARD                                               */}
      {/* ============================================================ */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <StatCard icon={Target} label="Total Matched" value={stats.total_matched || 0} color="#00796b" />
            <StatCard icon={Star} label="Interested" value={stats.interested || 0} color="#f59e0b" />
            <StatCard icon={Send} label="Applied" value={stats.applied || 0} color="#3b82f6" />
            <StatCard icon={Clock} label="Pending" value={stats.pending || 0} color="#8b5cf6" />
            <StatCard icon={CheckCircle} label="Won" value={stats.won || 0} color="#10b981" />
            <StatCard icon={XCircle} label="Lost" value={stats.lost || 0} color="#ef4444" />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
            {/* Monthly Bid Activity */}
            <div className="glass-card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={16} color="#3b82f6" /> Monthly Bid Activity
              </h3>
              <SimpleBarChart data={profileData?.monthlyActivity || []} height={180} />
            </div>

            {/* Tender Categories */}
            <div className="glass-card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChart size={16} color="#8b5cf6" /> Tender Categories
              </h3>
              <DonutChart data={profileData?.categoryDistribution || []} />
            </div>

            {/* Application Status */}
            <div className="glass-card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} color="#10b981" /> Application Status
              </h3>
              <DonutChart data={profileData?.statusDistribution || []} />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: SMART MATCHING                                          */}
      {/* ============================================================ */}
      {activeTab === 'matching' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Disclaimer */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 10, fontSize: '0.8rem', color: '#92400e'
          }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} color="#f59e0b" />
            <span><strong>Disclaimer:</strong> Match scores are AI-generated estimates based on available profile data. They do not guarantee eligibility or tender award. Always verify requirements independently before applying.</span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search matched tenders..."
                value={matchSearch}
                onChange={e => { setMatchSearch(e.target.value); setMatchPage(1); }}
                className="form-input"
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>
            <button onClick={loadSmartMatches} disabled={matchLoading} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #00796b, #004d40)',
              color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer'
            }}>
              <RefreshCw size={14} className={matchLoading ? 'spin' : ''} />
              {matchLoading ? 'Matching...' : 'Refresh Matches'}
            </button>
          </div>

          {/* Match Results */}
          {matchLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: 10 }}>AI is analyzing your profile against available tenders...</p>
            </div>
          ) : smartMatches?.data?.length > 0 ? (
            <>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {smartMatches.data.length} tender(s) matched with your profile
              </div>
              {smartMatches.data
                .filter(m => {
                  if (!matchSearch) return true;
                  const q = matchSearch.toLowerCase();
                  return m.tender.title.toLowerCase().includes(q) ||
                    m.tender.category?.toLowerCase().includes(q) ||
                    m.tender.organization_name?.toLowerCase().includes(q);
                })
                .slice((matchPage - 1) * 8, matchPage * 8)
                .map((match, idx) => (
                  <div key={idx} className="glass-card" style={{
                    padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start',
                    transition: 'all 0.2s ease', flexWrap: 'wrap'
                  }}>
                    {/* Match Ring */}
                    <MatchRing percentage={match.match_percentage} />

                    {/* Tender Info */}
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00796b', background: 'rgba(0,121,107,0.1)', padding: '2px 8px', borderRadius: 12 }}>
                          {match.tender.tender_reference_no}
                        </span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: 10,
                          background: match.confidence === 'high' ? 'rgba(16,185,129,0.1)' : match.confidence === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          color: match.confidence === 'high' ? '#10b981' : match.confidence === 'medium' ? '#f59e0b' : '#ef4444'
                        }}>
                          {match.confidence} confidence
                        </span>
                      </div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0', lineHeight: 1.3 }}>
                        {match.tender.title}
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        <span>{match.tender.organization_name}</span>
                        <span>•</span>
                        <span>{match.tender.category}</span>
                        <span>•</span>
                        <span><MapPin size={11} style={{ verticalAlign: 'middle' }} /> {match.tender.location_city}, {match.tender.location_state}</span>
                        <span>•</span>
                        <span>₹{((match.tender.estimated_value || 0) / 10000000).toFixed(1)} Cr</span>
                      </div>

                      {/* Match Reasons */}
                      {match.match_reasons?.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {match.match_reasons.slice(0, 3).map((reason, ri) => (
                            <div key={ri} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: '0.74rem', color: '#10b981' }}>
                              <CheckCircle size={12} style={{ flexShrink: 0, marginTop: 2 }} /> {reason}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Missing Requirements */}
                      {match.missing_requirements?.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {match.missing_requirements.slice(0, 2).map((missing, mi) => (
                            <div key={mi} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: '0.74rem', color: '#f59e0b' }}>
                              <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2 }} /> {missing}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Match Factors Mini Bar */}
                      {match.match_factors && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                          {Object.entries(match.match_factors).map(([key, factor]) => (
                            <div key={key} style={{
                              padding: '3px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600,
                              background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
                              color: factor.score >= factor.max * 0.7 ? '#10b981' : factor.score >= factor.max * 0.4 ? '#f59e0b' : '#ef4444'
                            }}>
                              {factor.label}: {factor.score}/{factor.max}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => onViewTenderDetails?.({ id: match.tender.id })} style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                        border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--bg-card)',
                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)'
                      }}>
                        <Eye size={13} /> View Details
                      </button>
                      <button onClick={() => handleSaveTender(match.tender.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                        border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, background: 'rgba(245,158,11,0.06)',
                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#d97706'
                      }}>
                        <Bookmark size={13} /> Save
                      </button>
                      <button onClick={() => handleOpenApplyModal(match.tender)} style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                        border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #00796b, #004d40)',
                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#fff'
                      }}>
                        <Send size={13} /> Apply Now
                      </button>
                    </div>
                  </div>
                ))}

              {/* Pagination */}
              {smartMatches.data.length > 8 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                  {Array.from({ length: Math.ceil(smartMatches.data.filter(m => {
                    if (!matchSearch) return true;
                    const q = matchSearch.toLowerCase();
                    return m.tender.title.toLowerCase().includes(q);
                  }).length / 8) }, (_, i) => (
                    <button key={i} onClick={() => setMatchPage(i + 1)} style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: matchPage === i + 1 ? 'none' : '1px solid var(--border-subtle)',
                      background: matchPage === i + 1 ? '#00796b' : 'var(--bg-card)',
                      color: matchPage === i + 1 ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem'
                    }}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <Target size={40} style={{ opacity: 0.3 }} />
              <p style={{ marginTop: 10 }}>No matches found. Complete your profile to get AI recommendations.</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: DOCUMENTS                                               */}
      {/* ============================================================ */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Document Management</h3>
            <button onClick={() => setUploadModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #00796b, #004d40)',
              color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer'
            }}>
              <Upload size={14} /> Upload Document
            </button>
          </div>

          {/* Document Types */}
          {DOCUMENT_TYPES.map(docType => {
            const typeDocs = documents.filter(d => d.document_type === docType.value);
            return (
              <div key={docType.value} className="glass-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <FileText size={16} color="#3b82f6" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    {docType.label}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'var(--bg-glass)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                    {typeDocs.length} file(s)
                  </span>
                </div>
                {typeDocs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {typeDocs.map(doc => (
                      <div key={doc.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                        background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border-subtle)'
                      }}>
                        <FileText size={18} color="#64748b" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.document_name}
                          </div>
                          <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>
                            <span>Uploaded: {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                            {doc.expiry_date && <span>Expires: {new Date(doc.expiry_date).toLocaleDateString('en-IN')}</span>}
                            {doc.file_size && <span>{(doc.file_size / 1024 / 1024).toFixed(1)} MB</span>}
                          </div>
                        </div>
                        <StatusBadge status={doc.verification_status || 'pending'} />
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => onShowToast?.('Download started (demo)', 'success')} style={{
                            width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Download size={13} color="var(--text-muted)" />
                          </button>
                          <button onClick={() => handleDeleteDocument(doc.id)} style={{
                            width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)',
                            background: 'rgba(239,68,68,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Trash2 size={13} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                    No documents uploaded for this category
                  </div>
                )}
              </div>
            );
          })}

          {/* Upload Modal */}
          {uploadModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }} onClick={() => setUploadModal(false)}>
              <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--bg-card, #fff)', borderRadius: 16, padding: 28, maxWidth: 500, width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 18 }}>
                  Upload Document
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Document Type</label>
                    <select
                      value={uploadForm.document_type}
                      onChange={e => setUploadForm(prev => ({ ...prev, document_type: e.target.value }))}
                      className="form-input" style={{ width: '100%' }}
                    >
                      {DOCUMENT_TYPES.map(dt => (
                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Document Name</label>
                    <input
                      type="text"
                      value={uploadForm.document_name}
                      onChange={e => setUploadForm(prev => ({ ...prev, document_name: e.target.value }))}
                      placeholder="e.g., GST Certificate 2026"
                      className="form-input" style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Expiry Date (if applicable)</label>
                    <input
                      type="date"
                      value={uploadForm.expiry_date}
                      onChange={e => setUploadForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                      className="form-input" style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>File</label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.png,.jpg,.xlsx"
                      onChange={e => setUploadFile(e.target.files[0])}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                  <button onClick={() => setUploadModal(false)} style={{
                    padding: '8px 16px', border: '1px solid var(--border-subtle)', borderRadius: 8,
                    background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)'
                  }}>Cancel</button>
                  <button onClick={handleUploadDocument} disabled={uploading} style={{
                    padding: '8px 20px', border: 'none', borderRadius: 8,
                    background: 'linear-gradient(135deg, #00796b, #004d40)',
                    color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700
                  }}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: ACTIVITY & NOTIFICATIONS                                */}
      {/* ============================================================ */}
      {activeTab === 'activity' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
          {/* Recent Activity */}
          <div className="glass-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="#3b82f6" /> Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activities.length > 0 ? activities.slice(0, 15).map((act, i) => {
                const iconMap = {
                  profile_updated: { icon: Edit3, color: '#3b82f6' },
                  tender_matched: { icon: Target, color: '#00796b' },
                  document_uploaded: { icon: Upload, color: '#8b5cf6' },
                  bid_submitted: { icon: Send, color: '#10b981' },
                  document_verified: { icon: Shield, color: '#f59e0b' },
                  tender_saved: { icon: Bookmark, color: '#d97706' }
                };
                const meta = iconMap[act.type] || { icon: Activity, color: '#64748b' };
                const ActIcon = meta.icon;
                return (
                  <div key={act.id || i} style={{
                    display: 'flex', gap: 12, padding: '10px 0',
                    borderBottom: i < Math.min(activities.length - 1, 14) ? '1px solid var(--border-subtle)' : 'none'
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${meta.color}15`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <ActIcon size={14} color={meta.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{act.title}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 1 }}>{act.description}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 3 }}>
                        {act.created_at ? new Date(act.created_at).toLocaleString('en-IN') : ''}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                  No recent activity
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Bell size={16} color="#f59e0b" /> Notifications
                {notifications.filter(n => !n.read_status).length > 0 && (
                  <span style={{
                    padding: '2px 7px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 700,
                    background: '#ef4444', color: '#fff'
                  }}>
                    {notifications.filter(n => !n.read_status).length}
                  </span>
                )}
              </h3>
              <div style={{ display: 'flex', gap: 4 }}>
                {['all', 'unread', 'read'].map(f => (
                  <button key={f} onClick={() => setNotifFilter(f)} style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none',
                    background: notifFilter === f ? '#00796b' : 'var(--bg-glass)',
                    color: notifFilter === f ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600
                  }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                <button onClick={handleMarkAllRead} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                  color: 'var(--text-muted)'
                }}>
                  Mark All Read
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 500, overflowY: 'auto' }}>
              {notifications.length > 0 ? notifications.map((notif, i) => (
                <div key={notif.id || i}
                  onClick={() => !notif.read_status && handleMarkRead(notif.id)}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 8px',
                    borderBottom: i < notifications.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    cursor: notif.read_status ? 'default' : 'pointer',
                    background: notif.read_status ? 'transparent' : 'rgba(0,121,107,0.03)',
                    borderRadius: 6, transition: 'all 0.15s'
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                    background: notif.read_status ? 'var(--border-subtle)' : '#00796b'
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: notif.read_status ? 500 : 700, color: 'var(--text-main)' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      {notif.created_at ? new Date(notif.created_at).toLocaleString('en-IN') : ''}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                  No notifications
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Bid Application Modal */}
      {applyModalTender && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
          padding: 20
        }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 580,
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-card, #e2e8f0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00796b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI MATCHED TENDER SUBMISSION
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--text-main, #0f172a)' }}>
                  Submit Official Bid Application
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalTender(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              padding: 12, borderRadius: 8, background: 'var(--bg-main, #f8fafc)',
              border: '1px solid var(--border-subtle, #e2e8f0)', marginBottom: 16
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                {applyModalTender.title}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.74rem', color: '#64748b' }}>
                <span>Ref: <strong style={{ color: '#00796b' }}>{applyModalTender.tender_reference_no}</strong></span>
                <span>Dept: {applyModalTender.organization_name}</span>
                {applyModalTender.estimated_value && (
                  <span>Est: {formatINR(applyModalTender.estimated_value)}</span>
                )}
              </div>
            </div>

            <form onSubmit={handleConfirmApply} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: 5 }}>
                  Your Quoted Bid Price (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000000"
                  value={applyBidAmount}
                  onChange={e => setApplyBidAmount(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 3 }}>
                  Estimated Project Cost: {applyModalTender.estimated_value ? formatINR(applyModalTender.estimated_value) : 'As per BOQ'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: 5 }}>
                  Delivery / Completion Timeline (Months) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={applyTimeline}
                  onChange={e => setApplyTimeline(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: 5 }}>
                  Technical Proposal Summary & Method Statement
                </label>
                <textarea
                  rows={3}
                  required
                  value={applyProposal}
                  onChange={e => setApplyProposal(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0',
                fontSize: '0.74rem', color: '#166534'
              }}>
                <CheckCircle size={15} style={{ flexShrink: 0 }} />
                <span>Client profile documents (GST, PAN, Company Registration) will be automatically attached to this bid submission.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setApplyModalTender(null)}
                  className="btn btn-secondary"
                  disabled={applying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {applying ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Confirm & Submit Bid
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
