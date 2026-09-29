import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Award, 
  Save, 
  Star,
  FileText
} from 'lucide-react';
import { formatINR } from '../components/TenderCard';
import { api } from '../services/api';

export default function EvaluatorPortal({ user }) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState(null);
  const [score, setScore] = useState(90);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('Recommended');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await api.getEvaluations();
      setEvaluations(res.data || []);
      if (res.data && res.data.length > 0 && !selectedEval) {
        selectEvalItem(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectEvalItem = (item) => {
    setSelectedEval(item);
    setScore(item.technical_score || 85);
    setRemarks(item.evaluator_remarks || '');
    setStatus(item.status || 'Recommended');
    setMsg('');
  };

  const handleSaveScore = async (e) => {
    e.preventDefault();
    if (!selectedEval) return;

    setSaving(true);
    setMsg('');
    try {
      await api.updateEvaluation(selectedEval.id, {
        technical_score: score,
        evaluator_remarks: remarks,
        status
      });
      setMsg('Technical evaluation score and remarks saved successfully!');
      fetchEvaluations();
    } catch (err) {
      alert(err.message || 'Failed to save score');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.35), rgba(15, 23, 42, 0.8))',
        border: '1px solid var(--border-accent)',
        borderRadius: 16,
        padding: '24px 32px',
        marginBottom: 28
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 9999, background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: 8 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#93c5fd' }}>
            TECHNICAL BID EVALUATION COMMITTEE
          </span>
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          Assigned Bid Technical Reviews
        </h1>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Assigned Evaluator: <strong style={{ color: '#0f172a' }}>{user.name}</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading assigned bids...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 24 }}>
          {/* Left: Bid Selection List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Submitted Proposals Under Review</h3>
            {evaluations.map(e => (
              <div
                key={e.id}
                onClick={() => selectEvalItem(e)}
                className="glass-card"
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  borderColor: selectedEval?.id === e.id ? 'var(--primary)' : 'var(--border-subtle)',
                  background: selectedEval?.id === e.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700 }}>
                    {e.tender_reference_no}
                  </span>
                  <span className={`badge ${e.status === 'Recommended' ? 'badge-success' : 'badge-warning'}`}>
                    {e.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  {e.bidder_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                  Project: {e.tender_title}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                  <span>Quote: <strong style={{ color: '#34d399' }}>{formatINR(e.financial_bid)}</strong></span>
                  <span>Technical Score: <strong style={{ color: '#60a5fa' }}>{e.technical_score}/100</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Technical Scoring & Comments Form */}
          {selectedEval && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Technical Evaluation Sheet</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedEval.bidder_name}</div>
                </div>
                <span className="badge badge-purple">{selectedEval.compliance_status}</span>
              </div>

              {msg && (
                <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: '#34d399', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
                  ✓ {msg}
                </div>
              )}

              <form onSubmit={handleSaveScore} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Technical Merit Score (0 - 100)</label>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>{score} pts</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={score}
                    onChange={e => setScore(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 4 }}>
                    <span>0 (Unsatisfactory)</span>
                    <span>70 (Qualifying Threshold)</span>
                    <span>100 (Flawless Bid)</span>
                  </div>
                </div>

                <div>
                  <label className="form-label">Evaluation Recommendation Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="Recommended">Recommended for Financial Opening</option>
                    <option value="Under Review">Under Review / Clarification Requested</option>
                    <option value="Rejected">Rejected on Technical Grounds</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Evaluator Technical Remarks & Audit Findings</label>
                  <textarea
                    rows={5}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Enter detailed technical evaluation commentary, architectural compliance, and milestone capability..."
                    className="form-textarea"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ padding: '10px' }}
                >
                  <Save size={15} /> {saving ? 'Saving...' : 'Record Evaluation & Sign Technical Bid'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
