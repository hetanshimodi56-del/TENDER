import React from 'react';
import { 
  X, 
  Sparkles, 
  CircleCheck, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck,
  Award,
  Layers,
  MapPin,
  Clock,
  IndianRupee
} from 'lucide-react';
import { formatINR } from './TenderCard';

export default function AIRecommendationModal({ tender, recommendation, onClose }) {
  if (!tender || !recommendation) return null;

  const score = recommendation.score || 50;
  const breakdown = recommendation.breakdown || {};

  const dimensions = [
    { key: 'category', label: 'Domain & Industry Fit', max: 25, current: breakdown.category || 0, icon: <Layers size={16} /> },
    { key: 'turnover', label: 'Financial Turnover Capacity', max: 20, current: breakdown.turnover || 0, icon: <IndianRupee size={16} /> },
    { key: 'experience', label: 'Operational Track Record', max: 20, current: breakdown.experience || 0, icon: <Clock size={16} /> },
    { key: 'location', label: 'Geographical Alignment', max: 15, current: breakdown.location || 0, icon: <MapPin size={16} /> },
    { key: 'certifications', label: 'Quality & Regulatory Certs', max: 15, current: breakdown.certifications || 0, icon: <Award size={16} /> },
    { key: 'capabilities', label: 'Keyword & Capability Overlap', max: 5, current: breakdown.capabilities || 0, icon: <Sparkles size={16} /> }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-accent)'
            }}>
              <Sparkles size={20} color="#c084fc" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Explainable AI Matching Analysis</h2>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Transparent mathematical scoring breakdown across 6 procurement dimensions
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Target Tender Banner */}
          <div style={{
            background: '#f8fafc',
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            marginBottom: 20
          }}>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, fontFamily: 'monospace' }}>
              {tender.tender_reference_no}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
              {tender.title}
            </div>
          </div>

          {/* Big Score Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4, #e6f4f1)',
            border: '1px solid #b2dfdb',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            boxShadow: '0 4px 14px rgba(0, 121, 107, 0.08)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#00796b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI MATCH COEFFICIENT
                </span>
                <span className="badge badge-purple">Confidence: {recommendation.confidence || 'High'}</span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#00796b', marginTop: 4 }}>
                {score}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', maxWidth: 420 }}>
                Calculated against your verified company turnover (₹55 Cr), 8 years experience, and active ISO/CMMI credentials.
              </div>
            </div>

            {/* Visual Progress Wheel / Radial representation */}
            <div style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: `conic-gradient(#00796b ${score * 3.6}deg, #cbd5e1 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 121, 107, 0.2)'
            }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#00796b',
                fontSize: '1.1rem'
              }}>
                {score}%
              </div>
            </div>
          </div>

          {/* Dimension Breakdown Sliders */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
              Dimensional Weight Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dimensions.map(dim => {
                const pct = (dim.current / dim.max) * 100;
                return (
                  <div key={dim.key} style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontWeight: 600 }}>
                        <span style={{ color: '#00796b' }}>{dim.icon}</span>
                        <span>{dim.label}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: pct >= 80 ? '#00796b' : (pct >= 50 ? '#d97706' : '#64748b') }}>
                        {dim.current} / {dim.max} pts
                      </div>
                    </div>
                    {/* Progress Track */}
                    <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: pct >= 80 ? 'linear-gradient(90deg, #00897b, #00bfa5)' : (pct >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : '#64748b'),
                        borderRadius: 4,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Strengths & Recommendation Reasons */}
          {recommendation.reasons?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CircleCheck size={16} /> Recommendation Rationale ({recommendation.reasons.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recommendation.reasons.map((reason, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#0f172a', background: '#f0fdf4', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #16a34a' }}>
                    • {reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Identified Gaps / Win-Rate Optimization */}
          {recommendation.gaps?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={16} /> Areas For Win-Rate Optimization ({recommendation.gaps.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recommendation.gaps.map((gap, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#0f172a', background: '#fffbeb', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
                    ⚠️ {gap}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button className="btn btn-primary" onClick={onClose}>
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
