import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  RefreshCw, 
  Building2, 
  ShieldCheck, 
  Send, 
  CircleCheck, 
  SlidersHorizontal 
} from 'lucide-react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export default function BidProposalGeneratorModal({ tender, onClose, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [proposalData, setProposalData] = useState(null);
  const [activeSection, setActiveSection] = useState('full'); // full, letter, summary, tech, compliance, commercial
  const [emphasis, setEmphasis] = useState('balanced'); // balanced, aggressive, conservative
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tender?.id) {
      fetchProposal(emphasis);
    }
  }, [tender?.id]);

  const fetchProposal = async (emp) => {
    setLoading(true);
    try {
      const res = await api.generateBidProposal(tender.id, emp);
      setProposalData(res.data);
    } catch (err) {
      console.error('Failed to generate proposal:', err);
      if (onShowToast) onShowToast('Failed to generate AI proposal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!proposalData) return;
    const textToCopy = activeSection === 'full' 
      ? proposalData.fullProposalText 
      : activeSection === 'letter' ? proposalData.sections.coveringLetter
      : activeSection === 'summary' ? proposalData.sections.executiveSummary
      : activeSection === 'tech' ? proposalData.sections.technicalArchitecture
      : activeSection === 'compliance' ? proposalData.sections.complianceMatrix
      : proposalData.sections.commercialPricing;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    if (onShowToast) onShowToast('Copied proposal text to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!proposalData) return;
    const element = document.createElement('a');
    const file = new Blob([proposalData.fullProposalText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Bid_Proposal_${tender.tender_reference_no.replace(/[/\\?%*:|"<>]/g, '_')}.doc`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    if (onShowToast) onShowToast('Downloaded Bid Proposal Document (.doc)');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 960, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
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
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(124, 58, 237, 0.4)'
            }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  AI Bid Proposal & Technical Document Drafter
                </h2>
                <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                  GPT-4 Powered
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                Auto-generated official RFP submission package for {tender.tender_reference_no}
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

        {/* Toolbar: Strategy focus and Section tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '8px 16px',
          flexWrap: 'wrap',
          gap: 10
        }}>
          {/* Section Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'full', label: '📄 Full Proposal' },
              { id: 'letter', label: '✉️ Covering Letter' },
              { id: 'summary', label: '📊 Executive Summary' },
              { id: 'tech', label: '🏗️ Technical Methodology' },
              { id: 'compliance', label: '📋 Compliance Matrix' },
              { id: 'commercial', label: '💰 Commercial Summary' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`btn btn-sm ${activeSection === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6 }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Strategy Emphasis Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>STRATEGY:</span>
            <select
              className="form-select"
              value={emphasis}
              onChange={e => {
                setEmphasis(e.target.value);
                fetchProposal(e.target.value);
              }}
              style={{ fontSize: '0.75rem', padding: '4px 8px', width: 140 }}
            >
              <option value="balanced">Balanced (Sweet Spot)</option>
              <option value="aggressive">Aggressive (Cost Lead)</option>
              <option value="conservative">Quality Focus (High Margin)</option>
            </select>
          </div>
        </div>

        {/* Body / Document Preview */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, background: '#f1f5f9' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: 12 }}>
                <Sparkles size={28} color="#7c3aed" />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                Analyzing Tender Specs & Drafting Bid Document...
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                Synthesizing technical scope, turnover declarations, compliance matrix, and official covering letter.
              </div>
            </div>
          ) : proposalData ? (
            <div style={{
              background: '#ffffff',
              padding: '28px 36px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1.6,
              fontSize: '0.88rem',
              color: '#1e293b',
              whiteSpace: 'pre-wrap',
              maxHeight: 520,
              overflowY: 'auto'
            }}>
              {activeSection === 'full' && proposalData.fullProposalText}
              {activeSection === 'letter' && proposalData.sections.coveringLetter}
              {activeSection === 'summary' && proposalData.sections.executiveSummary}
              {activeSection === 'tech' && proposalData.sections.technicalArchitecture}
              {activeSection === 'compliance' && proposalData.sections.complianceMatrix}
              {activeSection === 'commercial' && proposalData.sections.commercialPricing}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
              Failed to load proposal data.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
            >
              {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Section'}
            </button>

            <button
              onClick={handleDownload}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
            >
              <Download size={14} /> Download (.doc)
            </button>

            <button
              onClick={handlePrint}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
            >
              <Printer size={14} /> Print / PDF
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={() => fetchProposal(emphasis)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
            >
              <RefreshCw size={14} /> Regenerate
            </button>

            <button className="btn btn-primary" onClick={onClose}>
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
