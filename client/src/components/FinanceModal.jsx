import React, { useState } from 'react';
import { X, CreditCard, IndianRupee, ShieldCheck, Clock, CheckCircle2, Download } from 'lucide-react';
import { formatINR } from './TenderCard';

export default function FinanceModal({ onClose }) {
  const [emds, setEmds] = useState([
    {
      id: 'bg_01',
      tender_ref: 'GUDM/ITMS/2026/04',
      bank: 'State Bank of India (SBI)',
      bg_number: 'BG-SBI-AHM-2026-991',
      amount: 9000000,
      fee: 25000,
      issue_date: '2026-09-15',
      expiry_date: '2027-03-15',
      status: 'Active (Under Bidding)'
    },
    {
      id: 'bg_02',
      tender_ref: 'BEL/ERP-CLOUD/2026/09',
      bank: 'HDFC Bank Ltd',
      bg_number: 'BG-HDFC-BLR-2026-412',
      amount: 2400000,
      fee: 10000,
      issue_date: '2026-09-12',
      expiry_date: '2027-03-12',
      status: 'Active (Under Bidding)'
    },
    {
      id: 'bg_03',
      tender_ref: 'REBIT/CYBER/SOC/2026/05',
      bank: 'ICICI Bank Ltd',
      bg_number: 'BG-ICICI-MUM-2026-108',
      amount: 1640000,
      fee: 10000,
      issue_date: '2026-09-10',
      expiry_date: '2027-03-10',
      status: 'Active (Under Bidding)'
    },
    {
      id: 'bg_04',
      tender_ref: 'GUJ/MED/GAS-MGPS/2026/03',
      bank: 'Bank of Baroda',
      bg_number: 'BG-BOB-GND-2026-055',
      amount: 360000,
      fee: 5000,
      issue_date: '2026-08-20',
      expiry_date: '2027-02-20',
      status: 'Released / Refunded'
    }
  ]);

  const totalCommittedEMD = emds
    .filter(e => e.status.includes('Active'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalFeesPaid = emds.reduce((acc, curr) => acc + curr.fee, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>Finance & EMD Bank Guarantee Management</h2>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Track Earnest Money Deposits, Tender Document Fees & Release Cycles
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Active EMD Guarantees</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00796b', marginTop: 2 }}>
                {formatINR(totalCommittedEMD)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>3 Active Bank Guarantees</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Tender Processing Fees</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', marginTop: 2 }}>
                ₹{totalFeesPaid.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Non-Refundable Treasury Payments</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Bank Guarantee Facility Limit</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
                ₹25.00 Cr
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Sanctioned SBI Working Capital</div>
            </div>
          </div>

          {/* Ledger Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Tender Ref</th>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Issuing Bank & BG No</th>
                <th style={{ textAlign: 'right', padding: '10px 14px' }}>EMD Amount</th>
                <th style={{ textAlign: 'center', padding: '10px 14px' }}>Validity</th>
                <th style={{ textAlign: 'right', padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {emds.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                    {e.tender_ref}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ color: '#0f172a', fontWeight: 600 }}>{e.bank}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{e.bg_number}</div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#00796b', fontWeight: 700 }}>
                    {formatINR(e.amount)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b' }}>
                    {new Date(e.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <span className={`badge ${e.status.includes('Active') ? 'badge-green' : 'badge-gray'}`}>
                      {e.status}
                    </span>
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
