import React, { useState, useEffect } from 'react';
import { 
  FilePlus, 
  FileCheck, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Upload,
  Send,
  Sparkles,
  MapPin,
  IndianRupee,
  Calendar,
  Scale,
  Users,
  Search,
  Filter,
  BarChart2,
  Bell,
  Eye,
  Edit2,
  Trash2,
  Download,
  Check,
  XCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { formatINR } from '../components/TenderCard';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export default function AuthorityPortal({ user, initialTab = 'dashboard', onViewDetails, onShowToast }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tenders, setTenders] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [tenderSearch, setTenderSearch] = useState('');
  const [bidSearch, setBidSearch] = useState('');
  const [selectedBidTenderFilter, setSelectedBidTenderFilter] = useState('all');

  // Wizard state (Step 1 to 4)
  const [wizardStep, setWizardStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(null);

  // Form Fields for Create
  const [refNo, setRefNo] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Information Technology');
  const [industry, setIndustry] = useState('Smart Infrastructure');
  const [state, setState] = useState('Gujarat');
  const [city, setCity] = useState('Gandhinagar');
  const [estimatedValue, setEstimatedValue] = useState(25000000);
  const [emdAmount, setEmdAmount] = useState(500000);
  const [tenderFee, setTenderFee] = useState(5000);
  const [closingDate, setClosingDate] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [minTurnover, setMinTurnover] = useState(15000000);
  const [minExperience, setMinExperience] = useState(3);
  const [certificationsText, setCertificationsText] = useState('ISO 9001:2015, ISO 27001:2022');
  const [documentsText, setDocumentsText] = useState('Technical Bid Proposal, Audited CA Balance Sheets, EMD Guarantee, OEM MAF');
  const [clausesText, setClausesText] = useState('Liquidated damages of 0.5% per week of delay up to a max cap of 10% contract value.');

  // Modals
  const [editingTender, setEditingTender] = useState(null);
  const [deadlineTender, setDeadlineTender] = useState(null);
  const [newClosingDate, setNewClosingDate] = useState('');
  const [deadlineReason, setDeadlineReason] = useState('');
  const [rejectingBid, setRejectingBid] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Notifications state
  const [notifSubject, setNotifSubject] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTargetTender, setNotifTargetTender] = useState('all');
  const [sentNotifs, setSentNotifs] = useState([
    {
      id: 'notif-1',
      subject: 'Pre-Bid Conference Meeting Link Updated',
      tender_ref: 'TN-2026-001',
      date: '24 Sep 2026, 04:30 PM',
      recipients: 'All registered bidders'
    },
    {
      id: 'notif-2',
      subject: 'Corrigendum #1: Technical Specification Addendum Issued',
      tender_ref: 'TN-2026-004',
      date: '22 Sep 2026, 11:15 AM',
      recipients: 'Eligible contractors'
    }
  ]);

  // Synchronize incoming tab from sidebar navigation
  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'authority_my_tenders') setActiveTab('tenders');
      else if (initialTab === 'authority_create') setActiveTab('create');
      else if (initialTab === 'authority_bids') setActiveTab('bids');
      else if (initialTab === 'authority_evaluation') setActiveTab('evaluation');
      else if (initialTab === 'authority_reports') setActiveTab('reports');
      else if (initialTab === 'authority_notifications') setActiveTab('notifications');
      else if (initialTab === 'authority') setActiveTab('dashboard');
      else setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    fetchAuthorityData();
    const d = new Date(Date.now() + 21 * 86400000);
    setClosingDate(d.toISOString().split('T')[0]);
    const dOpen = new Date(Date.now() + 22 * 86400000);
    setOpeningDate(dOpen.toISOString().split('T')[0]);
    setRefNo(`AUTH/TND/${Date.now().toString().slice(-4)}`);
  }, []);

  const fetchAuthorityData = async () => {
    setLoading(true);
    try {
      const [tendersRes, bidsRes] = await Promise.all([
        api.getAuthorityTenders().catch(() => ({ data: [] })),
        api.getDepartmentBids().catch(() => ({ data: [] }))
      ]);
      setTenders(tendersRes.data || []);
      setBids(bidsRes.data || []);
    } catch (err) {
      console.error('Failed to load authority data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishTender = async (status = 'published') => {
    setSubmitting(true);
    try {
      const payload = {
        tender_reference_no: refNo,
        title,
        description,
        category,
        industry,
        location_state: state,
        location_city: city,
        estimated_value: Number(estimatedValue),
        emd_amount: Number(emdAmount),
        tender_fee: Number(tenderFee),
        closing_date: new Date(closingDate).toISOString(),
        opening_date: new Date(openingDate).toISOString(),
        min_turnover_required: Number(minTurnover),
        min_experience_years: Number(minExperience),
        required_certifications: certificationsText.split(',').map(s => s.trim()).filter(Boolean),
        required_documents: documentsText.split(',').map(s => s.trim()).filter(Boolean),
        clauses_summary: [clausesText],
        status
      };

      const res = await api.createTender(payload);
      setPublishSuccess(res.tender);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      if (onShowToast) onShowToast(`Tender ${res.tender?.tender_reference_no} ${status === 'published' ? 'published live' : 'saved as draft'}!`);
      fetchAuthorityData();
    } catch (err) {
      alert(err.message || 'Failed to publish tender');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateTenderStatus(id, { status });
      if (onShowToast) onShowToast(`Tender marked as ${status}`);
      fetchAuthorityData();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleSaveTenderEdit = async (e) => {
    e.preventDefault();
    if (!editingTender) return;
    try {
      await api.updateTender(editingTender.id, {
        title: editingTender.title,
        description: editingTender.description,
        estimated_value: Number(editingTender.estimated_value),
        category: editingTender.category,
        closing_date: new Date(editingTender.closing_date).toISOString()
      });
      setEditingTender(null);
      if (onShowToast) onShowToast('Tender updated successfully');
      fetchAuthorityData();
    } catch (err) {
      alert(err.message || 'Failed to update tender');
    }
  };

  const handleExtendDeadline = async (e) => {
    e.preventDefault();
    if (!deadlineTender || !newClosingDate) return;
    try {
      await api.updateTender(deadlineTender.id, {
        closing_date: new Date(newClosingDate).toISOString()
      });
      if (onShowToast) onShowToast(`Deadline extended to ${newClosingDate} (Corrigendum recorded)`);
      setDeadlineTender(null);
      setNewClosingDate('');
      setDeadlineReason('');
      fetchAuthorityData();
    } catch (err) {
      alert(err.message || 'Failed to extend deadline');
    }
  };

  const handleEvaluateBid = async (bidId, newStatus, reason = '', remarks = '') => {
    try {
      await api.evaluateBid(bidId, {
        status: newStatus,
        rejection_reason: reason,
        remarks: remarks || `Evaluation marked ${newStatus} by ${user.name}`
      });
      if (onShowToast) {
        onShowToast(`Bid status updated to: ${newStatus.toUpperCase()}`);
      }
      setRejectingBid(null);
      setRejectionReason('');
      fetchAuthorityData();
    } catch (err) {
      alert(err.message || 'Failed to evaluate bid');
    }
  };

  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!notifSubject.trim() || !notifMessage.trim()) return;
    const newEntry = {
      id: `notif-${Date.now()}`,
      subject: notifSubject,
      tender_ref: notifTargetTender === 'all' ? 'All Department Tenders' : notifTargetTender,
      date: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      recipients: 'Registered Bidders'
    };
    setSentNotifs(prev => [newEntry, ...prev]);
    setNotifSubject('');
    setNotifMessage('');
    if (onShowToast) onShowToast('Department broadcast notification dispatched!');
  };

  const handleExportDepartmentCSV = () => {
    const headers = ['Reference No', 'Title', 'Category', 'Estimated Value (INR)', 'Closing Date', 'Status'];
    const rows = tenders.map(t => [
      `"${t.tender_reference_no}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.estimated_value,
      `"${t.closing_date}"`,
      `"${t.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Department_Tenders_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPIs
  const myTendersCount = tenders.length;
  const draftCount = tenders.filter(t => t.status === 'draft').length;
  const publishedCount = tenders.filter(t => t.status === 'published' || t.status === 'closing_soon').length;
  const closedCount = tenders.filter(t => t.status === 'closed').length;
  const receivedBidsCount = bids.length;
  const pendingEvaluationCount = bids.filter(b => b.status === 'submitted' || b.status === 'under_evaluation').length;
  const shortlistedBidsCount = bids.filter(b => b.status === 'shortlisted').length;
  const awardedBidsCount = bids.filter(b => b.status === 'awarded').length;
  const totalDepartmentBudget = tenders.reduce((acc, t) => acc + (t.estimated_value || 0), 0);

  // Filters
  const filteredTenders = tenders.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (tenderSearch.trim()) {
      const q = tenderSearch.toLowerCase();
      return (
        t.tender_reference_no?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredBids = bids.filter(b => {
    if (selectedBidTenderFilter !== 'all' && b.tender_id !== selectedBidTenderFilter) return false;
    if (bidSearch.trim()) {
      const q = bidSearch.toLowerCase();
      return (
        b.tender?.tender_reference_no?.toLowerCase().includes(q) ||
        b.company?.name?.toLowerCase().includes(q) ||
        b.status?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 83, 45, 0.35), rgba(15, 23, 42, 0.85))',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: 16,
        padding: '24px 32px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 9999, background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#86efac' }}>
              OFFICIAL TENDER AUTHORITY & DEPARTMENT HEAD
            </span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Department Tender Management Hub
          </h1>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Officer: <strong style={{ color: '#0f172a' }}>{user.name}</strong> • Department: <strong style={{ color: '#00796b' }}>{user.organization_name || 'Urban Development & Smart City Mission'}</strong>
          </div>
        </div>
      </div>

      {/* TAB 1: DASHBOARD (Overview KPIs & Recent Applications) */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* KPI Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
            <div className="saas-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>My Tenders</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{myTendersCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Department pipeline</div>
            </div>

            <div className="saas-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>Published</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>{publishedCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Live on public portal</div>
            </div>

            <div className="saas-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase' }}>Draft Tenders</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', margin: '4px 0' }}>{draftCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Awaiting publication</div>
            </div>

            <div className="saas-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>Closed Tenders</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', margin: '4px 0' }}>{closedCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Submissions ended</div>
            </div>

            <div className="saas-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>Received Bids</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>{receivedBidsCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>From verified bidders</div>
            </div>

            <div className="saas-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>Pending Eval</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', margin: '4px 0' }}>{pendingEvaluationCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Action required</div>
            </div>
          </div>

          {/* Quick Actions & Department Allocation */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            {/* Recent Received Bids */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Recent Bid Submissions & Applications
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Real-time contractor proposals received for your department</span>
                </div>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setActiveTab('bids')}
                >
                  View All Bids →
                </button>
              </div>

              {bids.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                  No bids received yet for this department's tenders.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {bids.slice(0, 5).map(b => (
                    <div 
                      key={b.id}
                      style={{
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{b.company?.name || 'Bidder Entity'}</strong>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: 4 }}>
                            {b.tender?.tender_reference_no}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3 }}>
                          Submitted: {new Date(b.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Timeline: {b.delivery_timeline_weeks || 12} weeks
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>{formatINR(b.bid_amount)}</div>
                          <span className={`badge ${b.status === 'awarded' ? 'badge-success' : (b.status === 'rejected' ? 'badge-danger' : (b.status === 'shortlisted' ? 'badge-purple' : 'badge-warning'))}`} style={{ fontSize: '0.68rem' }}>
                            {b.status}
                          </span>
                        </div>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setActiveTab('evaluation')}
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        >
                          Evaluate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Summary & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                  Department Budget Allocation
                </h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00796b', marginBottom: 4 }}>
                  {formatINR(totalDepartmentBudget)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 16 }}>
                  Total cumulative procurement volume for {user.organization_name || 'Smart City Mission'}
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>Shortlisted Bids:</span>
                    <strong style={{ color: '#7c3aed' }}>{shortlistedBidsCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>Awarded Contracts:</span>
                    <strong style={{ color: '#16a34a' }}>{awardedBidsCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>Competition Ratio:</span>
                    <strong style={{ color: '#0f172a' }}>{myTendersCount > 0 ? (receivedBidsCount / myTendersCount).toFixed(1) : 0} bids/tender</strong>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                  Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setActiveTab('create'); setWizardStep(1); }}
                    style={{ justifyContent: 'center' }}
                  >
                    <FilePlus size={15} /> Float New Tender
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('evaluation')}
                    style={{ justifyContent: 'center' }}
                  >
                    <Scale size={15} /> Review & Shortlist Bids
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('notifications')}
                    style={{ justifyContent: 'center' }}
                  >
                    <Bell size={15} /> Dispatch Pre-Bid Notice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY TENDERS TABLE */}
      {activeTab === 'tenders' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Department Tenders ({filteredTenders.length})
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['all', 'published', 'draft', 'closed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search ref or title..."
                  value={tenderSearch}
                  onChange={e => setTenderSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 30, width: 220, fontSize: '0.8rem' }}
                />
              </div>

              <button
                className="btn btn-sm btn-primary"
                onClick={() => { setActiveTab('create'); setWizardStep(1); }}
              >
                <FilePlus size={14} /> + New Tender
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading department tenders...</div>
          ) : filteredTenders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              No department tenders found matching criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Reference No</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Title & Scope</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Category</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Estimated Value</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Closing Date</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenders.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>
                        {t.tender_reference_no}
                      </td>
                      <td style={{ padding: '12px 14px', maxWidth: 300 }}>
                        <div style={{ color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.location_city ? `${t.location_city}, ` : ''}{t.location_state}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge badge-purple">{t.category}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#00796b', fontWeight: 700 }}>
                        {formatINR(t.estimated_value)}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#d97706', fontWeight: 600 }}>
                        {new Date(t.closing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge ${t.status === 'published' ? 'badge-success' : (t.status === 'closing_soon' ? 'badge-warning' : (t.status === 'closed' ? 'badge-danger' : 'badge-gray'))}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => onViewDetails(t)}
                            title="View Public Tender RFP"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingTender(t)}
                            title="Edit Tender Specifications"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              setDeadlineTender(t);
                              setNewClosingDate(t.closing_date ? t.closing_date.split('T')[0] : '');
                            }}
                            title="Extend Submission Deadline"
                            style={{ color: '#d97706' }}
                          >
                            <Clock size={13} />
                          </button>

                          {t.status === 'draft' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleUpdateStatus(t.id, 'published')}
                              title="Publish Tender to Public Portal"
                            >
                              Publish
                            </button>
                          )}

                          {t.status === 'published' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleUpdateStatus(t.id, 'closed')}
                              title="Close Tender Submissions"
                            >
                              Close
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
        </div>
      )}

      {/* TAB 3: CREATE TENDER WIZARD */}
      {activeTab === 'create' && (
        <div className="glass-card" style={{ padding: '32px' }}>
          {publishSuccess ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #86efac' }}>
                <CheckCircle2 size={36} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                Official Tender Published Successfully!
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 500, margin: '0 auto 20px' }}>
                Tender <strong>{publishSuccess.tender_reference_no}</strong> is now live on the TenderHub Portal. Automated match notifications dispatched.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => onViewDetails(publishSuccess)}
                >
                  View Live Tender
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => { setPublishSuccess(null); setActiveTab('tenders'); }}
                >
                  Return to My Tenders
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, position: 'relative' }}>
                {[
                  { step: 1, title: 'Basic Information' },
                  { step: 2, title: 'Financials & Location' },
                  { step: 3, title: 'Eligibility & Requirements' },
                  { step: 4, title: 'Review & Publish' }
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: wizardStep >= s.step ? '#0284c7' : '#f1f5f9',
                      border: wizardStep === s.step ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: wizardStep >= s.step ? '#fff' : '#64748b'
                    }}>
                      {s.step}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: wizardStep >= s.step ? '#0f172a' : '#94a3b8', fontWeight: wizardStep === s.step ? 700 : 500 }}>
                      {s.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Step 1: Basic Information */}
              {wizardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                    <div>
                      <label className="form-label">Tender Reference No *</label>
                      <input
                        type="text"
                        required
                        value={refNo}
                        onChange={e => setRefNo(e.target.value)}
                        className="form-input"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label className="form-label">Tender Title *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Implementation of Smart City IoT Sensors"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="form-label">Category</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="form-select"
                      >
                        <option value="Information Technology">Information Technology</option>
                        <option value="Healthcare & Medical Equipment">Healthcare & Medical Equipment</option>
                        <option value="Civil Works & Construction">Civil Works & Construction</option>
                        <option value="Renewable Energy">Renewable Energy</option>
                        <option value="Electronics & Hardware">Electronics & Hardware</option>
                        <option value="Healthcare & Maintenance">Healthcare & Maintenance</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Industry Sub-Domain</label>
                      <input
                        type="text"
                        value={industry}
                        onChange={e => setIndustry(e.target.value)}
                        placeholder="e.g. Smart City & IoT"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Detailed Project Scope & Specifications</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Comprehensive overview of required goods, civil works, or technical services..."
                      className="form-textarea"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        if (!refNo || !title) return alert('Reference No and Title are required.');
                        setWizardStep(2);
                      }}
                    >
                      Next: Financials <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Financials & Location */}
              {wizardStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div>
                      <label className="form-label">Estimated Value (INR) *</label>
                      <input
                        type="number"
                        required
                        value={estimatedValue}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setEstimatedValue(val);
                          setEmdAmount(Math.round(val * 0.02));
                        }}
                        className="form-input"
                      />
                      <span style={{ fontSize: '0.72rem', color: '#00796b', fontWeight: 600 }}>{formatINR(estimatedValue)}</span>
                    </div>

                    <div>
                      <label className="form-label">EMD Amount (INR) *</label>
                      <input
                        type="number"
                        required
                        value={emdAmount}
                        onChange={e => setEmdAmount(Number(e.target.value))}
                        className="form-input"
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{formatINR(emdAmount)}</span>
                    </div>

                    <div>
                      <label className="form-label">Tender Document Fee (INR)</label>
                      <input
                        type="number"
                        required
                        value={tenderFee}
                        onChange={e => setTenderFee(Number(e.target.value))}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={e => setState(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="form-label">Bid Closing Date *</label>
                      <input
                        type="date"
                        required
                        value={closingDate}
                        onChange={e => setClosingDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Technical Bid Opening Date</label>
                      <input
                        type="date"
                        required
                        value={openingDate}
                        onChange={e => setOpeningDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                    <button className="btn btn-secondary" onClick={() => setWizardStep(1)}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button className="btn btn-primary" onClick={() => setWizardStep(3)}>
                      Next: Eligibility Criteria <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Eligibility & Requirements */}
              {wizardStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="form-label">Minimum Annual Turnover (INR)</label>
                      <input
                        type="number"
                        value={minTurnover}
                        onChange={e => setMinTurnover(Number(e.target.value))}
                        className="form-input"
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{formatINR(minTurnover)}</span>
                    </div>

                    <div>
                      <label className="form-label">Minimum Operational Experience (Years)</label>
                      <input
                        type="number"
                        value={minExperience}
                        onChange={e => setMinExperience(Number(e.target.value))}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Mandatory Certifications (Comma Separated)</label>
                    <input
                      type="text"
                      value={certificationsText}
                      onChange={e => setCertificationsText(e.target.value)}
                      placeholder="e.g. ISO 9001:2015, ISO 27001:2022, CMMI Level 3"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Mandatory Submission Documents (Comma Separated)</label>
                    <input
                      type="text"
                      value={documentsText}
                      onChange={e => setDocumentsText(e.target.value)}
                      placeholder="e.g. Technical Proposal, CA Audited Turnover, EMD Proof, GSTIN"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Key Penalties & Performance Clauses</label>
                    <input
                      type="text"
                      value={clausesText}
                      onChange={e => setClausesText(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                    <button className="btn btn-secondary" onClick={() => setWizardStep(2)}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button className="btn btn-primary" onClick={() => setWizardStep(4)}>
                      Next: Review & Confirm <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Publish */}
              {wizardStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>
                        {refNo}
                      </span>
                      <span className="badge badge-purple">{category}</span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 14 }}>{description || 'No description provided.'}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>ESTIMATED COST</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00796b' }}>{formatINR(estimatedValue)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>EMD GUARANTEE</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{formatINR(emdAmount)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SUBMISSION DEADLINE</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#d97706' }}>{closingDate} 18:00 IST</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                    <button className="btn btn-secondary" onClick={() => setWizardStep(3)}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button 
                        className="btn btn-secondary"
                        disabled={submitting}
                        onClick={() => handlePublishTender('draft')}
                      >
                        Save as Draft
                      </button>
                      <button 
                        className="btn btn-primary"
                        disabled={submitting}
                        onClick={() => handlePublishTender('published')}
                      >
                        <Send size={15} /> {submitting ? 'Publishing...' : 'Publish Official Tender'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RECEIVED BIDS */}
      {activeTab === 'bids' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Submitted Contractor Bids ({filteredBids.length})
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                All technical and commercial proposals submitted for your department tenders
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={selectedBidTenderFilter}
                onChange={e => setSelectedBidTenderFilter(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.8rem', minWidth: 200 }}
              >
                <option value="all">All Department Tenders</option>
                {tenders.map(t => (
                  <option key={t.id} value={t.id}>{t.tender_reference_no} - {t.title.slice(0, 30)}...</option>
                ))}
              </select>

              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search bidder or status..."
                  value={bidSearch}
                  onChange={e => setBidSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 30, width: 200, fontSize: '0.8rem' }}
                />
              </div>
            </div>
          </div>

          {filteredBids.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              No contractor bids submitted yet for the selected criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Bidder Entity</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Tender Reference</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Quoted Bid (INR)</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Timeline</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Documents & Proposal</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px' }}>Evaluation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBids.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.company?.name || 'Company User'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          GST: {b.company?.gstin || '24AAACH7409R1ZZ'} • {b.company?.city || 'Gujarat'}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>
                          {b.tender?.tender_reference_no}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.tender?.title}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>
                          {formatINR(b.bid_amount)}
                        </div>
                        {b.tender?.estimated_value && (
                          <div style={{ fontSize: '0.7rem', color: b.bid_amount < b.tender.estimated_value ? '#16a34a' : '#d97706' }}>
                            {(((b.bid_amount - b.tender.estimated_value) / b.tender.estimated_value) * 100).toFixed(1)}% vs Est.
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {b.delivery_timeline_weeks || 12} weeks
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: '0.72rem', color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <FileText size={12} /> View Proposal ({b.technical_proposal ? `${b.technical_proposal.slice(0, 25)}...` : 'Sealed RFP'})
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {b.attached_documents ? b.attached_documents.length : 3} Verified Documents Sealed
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge ${b.status === 'awarded' ? 'badge-success' : (b.status === 'rejected' ? 'badge-danger' : (b.status === 'shortlisted' ? 'badge-purple' : 'badge-warning'))}`}>
                          {b.status}
                        </span>
                        {b.rejection_reason && (
                          <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: 2, maxWidth: 140 }}>
                            Reason: {b.rejection_reason}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setActiveTab('evaluation')}
                        >
                          <Scale size={13} /> Evaluate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: EVALUATION WORKBENCH */}
      {activeTab === 'evaluation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Tender Evaluation & Bid Award Workbench
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Review submitted proposals, perform technical qualification, shortlist bidders, or award contracts.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <span className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  {pendingEvaluationCount} Bids Pending Decision
                </span>
              </div>
            </div>

            {filteredBids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                No submitted bids awaiting evaluation.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredBids.map(b => (
                  <div 
                    key={b.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: '20px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {b.company?.name || 'Bidder Entity'}
                          </h4>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: 4 }}>
                            {b.tender?.tender_reference_no}
                          </span>
                          <span className={`badge ${b.status === 'awarded' ? 'badge-success' : (b.status === 'rejected' ? 'badge-danger' : (b.status === 'shortlisted' ? 'badge-purple' : 'badge-warning'))}`}>
                            Status: {b.status?.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                          Tender: <strong>{b.tender?.title}</strong> • Estimated Budget: {formatINR(b.tender?.estimated_value)}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>QUOTED COMMERCIAL BID</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                          {formatINR(b.bid_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Proposal Snippet & Timeline */}
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, fontSize: '0.82rem', color: '#334155' }}>
                      <strong style={{ color: '#0f172a' }}>Technical Proposal Summary:</strong>
                      <p style={{ margin: '4px 0 0', color: '#475569', lineHeight: 1.5 }}>
                        {b.technical_proposal || 'Full technical solution architecture, implementation methodology, and SLA commitment documents attached in the sealed e-vault.'}
                      </p>
                      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.75rem', color: '#64748b' }}>
                        <span>⏱ Delivery Commitment: <strong>{b.delivery_timeline_weeks || 12} Weeks</strong></span>
                        <span>📄 Documents: <strong>{b.attached_documents ? b.attached_documents.join(', ') : 'CA Balance Sheet, ISO 9001, EMD Guarantee'}</strong></span>
                      </div>
                    </div>

                    {/* Rejection notice if present */}
                    {b.status === 'rejected' && b.rejection_reason && (
                      <div style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 8, fontSize: '0.78rem', color: '#b91c1c' }}>
                        <strong>Rejection Reason Recorded:</strong> {b.rejection_reason}
                      </div>
                    )}

                    {/* Decision Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                      {b.status !== 'shortlisted' && b.status !== 'awarded' && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEvaluateBid(b.id, 'shortlisted', '', 'Technically Qualified')}
                          style={{ color: '#7c3aed', borderColor: '#c4b5fd' }}
                        >
                          <Check size={14} /> Shortlist Bidder
                        </button>
                      )}

                      {b.status !== 'awarded' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleEvaluateBid(b.id, 'awarded', '', 'Contract Awarded to L1 Qualified Contractor')}
                        >
                          <CheckCircle2 size={14} /> Award Contract
                        </button>
                      )}

                      {b.status !== 'rejected' && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            setRejectingBid(b);
                            setRejectionReason('');
                          }}
                        >
                          <XCircle size={14} /> Reject Bid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: REPORTS */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Department Procurement & Bidding Reports
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Analytical breakdown for {user.organization_name || 'Urban Development Mission'}
                </span>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleExportDepartmentCSV}
              >
                <Download size={15} /> Export Department Report (CSV)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ALLOCATED BUDGET</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#00796b', margin: '4px 0' }}>{formatINR(totalDepartmentBudget)}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Across {myTendersCount} projects</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>BID TURNOUT</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>{receivedBidsCount} Quotes</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Avg {myTendersCount ? (receivedBidsCount / myTendersCount).toFixed(1) : 0} per tender</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>SUCCESSFUL AWARDS</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>{awardedBidsCount} Contracts</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Finalized procurement</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>SHORTLIST RATE</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed', margin: '4px 0' }}>
                  {receivedBidsCount > 0 ? `${Math.round((shortlistedBidsCount / receivedBidsCount) * 100)}%` : '0%'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Technical compliance</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Active Project Deadlines & Bid Status Summary
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Tender</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Estimated Value</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Closing Date</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Received Bids</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.map(t => {
                    const tenderBidsCount = bids.filter(b => b.tender_id === t.id).length;
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ color: '#0f172a' }}>{t.tender_reference_no}</strong>: {t.title}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#00796b', fontWeight: 700 }}>
                          {formatINR(t.estimated_value)}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#d97706' }}>
                          {new Date(t.closing_date).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span className="badge badge-primary">{tenderBidsCount} Bids</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span className="badge badge-gray">{t.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Dispatch Form */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              Broadcast Department Notice / Corrigendum
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Send official announcements, pre-bid meeting links, or addendums to prospective bidders.
            </span>

            <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div>
                <label className="form-label">Target Tender</label>
                <select
                  value={notifTargetTender}
                  onChange={e => setNotifTargetTender(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Department Tenders</option>
                  {tenders.map(t => (
                    <option key={t.id} value={t.tender_reference_no}>{t.tender_reference_no} - {t.title.slice(0, 35)}...</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Notice Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corrigendum #2: Extension of Bid Opening Date"
                  value={notifSubject}
                  onChange={e => setNotifSubject(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Message Details & Instructions</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide complete clarifications, updated clause numbers, or meeting join links..."
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Send size={15} /> Dispatch Official Notice
              </button>
            </form>
          </div>

          {/* Sent Notifications History */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              Dispatched Department Notices
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Log of announcements sent to registered bidders
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {sentNotifs.map(n => (
                <div 
                  key={n.id}
                  style={{
                    padding: '14px 16px',
                    background: '#f8fafc',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {n.subject}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{n.date}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: '0.72rem' }}>
                    <span style={{ fontFamily: 'monospace', color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: 4 }}>
                      {n.tender_ref}
                    </span>
                    <span style={{ color: '#16a34a' }}>✓ Dispatched to: {n.recipients}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDIT TENDER MODAL */}
      {editingTender && (
        <div className="modal-overlay" onClick={() => setEditingTender(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Edit Tender: {editingTender.tender_reference_no}
              </h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setEditingTender(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveTenderEdit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Tender Title</label>
                <input
                  type="text"
                  required
                  value={editingTender.title}
                  onChange={e => setEditingTender({ ...editingTender, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Category</label>
                <input
                  type="text"
                  value={editingTender.category}
                  onChange={e => setEditingTender({ ...editingTender, category: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Estimated Value (INR)</label>
                <input
                  type="number"
                  required
                  value={editingTender.estimated_value}
                  onChange={e => setEditingTender({ ...editingTender, estimated_value: Number(e.target.value) })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Closing Date</label>
                <input
                  type="date"
                  required
                  value={editingTender.closing_date ? editingTender.closing_date.split('T')[0] : ''}
                  onChange={e => setEditingTender({ ...editingTender, closing_date: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Scope Description</label>
                <textarea
                  rows={3}
                  value={editingTender.description || ''}
                  onChange={e => setEditingTender({ ...editingTender, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTender(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND DEADLINE MODAL */}
      {deadlineTender && (
        <div className="modal-overlay" onClick={() => setDeadlineTender(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Extend Tender Deadline
              </h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setDeadlineTender(null)}>✕</button>
            </div>

            <form onSubmit={handleExtendDeadline} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 8, fontSize: '0.82rem' }}>
                <div>Tender: <strong>{deadlineTender.tender_reference_no}</strong></div>
                <div style={{ color: '#64748b' }}>Current Deadline: {new Date(deadlineTender.closing_date).toLocaleDateString('en-IN')}</div>
              </div>

              <div>
                <label className="form-label">New Closing Date *</label>
                <input
                  type="date"
                  required
                  value={newClosingDate}
                  onChange={e => setNewClosingDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Extension Reason / Corrigendum Note</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Due to requests from prospective contractors during pre-bid conference..."
                  value={deadlineReason}
                  onChange={e => setDeadlineReason(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setDeadlineTender(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Corrigendum & Extend</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT BID MODAL (Mandatory Reason) */}
      {rejectingBid && (
        <div className="modal-overlay" onClick={() => setRejectingBid(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color="#dc2626" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
                  Reject Contractor Bid
                </h3>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setRejectingBid(null)}>✕</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Bidder: <strong style={{ color: '#0f172a' }}>{rejectingBid.company?.name || 'Bidder Entity'}</strong><br />
                Tender: <strong style={{ color: '#0f172a' }}>{rejectingBid.tender?.tender_reference_no}</strong><br />
                Quoted Bid: <strong style={{ color: '#16a34a' }}>{formatINR(rejectingBid.bid_amount)}</strong>
              </div>

              <div>
                <label className="form-label" style={{ color: '#991b1b', fontWeight: 700 }}>
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify why this bid was disqualified (e.g. Non-submission of EMD bank guarantee, failed minimum turnover criteria of INR 1.5 Cr, missing ISO 27001 certificate)..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="form-textarea"
                />
                <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>
                  This reason will be officially recorded in the audit log and visible on the bidder's dashboard.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={() => setRejectingBid(null)}>Cancel</button>
                <button
                  className="btn btn-danger"
                  disabled={!rejectionReason.trim()}
                  onClick={() => handleEvaluateBid(rejectingBid.id, 'rejected', rejectionReason)}
                >
                  Confirm Official Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
