import React, { useState, useEffect } from 'react';
import { 
  X, 
  FilePlus, 
  Building2, 
  MapPin, 
  IndianRupee, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  CircleCheck, 
  CircleAlert,
  CircleHelp,
  ChevronRight,
  ChevronLeft,
  Upload
} from 'lucide-react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export default function AddTenderModal({ onClose, onTenderCreated, user, onShowToast }) {
  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [refNo, setRefNo] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orgName, setOrgName] = useState(user?.organization_name || 'Gujarat Urban Development Mission (GUDM)');
  const [category, setCategory] = useState('Information Technology');
  const [industry, setIndustry] = useState('Smart Infrastructure');
  const [state, setState] = useState('Gujarat');
  const [city, setCity] = useState('Gandhinagar');
  
  // Financials
  const [estimatedValue, setEstimatedValue] = useState(35000000); // 3.5 Cr
  const [emdAmount, setEmdAmount] = useState(700000); // 7 Lakhs (2%)
  const [tenderFee, setTenderFee] = useState(5000);
  const [closingDate, setClosingDate] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  
  // Eligibility
  const [minTurnover, setMinTurnover] = useState(25000000); // 2.5 Cr
  const [minExperience, setMinExperience] = useState(3);
  const [certificationsText, setCertificationsText] = useState('ISO 9001:2015, ISO 27001:2022, CMMI Level 3');
  const [documentsText, setDocumentsText] = useState('Technical Bid Proposal, CA Audited Balance Sheets, EMD Guarantee, OEM MAF, GST Certificate');
  const [clausesText, setClausesText] = useState('Liquidated damages of 0.5% per week of delay up to a max cap of 10% contract value.');
  const [status, setStatus] = useState('published'); // published or draft

  useEffect(() => {
    // Generate default ref number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setRefNo(`GEM/2026/B/${randomNum}`);

    // Default dates: closing in 21 days, opening in 22 days
    const dClose = new Date(Date.now() + 21 * 86400000);
    setClosingDate(dClose.toISOString().split('T')[0]);
    const dOpen = new Date(Date.now() + 22 * 86400000);
    setOpeningDate(dOpen.toISOString().split('T')[0]);
  }, []);

  const handleCalcEmd = () => {
    const val = Number(estimatedValue) || 0;
    const emd = Math.round(val * 0.02);
    setEmdAmount(emd);
    if (onShowToast) onShowToast('Auto-calculated EMD as standard 2% of contract value');
  };

  const handleGenerateRef = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setRefNo(`TND/GOV/2026/${randomNum}`);
  };

  const handleSubmit = async (publishStatus = status) => {
    setErrorMsg('');
    if (!refNo.trim() || !title.trim() || !estimatedValue || !closingDate) {
      setErrorMsg('Please complete all mandatory fields (Reference No, Title, Estimated Value, Closing Date).');
      setActiveStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tender_reference_no: refNo.trim(),
        title: title.trim(),
        description: description.trim() || title.trim(),
        organization_name: orgName.trim(),
        category,
        industry,
        location_state: state,
        location_city: city,
        estimated_value: Number(estimatedValue),
        emd_amount: Number(emdAmount),
        tender_fee: Number(tenderFee),
        closing_date: new Date(closingDate).toISOString(),
        opening_date: new Date(openingDate || closingDate).toISOString(),
        min_turnover_required: Number(minTurnover || 0),
        min_experience_years: Number(minExperience || 0),
        required_certifications: certificationsText.split(',').map(s => s.trim()).filter(Boolean),
        required_documents: documentsText.split(',').map(s => s.trim()).filter(Boolean),
        clauses_summary: [clausesText],
        status: publishStatus
      };

      const res = await api.createTender(payload);
      
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (onShowToast) {
        onShowToast(`🎉 Tender ${payload.tender_reference_no} published successfully!`, 'success');
      }

      if (onTenderCreated) {
        onTenderCreated(res.tender);
      }
      onClose();
    } catch (err) {
      console.error('Error creating tender:', err);
      setErrorMsg(err.message || 'Failed to publish tender. Please check details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 840, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Top Header */}
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
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(79, 70, 229, 0.4)'
            }}>
              <FilePlus size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Add New Tender Opportunity
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                Publish a new official procurement tender or upload RFP details into BidSphere
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

        {/* Wizard Steps Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          {[
            { step: 1, title: '1. Basic Details', desc: 'Reference & Authority' },
            { step: 2, title: '2. Financials & Dates', desc: 'Value, EMD, Deadlines' },
            { step: 3, title: '3. Eligibility & Documents', desc: 'Turnover & Checklists' }
          ].map(s => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeStep === s.step ? '#ffffff' : 'transparent',
                border: 'none',
                borderBottom: activeStep === s.step ? '2px solid #4f46e5' : '2px solid transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: activeStep === s.step ? '#4f46e5' : '#475569'
              }}>
                {s.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {s.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            margin: '16px 24px 0',
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#b91c1c',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CircleAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body / Steps Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: Basic Details */}
          {activeStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Tender Reference Number *
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="form-input"
                      value={refNo}
                      onChange={e => setRefNo(e.target.value)}
                      placeholder="e.g. GEM/2026/B/89421"
                      style={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={handleGenerateRef}
                      title="Generate Reference"
                    >
                      <Sparkles size={14} /> Auto
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Initial Status
                  </label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="published">🟢 Published (Live)</option>
                    <option value="draft">🟡 Draft (Save only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Tender Title / Procurement Work *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Implementation of AI-Powered CCTV Surveillance and Edge Computing Cluster"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Issuing Authority / Department *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="e.g. Gujarat Urban Development Mission"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Category *
                  </label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="Information Technology">Information Technology</option>
                    <option value="Civil Works & Highways">Civil Works & Highways</option>
                    <option value="Renewable Energy & Solar">Renewable Energy & Solar</option>
                    <option value="Healthcare & Maintenance">Healthcare & Maintenance</option>
                    <option value="Telecom & Surveillance">Telecom & Surveillance</option>
                    <option value="Electrical & Power Systems">Electrical & Power Systems</option>
                    <option value="Urban Mobility & Logistics">Urban Mobility & Logistics</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    placeholder="e.g. Smart Infrastructure"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    State / Region *
                  </label>
                  <select
                    className="form-select"
                    value={state}
                    onChange={e => setState(e.target.value)}
                  >
                    <option value="Gujarat">Gujarat</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Pan-India">Pan-India</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    City / Location
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Gandhinagar"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Project Description & Work Scope
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide scope of supply, installation, commissioning, maintenance SLA, and high-level requirements..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: Financials & Dates */}
          {activeStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Estimated Tender Value (₹ INR) *
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={estimatedValue}
                    onChange={e => setEstimatedValue(e.target.value)}
                    placeholder="e.g. 25000000"
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                    Equivalent: ₹{(Number(estimatedValue) / 10000000).toFixed(2)} Crores
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      EMD Amount (₹ INR) *
                    </label>
                    <button
                      type="button"
                      onClick={handleCalcEmd}
                      style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ⚡ Auto 2%
                    </button>
                  </div>
                  <input
                    type="number"
                    className="form-input"
                    value={emdAmount}
                    onChange={e => setEmdAmount(e.target.value)}
                    placeholder="e.g. 500000"
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                    Equivalent: ₹{(Number(emdAmount) / 100000).toFixed(2)} Lakhs
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Tender Document Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={tenderFee}
                    onChange={e => setTenderFee(e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Submission Deadline (Closing Date) *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={closingDate}
                    onChange={e => setClosingDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Technical Bid Opening Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={openingDate}
                    onChange={e => setOpeningDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick Preview Callout */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '14px 18px',
                display: 'flex',
                gap: 24,
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>VALUE</div>
                  <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>₹{(Number(estimatedValue) || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>EMD GUARANTEE</div>
                  <strong style={{ color: '#0284c7', fontSize: '0.95rem' }}>₹{(Number(emdAmount) || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>CLOSING DEADLINE</div>
                  <strong style={{ color: '#d97706', fontSize: '0.95rem' }}>{closingDate ? new Date(closingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Eligibility & Documents */}
          {activeStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Min Average Annual Turnover (₹ INR)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={minTurnover}
                    onChange={e => setMinTurnover(e.target.value)}
                    placeholder="e.g. 15000000"
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                    ₹{(Number(minTurnover) / 10000000).toFixed(2)} Crores required in past 3 FYs
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Min Years of Experience Required
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={minExperience}
                    onChange={e => setMinExperience(e.target.value)}
                    placeholder="e.g. 3"
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                    Years in relevant government/private works
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Required Certifications (comma separated)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={certificationsText}
                  onChange={e => setCertificationsText(e.target.value)}
                  placeholder="e.g. ISO 9001:2015, ISO 27001:2022, CMMI Level 3"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Mandatory Submission Documents (comma separated)
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={documentsText}
                  onChange={e => setDocumentsText(e.target.value)}
                  placeholder="e.g. Technical Proposal, Audited Balance Sheets, EMD BG, OEM MAF"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Key Contract Penalty / SLA Clauses
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={clausesText}
                  onChange={e => setClausesText(e.target.value)}
                  placeholder="e.g. Liquidated damages of 0.5% per week of delay up to a max cap of 10% contract value."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {activeStep > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveStep(activeStep - 1)}
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {activeStep < 3 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveStep(activeStep + 1)}
              >
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={submitting}
                  onClick={() => handleSubmit('draft')}
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submitting}
                  onClick={() => handleSubmit('published')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {submitting ? 'Publishing...' : '🚀 Publish Tender Now'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
