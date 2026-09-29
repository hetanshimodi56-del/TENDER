import React from 'react';
import { 
  X, 
  Scale, 
  Download, 
  Building2, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { formatINR } from './TenderCard';

export default function TenderComparisonModal({ tenders = [], onClose, onRemoveFromCompare }) {
  if (!tenders || tenders.length === 0) return null;

  const handleExport = () => {
    let csvContent = 'Parameter,' + tenders.map(t => `"${t.title.replace(/"/g, '""')}"`).join(',') + '\n';
    csvContent += 'Reference No,' + tenders.map(t => `"${t.reference_no}"`).join(',') + '\n';
    csvContent += 'Organization,' + tenders.map(t => `"${t.organization}"`).join(',') + '\n';
    csvContent += 'Category,' + tenders.map(t => `"${t.category}"`).join(',') + '\n';
    csvContent += 'Location,' + tenders.map(t => `"${t.location}"`).join(',') + '\n';
    csvContent += 'Estimated Value,' + tenders.map(t => formatINR(t.estimated_value)).join(',') + '\n';
    csvContent += 'EMD Amount,' + tenders.map(t => formatINR(t.emd_amount)).join(',') + '\n';
    csvContent += 'Tender Fee,' + tenders.map(t => `₹${t.tender_fee}`).join(',') + '\n';
    csvContent += 'Submission Deadline,' + tenders.map(t => new Date(t.closing_date).toLocaleDateString()).join(',') + '\n';
    csvContent += 'Min Turnover,' + tenders.map(t => formatINR(t.min_turnover_required)).join(',') + '\n';
    csvContent += 'Min Experience,' + tenders.map(t => `${t.min_experience_years} Years`).join(',') + '\n';
    csvContent += 'AI Match Score,' + tenders.map(t => `${t.ai_match_score}%`).join(',') + '\n';
    csvContent += 'Eligibility Status,' + tenders.map(t => t.eligibility_status).join(',') + '\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tender_Comparison_Matrix_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 1100, maxHeight: '90vh' }}>
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
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#e6f4f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Scale size={18} color="#00796b" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Side-by-Side Tender Comparison</h2>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Comparing {tenders.length} opportunities across financial, eligibility and match parameters
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-sm btn-secondary" onClick={handleExport}>
              <Download size={14} /> Export Matrix (CSV)
            </button>
            <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569', width: 220, fontWeight: 700 }}>
                  Attribute
                </th>
                {tenders.map(t => (
                  <th key={t.id} style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', minWidth: 240 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: 700 }}>
                          {t.reference_no}
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: 2, lineHeight: 1.3 }}>
                          {t.title}
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveFromCompare(t.id)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                        title="Remove from comparison"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Organization */}
              <tr>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  Procuring Agency
                </td>
                {tenders.map(t => (
                  <td key={t.id} style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>
                    {t.organization}
                  </td>
                ))}
              </tr>

              {/* Estimated Value */}
              <tr>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  Estimated Project Value
                </td>
                {tenders.map(t => (
                  <td key={t.id} style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#00796b', fontWeight: 800, fontSize: '0.95rem' }}>
                    {formatINR(t.estimated_value)}
                  </td>
                ))}
              </tr>

              {/* EMD & Fee */}
              <tr>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  EMD / Tender Fee
                </td>
                {tenders.map(t => (
                  <td key={t.id} style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>
                    <strong>{formatINR(t.emd_amount)}</strong> <span style={{ color: '#64748b' }}>(Fee: ₹{t.tender_fee})</span>
                  </td>
                ))}
              </tr>

              {/* Submission Deadline */}
              <tr>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  Submission Deadline
                </td>
                {tenders.map(t => (
                  <td key={t.id} style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#d97706', fontWeight: 600 }}>
                    {new Date(t.closing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                ))}
              </tr>

              {/* AI Match Score */}
              <tr>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  Explainable AI Match
                </td>
                {tenders.map(t => (
                  <td key={t.id} style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0' }}>
                    <span className={`badge ${t.ai_match_score >= 80 ? 'badge-green' : (t.ai_match_score >= 60 ? 'badge-yellow' : 'badge-gray')}`}>
                      <Sparkles size={12} /> {t.ai_match_score}% Match
                    </span>
                  </td>
                ))}
              </tr>

              {/* Eligibility Status */}
              <tr>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  Eligibility Evaluation
                </td>
                {tenders.map(t => (
                  <td key={t.id} style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0' }}>
                    <span className={`badge ${t.eligibility_status === 'Eligible' ? 'badge-green' : (t.eligibility_status === 'Partially Eligible' ? 'badge-yellow' : 'badge-red')}`}>
                      {t.eligibility_status}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Minimum Turnover Required */}
              <tr>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  Minimum Turnover
                </td>
                {tenders.map(t => (
                  <td key={t.id} style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>
                    {formatINR(t.min_turnover_required)}
                  </td>
                ))}
              </tr>

              {/* Minimum Experience */}
              <tr>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  Min Experience
                </td>
                {tenders.map(t => (
                  <td key={t.id} style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>
                    {t.min_experience_years} Years
                  </td>
                ))}
              </tr>

              {/* Certifications */}
              <tr>
                <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>
                  Mandatory Certifications
                </td>
                {tenders.map(t => (
                  <td key={t.id} style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(t.required_certifications || []).map((c, ci) => (
                        <span key={ci} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button className="btn btn-primary" onClick={onClose}>
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
