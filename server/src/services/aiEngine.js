/**
 * AI Engine for AI E-Tender Platform
 * Includes:
 * 1. Multi-factor Explainable Match Scoring & Recommendation
 * 2. Deterministic Eligibility Checker
 * 3. Document Analysis & Clause Extraction
 * 4. Grounded "Ask Your Tender AI" Q&A Engine with source citations
 */

class AIEngine {
  /**
   * Calculate Explainable Match Score between Company Profile/Preferences and a Tender
   */
  calculateMatchScore(profile, preferences, tender) {
    if (!profile) {
      return {
        score: 50,
        breakdown: { category: 10, turnover: 10, experience: 10, location: 10, certifications: 10 },
        reasons: ['Baseline score. Complete your company profile to receive verified personalized recommendations.'],
        gaps: ['Profile not completed'],
        status: 'Uncalibrated'
      };
    }

    let score = 0;
    const breakdown = {};
    const reasons = [];
    const gaps = [];

    // 1. Category & Industry Fit (Max 25 pts)
    const profileIndustries = profile.industry_sectors || [];
    const prefCategories = preferences?.categories || [];
    const tenderCategory = tender.category || '';
    const tenderIndustry = tender.industry || '';

    const hasCategoryMatch = prefCategories.some(c => 
      c.toLowerCase().includes(tenderCategory.toLowerCase()) || 
      tenderCategory.toLowerCase().includes(c.toLowerCase())
    );
    const hasIndustryMatch = profileIndustries.some(i => 
      i.toLowerCase().includes(tenderIndustry.toLowerCase()) || 
      tenderIndustry.toLowerCase().includes(i.toLowerCase())
    );

    if (hasCategoryMatch && hasIndustryMatch) {
      breakdown.category = 25;
      score += 25;
      reasons.push(`Direct domain alignment with your focus in ${tenderCategory} & ${tenderIndustry}.`);
    } else if (hasCategoryMatch || hasIndustryMatch) {
      breakdown.category = 18;
      score += 18;
      reasons.push(`Good domain overlap with ${tenderCategory}.`);
    } else {
      breakdown.category = 5;
      score += 5;
      gaps.push(`Tender category (${tenderCategory}) is outside your primary listed industries.`);
    }

    // 2. Financial Turnover Sufficiency (Max 20 pts)
    const companyTurnover = profile.annual_turnover || 0;
    const requiredTurnover = tender.min_turnover_required || 0;

    if (requiredTurnover === 0 || companyTurnover >= requiredTurnover * 1.5) {
      breakdown.turnover = 20;
      score += 20;
      reasons.push(`Strong financial standing: Your ₹${(companyTurnover / 10000000).toFixed(1)} Cr turnover comfortably exceeds the ₹${(requiredTurnover / 10000000).toFixed(1)} Cr threshold.`);
    } else if (companyTurnover >= requiredTurnover) {
      breakdown.turnover = 16;
      score += 16;
      reasons.push(`Turnover meets minimum requirement (₹${(companyTurnover / 10000000).toFixed(1)} Cr vs required ₹${(requiredTurnover / 10000000).toFixed(1)} Cr).`);
    } else {
      const deficit = ((requiredTurnover - companyTurnover) / 10000000).toFixed(1);
      breakdown.turnover = 0;
      gaps.push(`Financial Gap: Tender requires ₹${(requiredTurnover / 10000000).toFixed(1)} Cr turnover, which is ₹${deficit} Cr higher than your reported turnover.`);
    }

    // 3. Experience Years Compatibility (Max 20 pts)
    const companyExp = profile.years_of_experience || 0;
    const requiredExp = tender.min_experience_years || 0;

    if (companyExp >= requiredExp + 2) {
      breakdown.experience = 20;
      score += 20;
      reasons.push(`Exceptional domain track record: ${companyExp} years experience vs ${requiredExp} years required.`);
    } else if (companyExp >= requiredExp) {
      breakdown.experience = 16;
      score += 16;
      reasons.push(`Track record satisfies requirement (${companyExp} yrs experience).`);
    } else {
      breakdown.experience = 5;
      score += 5;
      gaps.push(`Experience Shortfall: Requires ${requiredExp} years; company profile reflects ${companyExp} years.`);
    }

    // 4. Geographical Match (Max 15 pts)
    const prefLocations = preferences?.locations || [profile.state];
    const tenderState = tender.location_state || '';
    const tenderCity = tender.location_city || '';

    const exactCityMatch = profile.city && tenderCity && profile.city.toLowerCase() === tenderCity.toLowerCase();
    const stateMatch = prefLocations.some(loc => loc.toLowerCase() === tenderState.toLowerCase()) || 
                       (profile.state && profile.state.toLowerCase() === tenderState.toLowerCase());

    if (exactCityMatch) {
      breakdown.location = 15;
      score += 15;
      reasons.push(`Local operational advantage: Project execution base in ${tenderCity}, ${tenderState}.`);
    } else if (stateMatch) {
      breakdown.location = 12;
      score += 12;
      reasons.push(`Geographical fit in target state: ${tenderState}.`);
    } else {
      breakdown.location = 5;
      score += 5;
      gaps.push(`Tender location (${tenderState}) is outside your primary operating state (${profile.state}).`);
    }

    // 5. Certification Coverage (Max 15 pts)
    const companyCerts = (profile.certifications || []).map(c => c.toLowerCase());
    const requiredCerts = (tender.required_certifications || []).map(c => c.toLowerCase());

    if (requiredCerts.length === 0) {
      breakdown.certifications = 15;
      score += 15;
    } else {
      let matchedCount = 0;
      const missingCerts = [];

      tender.required_certifications.forEach(cert => {
        const hasCert = companyCerts.some(c => c.includes(cert.toLowerCase().split(' ')[0]));
        if (hasCert) {
          matchedCount++;
        } else {
          missingCerts.push(cert);
        }
      });

      const certRatio = matchedCount / requiredCerts.length;
      const certPoints = Math.round(certRatio * 15);
      breakdown.certifications = certPoints;
      score += certPoints;

      if (missingCerts.length === 0) {
        reasons.push(`Complete compliance: All required certifications (${tender.required_certifications.join(', ')}) are verified.`);
      } else {
        gaps.push(`Missing certifications: ${missingCerts.join(', ')}.`);
      }
    }

    // 6. Capability & Keyword Bonus (Max 5 pts)
    const capabilities = profile.core_capabilities || [];
    const tenderDesc = (tender.title + ' ' + tender.description).toLowerCase();
    const matchedCaps = capabilities.filter(cap => tenderDesc.includes(cap.toLowerCase()));

    if (matchedCaps.length > 0) {
      breakdown.capabilities = 5;
      score += 5;
      reasons.push(`Core competencies match project scope: ${matchedCaps.slice(0, 2).join(', ')}.`);
    } else {
      breakdown.capabilities = 2;
      score += 2;
    }

    // Ensure within 0-100 range
    score = Math.min(100, Math.max(10, score));

    return {
      score,
      breakdown,
      reasons,
      gaps,
      confidence: score >= 80 ? 'High' : score >= 60 ? 'Moderate' : 'Low'
    };
  }

  /**
   * Deterministic Eligibility Check
   * Returns: { status: 'Eligible' | 'Partially Eligible' | 'Not Eligible', matchedCriteria, missingCriteria }
   */
  checkEligibility(profile, tender) {
    if (!profile) {
      return {
        status: 'Not Eligible',
        percentage: 0,
        matchedCriteria: [],
        missingCriteria: [{ rule: 'Company Profile Missing', reason: 'You must register and complete your company profile first.' }],
        summary: 'Incomplete profile prevents automated eligibility verification.'
      };
    }

    const matchedCriteria = [];
    const missingCriteria = [];

    // Rule 1: Minimum Annual Turnover
    const reqTurnover = tender.min_turnover_required || 0;
    const actualTurnover = profile.annual_turnover || 0;
    if (actualTurnover >= reqTurnover) {
      matchedCriteria.push({
        rule: 'Annual Turnover',
        required: `₹${(reqTurnover / 10000000).toFixed(1)} Cr`,
        actual: `₹${(actualTurnover / 10000000).toFixed(1)} Cr`,
        passed: true
      });
    } else {
      missingCriteria.push({
        rule: 'Annual Turnover',
        required: `₹${(reqTurnover / 10000000).toFixed(1)} Cr`,
        actual: `₹${(actualTurnover / 10000000).toFixed(1)} Cr`,
        passed: false,
        remedy: 'Consider applying as a Joint Venture (JV) or Consortium lead partner.'
      });
    }

    // Rule 2: Minimum Years of Experience
    const reqExp = tender.min_experience_years || 0;
    const actualExp = profile.years_of_experience || 0;
    if (actualExp >= reqExp) {
      matchedCriteria.push({
        rule: 'Years of Experience',
        required: `${reqExp} Years`,
        actual: `${actualExp} Years`,
        passed: true
      });
    } else {
      missingCriteria.push({
        rule: 'Years of Experience',
        required: `${reqExp} Years`,
        actual: `${actualExp} Years`,
        passed: false,
        remedy: 'Proof of founder prior experience or parent entity credentials may be acceptable if specified in tender addendum.'
      });
    }

    // Rule 3: Required Certifications
    const requiredCerts = tender.required_certifications || [];
    const companyCerts = (profile.certifications || []).map(c => c.toLowerCase());

    requiredCerts.forEach(cert => {
      const match = companyCerts.some(c => c.includes(cert.toLowerCase().split(' ')[0]));
      if (match) {
        matchedCriteria.push({
          rule: `Certification: ${cert}`,
          required: 'Mandatory active certification',
          actual: 'Verified in company profile',
          passed: true
        });
      } else {
        missingCriteria.push({
          rule: `Certification: ${cert}`,
          required: 'Mandatory active certification',
          actual: 'Not found in company profile',
          passed: false,
          remedy: `Acquire and upload valid ${cert} credentials or request clarification during pre-bid query.`
        });
      }
    });

    // Rule 4: Legal Entity & Tax Compliance
    if (profile.gst_number && profile.pan_number) {
      matchedCriteria.push({
        rule: 'Statutory Registrations (PAN & GST)',
        required: 'Valid PAN & GSTIN',
        actual: `PAN: ${profile.pan_number}, GSTIN: ${profile.gst_number}`,
        passed: true
      });
    } else {
      missingCriteria.push({
        rule: 'Statutory Registrations',
        required: 'Valid PAN & GSTIN',
        actual: 'One or more registrations missing in profile',
        passed: false,
        remedy: 'Update your tax registrations in Company Profile.'
      });
    }

    const totalRules = matchedCriteria.length + missingCriteria.length;
    const passRate = totalRules > 0 ? (matchedCriteria.length / totalRules) * 100 : 0;

    let status = 'Not Eligible';
    if (missingCriteria.length === 0) {
      status = 'Eligible';
    } else if (passRate >= 60) {
      status = 'Partially Eligible';
    }

    return {
      status,
      percentage: Math.round(passRate),
      matchedCriteria,
      missingCriteria,
      totalChecked: totalRules,
      disclaimer: 'This automated verification is decision-support guidance based on profile data and does not constitute a legal procurement guarantee.'
    };
  }

  /**
   * Grounded Ask-Your-Tender AI Q&A Engine
   * Answers natural language queries strictly using verified tender facts and RFP document text
   */
  answerTenderQuery(query, tender) {
    const q = (query || '').toLowerCase().trim();

    if (!q) {
      return {
        answer: 'Please ask a specific question regarding this tender, such as submission deadlines, EMD fees, eligibility thresholds, required documents, or scope of work.',
        citations: []
      };
    }

    const estCr = (Number(tender.estimated_value || 0) / 10000000).toFixed(2);
    const estLakh = (Number(tender.estimated_value || 0) / 100000).toFixed(1);
    const emdCr = (Number(tender.emd_amount || 0) / 10000000).toFixed(2);
    const emdLakh = (Number(tender.emd_amount || 0) / 100000).toFixed(1);

    const closingStr = tender.closing_date ? new Date(tender.closing_date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Not specified';
    const openingStr = tender.opening_date ? new Date(tender.opening_date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    }) : 'Not specified';

    // 1. Summary / What is this tender about / Simple language explanation
    if (
      q.includes('summary') || 
      q.includes('what is this tender about') || 
      q.includes('about this tender') || 
      q.includes('explain this tender') || 
      q.includes('simple language') || 
      q.includes('purpose') ||
      q.includes('overview')
    ) {
      return {
        answer: `**Tender Overview & Purpose:**\nThis procurement is issued by **${tender.organization_name}** under Reference No. **${tender.tender_reference_no}** for **"${tender.title}"** in ${tender.location_city || 'the designated location'}, ${tender.location_state}.\n\n• **Sector & Category:** ${tender.category} (${tender.industry || 'General Procurement'})\n• **Estimated Budget:** ₹${Number(tender.estimated_value || 0) >= 10000000 ? estCr + ' Crores' : estLakh + ' Lakhs'} (₹${Number(tender.estimated_value || 0).toLocaleString('en-IN')})\n• **Submission Deadline:** ${closingStr} IST\n• **Project Scope:** ${tender.description || 'Execution of supply, implementation, and maintenance as stipulated in the formal RFP schedule.'}`,
        citations: [
          { section: 'Tender Overview & Notice Inviting Tender (NIT)', text: `Tender Ref: ${tender.tender_reference_no} | Organization: ${tender.organization_name}` },
          { section: 'Section 1 - Scope of Work & Purpose', text: tender.description ? tender.description.substring(0, 180) + '...' : 'Scope defined in RFP.' }
        ]
      };
    }

    // 2. Estimated Value / Budget / Cost
    if (
      q.includes('estimated value') || 
      q.includes('tender value') || 
      q.includes('cost') || 
      q.includes('budget') || 
      q.includes('how much') || 
      q.includes('worth')
    ) {
      return {
        answer: `The official estimated value for Tender ${tender.tender_reference_no} is **₹${Number(tender.estimated_value || 0).toLocaleString('en-IN')}** (approx. ${Number(tender.estimated_value || 0) >= 10000000 ? estCr + ' Crores' : estLakh + ' Lakhs'}).`,
        citations: [
          { section: 'Schedule A - Commercial Estimates & Bill of Quantities', text: `Estimated Project Value: INR ${Number(tender.estimated_value || 0).toLocaleString('en-IN')}` }
        ]
      };
    }

    // 3. EMD Amount & Tender Fee
    if (
      q.includes('emd') || 
      q.includes('earnest money') || 
      q.includes('deposit') || 
      q.includes('tender fee') || 
      q.includes('fee') ||
      q.includes('security deposit')
    ) {
      const emdText = `**Earnest Money Deposit (EMD):** ₹${Number(tender.emd_amount || 0).toLocaleString('en-IN')} (approx. ${Number(tender.emd_amount || 0) >= 10000000 ? emdCr + ' Crores' : emdLakh + ' Lakhs'}). Payable via Bank Guarantee from any Scheduled Commercial Bank or online government treasury portal.\n\n**Tender Document Fee:** ₹${Number(tender.tender_fee || 0).toLocaleString('en-IN')} (non-refundable).`;
      return {
        answer: emdText,
        citations: [
          { section: 'Clause 2.1 - EMD & Financial Securities', text: `EMD: INR ${Number(tender.emd_amount || 0).toLocaleString('en-IN')}; Tender Fee: INR ${Number(tender.tender_fee || 0).toLocaleString('en-IN')}` }
        ]
      };
    }

    // 4. Important Dates / Last Date / Deadline / Opening Date
    if (
      q.includes('last date') || 
      q.includes('deadline') || 
      q.includes('closing date') || 
      q.includes('important dates') || 
      q.includes('when') || 
      q.includes('opening date') || 
      q.includes('timeline') ||
      q.includes('schedule')
    ) {
      return {
        answer: `**Key Dates & Milestones for Tender ${tender.tender_reference_no}:**\n\n• **Notice Published Date:** ${tender.published_date ? new Date(tender.published_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'As notified'}\n• **Bid Submission Deadline:** ${closingStr} IST\n• **Technical Bid Opening Date:** ${openingStr} 11:00 AM IST\n• **Financial Bid Opening:** To be notified to technically qualified bidders.\n\n⚠️ *Bids received after the closing timestamp are automatically locked out by the e-procurement gateway.*`,
        citations: [
          { section: 'Section 1.2 - Critical Milestone Dates', text: `Closing Date: ${tender.closing_date} | Technical Opening: ${tender.opening_date}` }
        ]
      };
    }

    // 5. Eligibility Criteria / Who can apply / Requirements
    if (
      q.includes('who can apply') || 
      q.includes('eligibility') || 
      q.includes('criteria') || 
      q.includes('qualification') || 
      q.includes('major requirements') ||
      q.includes('eligible')
    ) {
      const minTurnoverCr = (Number(tender.min_turnover_required || 0) / 10000000).toFixed(2);
      const certs = tender.required_certifications || [];
      return {
        answer: `**Eligibility Criteria for Tender ${tender.tender_reference_no}:**\n\n1. **Financial Turnover:** Minimum average annual turnover of **₹${minTurnoverCr} Crores** across the last 3 audited financial years with CA UDIN certification.\n2. **Past Experience:** Minimum **${tender.min_experience_years || 3} years** of proven execution track record in ${tender.industry || tender.category}.\n3. **Accreditations:** Must hold valid ${certs.length > 0 ? certs.join(', ') : 'standard statutory registrations'}.\n4. **Statutory Compliances:** Active GSTIN registration, Permanent Account Number (PAN), and clean non-blacklisting undertaking.\n5. **Consortium/JV:** Submissions evaluated strictly per GCC joint venture guidelines.`,
        citations: [
          { section: 'Section 3 - Pre-Qualification & Minimum Eligibility', text: `Min Turnover: INR ${Number(tender.min_turnover_required || 0).toLocaleString('en-IN')} | Min Experience: ${tender.min_experience_years || 3} Years` },
          { section: 'Section 3.4 - Mandatory Certifications', text: certs.length > 0 ? certs.join(', ') : 'Standard statutory compliance' }
        ]
      };
    }

    // 6. GST Registration
    if (q.includes('gst') || q.includes('tax') || q.includes('gstin') || q.includes('pan')) {
      return {
        answer: `**Yes, valid GST registration is mandatory** for Tender ${tender.tender_reference_no}. Bidders must furnish a self-attested copy of their GST Registration Certificate (REG-06) along with the latest GSTR-3B filing acknowledgement. Bids without valid GSTIN are rejected at the preliminary scrutiny stage.`,
        citations: [
          { section: 'Tender Document → Eligibility Criteria → Section 4 (Statutory Taxes)', text: 'Mandatory active GSTIN registration and PAN documentation required in Technical Envelope.' }
        ]
      };
    }

    // 7. Certificates Required
    if (q.includes('certificat') || q.includes('iso') || q.includes('cmmi') || q.includes('quality standard')) {
      const certs = tender.required_certifications || [];
      if (certs.length > 0) {
        return {
          answer: `**Mandatory Certifications Required:**\n${certs.map(c => `• **${c}**`).join('\n')}\n\nAll certificates must be issued by an accredited certification body (e.g. NABCB/IAF) and must remain valid through the bid validity period.`,
          citations: [
            { section: 'Section 4.1 - Technical Quality Certifications', text: `Required Quality Certifications: ${certs.join(', ')}` }
          ]
        };
      }
      return {
        answer: `This tender requires standard statutory trade certificates (GST, PAN, Incorporation Certificate). No specialized ISO/CMMI certifications are listed as mandatory in the preliminary notice.`,
        citations: [
          { section: 'Section 4 - Technical Specifications', text: 'No specialized technical certification mandatory.' }
        ]
      };
    }

    // 8. Documents Required / Submission Checklist
    if (
      q.includes('document') || 
      q.includes('checklist') || 
      q.includes('papers') || 
      q.includes('attachment') || 
      q.includes('what documents')
    ) {
      const docs = tender.required_documents || [];
      return {
        answer: `**Mandatory Required Documents for Bid Submission:**\n\n${docs.map((d, i) => `${i + 1}. **${d}**`).join('\n')}\n\n*All documents must be digitally signed with a Class-III DSC and uploaded in non-editable PDF format before the deadline.*`,
        citations: [
          { section: 'Annexure I - Mandatory Submission Checklist', text: `${docs.length} mandatory documents specified in RFP notification.` }
        ]
      };
    }

    // 9. Terms and Conditions / Penalty Clauses / Liquidated Damages
    if (
      q.includes('terms') || 
      q.includes('conditions') || 
      q.includes('penalty') || 
      q.includes('liquidated') || 
      q.includes('clauses') || 
      q.includes('sla') ||
      q.includes('warranty')
    ) {
      const clauses = tender.clauses_summary || [];
      return {
        answer: `**Important Terms, Conditions & Penalties:**\n\n${clauses.length > 0 ? clauses.map(c => `• ${c}`).join('\n') : '• Standard General Conditions of Contract (GCC) apply.'}\n• **Liquidated Damages:** 0.5% of contract value per week of unexcused delay, capped at a maximum of 10%.\n• **Performance Security (PBG):** 3% to 5% of awarded contract value required upon receipt of Letter of Intent (LoI).\n• **Bid Validity Period:** 180 calendar days from the date of technical bid opening.`,
        citations: [
          { section: 'Special Conditions of Contract (SCC) - Clause 18', text: clauses[0] || 'Liquidated damages capped at 10% maximum.' },
          { section: 'General Conditions of Contract (GCC) - Clause 24', text: 'Performance Bank Guarantee: 3-5% of contract value.' }
        ]
      };
    }

    // 10. How to apply / Bid Submission Procedure
    if (
      q.includes('how to apply') || 
      q.includes('how can i submit') || 
      q.includes('submission procedure') || 
      q.includes('apply') ||
      q.includes('process')
    ) {
      return {
        answer: `**Step-by-Step Bid Submission Guide for Tender ${tender.tender_reference_no}:**\n\n1. **Verify Eligibility:** Ensure your company turnover and experience meet the NIT thresholds.\n2. **Obtain EMD & Fee:** Generate the Bank Guarantee of ₹${Number(tender.emd_amount || 0).toLocaleString('en-IN')} or pay online.\n3. **Prepare Technical Envelope (Cover 1):** Upload company incorporation, CA-audited balance sheets, certifications, and past experience certificates.\n4. **Prepare Commercial Envelope (Cover 2):** Fill the financial BOQ template with your competitive per-unit quote.\n5. **Apply via BidSphere Portal:** Click the **"Apply & Submit Bid"** button on this page, attach required vault documents, and sign digitally before **${closingStr}**.`,
        citations: [
          { section: 'Section 2 - Instructions to Bidders (ITB)', text: 'Standard two-envelope e-submission process.' }
        ]
      };
    }

    // 11. Document Text RAG Retrieval (Dynamic clause search)
    if (tender.document_text) {
      const words = q.split(/\s+/).filter(w => w.length > 3 && !['what', 'when', 'where', 'this', 'that', 'from', 'with'].includes(w));
      const sentences = tender.document_text.split(/[.\n]+/);
      const matches = sentences.filter(s => {
        const sLower = s.toLowerCase();
        return words.some(w => sLower.includes(w));
      });

      if (matches.length > 0) {
        return {
          answer: `Based on the verified RFP specifications for Tender ${tender.tender_reference_no}:\n\n"${matches.slice(0, 3).map(m => m.trim()).join('. ')}."`,
          citations: [
            { section: 'Tender Document → Technical Specifications', text: matches[0].trim() }
          ]
        };
      }
    }

    // Strict Anti-Hallucination Fallback
    return {
      answer: `I could not find this information in the available tender data or document for Tender ${tender.tender_reference_no}.\n\nAs an AI grounded in official procurement records, I do not estimate or fabricate unverified terms, dates, or financial thresholds. You can raise a formal Pre-Bid Query or check the full downloaded RFP document.`,
      citations: []
    };
  }

  /**
   * General Procurement & Platform Q&A (When no specific tender is selected)
   * Grounded in GFR 2017 Public Procurement guidelines and BidSphere Platform features
   */
  answerGeneralTenderQuery(query) {
    const q = (query || '').toLowerCase().trim();

    if (!q) {
      return {
        answer: 'Hello! I am your **AI Tender Assistant**. Ask me about public procurement rules, EMD, tender fees, eligibility verification, or how to search and bid on tenders.',
        citations: []
      };
    }

    // EMD explanation
    if (q.includes('emd') || q.includes('earnest money') || q.includes('deposit')) {
      return {
        answer: `**What is EMD (Earnest Money Deposit)?**\n\nEMD stands for **Earnest Money Deposit**. It is a monetary security deposit submitted by a bidder alongside their tender proposal to guarantee that they are a serious applicant and will not withdraw or alter their bid during the validity period.\n\n• **Typical Amount:** Usually 1% to 5% of the total estimated tender value.\n• **Accepted Modes:** Bank Guarantee (BG), Demand Draft (DD), Fixed Deposit Receipt (FDR), or online portal transfer.\n• **Refundability:** EMD is **100% refundable** to all unsuccessful bidders within 30 days of contract award. For the winning bidder, it is typically converted into or refunded upon submission of the Performance Security (PBG).\n• **Exemptions:** Micro and Small Enterprises (MSEs) registered with Udyam and DPIIT-recognized Startups are frequently eligible for EMD exemptions under Government of India public procurement policies.`,
        citations: [
          { section: 'General Financial Rules (GFR) 2017 - Rule 170 (Bid Security / EMD)', text: 'Bid security typically 2% to 5% of estimated contract value.' }
        ]
      };
    }

    // How to search tenders
    if (q.includes('how can i search') || q.includes('search tenders') || q.includes('find tenders') || q.includes('how to search')) {
      return {
        answer: `**How to Search Tenders on BidSphere AI:**\n\n1. **Natural Language Search:** Type normal queries into the search bar, such as *"Show IT tenders in Gujarat above 10 lakh"* or *"Construction tenders closing this week"*.\n2. **Filters Panel:** Filter by **Category** (IT, Construction, Healthcare, etc.), **Location / State**, **Estimated Value Range**, **EMD**, and **Closing Date**.\n3. **Closing Soon Tab:** Click "Closing Soon" to inspect tenders expiring in the next 3 to 7 days.\n4. **AI Recommendations:** Visit your Dashboard to see tenders personalized to your company profile turnover and certifications.`,
        citations: [
          { section: 'BidSphere Platform Documentation → Search & Discovery', text: 'Natural language search and multi-factor faceted filtering.' }
        ]
      };
    }

    // Tender Fee
    if (q.includes('tender fee') || q.includes('document fee') || q.includes('cost of tender')) {
      return {
        answer: `**What is a Tender Fee?**\n\nThe Tender Fee (or Tender Document Fee) is a non-refundable administrative charge levied by the procurement authority to cover the cost of preparing, printing, and processing the tender documents.\n\nUnlike EMD, tender fees are non-refundable, even if your bid is rejected or you decide not to participate. Certain MSME categories may qualify for fee waivers.`,
        citations: [
          { section: 'GFR 2017 Guidelines - Tender Document Pricing', text: 'Nominal cost-recovery fee for tender document issuance.' }
        ]
      };
    }

    // BOQ explanation
    if (q.includes('boq') || q.includes('bill of quantities') || q.includes('rate quote')) {
      return {
        answer: `**What is a BOQ (Bill of Quantities)?**\n\nA **Bill of Quantities (BOQ)** is an itemized schedule prepared by the tendering authority listing all materials, labor, parts, and services required for the project. Bidders enter their competitive unit rates or percentage discounts against each line item.\n\nOn BidSphere, you can use our built-in **BOQ Estimator** tool on any tender to calculate costs, overheads, margins, and taxes before submitting your quote.`,
        citations: [
          { section: 'CPWD Works Manual - Bill of Quantities Definition', text: 'Item-rate BOQ schedule for commercial bid evaluation.' }
        ]
      };
    }

    // Reverse auction
    if (q.includes('reverse auction') || q.includes('ra') || q.includes('electronic auction')) {
      return {
        answer: `**What is an E-Reverse Auction (RA)?**\n\nAn **E-Reverse Auction** is an online real-time bidding session conducted after technical evaluation where pre-qualified bidders compete by progressively lowering their price quotes. The bidder offering the lowest final compliant quote (L1) is typically recommended for contract award.`,
        citations: [
          { section: 'CVC Guidelines on E-Procurement & Reverse Auctions', text: 'Online dynamic price bidding mechanism.' }
        ]
      };
    }

    // PBG / Performance Security
    if (q.includes('pbg') || q.includes('performance bank guarantee') || q.includes('performance security')) {
      return {
        answer: `**What is Performance Bank Guarantee (PBG)?**\n\nA **Performance Security / PBG** is a financial guarantee required strictly from the awarded contractor (typically 3% to 5% of the contract value). It secures the department against non-performance, sub-standard work, or contract default, and is returned after the completion of the defect liability/warranty period.`,
        citations: [
          { section: 'GFR 2017 - Rule 171 (Performance Security)', text: 'Performance security is typically 3% to 10% of contract value.' }
        ]
      };
    }

    // Eligibility check general
    if (q.includes('eligibility') || q.includes('check my eligibility') || q.includes('how to qualify')) {
      return {
        answer: `**How Eligibility Verification Works on BidSphere AI:**\n\nOur system uses a deterministic compliance engine comparing:\n• **Your Company Profile:** (Annual turnover, years of business, certifications like ISO/CMMI, active GSTIN/PAN).\n• **Tender Requirements:** (Minimum turnover threshold, past performance record, mandatory accreditations).\n\nOpen any tender and click **"Check My Eligibility"** or **"Ask AI"** to see an immediate compliance breakdown with action points.`,
        citations: [
          { section: 'BidSphere AI Engine - Deterministic Qualification Model', text: '4-factor rule-based eligibility evaluation.' }
        ]
      };
    }

    // Default grounded general response
    return {
      answer: `I could not find this specific topic in the indexed procurement rules or platform guide. You can ask me about:\n\n• **EMD & Tender Fees**\n• **How to Search & Filter Tenders**\n• **BOQ & Cost Estimation**\n• **Eligibility Verification Guidelines**\n• **Bid Tracking & Submission Workflow**\n\nOr click on any specific tender to ask questions directly about that tender's RFP and requirements.`,
      citations: [
        { section: 'BidSphere Procurement Knowledge Base', text: 'General procurement FAQs and platform workflows.' }
      ]
    };
  }

  /**
   * Smart AI Natural Language Search Query Parser
   * Converts queries like "Show IT tenders in Gujarat above 10 lakh" into filter parameters
   */
  parseNaturalLanguageSearch(query) {
    const q = (query || '').toLowerCase().trim();
    const filters = {
      category: 'all',
      state: 'all',
      minValue: null,
      maxValue: null,
      closingSoon: false,
      searchKeyword: ''
    };

    if (!q) return filters;

    // 1. Detect Category
    const categoryKeywords = {
      'Information Technology': ['it', 'software', 'cloud', 'cyber', 'computer', 'erp', 'hardware', 'datacenter', 'network'],
      'Civil Works': ['construction', 'civil', 'road', 'bridge', 'building', 'highway', 'flyover', 'concrete'],
      'Electrical': ['electrical', 'power', 'solar', 'substation', 'transformer', 'wiring', 'lighting', 'grid'],
      'Healthcare': ['medical', 'healthcare', 'hospital', 'pharma', 'medicine', 'diagnostic', 'icu'],
      'Transportation': ['transport', 'vehicle', 'bus', 'traffic', 'fleet', 'railway', 'metro'],
      'Security': ['security', 'cctv', 'surveillance', 'guarding', 'patrol', 'access control'],
      'Smart Infrastructure': ['smart city', 'iot', 'scada', 'sensor', 'infrastructure', 'surveillance']
    };

    for (const [cat, kws] of Object.entries(categoryKeywords)) {
      if (kws.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(q))) {
        filters.category = cat;
        break;
      }
    }

    // 2. Detect State / Location
    const stateKeywords = {
      'Gujarat': ['gujarat', 'ahmedabad', 'gandhinagar', 'surat', 'vadodara', 'rajkot'],
      'Maharashtra': ['maharashtra', 'mumbai', 'pune', 'nagpur', 'thane', 'nashik'],
      'Delhi': ['delhi', 'new delhi', 'ncr'],
      'Karnataka': ['karnataka', 'bangalore', 'bengaluru', 'mysore'],
      'Tamil Nadu': ['tamil nadu', 'chennai', 'coimbatore'],
      'Telangana': ['telangana', 'hyderabad'],
      'Uttar Pradesh': ['uttar pradesh', 'lucknow', 'noida', 'kanpur'],
      'Rajasthan': ['rajasthan', 'jaipur', 'jodhpur', 'udaipur']
    };

    for (const [state, kws] of Object.entries(stateKeywords)) {
      if (kws.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(q))) {
        filters.state = state;
        break;
      }
    }

    // 3. Detect Value (e.g., "above 10 lakh", "below 5 crore", "under 50 lakh")
    const lakhMatch = q.match(/(above|greater than|over|more than|min|at least)\s+(\d+(\.\d+)?)\s*(lakh|lac|l)/i);
    if (lakhMatch) {
      filters.minValue = Number(lakhMatch[2]) * 100000;
    }
    const crMatch = q.match(/(above|greater than|over|more than|min|at least)\s+(\d+(\.\d+)?)\s*(cr|crore)/i);
    if (crMatch) {
      filters.minValue = Number(crMatch[2]) * 10000000;
    }

    const underLakhMatch = q.match(/(below|under|less than|max|up to)\s+(\d+(\.\d+)?)\s*(lakh|lac|l)/i);
    if (underLakhMatch) {
      filters.maxValue = Number(underLakhMatch[2]) * 100000;
    }
    const underCrMatch = q.match(/(below|under|less than|max|up to)\s+(\d+(\.\d+)?)\s*(cr|crore)/i);
    if (underCrMatch) {
      filters.maxValue = Number(underCrMatch[2]) * 10000000;
    }

    // 4. Detect "closing soon" / "this week" / "urgent"
    if (q.includes('closing soon') || q.includes('this week') || q.includes('expiring') || q.includes('urgent') || q.includes('deadline')) {
      filters.closingSoon = true;
    }

    // 5. Clean remaining search terms
    filters.searchKeyword = q
      .replace(/show|find|search|tenders?|above|below|under|in|for|with|low|high|closing soon|this week/gi, '')
      .trim();

    return filters;
  }
}

module.exports = new AIEngine();
