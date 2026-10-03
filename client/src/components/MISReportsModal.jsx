import React from 'react';
import { X, BarChart3, Download, TrendingUp, PieChart, FileText, CircleCheck } from 'lucide-react';
import { formatINR } from './TenderCard';

export default function MISReportsModal({ onClose }) {
  const reportData = [
    { category: 'Information Technology', tenders: 3, totalValue: 652000000, avgTurnover: 150000000, winRate: '68%' },
    { category: 'Civil Works & Construction', tenders: 1, totalValue: 1200000000, avgTurnover: 800000000, winRate: '45%' },
    { category: 'Healthcare & Medical Equipment', tenders: 2, totalValue: 203000000, avgTurnover: 82500000, winRate: '74%' },
    { category: 'Renewable Energy', tenders: 1, totalValue: 350000000, avgTurnover: 250000000, winRate: '60%' },
    { category: 'Electronics & Hardware', tenders: 1, totalValue: 45000000, avgTurnover: 30000000, winRate: '82%' }
  ];

  const handleExportCSV = () => {
    let csv = 'Procurement Category,Tenders Count,Total Estimated Value,Average Min Turnover,Historical Win Rate\n';
    reportData.forEach(r => {
      csv += `"${r.category}",${r.tenders},${r.totalValue},${r.avgTurnover},"${r.winRate}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MIS_Procurement_Report_${Date.now()}.csv`;
    link.click();
  };

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
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>Management Information System (MIS) & Reports</h2>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Executive Procurement Analytics, Win-Rate Trends & Capital Allocations
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Top KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Total Pipeline Value</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00796b', marginTop: 2 }}>₹245.00 Cr</div>
              <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>Across 8 State Departments</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Average Bid Win Probability</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366f1', marginTop: 2 }}>71.4%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>AI-Matched Opportunities</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>EMD Liquidity Ratio</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>2.08%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Bank Guarantees Deployed</div>
            </div>
          </div>

          {/* Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Category Sector</th>
                  <th style={{ textAlign: 'center', padding: '10px 14px' }}>Active Bids</th>
                  <th style={{ textAlign: 'right', padding: '10px 14px' }}>Cumulative Value</th>
                  <th style={{ textAlign: 'right', padding: '10px 14px' }}>Avg Min Turnover</th>
                  <th style={{ textAlign: 'center', padding: '10px 14px' }}>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{row.category}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#334155' }}>{row.tenders}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#00796b', fontWeight: 700 }}>
                      {formatINR(row.totalValue)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>
                      {formatINR(row.avgTurnover)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span className="badge badge-green">{row.winRate}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={15} /> Export MIS Report (.CSV)
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
