import { formatINR } from '../components/TenderCard';

export function downloadTenderRFP(tender) {
  const content = `================================================================================
                    OFFICIAL E-PROCUREMENT TENDER NOTICE
================================================================================
GOVERNMENT OF INDIA / STATE PROCUREMENT PORTAL
Organization: ${tender.organization_name || 'Procurement Authority'}
Department: Directorate of Public Procurement & Technical Services
Tender Notification ID: ${tender.tender_reference_no}

1. PROJECT OVERVIEW
--------------------------------------------------------------------------------
Project Title: ${tender.title}
Procurement Category: ${tender.category}
Industry / Sector: ${tender.industry || 'General Infrastructure'}
Location: ${tender.location_city ? tender.location_city + ', ' : ''}${tender.location_state}

2. KEY FINANCIAL PARTICULARS
--------------------------------------------------------------------------------
Estimated Project Cost: ${formatINR(tender.estimated_value)} (INR ${tender.estimated_value?.toLocaleString('en-IN')})
Earnest Money Deposit (EMD): ${formatINR(tender.emd_amount)} (INR ${tender.emd_amount?.toLocaleString('en-IN')})
Tender Processing Fee: INR ${tender.tender_fee?.toLocaleString('en-IN')} (Non-refundable)
Mode of Payment: Online Treasury Portal / Bank Guarantee from Scheduled Commercial Bank

3. SCHEDULE OF CRITICAL DATES
--------------------------------------------------------------------------------
Tender Published Date: ${new Date(tender.published_date || tender.created_at).toLocaleDateString('en-IN')}
Pre-Bid Query Cutoff: ${new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-IN')}
Bid Submission Closing Date & Time: ${new Date(tender.closing_date).toLocaleDateString('en-IN')} 18:00 Hours IST
Technical Bid Opening Date: ${new Date(tender.opening_date || tender.closing_date).toLocaleDateString('en-IN')} 11:00 Hours IST

4. MANDATORY PRE-QUALIFICATION CRITERIA (PQC)
--------------------------------------------------------------------------------
A. Financial Capacity:
   - Minimum average annual audited turnover of ${formatINR(tender.min_turnover_required)}
     over the preceding three financial years, certified by a Chartered Accountant with UDIN.

B. Technical Track Record:
   - Minimum ${tender.min_experience_years} years of proven operational experience in ${tender.industry || tender.category}.
   - Client performance certificates for at least 1 completed project of similar scale.

C. Mandatory Accreditations:
${(tender.required_certifications || ['ISO 9001:2015']).map(c => `   - ${c}`).join('\n')}

5. MANDATORY SUBMISSION DOCUMENTS (COVER 1 & 2)
--------------------------------------------------------------------------------
${(tender.required_documents || ['Technical Proposal', 'EMD Proof', 'Audited Balance Sheets', 'PAN/GSTIN']).map((doc, idx) => `   ${idx + 1}. ${doc}`).join('\n')}

6. SPECIAL CONDITIONS OF CONTRACT (SCC) & PENALTIES
--------------------------------------------------------------------------------
${(tender.clauses_summary || ['Standard Liquidated damages of 0.5% per week of delay up to a max cap of 10% contract value apply.']).map(cl => `   - ${cl}`).join('\n')}

================================================================================
Authorized Signatory: Chief Procurement Officer
Document Generated via BidSphere AI Enterprise Procurement Platform
Timestamp: ${new Date().toISOString()}
================================================================================`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeRef = tender.tender_reference_no.replace(/[/\\?%*:|"<>]/g, '_');
  link.download = `Tender_RFP_${safeRef}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
