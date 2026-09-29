const db = require('../db/db');
const aiEngine = require('../services/aiEngine');
const { logAudit } = require('../middleware/audit');

// One-click Check My Eligibility
exports.checkEligibility = (req, res) => {
  try {
    const userId = req.user.id;
    const { tender_id } = req.body;

    if (!tender_id) {
      return res.status(400).json({ success: false, message: 'tender_id is required.' });
    }

    const tender = db.findById('tenders', tender_id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found.' });
    }

    const profile = db.findOne('company_profiles', p => p.user_id === userId);
    const evaluation = aiEngine.checkEligibility(profile, tender);

    // Persist check in eligibility_checks table
    const checkRecord = db.insert('eligibility_checks', {
      user_id: userId,
      tender_id: tender.id,
      status: evaluation.status,
      match_percentage: evaluation.percentage,
      matched_criteria: evaluation.matchedCriteria,
      missing_criteria: evaluation.missingCriteria,
      checked_at: new Date().toISOString()
    });

    logAudit(userId, 'CHECK_ELIGIBILITY', 'Tender', tender.id, {
      status: evaluation.status,
      percentage: evaluation.percentage
    });

    res.json({
      success: true,
      data: {
        ...evaluation,
        check_id: checkRecord.id,
        tender: {
          id: tender.id,
          reference_no: tender.tender_reference_no,
          title: tender.title,
          estimated_value: tender.estimated_value,
          closing_date: tender.closing_date
        },
        company: profile ? {
          name: profile.company_name,
          turnover: profile.annual_turnover,
          experience: profile.years_of_experience
        } : null
      }
    });
  } catch (err) {
    console.error('Check eligibility error:', err);
    res.status(500).json({ success: false, message: 'Failed to evaluate eligibility.' });
  }
};

// Get past eligibility check history for current user
exports.getEligibilityHistory = (req, res) => {
  try {
    const checks = db.find('eligibility_checks', c => c.user_id === req.user.id);
    // Enrich with tender titles
    const enriched = checks.map(c => {
      const tender = db.findById('tenders', c.tender_id);
      return {
        ...c,
        tender_title: tender ? tender.title : 'Archived Tender',
        tender_reference_no: tender ? tender.tender_reference_no : 'N/A'
      };
    });

    res.json({
      success: true,
      data: enriched.reverse()
    });
  } catch (err) {
    console.error('Get eligibility history error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve eligibility history.' });
  }
};
