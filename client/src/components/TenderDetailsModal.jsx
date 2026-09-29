import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  IndianRupee, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Bookmark, 
  Scale, 
  Download, 
  ShieldCheck, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  CheckSquare,
  CheckCircle2,
  Plus,
  Send,
  Trophy,
  Trash2,
  Calculator,
  TrendingUp,
  FileCheck,
  Share2,
  Bot
} from 'lucide-react';
import { formatINR } from './TenderCard';
import AskTenderAIDrawer from './AskTenderAIDrawer';
import { downloadTenderRFP } from '../utils/downloadRFP';
import { api } from '../services/api';

export default function TenderDetailsModal({
  tender,
  similarTenders = [],
  aiEvaluation,
  eligibilityEvaluation,
  isSaved,
  isFavourite,
  onClose,
  onCheckEligibility,
  onViewRecommendation,
  onToggleSave,
  onSelectSimilar,
  onOpenProposal,
  onOpenWinProbability,
  onOpenBOQ,
  onSubmitBid,
  onOpenAskAI,
  userRole = 'company_user'
}) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, eligibility, ai_doc, ask_ai, tasks_status
  const [tenderTasks, setTenderTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [bidStatus, setBidStatus] = useState('saved');

  useEffect(() => {
    if (tender?.id) {
      loadTenderTasks();
    }
  }, [tender?.id]);

  const loadTenderTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await api.getTasks({ tender_id: tender.id });
      setTenderTasks(res.data || []);
    } catch (err) {
      console.error('Failed to load tasks for tender:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleQuickAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await api.createTask({
        tender_id: tender.id,
        title: newTaskTitle.trim(),
        priority: 'high',
        stage: 'Technical Documentation',
        status: 'todo'
      });
      setNewTaskTitle('');
      loadTenderTasks();
    } catch (err) {
      console.error('Failed to add quick task:', err);
    }
  };

  const handleToggleTaskChecklist = async (task, cIdx) => {
    try {
      const checklist = [...(task.checklist || [])];
      checklist[cIdx].completed = !checklist[cIdx].completed;
      const allDone = checklist.every(c => c.completed);
      await api.updateTask(task.id, { checklist, status: allDone ? 'completed' : task.status });
      setTenderTasks(prev => prev.map(t => t.id === task.id ? { ...t, checklist, status: allDone ? 'completed' : t.status } : t));
    } catch (err) {
      console.error('Failed to toggle task checklist:', err);
    }
  };

  const handleUpdateBidStatus = async (st) => {
    try {
      await api.updateBidStatus(tender.id, { status: st });
      setBidStatus(st);
    } catch (err) {
      console.error('Failed to update bid status:', err);
    }
  };

  if (!tender) return null;

  const closingDate = new Date(tender.closing_date);
  const openingDate = new Date(tender.opening_date);
  const now = new Date();
  const diffHours = (closingDate.getTime() - now.getTime()) / 3600000;
  const daysLeft = Math.ceil(diffHours / 24);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 960, maxHeight: '92vh' }}>
        {/* Top Header */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.25), rgba(15, 23, 42, 0.9))',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'relative'
        }}>
          <button 
            onClick={onClose}
            className="btn btn-sm btn-secondary"
            style={{ position: 'absolute', right: 20, top: 20, width: 32, height: 32, padding: 0 }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', background: 'rgba(59, 130, 246, 0.15)', padding: '3px 10px', borderRadius: 6 }}>
              {tender.tender_reference_no}
            </span>
            <span className="badge badge-purple">{tender.category}</span>
            <span className="badge badge-gray">{tender.industry}</span>
            <span className="badge badge-primary"><MapPin size={12} /> {tender.location_city ? `${tender.location_city}, ` : ''}{tender.location_state}</span>

            {daysLeft <= 3 ? (
              <span className="badge badge-danger"><Clock size={12} /> Closing in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}!</span>
            ) : (
              <span className="badge badge-warning"><Calendar size={12} /> Closes {closingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
          </div>

          <h2 style={{ fontSize: '1.35rem', lineHeight: 1.35, fontWeight: 700, color: '#0f172a', marginBottom: 8, paddingRight: 40 }}>
            {tender.title}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#00796b', fontWeight: 600 }}>
            <Building2 size={16} />
            <span>{tender.organization_name || 'Procuring Authority'}</span>
          </div>

          {/* Key Financial KPIs Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            background: '#f8fafc',
            padding: '14px 18px',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            marginTop: 20
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Estimated Value</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00796b' }}>{formatINR(tender.estimated_value)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>EMD Deposit</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{formatINR(tender.emd_amount)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Tender Fee</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>₹{tender.tender_fee?.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Submission Due</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#d97706' }}>
                {closingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} 18:00 IST
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0 24px'
        }}>
          {[
            { id: 'overview', label: 'Overview & Scope', icon: <FileText size={15} /> },
            { id: 'eligibility', label: 'Pre-Qualification & Criteria', icon: <ShieldCheck size={15} /> },
            { id: 'ai_doc', label: 'AI Document Intelligence', icon: <Sparkles size={15} /> },
            { id: 'ask_ai', label: 'Ask Your Tender AI', icon: <HelpCircle size={15} /> },
            { id: 'tasks_status', label: `Tender Tasks (${tenderTasks.length}) & Status`, icon: <CheckSquare size={15} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 18px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? '#00796b' : '#64748b',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.88rem',
                borderBottom: activeTab === tab.id ? '2px solid #00796b' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '24px', minHeight: 380 }}>
          {/* 1. OVERVIEW & SCOPE */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* AI Tender Summary Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 121, 107, 0.08), rgba(99, 102, 241, 0.06))',
                border: '1px solid rgba(0, 121, 107, 0.25)',
                borderRadius: 12,
                padding: '18px 22px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={18} color="#00796b" />
                    <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      AI Tender Summary
                    </h4>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => onOpenAskAI ? onOpenAskAI(tender) : setActiveTab('ask_ai')}
                      style={{ background: 'linear-gradient(135deg, #00796b, #004d40)' }}
                    >
                      <Bot size={14} /> Ask AI About This Tender
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => setActiveTab('ai_doc')}
                    >
                      View Full AI Analysis →
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, fontSize: '0.84rem' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tender Purpose</div>
                    <div style={{ color: 'var(--text-main)', marginTop: 2 }}>{tender.description ? tender.description.substring(0, 130) + '...' : 'Execution per RFP specifications.'}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Value</div>
                    <div style={{ color: '#00796b', fontWeight: 800, fontSize: '1rem', marginTop: 2 }}>{formatINR(tender.estimated_value)}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>EMD Amount</div>
                    <div style={{ color: 'var(--text-main)', fontWeight: 700, marginTop: 2 }}>{formatINR(tender.emd_amount)} (Bank Guarantee or Online Portal)</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Submission Deadline</div>
                    <div style={{ color: '#d97706', fontWeight: 700, marginTop: 2 }}>{closingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} 18:00 IST</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Eligibility Criteria</div>
                    <div style={{ color: 'var(--text-main)', marginTop: 2 }}>₹{(Number(tender.min_turnover_required || 0) / 10000000).toFixed(1)} Cr turnover & {tender.min_experience_years || 3}+ years track record</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Required Documents</div>
                    <div style={{ color: 'var(--text-main)', marginTop: 2 }}>{(tender.required_documents || ['Audited Balance Sheets', 'Technical Proposal', 'EMD BG']).slice(0, 3).join(', ')}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>Project Description & Scope of Work</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {tender.description}
                </p>
              </div>

              {/* Technical Specifications & Milestones */}
              <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Schedule of Milestones & Key Dates</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>PUBLISHED DATE</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                      {new Date(tender.published_date || tender.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>BID SUBMISSION DEADLINE</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#d97706' }}>
                      {closingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} 18:00 IST
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TECHNICAL BID OPENING</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#00796b' }}>
                      {openingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} 11:00 IST
                    </div>
                  </div>
                </div>
              </div>

              {/* Download RFP Notification Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '12px 18px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={20} color="#00796b" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>Official Tender Notice & RFP Specifications</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Verified Document • Size: 2.4 MB • Format: PDF / Text</div>
                  </div>
                </div>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => downloadTenderRFP(tender)}
                >
                  <Download size={14} /> Download RFP
                </button>
              </div>
            </div>
          )}

          {/* 2. ELIGIBILITY & CRITERIA */}
          {activeTab === 'eligibility' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Minimum Turnover Required</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00796b' }}>{formatINR(tender.min_turnover_required)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Average annual turnover in last 3 financial years certified by CA</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Track Record & Experience</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{tender.min_experience_years} Years Minimum</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Proven execution in {tender.industry || tender.category}</div>
                </div>
              </div>

              {/* Required Certifications */}
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Mandatory Quality Accreditations</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(tender.required_certifications || []).map((c, i) => (
                    <span key={i} className="badge badge-purple" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                      🛡️ {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Required Submission Documents */}
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Mandatory Submission Documents (Cover 1 & 2)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(tender.required_documents || []).map((doc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, fontSize: '0.84rem' }}>
                      <CheckCircle size={15} color="#00796b" />
                      <span style={{ color: '#0f172a' }}>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. AI DOCUMENT INTELLIGENCE */}
          {activeTab === 'ai_doc' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Sparkles size={16} color="#c084fc" />
                  <h4 style={{ fontSize: '0.92rem', color: '#fff' }}>Extracted Key Clauses & Penalties</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(tender.clauses_summary || []).map((clause, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: '#e2e8f0', background: 'rgba(139, 92, 246, 0.06)', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #8b5cf6' }}>
                      📌 {clause}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <CheckCircle size={16} color="#34d399" />
                  <h4 style={{ fontSize: '0.92rem', color: '#fff' }}>Bidder Preparation Checklist</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(tender.bidder_checklist || []).map((chk, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(16, 185, 129, 0.05)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem' }}>
                      <input type="checkbox" defaultChecked={false} style={{ cursor: 'pointer', accentColor: '#10b981' }} />
                      <span style={{ color: '#fff' }}>{chk.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. ASK YOUR TENDER AI */}
          {activeTab === 'ask_ai' && (
            <AskTenderAIDrawer tender={tender} />
          )}

          {/* Similar Opportunities Carousel */}
          {similarTenders.length > 0 && activeTab !== 'ask_ai' && (
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
                Similar Opportunities in {tender.category}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {similarTenders.map(sim => (
                  <div
                    key={sim.id}
                    onClick={() => onSelectSimilar(sim.id)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontFamily: 'monospace' }}>{sim.tender_reference_no}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sim.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>{formatINR(sim.estimated_value)}</span>
                      <span style={{ color: 'var(--text-dim)' }}>{sim.organization_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. TENDER TASKS & STATUS TAB */}
          {activeTab === 'tasks_status' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Bid Lifecycle Status Controls */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px 20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Bidding Pipeline Status
                    </h4>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Current Stage: <strong style={{ color: '#4f46e5', textTransform: 'uppercase' }}>{bidStatus.replace('_', ' ')}</strong>
                    </div>
                  </div>

                  {/* Quick status selector */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { st: 'saved', label: 'Shortlisted' },
                      { st: 'preparing', label: 'Preparing' },
                      { st: 'submitted', label: 'Submitted' },
                      { st: 'awarded', label: 'Won 🎉' }
                    ].map(btn => (
                      <button
                        key={btn.st}
                        onClick={() => handleUpdateBidStatus(btn.st)}
                        className={`btn btn-sm ${bidStatus === btn.st ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tasks List for this Tender */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Tender Preparation Tasks ({tenderTasks.length})
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {tenderTasks.filter(t => t.status === 'completed').length} completed
                  </span>
                </div>

                {/* Inline Quick Add Task */}
                <form onSubmit={handleQuickAddTask} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add task for this tender (e.g. Frank Bank Guarantee with SBI)..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={14} /> Add Task
                  </button>
                </form>

                {tasksLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                    Loading tasks...
                  </div>
                ) : tenderTasks.length === 0 ? (
                  <div style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: 10,
                    border: '1px dashed #cbd5e1'
                  }}>
                    <CheckSquare size={28} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      No preparation tasks created yet
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                      Use the quick input above to create EMD, technical documentation, or compliance checklist items.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tenderTasks.map(task => (
                      <div
                        key={task.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '12px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontSize: '0.67rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: task.status === 'completed' ? '#dcfce7' : '#e0f2fe',
                              color: task.status === 'completed' ? '#16a34a' : '#0284c7'
                            }}>
                              {task.status.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                              {task.title}
                            </span>
                          </div>

                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {task.assigned_to}
                          </span>
                        </div>

                        {task.checklist && task.checklist.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, paddingLeft: 6 }}>
                            {task.checklist.map((item, cIdx) => (
                              <label
                                key={item.id || cIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  color: item.completed ? '#94a3b8' : '#334155',
                                  textDecoration: item.completed ? 'line-through' : 'none'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!item.completed}
                                  onChange={() => handleToggleTaskChecklist(task, cIdx)}
                                  style={{ accentColor: '#16a34a' }}
                                />
                                <span>{item.text}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {userRole === 'company_user' && (
              <button
                className="btn btn-secondary"
                onClick={() => onToggleSave(tender.id)}
              >
                <Bookmark size={15} color={isSaved ? '#00796b' : 'currentColor'} fill={isSaved ? '#00796b' : 'none'} />
                {isSaved ? 'Saved in My Tenders' : 'Save Tender'}
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.origin + `/tenders?ref=${tender.tender_reference_no}`);
                  alert('Tender link copied to clipboard!');
                }
              }}
              title="Share Tender URL"
            >
              <Share2 size={14} /> Share
            </button>

            {/* Prominent Ask AI About This Tender Button */}
            <button
              className="btn btn-primary"
              onClick={() => onOpenAskAI ? onOpenAskAI(tender) : setActiveTab('ask_ai')}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                color: '#ffffff',
                fontWeight: 700
              }}
            >
              <Bot size={16} /> Ask AI About This Tender
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {userRole === 'company_user' && (
              <>
                {onOpenBOQ && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => onOpenBOQ(tender)}
                    title="Open interactive Bill of Quantities cost calculator"
                  >
                    <Calculator size={15} color="#059669" /> BOQ Estimator
                  </button>
                )}

                {onOpenWinProbability && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => onOpenWinProbability(tender)}
                    title="Predict win probability & optimal L1 price"
                  >
                    <TrendingUp size={15} color="#0284c7" /> Win Probability
                  </button>
                )}

                {onOpenProposal && (
                  <button
                    className="btn btn-ai"
                    onClick={() => onOpenProposal(tender)}
                    title="Generate AI RFP bid proposal and covering letter"
                  >
                    <Sparkles size={15} /> AI Proposal
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={() => onViewRecommendation(tender)}
                >
                  <Sparkles size={15} color="#7c3aed" /> AI Match
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => onCheckEligibility(tender)}
                >
                  <ShieldCheck size={16} /> Eligibility
                </button>

                {onSubmitBid && (tender.status === 'published' || tender.status === 'closing_soon') && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      onClose();
                      onSubmitBid(tender);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Send size={15} /> Apply & Submit Bid
                  </button>
                )}
              </>
            )}

            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
