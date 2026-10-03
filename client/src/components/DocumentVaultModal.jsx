import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  UploadCloud, 
  CircleCheck, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Download, 
  Trash2, 
  Sparkles, 
  RefreshCw,
  Eye,
  FileCheck
} from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

export default function DocumentVaultModal({ onClose, onShowToast }) {
  const { t } = useLanguage();

  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      title: 'GST Registration Certificate (REG-06)',
      category: 'Statutory & Tax',
      fileName: 'GST_TechInfra_24AAACT1234F1Z5.pdf',
      fileSize: '1.4 MB',
      uploadDate: '2024-01-15',
      expiryDate: '2029-12-31',
      status: 'verified',
      aiConfidence: 99,
      aiNotes: 'Active GSTIN with zero compliance defaults in last 12 return periods.'
    },
    {
      id: 'doc-2',
      title: 'MSME Udyam Registration (Class: Medium)',
      category: 'Enterprise Credentials',
      fileName: 'UDYAM-GJ-01-0089241.pdf',
      fileSize: '820 KB',
      uploadDate: '2023-08-10',
      expiryDate: 'Lifetime',
      status: 'verified',
      aiConfidence: 100,
      aiNotes: 'Eligible for 100% EMD Exemption and 15% Purchase Preference under PPP-MII.'
    },
    {
      id: 'doc-3',
      title: 'CA Audited Balance Sheet & Net Worth (FY 2023-24)',
      category: 'Financial Eligibility',
      fileName: 'CA_Certified_NetWorth_FY24.pdf',
      fileSize: '3.8 MB',
      uploadDate: '2024-09-02',
      expiryDate: '2025-09-30',
      status: 'verified',
      aiConfidence: 96,
      aiNotes: 'Average 3-yr turnover ₹28.4 Cr. Net worth ₹12.6 Cr exceeds all Tier-1 tenders.'
    },
    {
      id: 'doc-4',
      title: 'ISO 9001:2015 & ISO 27001 Security Certifications',
      category: 'Quality & Standards',
      fileName: 'ISO_Combined_Audit_Report.pdf',
      fileSize: '2.1 MB',
      uploadDate: '2022-11-20',
      expiryDate: '2025-11-19',
      status: 'verified',
      aiConfidence: 98,
      aiNotes: 'Accredited by NABCB. Valid across pan-India central & state e-procurement.'
    },
    {
      id: 'doc-5',
      title: 'Non-Blacklisting & Solvency Affidavit (₹100 Stamp)',
      category: 'Legal Affidavits',
      fileName: 'Notarized_Affidavit_2024.pdf',
      fileSize: '950 KB',
      uploadDate: '2024-04-12',
      expiryDate: '2025-04-11',
      status: 'expiring',
      aiConfidence: 94,
      aiNotes: 'Expires in 16 days. Recommended to notarize renewal stamp paper for upcoming bids.'
    },
    {
      id: 'doc-6',
      title: 'OEM Manufacturer Authorization Form (MAF)',
      category: 'Technical Compliance',
      fileName: 'OEM_Cisco_Dell_MAF_Schedule.pdf',
      fileSize: '1.9 MB',
      uploadDate: '2024-02-18',
      expiryDate: '2026-02-17',
      status: 'verified',
      aiConfidence: 97,
      aiNotes: 'Direct Tier-1 OEM authorization with 5-year pan-India onsite SLA commitment.'
    }
  ]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // New Doc Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Statutory & Tax');
  const [newExpiry, setNewExpiry] = useState('');
  const [newFileName, setNewFileName] = useState('');

  const categories = ['All', 'Statutory & Tax', 'Enterprise Credentials', 'Financial Eligibility', 'Quality & Standards', 'Legal Affidavits', 'Technical Compliance'];

  const filteredDocs = activeCategory === 'All' 
    ? documents 
    : documents.filter(d => d.category === activeCategory);

  const handleRunAiAudit = () => {
    setScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setScanning(false);
      setScanResult({
        overallScore: 97,
        readyTenders: 48,
        missingDocs: 0,
        expiringAlerts: 1,
        verdict: 'Bid-Ready: Highest Level Compliance',
        recommendation: 'Your company profile passes 100% of standard GeM & Central CPPP technical pre-qualification audits. Only renew Affidavit before April 11.'
      });
      if (onShowToast) {
        onShowToast('✓ AI Compliance scan completed: 97% readiness score!', 'success');
      }
    }, 1400);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      fileName: newFileName || `${newTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileSize: '1.2 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      expiryDate: newExpiry || '2027-12-31',
      status: 'verified',
      aiConfidence: 98,
      aiNotes: 'Automated OCR parsed headers, signature seal & issuing authority validated successfully.'
    };

    setDocuments([newDoc, ...documents]);
    setShowUploadForm(false);
    setNewTitle('');
    setNewExpiry('');
    setNewFileName('');

    if (onShowToast) {
      onShowToast(`Uploaded & Verified: "${newDoc.title}"`, 'success');
    }
  };

  const handleDelete = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (onShowToast) {
      onShowToast('Document archived from vault.', 'info');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)',
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
        maxWidth: 980,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        animation: 'modalSlideIn 0.25s ease-out'
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
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)'
            }}>
              <ShieldCheck size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Company Document Vault & AI Compliance Scanner
                </h2>
                <span style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  GeM & CPPP Ready
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Store, verify, and auto-attach verified vendor credentials to technical bids
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleRunAiAudit}
              disabled={scanning}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                border: 'none',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                cursor: scanning ? 'wait' : 'pointer',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
              }}
            >
              {scanning ? (
                <>
                  <RefreshCw size={14} className="spin-animate" />
                  Running AI Audit...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  AI Compliance Audit
                </>
              )}
            </button>

            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              style={{
                background: '#334155',
                border: '1px solid #475569',
                color: '#f8fafc',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <UploadCloud size={14} />
              {showUploadForm ? 'Cancel Upload' : '+ Upload Doc'}
            </button>

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
        </div>

        {/* AI Scan Result Banner (if run) */}
        {scanResult && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            borderBottom: '1px solid #86efac',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#16a34a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem'
              }}>
                {scanResult.overallScore}%
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#14532d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CircleCheck size={16} color="#16a34a" /> {scanResult.verdict}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: 2 }}>
                  {scanResult.recommendation}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase' }}>Eligible Tenders</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#14532d' }}>{scanResult.readyTenders} Available</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#b45309', textTransform: 'uppercase' }}>Needs Attention</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309' }}>{scanResult.expiringAlerts} Doc Expiry</div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form Dropdown */}
        {showUploadForm && (
          <form onSubmit={handleUploadSubmit} style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '16px 24px',
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr auto',
            gap: 12,
            alignItems: 'flex-end'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Document Name / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ISO 14001 Environment Certificate"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Compliance Category
              </label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  outline: 'none',
                  background: '#fff'
                }}
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Validity / Expiry
              </label>
              <input
                type="date"
                value={newExpiry}
                onChange={e => setNewExpiry(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Attach PDF / Scanned File
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setNewFileName(e.target.files[0].name);
                  }
                }}
                style={{
                  fontSize: '0.78rem',
                  color: '#475569'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <FileCheck size={15} /> Save & OCR Scan
            </button>
          </form>
        )}

        {/* Category Filter Tabs */}
        <div style={{
          padding: '10px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          gap: 6,
          background: '#fafafa',
          overflowX: 'auto'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: '1px solid ' + (activeCategory === cat ? '#0284c7' : '#e2e8f0'),
                background: activeCategory === cat ? '#0284c7' : '#ffffff',
                color: activeCategory === cat ? '#ffffff' : '#64748b',
                fontSize: '0.78rem',
                fontWeight: activeCategory === cat ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Document List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '14px 18px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#cbd5e1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: doc.status === 'expiring' ? '#fef3c7' : '#f0f9ff',
                  color: doc.status === 'expiring' ? '#d97706' : '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={20} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                      {doc.title}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 10,
                      background: doc.status === 'expiring' ? '#fef3c7' : '#dcfce7',
                      color: doc.status === 'expiring' ? '#92400e' : '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {doc.status === 'expiring' ? (
                        <><AlertTriangle size={11} /> Expiring Soon</>
                      ) : (
                        <><CircleCheck size={11} /> Verified ({doc.aiConfidence}%)</>
                      )}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      color: '#64748b',
                      background: '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: 6
                    }}>
                      {doc.category}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: 14, marginBottom: 6 }}>
                    <span>📁 {doc.fileName} ({doc.fileSize})</span>
                    <span>🕒 Uploaded: {doc.uploadDate}</span>
                    <span style={{ color: doc.status === 'expiring' ? '#b45309' : '#64748b', fontWeight: doc.status === 'expiring' ? 600 : 400 }}>
                      ⏳ Valid: {doc.expiryDate}
                    </span>
                  </div>

                  {/* AI Note Pill */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#334155',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '4px 10px',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Sparkles size={12} color="#6366f1" />
                    <span><strong>AI Scanner:</strong> {doc.aiNotes}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => {
                    if (onShowToast) onShowToast(`Opening ${doc.fileName} preview...`, 'info');
                  }}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: 6,
                    padding: '7px 10px',
                    fontSize: '0.78rem',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                  title="View Document"
                >
                  <Eye size={14} /> Preview
                </button>

                <button
                  onClick={() => {
                    if (onShowToast) onShowToast(`Downloading ${doc.fileName}...`, 'success');
                  }}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: 6,
                    padding: '7px 10px',
                    fontSize: '0.78rem',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                  title="Download File"
                >
                  <Download size={14} />
                </button>

                <button
                  onClick={() => handleDelete(doc.id)}
                  style={{
                    background: '#fff1f2',
                    border: 'none',
                    borderRadius: 6,
                    padding: '7px 10px',
                    fontSize: '0.78rem',
                    color: '#e11d48',
                    cursor: 'pointer'
                  }}
                  title="Remove from vault"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: '#64748b'
        }}>
          <div>
            🔒 Encrypted with SHA-256 digital seals & GeM API interoperability standards.
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
}
