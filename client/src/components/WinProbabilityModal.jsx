import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Scale, 
  Trophy, 
  ShieldAlert, 
  Sparkles,
  ArrowRight,
  IndianRupee
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from './TenderCard';

export default function WinProbabilityModal({ tender, onClose, onApplyBid, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (tender?.id) {
      fetchWinPrediction();
    }
  }, [tender?.id]);

  const fetchWinPrediction = async () => {
    setLoading(true);
    try {
      const res = await api.getWinPrediction(tender.id);
      setData(res.data);
    } catch (err) {
      console.error('Failed to get win prediction:', err);
      if (onShowToast) onShowToast('Failed to load predictive model', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTier = async (tier) => {
    try {
      await api.updateBidStatus(tender.id, {
        status: 'preparing',
        bid_amount: tier.bid_price,
        note: `Applied ${tier.tier} at ₹${tier.bid_price.toLocaleString('en-IN')}`
      });
      if (onShowToast) onShowToast(`Applied ${tier.tier} (₹${formatINR(tier.bid_price)}) to your bid!`);
      if (onApplyBid) onApplyBid(tier.bid_price);
      onClose();
    } catch (err) {
      if (onShowToast) onShowToast('Failed to apply bid price', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 840, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
            }}>
              <TrendingUp size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                AI Win Probability & L1 Price Predictor
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                Machine learning bid price optimization for {tender.tender_reference_no}
              </p>
            </div>
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

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Calculating historical procurement metrics and competitor pricing distributions...
            </div>
          ) : data ? (
            <>
              {/* Top Win Probability Gauge & Competition Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '4px solid #10b981',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                  }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>
                      {data.win_probability}%
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', marginTop: 2 }}>
                      WIN ODDS
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 4, background: '#dcfce7', color: '#16a34a', fontSize: '0.72rem', fontWeight: 800, marginBottom: 4 }}>
                      HIGH WIN POTENTIAL
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      Strong Technical & Financial Alignment
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>
                      Estimated Tender Value: <strong>₹{data.estimated_value.toLocaleString('en-IN')}</strong> • Market Density: {data.competition_level}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimensional Evaluation Progress Bars */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px 20px'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 12 }}>
                  Dimensional Fit Radar Assessment
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Technical Architecture Fit', score: data.radar_scores.technical_fit },
                    { label: 'Financial Standing & Turnover', score: data.radar_scores.financial_eligibility },
                    { label: 'Compliance & Quality Standards', score: data.radar_scores.compliance_readiness },
                    { label: 'Past Domain Performance', score: data.radar_scores.past_performance },
                    { label: 'Geographic Location Advantage', score: data.radar_scores.geographic_reach }
                  ].map((dim, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        <span>{dim.label}</span>
                        <span style={{ color: dim.score >= 85 ? '#16a34a' : '#0284c7' }}>{dim.score}%</span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${dim.score}%`, height: '100%', background: dim.score >= 85 ? '#10b981' : '#0284c7' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* L1 Pricing Optimization Tiers */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase' }}>
                  Optimal L1 Bidding Price Recommendations
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {data.pricing_tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="saas-card"
                      style={{
                        padding: '16px',
                        border: idx === 1 ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        background: idx === 1 ? '#f5f3ff' : '#ffffff',
                        position: 'relative'
                      }}
                    >
                      {idx === 1 && (
                        <div style={{
                          position: 'absolute',
                          top: -10,
                          right: 14,
                          background: '#4f46e5',
                          color: '#ffffff',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 9999
                        }}>
                          RECOMMENDED
                        </div>
                      )}

                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                        {tier.tier}
                      </div>

                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: idx === 1 ? '#4f46e5' : '#0f172a', marginBottom: 4 }}>
                        ₹{tier.bid_price.toLocaleString('en-IN')}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginBottom: 8 }}>
                        {tier.discount_percent}% below budget • {tier.win_probability}% Win Odds
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4, marginBottom: 12 }}>
                        {tier.recommendation}
                      </div>

                      <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600, background: '#ffffff', padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0', marginBottom: 10 }}>
                        Expected Margin: <strong>{tier.profit_margin}</strong>
                      </div>

                      <button
                        onClick={() => handleApplyTier(tier)}
                        className={`btn btn-sm ${idx === 1 ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ width: '100%', fontSize: '0.72rem' }}
                      >
                        Apply This Bid Quote
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Risk Flags */}
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 8,
                padding: '12px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#b45309', marginBottom: 6 }}>
                  <AlertTriangle size={15} /> Key Clause Risks to Factor into Pricing
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.75rem', color: '#78350f', lineHeight: 1.5 }}>
                  {data.key_risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
