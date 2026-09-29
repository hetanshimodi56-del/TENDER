const db = require('../db/db');
const { logAudit } = require('../middleware/audit');

// 1. Submit a New Bid (Company / Bidder only)
exports.submitBid = (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'company_user' && user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only registered Company / Bidder accounts can submit bids.'
      });
    }

    const {
      tender_id,
      bid_amount,
      technical_proposal,
      commercial_terms,
      delivery_timeline_months = 6,
      documents = []
    } = req.body;

    if (!tender_id || !bid_amount) {
      return res.status(400).json({
        success: false,
        message: 'Tender ID and quoted bid amount are required.'
      });
    }

    const tender = db.findById('tenders', tender_id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found.' });
    }

    if (tender.status === 'closed' || tender.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Bidding closed: This tender is currently ${tender.status}.`
      });
    }

    // Check submission deadline
    const closingTime = new Date(tender.closing_date).getTime();
    if (closingTime < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Deadline expired: Tender submission deadline has passed.'
      });
    }

    const profile = db.findOne('company_profiles', p => p.user_id === user.id);
    const companyName = profile ? profile.company_name : (user.organization_name || user.name);

    // Check if bid already exists from this company for this tender
    const existingBid = db.findOne('bids', b => b.tender_id === tender_id && (b.user_id === user.id || (user.user_id && b.user_id === user.user_id)) && b.status !== 'withdrawn');
    if (existingBid) {
      // Update existing bid
      db.updateById('bids', existingBid.id, {
        bid_amount: Number(bid_amount),
        technical_proposal: technical_proposal || existingBid.technical_proposal,
        commercial_terms: commercial_terms || existingBid.commercial_terms,
        delivery_timeline_months: Number(delivery_timeline_months),
        documents: documents.length > 0 ? documents : existingBid.documents,
        updated_at: new Date().toISOString()
      });

      logAudit(user.user_id || user.id, `Revised Bid Quote to ₹${Number(bid_amount).toLocaleString('en-IN')}`, 'Bid', existingBid.id, {
        tender_reference_no: tender.tender_reference_no,
        related_tender: tender.tender_reference_no
      });

      return res.json({
        success: true,
        message: 'Bid proposal successfully updated!',
        data: db.findById('bids', existingBid.id)
      });
    }

    // Create fresh bid record
    const newBid = db.insert('bids', {
      tender_id: tender.id,
      tender_reference_no: tender.tender_reference_no,
      tender_title: tender.title,
      department: tender.organization_name || 'Procuring Authority',
      user_id: user.user_id || user.id,
      account_id: user.id,
      bidder_name: user.name,
      bidder_email: user.email,
      company_name: companyName,
      bid_amount: Number(bid_amount),
      technical_proposal: technical_proposal || 'Comprehensive turnkey deployment adhering to all RFP specifications.',
      commercial_terms: commercial_terms || 'Standard payment terms per RFP Special Conditions.',
      delivery_timeline_months: Number(delivery_timeline_months),
      documents: documents.length > 0 ? documents : [
        { name: 'Technical_Proposal.pdf', size: '2.4 MB', type: 'application/pdf' },
        { name: 'Commercial_Price_Bid.xlsx', size: '640 KB', type: 'application/vnd.ms-excel' },
        { name: 'EMD_Bank_Guarantee.pdf', size: '1.1 MB', type: 'application/pdf' }
      ],
      status: 'submitted', // submitted, under_evaluation, shortlisted, awarded, rejected, withdrawn
      evaluation_score: null,
      rejection_reason: null,
      evaluated_by: null,
      evaluated_at: null,
      submitted_at: new Date().toISOString()
    });

    // Sync to saved_tenders so it reflects on user pipeline
    const existingSaved = db.findOne('saved_tenders', s => s.user_id === user.id && s.tender_id === tender.id);
    if (existingSaved) {
      db.updateById('saved_tenders', existingSaved.id, {
        status: 'submitted',
        bid_amount: Number(bid_amount)
      });
    } else {
      db.insert('saved_tenders', {
        user_id: user.id,
        tender_id: tender.id,
        status: 'submitted',
        bid_amount: Number(bid_amount),
        saved_at: new Date().toISOString()
      });
    }

    // Log enterprise audit entry
    logAudit(user.user_id || user.id, `Submitted Bid of ₹${Number(bid_amount).toLocaleString('en-IN')}`, 'Bid', newBid.id, {
      tender_reference_no: tender.tender_reference_no,
      related_tender: tender.tender_reference_no
    });

    res.status(201).json({
      success: true,
      message: 'Official bid submitted successfully to e-Procurement vault!',
      data: newBid
    });
  } catch (err) {
    console.error('Submit bid error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit bid.' });
  }
};

// 2. Get My Bids (Company / Bidder isolated view)
exports.getMyBids = (req, res) => {
  try {
    const user = req.user;
    const bids = db.find('bids', b => b.user_id === user.id || (user.user_id && b.user_id === user.user_id) || b.account_id === user.id);

    const enriched = bids.map(bid => {
      const tender = db.findById('tenders', bid.tender_id) || {};
      return {
        ...bid,
        tender: {
          id: tender.id,
          reference_no: tender.tender_reference_no,
          tender_reference_no: tender.tender_reference_no,
          title: tender.title,
          category: tender.category,
          estimated_value: tender.estimated_value,
          emd_amount: tender.emd_amount,
          closing_date: tender.closing_date,
          status: tender.status,
          organization_name: tender.organization_name
        }
      };
    });

    res.json({
      success: true,
      data: enriched.reverse()
    });
  } catch (err) {
    console.error('Get my bids error:', err);
    res.status(500).json({ success: false, message: 'Failed to load company bids.' });
  }
};

// 3. Get Department Tenders Bids (Tender Authority isolated view)
exports.getDepartmentBids = (req, res) => {
  try {
    const user = req.user;
    const { tender_id, status } = req.query;

    let departmentTenderIds = [];
    if (user.role === 'super_admin') {
      departmentTenderIds = db.getTable('tenders').map(t => t.id);
    } else {
      const deptTenders = db.find('tenders', t => t.created_by === user.id || t.organization_id === user.organization_id);
      departmentTenderIds = deptTenders.map(t => t.id);
    }

    let bids = db.find('bids', b => departmentTenderIds.includes(b.tender_id));

    if (tender_id) {
      bids = bids.filter(b => b.tender_id === tender_id);
    }
    if (status && status !== 'all') {
      bids = bids.filter(b => b.status === status);
    }

    const enriched = bids.map(bid => {
      const bidderProfile = db.findOne('company_profiles', p => p.user_id === bid.user_id) || {};
      const tender = db.findById('tenders', bid.tender_id) || {};
      return {
        ...bid,
        tender_reference_no: tender.tender_reference_no || bid.tender_reference_no,
        tender_title: tender.title || bid.tender_title,
        tender_estimated_value: tender.estimated_value,
        bidder_profile: {
          turnover: bidderProfile.annual_turnover,
          years_experience: bidderProfile.years_of_experience,
          certifications: bidderProfile.certifications || [],
          pan: bidderProfile.pan_number,
          gst: bidderProfile.gst_number,
          state: bidderProfile.state
        }
      };
    });

    res.json({
      success: true,
      data: enriched.reverse()
    });
  } catch (err) {
    console.error('Get department bids error:', err);
    res.status(500).json({ success: false, message: 'Failed to load received bids.' });
  }
};

// 4. Get All Bids (Super Admin system-wide ledger)
exports.getAllBids = (req, res) => {
  try {
    const bids = db.getTable('bids');
    const enriched = bids.map(bid => {
      const tender = db.findById('tenders', bid.tender_id) || {};
      const bidderProfile = db.findOne('company_profiles', p => p.user_id === bid.user_id) || {};
      return {
        ...bid,
        tender_reference_no: tender.tender_reference_no || bid.tender_reference_no,
        tender_title: tender.title || bid.tender_title,
        department: tender.organization_name || bid.department,
        estimated_value: tender.estimated_value,
        bidder_turnover: bidderProfile.annual_turnover
      };
    });

    res.json({
      success: true,
      data: enriched.reverse()
    });
  } catch (err) {
    console.error('Get all bids error:', err);
    res.status(500).json({ success: false, message: 'Failed to load all bids.' });
  }
};

// 4b. Get Single Bid by ID (Strict Ownership & Anti-IDOR Protected)
exports.getBidById = (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const bid = db.findById('bids', id);
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid record not found.' });
    }

    // Anti-IDOR Protection:
    // Only:
    // 1. The submitting Company/Bidder (user_id / account_id matches)
    // 2. The authorized Tender Authority of the department
    // 3. Super Admin
    // can access this bid.
    const isOwner = bid.user_id === user.id || (user.user_id && bid.user_id === user.user_id) || bid.account_id === user.id;
    const isSuperAdmin = user.role === 'super_admin';

    let isAuthorizedAuthority = false;
    if (user.role === 'tender_authority') {
      const tender = db.findById('tenders', bid.tender_id);
      if (tender && (tender.created_by === user.id || tender.organization_id === user.organization_id || (tender.department_id && user.department_id && tender.department_id === user.department_id))) {
        isAuthorizedAuthority = true;
      }
    }

    if (!isOwner && !isSuperAdmin && !isAuthorizedAuthority) {
      return res.status(403).json({
        success: false,
        message: '403 – Access Denied: Insecure Direct Object Reference (IDOR) blocked. You are not authorized to view this company\'s private bid proposal.'
      });
    }

    const tender = db.findById('tenders', bid.tender_id) || {};
    const bidderProfile = db.findOne('company_profiles', p => p.user_id === bid.user_id || (bid.account_id && p.user_id === bid.account_id)) || {};

    res.json({
      success: true,
      data: {
        ...bid,
        tender,
        bidder_profile: bidderProfile
      }
    });
  } catch (err) {
    console.error('Get bid by id error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bid details.' });
  }
};

// 5. Evaluate Bid (Tender Authority & Super Admin: Shortlist / Reject / Award)
exports.evaluateBid = (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'tender_authority' && user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only Tender Authorities can evaluate bids.'
      });
    }

    const { id } = req.params;
    const { status, reason, rejection_reason, remarks, evaluation_score } = req.body;
    const finalReason = reason || rejection_reason;

    const validStatuses = ['under_evaluation', 'shortlisted', 'awarded', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Rejection reason is mandatory
    if (status === 'rejected' && (!finalReason || !finalReason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is mandatory when rejecting a bid.'
      });
    }

    const bid = db.findById('bids', id);
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid record not found.' });
    }

    const tender = db.findById('tenders', bid.tender_id);

    // Authority access check (must belong to their org if not super_admin)
    if (user.role === 'tender_authority' && tender) {
      if (tender.created_by !== user.id && tender.organization_id !== user.organization_id) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You cannot evaluate bids for another department.'
        });
      }
    }

    db.updateById('bids', id, {
      status,
      rejection_reason: status === 'rejected' ? finalReason : null,
      evaluation_score: evaluation_score ? Number(evaluation_score) : bid.evaluation_score,
      evaluated_by: user.id,
      evaluated_at: new Date().toISOString()
    });

    // Synchronize to bidder's saved_tenders pipeline
    const saved = db.findOne('saved_tenders', s => s.user_id === bid.user_id && s.tender_id === bid.tender_id);
    if (saved) {
      db.updateById('saved_tenders', saved.id, {
        status: status === 'shortlisted' ? 'shortlisted' : (status === 'awarded' ? 'awarded' : (status === 'rejected' ? 'lost' : 'under_evaluation'))
      });
    }

    // Dispatch in-app notification to bidder
    db.insert('tender_alerts', {
      user_id: bid.user_id,
      tender_id: bid.tender_id,
      alert_type: status === 'awarded' ? 'award' : 'bid_status_change',
      message: `Bid status updated for ${tender ? tender.tender_reference_no : 'Tender'}: marked as '${status.toUpperCase()}'${status === 'rejected' ? ` (Reason: ${reason})` : ''}.`,
      is_read: false
    });

    const actionText = status === 'shortlisted' 
      ? `Shortlisted Bid by ${bid.company_name}`
      : (status === 'awarded' 
        ? `Awarded Contract to ${bid.company_name} for ₹${Number(bid.bid_amount).toLocaleString('en-IN')}`
        : (status === 'rejected' 
          ? `Rejected Bid by ${bid.company_name} (Reason: ${reason})`
          : `Marked Bid Under Evaluation`));

    logAudit(user.id, actionText, 'Bid', bid.id, {
      tender_reference_no: tender ? tender.tender_reference_no : bid.tender_reference_no,
      related_tender: tender ? tender.tender_reference_no : bid.tender_reference_no,
      reason: reason || ''
    });

    res.json({
      success: true,
      message: `Bid successfully marked as '${status}'.`,
      data: db.findById('bids', id)
    });
  } catch (err) {
    console.error('Evaluate bid error:', err);
    res.status(500).json({ success: false, message: 'Failed to update bid evaluation.' });
  }
};

// 6. Withdraw Bid (Company / Bidder only)
exports.withdrawBid = (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const bid = db.findById('bids', id);
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid record not found.' });
    }

    if (bid.user_id !== user.id && user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access Denied: You cannot withdraw another company\'s bid.' });
    }

    if (bid.status === 'awarded') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw an awarded contract.' });
    }

    if (bid.status === 'withdrawn') {
      return res.status(400).json({ success: false, message: 'This bid has already been withdrawn.' });
    }

    db.updateById('bids', id, {
      status: 'withdrawn',
      withdrawn_at: new Date().toISOString()
    });

    // Update pipeline
    const saved = db.findOne('saved_tenders', s => s.user_id === bid.user_id && s.tender_id === bid.tender_id);
    if (saved) {
      db.updateById('saved_tenders', saved.id, { status: 'withdrawn' });
    }

    logAudit(user.id, `Withdrew Bid Proposal`, 'Bid', bid.id, {
      tender_reference_no: bid.tender_reference_no,
      related_tender: bid.tender_reference_no
    });

    res.json({
      success: true,
      message: 'Bid withdrawn successfully from procurement evaluation.'
    });
  } catch (err) {
    console.error('Withdraw bid error:', err);
    res.status(500).json({ success: false, message: 'Failed to withdraw bid.' });
  }
};
