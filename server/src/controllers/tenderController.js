const db = require('../db/db');
const { logAudit } = require('../middleware/audit');
const aiEngine = require('../services/aiEngine');

// Get all tenders with advanced search, filtering, and sorting
exports.getTenders = (req, res) => {
  try {
    const {
      q,
      category,
      state,
      city,
      min_value,
      max_value,
      max_deadline_days,
      min_exp,
      status = 'published',
      sort_by = 'deadline', // deadline, newest, value_high, value_low, match_score
      page = 1,
      limit = 10
    } = req.query;

    let tenders = db.find('tenders', t => {
      // Status filter
      if (status !== 'all' && t.status !== status && !(status === 'published' && t.status === 'closing_soon')) {
        return false;
      }

      // Keyword query
      if (q) {
        const query = q.toLowerCase();
        const text = `${t.tender_reference_no} ${t.title} ${t.description} ${t.organization_name || ''} ${t.category} ${t.industry || ''} ${t.location_city || ''} ${t.location_state || ''}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      // Category filter
      if (category && category !== 'All' && t.category !== category) {
        return false;
      }

      // Location filter
      if (state && state !== 'All' && t.location_state !== state) {
        return false;
      }
      if (city && t.location_city && t.location_city.toLowerCase() !== city.toLowerCase()) {
        return false;
      }

      // Financial value filters
      if (min_value && t.estimated_value < Number(min_value)) return false;
      if (max_value && t.estimated_value > Number(max_value)) return false;

      // Experience filter
      if (min_exp && t.min_experience_years > Number(min_exp)) return false;

      // Deadline window filter
      if (max_deadline_days) {
        const now = new Date().getTime();
        const closingTime = new Date(t.closing_date).getTime();
        const daysRemaining = (closingTime - now) / 86400000;
        if (daysRemaining < 0 || daysRemaining > Number(max_deadline_days)) return false;
      }

      return true;
    });

    // Check if user is logged in to compute AI match scores dynamically
    let profile = null;
    let preferences = null;
    if (req.user && req.user.role === 'company_user') {
      profile = db.findOne('company_profiles', p => p.user_id === req.user.id);
      preferences = db.findOne('user_preferences', p => p.user_id === req.user.id);
    }

    // Attach dynamic calculated AI match scores
    tenders = tenders.map(tender => {
      const matchData = aiEngine.calculateMatchScore(profile, preferences, tender);
      return {
        ...tender,
        ai_match_score: matchData.score,
        match_confidence: matchData.confidence,
        match_summary: matchData.reasons[0] || 'Matches general procurement criteria'
      };
    });

    // Sorting
    tenders.sort((a, b) => {
      if (sort_by === 'newest') {
        return new Date(b.published_date || b.created_at) - new Date(a.published_date || a.created_at);
      }
      if (sort_by === 'deadline') {
        return new Date(a.closing_date) - new Date(b.closing_date);
      }
      if (sort_by === 'value_high') {
        return b.estimated_value - a.estimated_value;
      }
      if (sort_by === 'value_low') {
        return a.estimated_value - b.estimated_value;
      }
      if (sort_by === 'match_score') {
        return (b.ai_match_score || 0) - (a.ai_match_score || 0);
      }
      return 0;
    });

    // Pagination
    const totalCount = tenders.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedTenders = tenders.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      data: paginatedTenders
    });
  } catch (err) {
    console.error('Get tenders error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve tenders.' });
  }
};

// Get single tender details by ID
exports.getTenderById = (req, res) => {
  try {
    const { id } = req.params;
    const tender = db.findById('tenders', id);

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found.' });
    }

    // Similar tenders in same category/industry
    const similarTenders = db.find('tenders', t => 
      t.id !== tender.id && 
      (t.category === tender.category || t.location_state === tender.location_state) &&
      t.status === 'published'
    ).slice(0, 3).map(t => ({
      id: t.id,
      tender_reference_no: t.tender_reference_no,
      title: t.title,
      category: t.category,
      estimated_value: t.estimated_value,
      closing_date: t.closing_date,
      organization_name: t.organization_name
    }));

    // If company_user is logged in, attach personalized score
    let aiEvaluation = null;
    let eligibilityEvaluation = null;
    let isSaved = false;
    let isFavourite = false;

    if (req.user && req.user.role === 'company_user') {
      const profile = db.findOne('company_profiles', p => p.user_id === req.user.id);
      const preferences = db.findOne('user_preferences', p => p.user_id === req.user.id);
      aiEvaluation = aiEngine.calculateMatchScore(profile, preferences, tender);
      eligibilityEvaluation = aiEngine.checkEligibility(profile, tender);

      const saved = db.findOne('saved_tenders', s => s.user_id === req.user.id && s.tender_id === tender.id);
      if (saved) {
        isSaved = true;
        isFavourite = !!saved.is_favourite;
      }
    }

    res.json({
      success: true,
      tender,
      similarTenders,
      aiEvaluation,
      eligibilityEvaluation,
      isSaved,
      isFavourite
    });
  } catch (err) {
    console.error('Get tender by id error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve tender details.' });
  }
};

// Create Tender (Authorized Tender Authority only)
exports.createTender = (req, res) => {
  try {
    const user = req.user;
    const {
      tender_reference_no,
      title,
      description,
      category,
      industry,
      location_state,
      location_city,
      estimated_value,
      emd_amount,
      tender_fee,
      closing_date,
      opening_date,
      min_turnover_required,
      min_experience_years,
      required_certifications = [],
      required_documents = [],
      clauses_summary = [],
      document_text = '',
      status = 'published' // draft or published
    } = req.body;

    if (!tender_reference_no || !title || !estimated_value || !closing_date) {
      return res.status(400).json({
        success: false,
        message: 'Reference number, title, estimated value and closing date are mandatory.'
      });
    }

    // Check duplicate reference number
    const existing = db.findOne('tenders', t => t.tender_reference_no.toLowerCase() === tender_reference_no.toLowerCase());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Tender with Reference No '${tender_reference_no}' already exists in the system.`
      });
    }

    const org = user.organization_id ? db.findById('organizations', user.organization_id) : null;
    const orgName = req.body.organization_name || (org ? org.name : (user.organization_name || 'Department of Public Works & Technology'));

    const newTender = db.insert('tenders', {
      tender_reference_no,
      title,
      description: description || title,
      organization_id: user.organization_id,
      organization_name: orgName,
      category: category || 'Information Technology',
      industry: industry || 'Smart Infrastructure',
      location_state: location_state || 'Gujarat',
      location_city: location_city || 'Gandhinagar',
      estimated_value: Number(estimated_value),
      emd_amount: Number(emd_amount || (Number(estimated_value) * 0.02)),
      tender_fee: Number(tender_fee || 5000),
      published_date: new Date().toISOString(),
      closing_date,
      opening_date: opening_date || closing_date,
      status,
      min_turnover_required: Number(min_turnover_required || 0),
      min_experience_years: Number(min_experience_years || 0),
      required_certifications,
      required_documents,
      clauses_summary,
      bidder_checklist: required_documents.map(doc => ({ item: `Mandatory submission: ${doc}`, required: true })),
      document_text: document_text || `${orgName} invites tenders for ${title}. Estimated Cost: ₹${estimated_value}. Due Date: ${closing_date}.`,
      created_by: user.id,
      published_by: status === 'published' ? user.id : null
    });

    logAudit(user.id, 'CREATE_TENDER', 'Tender', newTender.id, {
      reference_no: newTender.tender_reference_no,
      title: newTender.title,
      status: newTender.status
    });

    // Check matching preferences across registered companies and dispatch in-app alerts!
    if (status === 'published') {
      const companies = db.find('company_profiles');
      companies.forEach(company => {
        const pref = db.findOne('user_preferences', p => p.user_id === company.user_id);
        const match = aiEngine.calculateMatchScore(company, pref, newTender);
        if (match.score >= 70) {
          db.insert('tender_alerts', {
            user_id: company.user_id,
            tender_id: newTender.id,
            alert_type: 'new_match',
            message: `New Opportunity (${match.score}% Match): ${newTender.title} published by ${orgName}.`,
            is_read: false
          });
        }
      });
    }

    res.status(201).json({
      success: true,
      message: status === 'published' ? 'Official tender published successfully!' : 'Tender saved as draft.',
      tender: newTender
    });
  } catch (err) {
    console.error('Create tender error:', err);
    res.status(500).json({ success: false, message: 'Failed to create tender.' });
  }
};

// Update Tender Status (Publish, Extend, Close, Cancel)
exports.updateTenderStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, closing_date } = req.body;
    const tender = db.findById('tenders', id);

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found.' });
    }

    const updates = { status };
    if (closing_date) {
      updates.closing_date = closing_date;
    }
    if (status === 'published' && !tender.published_by) {
      updates.published_by = req.user.id;
      updates.published_date = new Date().toISOString();
    }

    db.updateById('tenders', id, updates);
    const updated = db.findById('tenders', id);

    logAudit(req.user.id, 'UPDATE_TENDER_STATUS', 'Tender', id, { previous_status: tender.status, new_status: status });

    res.json({
      success: true,
      message: `Tender status updated to '${status}'.`,
      tender: updated
    });
  } catch (err) {
    console.error('Update tender status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update tender status.' });
  }
};

// Get Tender Authority's tenders (for authority dashboard)
exports.getAuthorityTenders = (req, res) => {
  try {
    const user = req.user;
    let tenders;
    if (user.role === 'super_admin') {
      tenders = db.getTable('tenders');
    } else {
      tenders = db.find('tenders', t => t.created_by === user.id || t.organization_id === user.organization_id);
    }

    res.json({
      success: true,
      data: tenders
    });
  } catch (err) {
    console.error('Get authority tenders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch authority tenders.' });
  }
};

// Edit tender details (Tender Authority / Super Admin)
exports.updateTender = (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const tender = db.findById('tenders', id);

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found.' });
    }

    if (user.role !== 'super_admin' && tender.created_by !== user.id && tender.organization_id !== user.organization_id) {
      return res.status(403).json({ success: false, message: 'Access Denied: You cannot edit another authority\'s tender.' });
    }

    const allowedFields = [
      'title', 'description', 'category', 'industry', 'location_state', 'location_city',
      'estimated_value', 'emd_amount', 'tender_fee', 'closing_date', 'opening_date',
      'min_turnover_required', 'min_experience_years', 'status'
    ];

    const updates = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'estimated_value' || f === 'emd_amount' || f === 'tender_fee' || f === 'min_turnover_required' || f === 'min_experience_years') {
          updates[f] = Number(req.body[f]);
        } else {
          updates[f] = req.body[f];
        }
      }
    });

    db.updateById('tenders', id, updates);
    const updated = db.findById('tenders', id);

    logAudit(user.id, `Edited Tender Details for ${tender.tender_reference_no}`, 'Tender', id, {
      tender_reference_no: tender.tender_reference_no,
      related_tender: tender.tender_reference_no
    });

    res.json({
      success: true,
      message: 'Tender details updated successfully.',
      tender: updated
    });
  } catch (err) {
    console.error('Update tender error:', err);
    res.status(500).json({ success: false, message: 'Failed to update tender.' });
  }
};

