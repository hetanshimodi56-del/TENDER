import React, { useState } from 'react';
import { 
  X, 
  CircleCheck, 
  Clock, 
  Send, 
  Scale, 
  Trophy, 
  CircleX, 
  Bookmark, 
  Calendar, 
  IndianRupee, 
  FileText,
  CircleAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

const STAGES = [
  { key: 'saved', label: '1. Shortlisted', icon: Bookmark, color: '#64748b' },
  { key: 'preparing', label: '2. In Preparation', icon: FileText, color: '#0284c7' },
  { key: 'submitted', label: '3. Bid Submitted', icon: Send, color: '#f59e0b' },
  { key: 'under_evaluation', label: '4. Evaluation', icon: Scale, color: '#8b5cf6' },
  { key: 'awarded', label: '5. Awarded / Won', icon: Trophy, color: '#10b981' }
];

export default function TenderStatusModal({ 
  tender, 
  currentStatus = 'saved', 
  initialBidAmount = '', 
  statusHistory = [],
  onClose, 
  onStatusUpdated,
  onShowToast 
}) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || 'saved');
  const [bidAmount, setBidAmount] = useState(initialBidAmount || '');
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getStageIndex = (st) => {
    if (st === 'lost') return 4;
    const idx = STAGES.findIndex(s => s.key === st);
    return idx !== -1 ? idx : 0;
  };

  const currentStageIndex = getStageIndex(selectedStatus);

  const handleSaveStatus = async () => {
    setSubmitting(true);
    try {
      const payload = {
        status: selectedStatus,
        bid_amount: bidAmount ? Number(bidAmount) : undefined,
        submission_date: selectedStatus === 'submitted' || selectedStatus === 'under_evaluation' || selectedStatus === 'awarded' ? new Date(submissionDate).toISOString() : undefined,
        note: noteText.trim()
      };

      const res = await api.updateBidStatus(tender.id, payload);

      if (selectedStatus === 'awarded') {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 }
        });
      }

      if (onShowToast) {
        onShowToast(`Bid status updated to "${selectedStatus.replace('_', ' ').toUpperCase()}".`, 'success');
      }

      if (onStatusUpdated) {
        onStatusUpdated(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update bid status:', err);
      if (onShowToast) {
        onShowToast(err.message || 'Failed to update status', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 680, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace', marginBottom: 4 }}>
              {tender.tender_reference_no}
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Bid Status & Opportunity Pipeline
            </h2>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 6,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tender Title */}
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
              {tender.title}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
              {tender.organization_name} • Est. Value: ₹{Number(tender.estimated_value).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Visual 5-Stage Stepper Pipeline */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '16px 12px'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>
              Bid Lifecycle Progression
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {STAGES.map((st, idx) => {
                const Icon = st.icon;
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx && selectedStatus !== 'lost';
                const isLost = selectedStatus === 'lost' && idx === 4;

                let badgeBg = '#f1f5f9';
                let iconColor = '#94a3b8';
                let textColor = '#64748b';

                if (isPassed) {
                  badgeBg = '#dcfce7';
                  iconColor = '#16a34a';
                  textColor = '#16a34a';
                } else if (isCurrent) {
                  badgeBg = '#e0e7ff';
                  iconColor = '#4f46e5';
                  textColor = '#4f46e5';
                } else if (isLost) {
                  badgeBg = '#fee2e2';
                  iconColor = '#dc2626';
                  textColor = '#dc2626';
                }

                return (
                  <div 
                    key={st.key}
                    onClick={() => setSelectedStatus(st.key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      flex: 1,
                      zIndex: 2,
                      padding: '4px 0'
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: badgeBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isCurrent ? '0 0 0 3px rgba(79, 70, 229, 0.2)' : 'none',
                      transition: 'all 0.2s ease',
                      marginBottom: 6
                    }}>
                      <Icon size={18} color={iconColor} />
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: isCurrent ? 800 : 600,
                      color: textColor,
                      textAlign: 'center'
                    }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to Update Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Update Current Status
                </label>
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                >
                  <option value="saved">📌 Shortlisted / Saved</option>
                  <option value="preparing">📝 Bid In Preparation</option>
                  <option value="submitted">🚀 Bid Submitted to Authority</option>
                  <option value="under_evaluation">⚖️ Under Evaluation</option>
                  <option value="awarded">🏆 Won / Contract Awarded</option>
                  <option value="lost">❌ Not Awarded / Lost</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Our Quoted Bid Value (₹ INR)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder="e.g. 43000000"
                />
                {bidAmount && (
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 3 }}>
                    ₹{(Number(bidAmount) / 10000000).toFixed(2)} Cr
                  </div>
                )}
              </div>
            </div>

            {(selectedStatus === 'submitted' || selectedStatus === 'under_evaluation' || selectedStatus === 'awarded') && (
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Official Submission Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={submissionDate}
                  onChange={e => setSubmissionDate(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                Status Transition Remark / Notes
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="e.g. Technical proposal approved by committee. BG Franked by SBI. Uploaded on CPPP portal."
              />
            </div>
          </div>

          {/* Status Timeline History */}
          {statusHistory && statusHistory.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 10, textTransform: 'uppercase' }}>
                Status Audit Trail & Timeline
              </div>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                {statusHistory.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.78rem' }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#4f46e5',
                      marginTop: 4,
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>
                          {h.status.replace('_', ' ')}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {new Date(h.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ color: '#475569', marginTop: 2 }}>
                        {h.note || 'Status updated'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting}
            onClick={handleSaveStatus}
          >
            {submitting ? 'Updating...' : 'Save & Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
