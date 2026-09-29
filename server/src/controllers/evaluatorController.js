const db = require('../db/db');
const { logAudit } = require('../middleware/audit');

// Sample pre-populated bid evaluations for demonstration
let evaluations = [
  {
    id: 'eval_1',
    tender_id: 'tnd_itms_001',
    bidder_name: 'TechInfra Smart Systems Pvt Ltd',
    technical_score: 92,
    financial_bid: 438000000,
    compliance_status: 'Fully Compliant',
    evaluator_remarks: 'Outstanding technical design, high benchmark for AI video processing and excellent past execution certificates.',
    status: 'Recommended'
  },
  {
    id: 'eval_2',
    tender_id: 'tnd_itms_001',
    bidder_name: 'Apex Surveillance Corp',
    technical_score: 78,
    financial_bid: 445000000,
    compliance_status: 'Partially Compliant',
    evaluator_remarks: 'Missing ISO 27001 renewal proof. Camera OEM warranty is only 3 years instead of 5 years.',
    status: 'Under Review'
  },
  {
    id: 'eval_3',
    tender_id: 'tnd_bel_003',
    bidder_name: 'TechInfra Smart Systems Pvt Ltd',
    technical_score: 89,
    financial_bid: 118000000,
    compliance_status: 'Fully Compliant',
    evaluator_remarks: 'Tier-III cloud architectural plan meets MeitY guidelines. Experienced SAP personnel allocated.',
    status: 'Recommended'
  }
];

// Get Assigned Evaluations for Evaluator
exports.getAssignedEvaluations = (req, res) => {
  try {
    const tenders = db.getTable('tenders');
    const enriched = evaluations.map(e => {
      const tender = tenders.find(t => t.id === e.tender_id);
      return {
        ...e,
        tender_title: tender ? tender.title : 'ITMS Project',
        tender_reference_no: tender ? tender.tender_reference_no : 'REF-001',
        estimated_value: tender ? tender.estimated_value : 450000000
      };
    });

    res.json({
      success: true,
      data: enriched
    });
  } catch (err) {
    console.error('Get evaluations error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve evaluations.' });
  }
};

// Update Bid Score & Remarks
exports.updateEvaluationScore = (req, res) => {
  try {
    const { id } = req.params;
    const { technical_score, evaluator_remarks, status } = req.body;

    const evalItem = evaluations.find(e => e.id === id);
    if (!evalItem) {
      return res.status(404).json({ success: false, message: 'Evaluation item not found.' });
    }

    if (technical_score !== undefined) evalItem.technical_score = Number(technical_score);
    if (evaluator_remarks !== undefined) evalItem.evaluator_remarks = evaluator_remarks;
    if (status !== undefined) evalItem.status = status;

    logAudit(req.user.id, 'SUBMIT_EVALUATION', 'Evaluation', id, {
      score: technical_score,
      status
    });

    res.json({
      success: true,
      message: 'Evaluation score and remarks saved.',
      data: evalItem
    });
  } catch (err) {
    console.error('Update evaluation error:', err);
    res.status(500).json({ success: false, message: 'Failed to update evaluation.' });
  }
};
