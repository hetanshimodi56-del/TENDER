import React, { useState } from 'react';
import { 
  X, 
  Send, 
  IndianRupee, 
  Clock, 
  Building2, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { formatINR } from './TenderCard';
import { api } from '../services/api';

export default function SubmitBidModal({
  tender,
  user,
  onClose,
  onBidSubmitted,
  onOpenProposal,
  onOpenWinProbability,
  onShowToast
}) {
  const [bidAmount, setBidAmount] = useState(Math.round(Number(tender?.estimated_value || 10000000) * 0.96));
  const [technicalProposal, setTechnicalProposal] = useState(
    `Comprehensive turnkey execution for "${tender?.title || 'Project'}". Our solution fully complies with all specifications, ISO standards, and delivery milestones specified in the RFP.`
  );
  const [commercialTerms, setCommercialTerms] = useState(
    'Payment per Clause 14 Special Conditions: 20% on equipment delivery, 60% on installation & testing, 20% against bank guarantee.'
  );
  const [deliveryMonths, setDeliveryMonths] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Attached compliance documents
  const [documents, setDocuments] = useState([
    { name: 'Technical_Bid_Solution_Volume_I.pdf', size: '3.2 MB', verified: true },
    { name: 'Financial_Price_Schedule_BOQ.xlsx', size: '580 KB', verified: true },
    { name: 'EMD_Bank_Guarantee_Certified.pdf', size: '1.4 MB', verified: true },
    { name: 'CA_Audited_Turnover_FY24.pdf', size: '2.1 MB', verified: true }
  ]);

  if (!tender) return null;

  const estimatedVal = Number(tender.estimated_value || 0);
  const variancePercent = estimatedVal > 0 
    ? (((Number(bidAmount) - estimatedVal) / estimatedVal) * 100).toFixed(2)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bidAmount || Number(bidAmount) <= 0) {
      setError('Please provide a valid quoted bid amount.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.submitBid({
        tender_id: tender.id,
        bid_amount: Number(bidAmount),
        technical_proposal: technicalProposal,
        commercial_terms: commercialTerms,
        delivery_timeline_months: Number(deliveryMonths),
        documents
      });

      if (onShowToast) {
        onShowToast(`Bid of ₹${Number(bidAmount).toLocaleString('en-IN')} submitted successfully for #${tender.tender_reference_no}!`, 'success');
      }

      if (onBidSubmitted) {
        onBidSubmitted(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Bid submission error:', err);
      setError(err.message || 'Failed to submit bid. Please check criteria.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 780,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        animation: 'modalSlideIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Send size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Official Bid Submission Portal
                </h3>
                <span style={{
                  background: 'rgba(2, 132, 199, 0.2)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  Encrypted e-Bid
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Ref: {tender.tender_reference_no} • {tender.organization_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#cbd5e1',
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Financial KPI Banner */}
        <div style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Departmental Value</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{formatINR(tender.estimated_value)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Required EMD Deposit</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0284c7' }}>{formatINR(tender.emd_amount)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Submission Deadline</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#d97706' }}>
              {new Date(tender.closing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* AI Assistance Quick Bar */}
        {(onOpenProposal || onOpenWinProbability) && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
            borderBottom: '1px solid #bae6fd',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', color: '#0369a1', fontWeight: 600 }}>
              <Sparkles size={15} color="#0284c7" />
              <span>Use AI to draft formal bid covering letter or calculate optimal L1 winning bid:</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {onOpenWinProbability && (
                <button
                  type="button"
                  onClick={() => onOpenWinProbability(tender)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #7dd3fc',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <TrendingUp size={12} /> Optimal L1 Pricing
                </button>
              )}
              {onOpenProposal && (
                <button
                  type="button"
                  onClick={() => onOpenProposal(tender)}
                  style={{
                    background: '#0284c7',
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <FileText size={12} /> Auto-Draft RFP Response
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #f87171',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Quoted Price Input with Variance Indicator */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: 12,
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                Quoted Total Bid Price (INR) *
              </label>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 10,
                background: Number(variancePercent) <= 0 ? '#dcfce7' : '#fee2e2',
                color: Number(variancePercent) <= 0 ? '#166534' : '#991b1b'
              }}>
                {Number(variancePercent) <= 0 ? `${Math.abs(variancePercent)}% Below Est. Value` : `+${variancePercent}% Above Est. Value`}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: 10, fontWeight: 700, color: '#64748b' }}>₹</span>
              <input
                type="number"
                required
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 28px',
                  borderRadius: 8,
                  border: '1px solid #94a3b8',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 5 }}>
              Quoting: <strong>{formatINR(Number(bidAmount))}</strong> (Exclusive of 18% GST).
            </div>
          </div>

          {/* Delivery Timeline & Terms */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Execution Timeline (Months) *
              </label>
              <input
                type="number"
                min="1"
                max="60"
                required
                value={deliveryMonths}
                onChange={e => setDeliveryMonths(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Commercial & Payment Terms
              </label>
              <input
                type="text"
                value={commercialTerms}
                onChange={e => setCommercialTerms(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Technical Proposal */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Technical Methodology & Scope Compliance Summary *
            </label>
            <textarea
              rows="3"
              required
              value={technicalProposal}
              onChange={e => setTechnicalProposal(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.45
              }}
            />
          </div>

          {/* Supporting Uploaded Documents */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                Attached Technical & Statutory Documents ({documents.length})
              </label>
              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                ✓ Vault Pre-attached
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 12px',
                    borderRadius: 6,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={14} color="#0284c7" />
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{doc.name}</span>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>({doc.size})</span>
                  </div>
                  <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.7rem' }}>
                    Digitally Sealed ✓
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Notice & Declaration */}
          <div style={{
            fontSize: '0.73rem',
            color: '#64748b',
            background: '#f1f5f9',
            padding: '10px 14px',
            borderRadius: 8,
            lineHeight: 1.4
          }}>
            ⚖️ <strong>Legal Undertaking:</strong> By submitting this formal bid under <em>{user?.name}</em> ({user?.email}), you affirm that all quoted rates, technical deliverables and certifications are authentic and legally binding under the Public Procurement Integrity Pact.
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 20px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: submitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
              }}
            >
              {submitting ? 'Encrypting & Submitting...' : 'Confirm & Submit Official Bid'}
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
