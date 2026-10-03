import React from 'react';
import { X, Users, ShieldCheck, Check, Ban, Lock } from 'lucide-react';

export default function RolesRightsModal({ onClose }) {
  const permissions = [
    { feature: 'Search, Filter & View Tenders', bidder: true, authority: true, admin: true, evaluator: true },
    { feature: 'One-Click Eligibility Checking', bidder: true, authority: false, admin: true, evaluator: true },
    { feature: 'Explainable AI Match Scoring', bidder: true, authority: false, admin: true, evaluator: false },
    { feature: 'Ask Your Tender AI (Grounded Q&A)', bidder: true, authority: true, admin: true, evaluator: true },
    { feature: 'Side-by-Side Tender Comparison', bidder: true, authority: true, admin: true, evaluator: true },
    { feature: 'Save / Bookmark & Team Notes', bidder: true, authority: false, admin: true, evaluator: false },
    { feature: 'Create & Publish Official Tenders', bidder: false, authority: true, admin: true, evaluator: false },
    { feature: 'Upload Official RFP & BOQ Documents', bidder: false, authority: true, admin: true, evaluator: false },
    { feature: 'Bulk CSV / Excel Tender Ingestion', bidder: false, authority: false, admin: true, evaluator: false },
    { feature: 'Authorize Tender Authority Accounts', bidder: false, authority: false, admin: true, evaluator: false },
    { feature: 'Submit Technical Bid Evaluations', bidder: false, authority: false, admin: true, evaluator: true },
    { feature: 'View Immutable Audit Ledger', bidder: false, authority: false, admin: true, evaluator: false }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08), #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#faf5ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>Role-Based Access Control (RBAC) Matrix</h2>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Strict Security Boundaries & Principle of Least Privilege
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: '0.8rem',
            color: '#475569',
            lineHeight: 1.5
          }}>
            🛡️ <strong>Core Security Rule (Section 4 & 26):</strong> Normal users and bidders can discover and analyze tenders, while official tender publication is strictly restricted to authorized Tender Authorities under Super Admin approval.
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>System Capability</th>
                <th style={{ textAlign: 'center', padding: '10px 14px' }}>Company / Bidder</th>
                <th style={{ textAlign: 'center', padding: '10px 14px' }}>Tender Authority</th>
                <th style={{ textAlign: 'center', padding: '10px 14px' }}>Super Admin</th>
                <th style={{ textAlign: 'center', padding: '10px 14px' }}>Evaluator</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{p.feature}</td>
                  <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                    {p.bidder ? <Check size={16} color="#16a34a" style={{ margin: '0 auto' }} /> : <Ban size={15} color="#cbd5e1" style={{ margin: '0 auto' }} />}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                    {p.authority ? <Check size={16} color="#16a34a" style={{ margin: '0 auto' }} /> : <Ban size={15} color="#cbd5e1" style={{ margin: '0 auto' }} />}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                    {p.admin ? <Check size={16} color="#16a34a" style={{ margin: '0 auto' }} /> : <Ban size={15} color="#cbd5e1" style={{ margin: '0 auto' }} />}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                    {p.evaluator ? <Check size={16} color="#16a34a" style={{ margin: '0 auto' }} /> : <Ban size={15} color="#cbd5e1" style={{ margin: '0 auto' }} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#f8fafc'
        }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
