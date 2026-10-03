import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Star, 
  Trash2, 
  ExternalLink, 
  Building2, 
  Calendar, 
  Clock, 
  Sparkles, 
  Edit3, 
  Check, 
  Send, 
  Scale, 
  Trophy, 
  CheckSquare, 
  Plus, 
  TrendingUp, 
  FileText,
  CircleAlert,
  Calculator
} from 'lucide-react';
import { formatINR } from '../components/TenderCard';
import { api } from '../services/api';
import TenderStatusModal from '../components/TenderStatusModal';
import { useLanguage } from '../utils/LanguageContext';

export default function MyTenders({ 
  initialTab = 'all',
  onViewDetails, 
  onCheckEligibility, 
  onRefresh, 
  onNavigateToTasks,
  onOpenAddTender,
  onOpenProposal,
  onOpenWinProbability,
  onOpenBOQ,
  onShowToast 
}) {
  const { t } = useLanguage();
  const [savedItems, setSavedItems] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab); // all, shortlisted, preparing, submitted, awarded, favourites, my_bids
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [noteText, setNoteText] = useState('');
  
  // Status modal state
  const [statusModalTender, setStatusModalTender] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    fetchSavedTenders();
    fetchMyBids();
  }, []);

  const fetchSavedTenders = async () => {
    setLoading(true);
    try {
      const res = await api.getSavedTenders();
      setSavedItems(res.data || []);
    } catch (err) {
      console.error('Failed to load saved tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBids = async () => {
    try {
      const res = await api.getMyBids();
      setMyBids(res.data || []);
    } catch (err) {
      console.error('Failed to load my bids:', err);
    }
  };

  const handleWithdrawBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to withdraw this bid proposal? This action is final and will cancel your application.')) return;
    try {
      await api.withdrawBid(bidId);
      if (onShowToast) onShowToast('Bid successfully withdrawn', 'success');
      fetchMyBids();
    } catch (err) {
      alert(err.message || 'Failed to withdraw bid');
    }
  };

  const handleToggleFavourite = async (item) => {
    try {
      await api.toggleSaveTender(item.tender.id, item.notes, !item.is_favourite);
      fetchSavedTenders();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to update favourite:', err);
    }
  };

  const handleRemove = async (tenderId) => {
    if (!window.confirm('Remove this tender from your tracked pipeline?')) return;
    try {
      await api.toggleSaveTender(tenderId);
      fetchSavedTenders();
      if (onRefresh) onRefresh();
      if (onShowToast) onShowToast('Removed tender from tracked pipeline');
    } catch (err) {
      console.error('Failed to remove saved tender:', err);
    }
  };

  const handleSaveNote = async (item) => {
    try {
      await api.toggleSaveTender(item.tender.id, noteText, item.is_favourite);
      setEditingNotesId(null);
      fetchSavedTenders();
      if (onShowToast) onShowToast('Internal bid note saved');
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const getStatusBadge = (status = 'saved') => {
    switch (status) {
      case 'preparing':
        return { label: 'In Preparation', bg: '#e0f2fe', color: '#0284c7', icon: FileText };
      case 'submitted':
        return { label: 'Bid Submitted', bg: '#fef3c7', color: '#d97706', icon: Send };
      case 'under_evaluation':
        return { label: 'Under Evaluation', bg: '#ede9fe', color: '#7c3aed', icon: Scale };
      case 'awarded':
        return { label: 'Contract Won 🎉', bg: '#dcfce7', color: '#16a34a', icon: Trophy };
      case 'lost':
        return { label: 'Not Awarded', bg: '#fee2e2', color: '#dc2626', icon: CircleAlert };
      case 'saved':
      default:
        return { label: 'Shortlisted', bg: '#f1f5f9', color: '#475569', icon: Bookmark };
    }
  };

  // KPIs
  const totalTracked = savedItems.length;
  const preparingCount = savedItems.filter(i => i.status === 'preparing').length;
  const submittedCount = savedItems.filter(i => i.status === 'submitted' || i.status === 'under_evaluation').length;
  const awardedCount = savedItems.filter(i => i.status === 'awarded').length;
  const pipelineValue = savedItems.reduce((acc, curr) => acc + (curr.tender?.estimated_value || 0), 0);

  // Filtered items
  const filteredItems = savedItems.filter(item => {
    if (activeTab === 'favourites') return item.is_favourite;
    if (activeTab === 'shortlisted') return !item.status || item.status === 'saved';
    if (activeTab === 'preparing') return item.status === 'preparing';
    if (activeTab === 'submitted') return item.status === 'submitted' || item.status === 'under_evaluation';
    if (activeTab === 'awarded') return item.status === 'awarded';
    return true; // 'all'
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              My Tenders & Bidding Pipeline Hub
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
              {totalTracked} Opportunities
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            Manage shortlisted bids, preparation tasks, submitted proposals, and official status milestones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {onNavigateToTasks && (
            <button
              className="btn btn-secondary"
              onClick={onNavigateToTasks}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckSquare size={15} /> View Tender Tasks
            </button>
          )}


        </div>
      </div>

      {/* Summary KPI Pipeline Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 14,
        marginBottom: 20
      }}>
        <div 
          className="saas-card" 
          onClick={() => setActiveTab('all')}
          style={{ 
            padding: '14px 18px', 
            cursor: 'pointer',
            borderTop: activeTab === 'all' ? '3px solid #00796b' : '1px solid var(--border-card)',
            background: activeTab === 'all' ? 'rgba(0, 121, 107, 0.05)' : undefined
          }}
          title="Filter all pipeline items"
        >
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Pipeline
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
            {totalTracked}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Tracked opportunities
          </div>
        </div>

        <div 
          className="saas-card" 
          onClick={() => setActiveTab('preparing')}
          style={{ 
            padding: '14px 18px', 
            cursor: 'pointer',
            borderTop: activeTab === 'preparing' ? '3px solid #0284c7' : '1px solid var(--border-card)',
            background: activeTab === 'preparing' ? 'rgba(2, 132, 199, 0.05)' : undefined
          }}
          title="Filter tenders in preparation"
        >
          <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>
            In Preparation
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>
            {preparingCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Drafting bids & EMDs
          </div>
        </div>

        <div 
          className="saas-card" 
          onClick={() => setActiveTab('submitted')}
          style={{ 
            padding: '14px 18px', 
            cursor: 'pointer',
            borderTop: activeTab === 'submitted' ? '3px solid #d97706' : '1px solid var(--border-card)',
            background: activeTab === 'submitted' ? 'rgba(217, 119, 6, 0.05)' : undefined
          }}
          title="Filter submitted bids"
        >
          <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase' }}>
            Bids Submitted
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', margin: '4px 0' }}>
            {submittedCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Under authority review
          </div>
        </div>

        <div 
          className="saas-card" 
          onClick={() => setActiveTab('awarded')}
          style={{ 
            padding: '14px 18px', 
            cursor: 'pointer',
            borderTop: activeTab === 'awarded' ? '3px solid #16a34a' : '1px solid var(--border-card)',
            background: activeTab === 'awarded' ? 'rgba(22, 163, 74, 0.05)' : undefined
          }}
          title="Filter won contracts"
        >
          <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
            Contracts Won
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>
            {awardedCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Successful awards 🎉
          </div>
        </div>

        <div 
          className="saas-card" 
          onClick={() => setActiveTab('my_bids')}
          style={{ 
            padding: '14px 18px', 
            cursor: 'pointer',
            borderTop: activeTab === 'my_bids' ? '3px solid #4f46e5' : '1px solid var(--border-card)',
            background: activeTab === 'my_bids' ? 'rgba(79, 70, 229, 0.05)' : undefined
          }}
          title="View official bid proposals"
        >
          <div style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: 700, textTransform: 'uppercase' }}>
            Est. Pipeline Value
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5', margin: '4px 0' }}>
            ₹{(pipelineValue / 10000000).toFixed(1)} Cr
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Cumulative contract size
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '6px 10px',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Saved (${savedItems.length})`, icon: Bookmark },
            { id: 'my_bids', label: `My Submitted Bids (${myBids.length})`, icon: Send },
            { id: 'shortlisted', label: `Shortlisted (${savedItems.filter(i => !i.status || i.status === 'saved').length})` },
            { id: 'preparing', label: `In Prep (${preparingCount})` },
            { id: 'submitted', label: `Submitted (${submittedCount})` },
            { id: 'awarded', label: `Won (${awardedCount})` },
            { id: 'favourites', label: `Favourites (${savedItems.filter(i => i.is_favourite).length})`, icon: Star }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.78rem',
                  padding: '5px 12px',
                  borderRadius: 6
                }}
              >
                {Icon && <Icon size={13} />} {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Showing <strong>{filteredItems.length}</strong> tenders
        </div>
      </div>

      {/* Tender List Body */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Loading your tender pipeline...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0'
        }}>
          <Bookmark size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: 6 }}>
            No tenders in this view
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 460, margin: '0 auto 16px' }}>
            Shortlist live tenders from Discovery or use "+ Add Tender" to register custom tenders and track their preparation tasks.
          </p>
          {onOpenAddTender && (
            <button className="btn btn-primary" onClick={onOpenAddTender}>
              <Plus size={15} /> + Add Your First Tender
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredItems.map(item => {
            const tender = item.tender;
            const isEditing = editingNotesId === item.saved_id;
            const statusInfo = getStatusBadge(item.status);
            const StatusIcon = statusInfo.icon;
            const taskStats = item.task_stats || { total: 0, completed: 0, percentage: 0 };

            return (
              <div 
                key={item.saved_id} 
                className="saas-card" 
                style={{
                  padding: '20px 24px',
                  borderLeft: `4px solid ${statusInfo.color}`
                }}
              >
                {/* Top Row: Ref No, Category, State, Status Badge, Favourites */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, background: '#e0f2fe', padding: '3px 8px', borderRadius: 4 }}>
                      {tender.tender_reference_no}
                    </span>
                    <span className="badge badge-gray">{tender.category}</span>
                    <span className="badge badge-green">{tender.location_state}</span>

                    {/* Prominent Live Status Badge */}
                    <div 
                      onClick={() => setStatusModalTender(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: `1px solid ${statusInfo.color}33`,
                        transition: 'transform 0.15s ease'
                      }}
                      title="Click to change or view status history"
                    >
                      <StatusIcon size={13} />
                      <span>STATUS: {statusInfo.label}</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>▼</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleToggleFavourite(item)}
                      className="btn btn-sm btn-secondary"
                      style={{ width: 32, height: 32, padding: 0 }}
                      title={item.is_favourite ? 'Remove from favourites' : 'Mark favourite'}
                    >
                      <Star size={15} color={item.is_favourite ? '#f59e0b' : '#94a3b8'} fill={item.is_favourite ? '#f59e0b' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleRemove(tender.id)}
                      className="btn btn-sm btn-danger"
                      style={{ width: 32, height: 32, padding: 0 }}
                      title="Remove saved tender"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Tender Title */}
                <h3 
                  onClick={() => onViewDetails(tender)}
                  style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer', margin: '10px 0 4px', lineHeight: 1.4 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4f46e5'}
                  onMouseLeave={e => e.currentTarget.style.color = '#0f172a'}
                >
                  {tender.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#64748b', marginBottom: 14 }}>
                  <Building2 size={14} />
                  <span>{tender.organization_name}</span>
                </div>

                {/* Financials & Deadline KPI Strip */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 20,
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  marginBottom: 14
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>ESTIMATED VALUE: </span>
                    <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{formatINR(tender.estimated_value)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>EMD: </span>
                    <strong style={{ color: '#0284c7', fontSize: '0.88rem' }}>{formatINR(tender.emd_amount)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>CLOSING: </span>
                    <strong style={{ color: '#d97706', fontSize: '0.88rem' }}>
                      {new Date(tender.closing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                  </div>

                  {item.bid_amount && (
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>OUR QUOTED BID: </span>
                      <strong style={{ color: '#16a34a', fontSize: '0.9rem' }}>{formatINR(item.bid_amount)}</strong>
                    </div>
                  )}

                  {tender.ai_match_score && (
                    <div style={{ marginLeft: 'auto' }}>
                      <span className="badge badge-green">
                        <Sparkles size={12} /> {tender.ai_match_score}% Match
                      </span>
                    </div>
                  )}
                </div>

                {/* Tender Preparation Tasks Progress Bar */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: taskStats.total > 0 && taskStats.completed === taskStats.total ? '#dcfce7' : '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: taskStats.total > 0 && taskStats.completed === taskStats.total ? '#16a34a' : '#4f46e5'
                    }}>
                      <CheckSquare size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        <span>Tender Tasks: {taskStats.completed} of {taskStats.total} completed</span>
                        <span>{taskStats.percentage}%</span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${taskStats.percentage}%`,
                          height: '100%',
                          background: taskStats.percentage === 100 ? '#16a34a' : '#4f46e5',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {onNavigateToTasks && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={onNavigateToTasks}
                        style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                      >
                        Manage Tasks
                      </button>
                    )}
                  </div>
                </div>

                {/* Internal Preparation Notes */}
                <div style={{
                  background: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  marginBottom: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      📝 Internal Bidding Strategy Notes
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => { setEditingNotesId(item.saved_id); setNoteText(item.notes || ''); }}
                        style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit3 size={12} /> Edit Note
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <input
                        type="text"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Add notes for bidding team (e.g. consortium with OEM, BG guarantee timeline)..."
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                      />
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleSaveNote(item)}
                      >
                        <Check size={14} /> Save
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setEditingNotesId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: item.notes ? '#1e293b' : '#94a3b8', fontStyle: item.notes ? 'normal' : 'italic' }}>
                      {item.notes || 'No strategy notes added. Click Edit Note to log bidding details.'}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {onOpenProposal && (
                      <button
                        className="btn btn-sm btn-ai"
                        onClick={() => onOpenProposal(tender)}
                        title="Generate AI RFP Proposal & Covering Letter"
                        style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                      >
                        <Sparkles size={13} /> {t('proposalGenerator')}
                      </button>
                    )}

                    {onOpenWinProbability && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onOpenWinProbability(tender)}
                        title="Predict Win Odds & L1 Pricing Tiers"
                        style={{ fontSize: '0.75rem', padding: '5px 10px', color: '#0284c7' }}
                      >
                        <TrendingUp size={13} /> {t('winPredictor')}
                      </button>
                    )}

                    {onOpenBOQ && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onOpenBOQ(tender)}
                        title="Build Bill of Quantities Financial Model"
                        style={{ fontSize: '0.75rem', padding: '5px 10px', color: '#059669' }}
                      >
                        <Calculator size={13} /> {t('boqEstimator')}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setStatusModalTender(item)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0f172a' }}
                    >
                      <StatusIcon size={14} color={statusInfo.color} /> {t('bidStatus')}
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onCheckEligibility(tender)}
                    >
                      Check Eligibility
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onViewDetails(tender)}
                    >
                      Open Opportunity
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MY SUBMITTED BIDS VIEW */}
      {activeTab === 'my_bids' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {myBids.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0'
            }}>
              <Send size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: 6 }}>
                No Submitted Bids Found
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 460, margin: '0 auto 16px' }}>
                You have not submitted any formal bids yet. Browse open tenders, prepare your RFP proposals, and click "Submit Bid" to participate.
              </p>
            </div>
          ) : (
            myBids.map(bid => {
              const isRejected = bid.status === 'rejected';
              const isAwarded = bid.status === 'awarded';
              const isShortlisted = bid.status === 'shortlisted';
              const canWithdraw = bid.status === 'submitted' || bid.status === 'under_evaluation';

              return (
                <div 
                  key={bid.id}
                  className="saas-card"
                  style={{
                    padding: '20px 24px',
                    borderLeft: `4px solid ${isAwarded ? '#16a34a' : (isRejected ? '#dc2626' : (isShortlisted ? '#7c3aed' : '#0284c7'))}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, background: '#e0f2fe', padding: '3px 8px', borderRadius: 4 }}>
                          {bid.tender?.tender_reference_no}
                        </span>
                        <span className="badge badge-gray">{bid.tender?.category}</span>
                        <span className={`badge ${isAwarded ? 'badge-success' : (isRejected ? 'badge-danger' : (isShortlisted ? 'badge-purple' : 'badge-warning'))}`}>
                          {bid.status === 'awarded' ? 'CONTRACT AWARDED 🎉' : (bid.status === 'rejected' ? 'BID REJECTED' : (bid.status === 'shortlisted' ? 'SHORTLISTED' : 'SUBMITTED / IN EVALUATION'))}
                        </span>
                      </div>

                      <h3 
                        onClick={() => bid.tender && onViewDetails && onViewDetails(bid.tender)}
                        style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer', margin: '10px 0 4px' }}
                      >
                        {bid.tender?.title || 'Tender Opportunity'}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#64748b' }}>
                        <Building2 size={14} />
                        <span>{bid.tender?.organization_name || 'Department Authority'}</span>
                        <span>• Submitted: {new Date(bid.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>OUR QUOTED BID AMOUNT</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a' }}>
                        {formatINR(bid.bid_amount)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Timeline: <strong>{bid.delivery_timeline_weeks || 12} Weeks</strong>
                      </div>
                    </div>
                  </div>

                  {/* Technical Proposal Summary */}
                  {bid.technical_proposal && (
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, margin: '14px 0 10px', fontSize: '0.82rem', color: '#475569' }}>
                      <strong style={{ color: '#0f172a' }}>Submitted Technical Solution: </strong>
                      {bid.technical_proposal}
                    </div>
                  )}

                  {/* Prominent Rejection Banner */}
                  {isRejected && (
                    <div style={{
                      background: '#fee2e2',
                      border: '1px solid #fecaca',
                      padding: '12px 16px',
                      borderRadius: 8,
                      margin: '12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <CircleAlert size={20} color="#dc2626" />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991b1b' }}>
                          Official Rejection Remarks from Department Authority:
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: 2 }}>
                          {bid.rejection_reason || 'Bid proposal did not meet the mandatory technical evaluation threshold.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Attached Files: {bid.attached_documents ? bid.attached_documents.length : 3} Certified Documents
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {canWithdraw && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleWithdrawBid(bid.id)}
                        >
                          Withdraw Bid
                        </button>
                      )}

                      {bid.tender && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => onViewDetails && onViewDetails(bid.tender)}
                        >
                          View Tender RFP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Status Modal */}
      {statusModalTender && (
        <TenderStatusModal
          tender={statusModalTender.tender}
          currentStatus={statusModalTender.status || 'saved'}
          initialBidAmount={statusModalTender.bid_amount || ''}
          statusHistory={statusModalTender.status_history || []}
          onClose={() => setStatusModalTender(null)}
          onStatusUpdated={() => {
            fetchSavedTenders();
            if (onRefresh) onRefresh();
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
