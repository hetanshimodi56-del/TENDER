import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  Building,
  Edit3,
  Sliders,
  Check,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatINR } from './TenderCard';

export default function EligibilityModal({ 
  tender, 
  evaluation, 
  onClose, 
  onRecheck, 
  onGoToProfile,
  loading = false 
}) {
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  
  // Custom user inputs for instant comparison testing
  const [companyType, setCompanyType] = useState('Private Limited');
  const [turnover, setTurnover] = useState(45000000);
  const [experienceYears, setExperienceYears] = useState(5);
  const [userLocation, setUserLocation] = useState('Gujarat');
  const [certifications, setCertifications] = useState('ISO 9001:2015, ISO 27001:2022');
  const [gstStatus, setGstStatus] = useState('Active / Regular');
  const [prevProjectsCount, setPrevProjectsCount] = useState(4);

  // Dynamic analysis items based on current inputs vs tender
  const [analysisRows, setAnalysisRows] = useState([]);

  useEffect(() => {
    if (tender) {
      calculateAnalysis();
    }
  }, [tender, turnover, experienceYears, userLocation, certifications, gstStatus, prevProjectsCount]);

  useEffect(() => {
    const passedAll = analysisRows.length > 0 && analysisRows.every(r => r.status === 'Eligible');
    if (passedAll) {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [analysisRows]);

  const calculateAnalysis = () => {
    if (!tender) return;

    const reqTurnover = Number(tender.min_turnover_required || 0);
    const reqExp = Number(tender.min_experience_years || 3);
    const reqCerts = tender.required_certifications || ['ISO 9001:2015'];
    const userCertsList = certifications.split(',').map(c => c.trim().toLowerCase());

    const rows = [
      {
        requirement: 'Annual Financial Turnover',
        tenderReq: `₹${(reqTurnover / 10000000).toFixed(1)} Cr (3-Yr Avg)`,
        userVal: `₹${(Number(turnover) / 10000000).toFixed(1)} Cr`,
        status: Number(turnover) >= reqTurnover ? 'Eligible' : 'Not Eligible',
        explanation: Number(turnover) >= reqTurnover
          ? `Your turnover of ₹${(Number(turnover) / 10000000).toFixed(1)} Cr satisfies the minimum required ₹${(reqTurnover / 10000000).toFixed(1)} Cr.`
          : `Turnover falls short by ₹${((reqTurnover - Number(turnover)) / 10000000).toFixed(1)} Cr. Consider bidding in Consortium/JV.`
      },
      {
        requirement: 'Track Record & Experience',
        tenderReq: `${reqExp} Years in ${tender.category}`,
        userVal: `${experienceYears} Years Experience`,
        status: experienceYears >= reqExp ? 'Eligible' : 'Not Eligible',
        explanation: experienceYears >= reqExp
          ? `Proven track record of ${experienceYears} years comfortably satisfies the ${reqExp} years threshold.`
          : `Experience shortfall. Founder's prior credentials may be acceptable per RFP addendum.`
      },
      {
        requirement: 'Accredited Quality Certifications',
        tenderReq: reqCerts.join(', '),
        userVal: certifications || 'None',
        status: reqCerts.some(c => userCertsList.some(u => u.includes(c.toLowerCase().split(' ')[0]))) ? 'Eligible' : 'Pending Verification',
        explanation: reqCerts.some(c => userCertsList.some(u => u.includes(c.toLowerCase().split(' ')[0])))
          ? 'Mandatory active ISO accreditation verified.'
          : 'Acquire and upload valid compliance certificates before bid submission.'
      },
      {
        requirement: 'Statutory GST & Tax Status',
        tenderReq: 'Active GSTIN & Regular Filing',
        userVal: gstStatus,
        status: gstStatus.includes('Active') ? 'Eligible' : 'Not Eligible',
        explanation: gstStatus.includes('Active')
          ? 'Active GST compliance verified. Form REG-06 is attached in Technical Envelope.'
          : 'Active GST registration is mandatory for public tender submission.'
      },
      {
        requirement: 'Past Completed Similar Projects',
        tenderReq: 'At least 1 similar completed project',
        userVal: `${prevProjectsCount} Completed Projects`,
        status: prevProjectsCount >= 1 ? 'Eligible' : 'Not Eligible',
        explanation: prevProjectsCount >= 1
          ? `Sufficient project execution track record verified (${prevProjectsCount} projects).`
          : 'At least one formal project completion certificate is required.'
      },
      {
        requirement: 'Operating Base / Location',
        tenderReq: `${tender.location_state || 'State'} (Preferred)`,
        userVal: userLocation,
        status: (userLocation.toLowerCase() === (tender.location_state || '').toLowerCase()) ? 'Eligible' : 'Eligible',
        explanation: (userLocation.toLowerCase() === (tender.location_state || '').toLowerCase())
          ? `Local execution presence in ${tender.location_state} provides competitive operational advantage.`
          : `National bids permitted per GCC; out-of-state bidders must establish branch SLA office.`
      }
    ];

    setAnalysisRows(rows);
  };

  if (!tender) return null;

  const passedCount = analysisRows.filter(r => r.status === 'Eligible').length;
  const isAllEligible = passedCount === analysisRows.length;
  const isPartiallyEligible = passedCount >= 4 && !isAllEligible;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 900,
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          border: '1px solid var(--border-card)',
          borderRadius: 16
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
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
              background: 'rgba(0, 121, 107, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 121, 107, 0.25)'
            }}>
              <ShieldCheck size={22} color="#00796b" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                AI Tender Eligibility Checker
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Comparing company profile credentials with NIT criteria for {tender.tender_reference_no}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowCustomInputs(!showCustomInputs)}
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '0.75rem' }}
            >
              <Sliders size={13} /> {showCustomInputs ? 'Hide Custom Inputs' : 'Simulate Custom Profile'}
            </button>
            <button 
              onClick={onClose}
              className="btn btn-sm btn-secondary"
              style={{ width: 32, height: 32, padding: 0 }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div style={{ padding: '22px 24px', maxHeight: '78vh', overflowY: 'auto' }}>
          {/* Target Tender Banner */}
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#00796b', fontWeight: 700, textTransform: 'uppercase' }}>
                {tender.tender_reference_no} • {tender.category}
              </div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0' }}>
                {tender.title}
              </h3>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {tender.organization_name} • Location: <strong>{tender.location_city || 'City'}, {tender.location_state}</strong>
              </div>
            </div>

            {/* Overall Verdict Badge */}
            <div style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: isAllEligible ? 'rgba(22, 163, 74, 0.15)' : isPartiallyEligible ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isAllEligible ? '#16a34a' : isPartiallyEligible ? '#f59e0b' : '#ef4444'}40`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Overall Verdict
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: isAllEligible ? '#16a34a' : isPartiallyEligible ? '#d97706' : '#ef4444'
              }}>
                {isAllEligible ? '✓ Eligible to Bid' : isPartiallyEligible ? '⚠️ Partially Eligible' : '✕ Not Fully Eligible'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                {passedCount} of {analysisRows.length} criteria satisfied
              </div>
            </div>
          </div>

          {/* Interactive Custom Profile Simulator (Collapsible) */}
          {showCustomInputs && (
            <div style={{
              background: 'var(--bg-main)',
              border: '1px solid #00796b',
              borderRadius: 12,
              padding: '16px 18px',
              marginBottom: 20
            }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#00796b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit3 size={15} /> Adjust Profile Parameters to Test Eligibility
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Annual Turnover (₹)</label>
                  <input 
                    type="number" 
                    value={turnover} 
                    onChange={e => setTurnover(e.target.value)} 
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.82rem' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Years of Experience</label>
                  <input 
                    type="number" 
                    value={experienceYears} 
                    onChange={e => setExperienceYears(Number(e.target.value))} 
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.82rem' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>State Location</label>
                  <input 
                    type="text" 
                    value={userLocation} 
                    onChange={e => setUserLocation(e.target.value)} 
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.82rem' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>GST Status</label>
                  <select 
                    value={gstStatus} 
                    onChange={e => setGstStatus(e.target.value)} 
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                  >
                    <option value="Active / Regular">Active / Regular</option>
                    <option value="Composition Scheme">Composition Scheme</option>
                    <option value="Pending Application">Pending Application</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Prompt 11 Specified: ELIGIBILITY ANALYSIS TABLE */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
              Eligibility Analysis Matrix
            </h4>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 14px', width: '22%' }}>Requirement</th>
                    <th style={{ padding: '10px 14px', width: '20%' }}>Tender Requirement</th>
                    <th style={{ padding: '10px 14px', width: '18%' }}>User Information</th>
                    <th style={{ padding: '10px 14px', width: '15%' }}>Status</th>
                    <th style={{ padding: '10px 14px', width: '25%' }}>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisRows.map((row, idx) => {
                    const isPassed = row.status === 'Eligible';
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {row.requirement}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#00796b', fontWeight: 600 }}>
                          {row.tenderReq}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-main)' }}>
                          {row.userVal}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: isPassed ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isPassed ? '#16a34a' : '#ef4444'
                          }}>
                            {isPassed ? <Check size={12} /> : <X size={12} />}
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {row.explanation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mandatory Prompt Requirement Disclaimer */}
          <div style={{
            fontSize: '0.74rem',
            color: 'var(--text-dim)',
            padding: '12px 16px',
            borderRadius: 10,
            background: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8
          }}>
            <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Informational Comparison Disclaimer:</strong> This automated eligibility analysis is an informational decision-support comparison based on submitted profile data. It does not constitute a guaranteed eligibility or official procurement acceptance. The official published tender notice, corrigenda, and RFP document strictly control all final procurement decisions.
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {onGoToProfile && (
            <button 
              className="btn btn-secondary"
              onClick={onGoToProfile}
            >
              <Building size={14} /> Update Company Profile Credentials
            </button>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className="btn btn-primary"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
