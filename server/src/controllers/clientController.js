const db = require('../db/db');
const { logAudit } = require('../middleware/audit');
const aiEngine = require('../services/aiEngine');
const path = require('path');
const fs = require('fs');

// ============================================================================
// CLIENT DETAILS & SMART TENDER MATCHING MODULE - CONTROLLER
// ============================================================================

// Helper: Get or create full client profile for a user
function getFullClientProfile(userId) {
  const user = db.findById('users', userId) || db.findOne('users', u => u.user_id === userId || u.id === userId);
  if (!user) return null;

  const companyProfile = db.findOne('company_profiles', p => p.user_id === user.id);
  const company = db.findOne('companies', c => c.user_id === (user.user_id || user.id));
  const clientProfile = db.findOne('client_profiles', p => p.user_id === user.id);
  const preferences = db.findOne('user_preferences', p => p.user_id === user.id);

  // Aggregate bid statistics
  const allBids = db.find('bids', b => b.user_id === user.id);
  const savedTenders = db.find('saved_tenders', s => s.user_id === user.id);
  const matchedTenders = db.find('ai_recommendations', r => r.user_id === user.id);

  const stats = {
    total_matched: matchedTenders.length || savedTenders.length || 0,
    interested: savedTenders.filter(s => s.status === 'saved' || s.is_favourite).length,
    applied: allBids.length,
    pending: allBids.filter(b => b.status === 'submitted' || b.status === 'under_evaluation').length,
    won: allBids.filter(b => b.status === 'awarded').length,
    lost: allBids.filter(b => b.status === 'rejected' || b.status === 'lost').length
  };

  // Monthly bid activity (last 6 months)
  const monthlyActivity = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const count = allBids.filter(b => {
      const subDate = new Date(b.submitted_at || b.created_at);
      return subDate >= monthStart && subDate <= monthEnd;
    }).length;
    monthlyActivity.push({ month: monthKey, bids: count });
  }

  // Category distribution
  const categoryMap = {};
  allBids.forEach(b => {
    const tender = db.findById('tenders', b.tender_id);
    if (tender && tender.category) {
      categoryMap[tender.category] = (categoryMap[tender.category] || 0) + 1;
    }
  });
  const categoryDistribution = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

  // Status distribution
  const statusDistribution = [
    { name: 'Awarded', count: stats.won, color: '#10b981' },
    { name: 'Pending', count: stats.pending, color: '#f59e0b' },
    { name: 'Submitted', count: allBids.filter(b => b.status === 'submitted').length, color: '#3b82f6' },
    { name: 'Rejected', count: stats.lost, color: '#ef4444' },
    { name: 'Shortlisted', count: allBids.filter(b => b.status === 'shortlisted').length, color: '#8b5cf6' }
  ].filter(s => s.count > 0);

  // Client documents
  const clientDocs = db.find('client_documents', d => d.user_id === user.id || d.user_id === (user.user_id || user.id));

  // Activity log
  const activities = db.find('client_activity', a => a.user_id === user.id || a.user_id === (user.user_id || user.id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);

  // Notifications
  const notifications = db.find('notifications', n => n.user_id === (user.user_id || user.id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return {
    user: {
      id: user.id,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status || 'active',
      is_active: user.is_active !== false,
      created_at: user.created_at,
      last_login: user.last_login || user.updated_at || user.created_at
    },
    profile: clientProfile || null,
    companyProfile: companyProfile || null,
    company: company || null,
    preferences: preferences || null,
    stats,
    monthlyActivity,
    categoryDistribution,
    statusDistribution,
    documents: clientDocs,
    activities,
    notifications,
    bids: allBids
  };
}

// ============================================================================
// 1. GET CLIENT PROFILE (Own profile for authenticated client)
// ============================================================================
exports.getClientProfile = (req, res) => {
  try {
    const data = getFullClientProfile(req.user.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Client profile not found.' });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('Get client profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to load client profile.' });
  }
};

// ============================================================================
// 2. UPDATE CLIENT PROFILE (Full profile update)
// ============================================================================
exports.updateClientProfile = (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name, designation, company_name, business_type, industry,
      gstin, pan, address, city, state, pin_code,
      website, description, years_experience, annual_turnover,
      employee_count, services_products, mobile, profile_photo
    } = req.body;

    // Update user record
    const userUpdates = {};
    if (full_name) userUpdates.name = full_name;
    if (mobile) userUpdates.phone = mobile;
    if (Object.keys(userUpdates).length > 0) {
      db.updateById('users', userId, userUpdates);
    }

    // Update or create client_profile
    let existing = db.findOne('client_profiles', p => p.user_id === userId);
    const profileData = {
      user_id: userId,
      full_name: full_name || existing?.full_name || '',
      designation: designation || existing?.designation || '',
      company_name: company_name || existing?.company_name || '',
      business_type: business_type || existing?.business_type || '',
      industry: industry || existing?.industry || '',
      gstin: gstin || existing?.gstin || '',
      pan: pan || existing?.pan || '',
      address: address || existing?.address || '',
      city: city || existing?.city || '',
      state: state || existing?.state || '',
      pin_code: pin_code || existing?.pin_code || '',
      website: website || existing?.website || '',
      description: description || existing?.description || '',
      years_experience: years_experience ?? existing?.years_experience ?? 0,
      annual_turnover: annual_turnover || existing?.annual_turnover || '',
      employee_count: employee_count ?? existing?.employee_count ?? '',
      services_products: services_products || existing?.services_products || [],
      mobile: mobile || existing?.mobile || '',
      profile_photo: profile_photo || existing?.profile_photo || '',
      verification_status: existing?.verification_status || 'pending',
      account_status: existing?.account_status || 'active'
    };

    if (existing) {
      db.updateById('client_profiles', existing.id, profileData);
    } else {
      db.insert('client_profiles', profileData);
    }

    // Also sync company_profiles for AI matching
    let cp = db.findOne('company_profiles', p => p.user_id === userId);
    const cpData = {
      user_id: userId,
      company_name: company_name || cp?.company_name || '',
      pan_number: pan || cp?.pan_number || '',
      gst_number: gstin || cp?.gst_number || '',
      state: state || cp?.state || '',
      city: city || cp?.city || '',
      years_of_experience: years_experience ?? cp?.years_of_experience ?? 0,
      industry_sectors: typeof industry === 'string' ? [industry] : (cp?.industry_sectors || []),
      core_capabilities: Array.isArray(services_products) ? services_products : (cp?.core_capabilities || [])
    };
    if (cp) {
      db.updateById('company_profiles', cp.id, cpData);
    } else {
      db.insert('company_profiles', cpData);
    }

    // Log activity
    db.insert('client_activity', {
      user_id: userId,
      type: 'profile_updated',
      title: 'Profile Updated',
      description: 'Client profile details were updated successfully.',
      icon: 'user-edit'
    });

    logAudit(userId, 'UPDATE_CLIENT_PROFILE', 'ClientProfile', userId);

    const updated = getFullClientProfile(userId);
    res.json({ success: true, message: 'Client profile updated successfully.', data: updated });
  } catch (err) {
    console.error('Update client profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update client profile.' });
  }
};

// ============================================================================
// 3. AI-BASED SMART TENDER MATCHING
// ============================================================================
exports.getSmartMatches = (req, res) => {
  try {
    const userId = req.user.id;
    const profile = db.findOne('company_profiles', p => p.user_id === userId);
    const clientProfile = db.findOne('client_profiles', p => p.user_id === userId);
    const preferences = db.findOne('user_preferences', p => p.user_id === userId);
    const allTenders = db.find('tenders', t => t.status === 'published' || t.status === 'closing_soon');

    // Build enhanced profile for matching
    const enhancedProfile = {
      ...(profile || {}),
      company_name: clientProfile?.company_name || profile?.company_name || '',
      industry: clientProfile?.industry || '',
      business_type: clientProfile?.business_type || '',
      city: clientProfile?.city || profile?.city || '',
      state: clientProfile?.state || profile?.state || '',
      years_of_experience: clientProfile?.years_experience || profile?.years_of_experience || 0,
      services_products: clientProfile?.services_products || profile?.core_capabilities || [],
      annual_turnover: profile?.annual_turnover || 0,
      certifications: profile?.certifications || [],
      industry_sectors: profile?.industry_sectors || [],
      core_capabilities: profile?.core_capabilities || []
    };

    const matches = allTenders.map(tender => {
      const matchResult = calculateSmartMatch(enhancedProfile, preferences, tender);
      return {
        tender: {
          id: tender.id,
          tender_reference_no: tender.tender_reference_no,
          title: tender.title,
          description: tender.description,
          organization_name: tender.organization_name,
          category: tender.category,
          industry: tender.industry,
          location_state: tender.location_state,
          location_city: tender.location_city,
          estimated_value: tender.estimated_value,
          emd_amount: tender.emd_amount,
          published_date: tender.published_date,
          closing_date: tender.closing_date,
          status: tender.status,
          min_experience_years: tender.min_experience_years,
          min_turnover_required: tender.min_turnover_required,
          required_certifications: tender.required_certifications || [],
          required_documents: tender.required_documents || []
        },
        match_percentage: matchResult.score,
        match_reasons: matchResult.reasons,
        missing_requirements: matchResult.missing,
        match_factors: matchResult.factors,
        confidence: matchResult.confidence
      };
    })
    .filter(m => m.match_percentage > 0)
    .sort((a, b) => b.match_percentage - a.match_percentage);

    // Store recommendations
    matches.slice(0, 20).forEach(m => {
      const existing = db.findOne('ai_recommendations', r =>
        r.user_id === userId && r.tender_id === m.tender.id
      );
      if (!existing) {
        db.insert('ai_recommendations', {
          user_id: userId,
          tender_id: m.tender.id,
          match_score: m.match_percentage,
          reasons: m.match_reasons,
          generated_at: new Date().toISOString()
        });
      }
    });

    res.json({
      success: true,
      disclaimer: 'These AI-generated match scores are estimates based on available profile data. They do not guarantee eligibility or tender award. Always verify requirements independently.',
      total: matches.length,
      data: matches
    });
  } catch (err) {
    console.error('Smart match error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate smart matches.' });
  }
};

// Smart matching algorithm
function calculateSmartMatch(profile, preferences, tender) {
  let totalScore = 0;
  let maxScore = 100;
  const reasons = [];
  const missing = [];
  const factors = {};

  // 1. Business Category Match (25 points)
  let catScore = 0;
  const profileIndustries = [
    ...(profile.industry_sectors || []),
    profile.industry || '',
    profile.business_type || ''
  ].map(s => (s || '').toLowerCase()).filter(Boolean);

  const tenderCategory = (tender.category || '').toLowerCase();
  const tenderIndustry = (tender.industry || '').toLowerCase();

  if (profileIndustries.some(ind => tenderCategory.includes(ind) || ind.includes(tenderCategory))) {
    catScore = 25;
    reasons.push(`Business category "${tender.category}" matches your industry profile`);
  } else if (profileIndustries.some(ind => tenderIndustry.includes(ind) || ind.includes(tenderIndustry))) {
    catScore = 18;
    reasons.push(`Industry "${tender.industry}" aligns with your sector expertise`);
  } else {
    catScore = 5;
    missing.push(`Your industry profile does not directly match category "${tender.category}"`);
  }
  totalScore += catScore;
  factors.category = { score: catScore, max: 25, label: 'Business Category' };

  // 2. Keywords & Services Match (15 points)
  let kwScore = 0;
  const profileServices = [
    ...(profile.core_capabilities || []),
    ...(profile.services_products || []),
    ...(preferences?.keywords || [])
  ].map(s => (s || '').toLowerCase()).filter(Boolean);

  const tenderText = `${tender.title} ${tender.description} ${(tender.required_documents || []).join(' ')}`.toLowerCase();
  const matchedKeywords = profileServices.filter(kw => tenderText.includes(kw));
  if (matchedKeywords.length >= 3) {
    kwScore = 15;
    reasons.push(`${matchedKeywords.length} service keywords match tender requirements`);
  } else if (matchedKeywords.length >= 1) {
    kwScore = Math.min(matchedKeywords.length * 5, 12);
    reasons.push(`${matchedKeywords.length} relevant keyword(s) found in tender description`);
  } else {
    kwScore = 0;
    missing.push('No matching service keywords found in tender description');
  }
  totalScore += kwScore;
  factors.keywords = { score: kwScore, max: 15, label: 'Keywords & Services' };

  // 3. Budget / Turnover Match (20 points)
  let budgetScore = 0;
  const clientTurnover = profile.annual_turnover || 0;
  const requiredTurnover = tender.min_turnover_required || 0;
  if (requiredTurnover > 0 && clientTurnover > 0) {
    if (clientTurnover >= requiredTurnover) {
      budgetScore = 20;
      reasons.push(`Annual turnover ₹${(clientTurnover / 10000000).toFixed(1)} Cr exceeds minimum ₹${(requiredTurnover / 10000000).toFixed(1)} Cr`);
    } else if (clientTurnover >= requiredTurnover * 0.7) {
      budgetScore = 12;
      missing.push(`Turnover shortfall: You have ₹${(clientTurnover / 10000000).toFixed(1)} Cr vs required ₹${(requiredTurnover / 10000000).toFixed(1)} Cr`);
    } else {
      budgetScore = 5;
      missing.push(`Significant turnover gap: ₹${(clientTurnover / 10000000).toFixed(1)} Cr vs required ₹${(requiredTurnover / 10000000).toFixed(1)} Cr`);
    }
  } else {
    budgetScore = 10;
  }
  totalScore += budgetScore;
  factors.budget = { score: budgetScore, max: 20, label: 'Tender Budget / Turnover' };

  // 4. Experience Match (15 points)
  let expScore = 0;
  const clientExp = profile.years_of_experience || 0;
  const reqExp = tender.min_experience_years || 0;
  if (reqExp > 0 && clientExp > 0) {
    if (clientExp >= reqExp) {
      expScore = 15;
      reasons.push(`${clientExp} years experience exceeds required ${reqExp} years`);
    } else if (clientExp >= reqExp * 0.6) {
      expScore = 8;
      missing.push(`Experience gap: You have ${clientExp} years vs required ${reqExp} years`);
    } else {
      expScore = 3;
      missing.push(`Insufficient experience: ${clientExp} years vs required ${reqExp} years`);
    }
  } else {
    expScore = 7;
  }
  totalScore += expScore;
  factors.experience = { score: expScore, max: 15, label: 'Client Experience' };

  // 5. Geographical Match (15 points)
  let geoScore = 0;
  const profileState = (profile.state || '').toLowerCase();
  const profileCity = (profile.city || '').toLowerCase();
  const tenderState = (tender.location_state || '').toLowerCase();
  const tenderCity = (tender.location_city || '').toLowerCase();
  const prefLocations = (preferences?.locations || []).map(l => l.toLowerCase());

  if (profileCity && tenderCity && profileCity === tenderCity) {
    geoScore = 15;
    reasons.push(`Located in same city: ${tender.location_city}`);
  } else if (profileState && tenderState && profileState === tenderState) {
    geoScore = 12;
    reasons.push(`Located in same state: ${tender.location_state}`);
  } else if (prefLocations.some(l => tenderState.includes(l) || l.includes(tenderState))) {
    geoScore = 10;
    reasons.push(`Tender location ${tender.location_state} is in your preferred regions`);
  } else {
    geoScore = 3;
    missing.push(`Tender is in ${tender.location_state || 'unspecified location'}, outside your primary region`);
  }
  totalScore += geoScore;
  factors.geography = { score: geoScore, max: 15, label: 'Geographical Location' };

  // 6. Certifications / Qualifications (10 points)
  let certScore = 0;
  const clientCerts = (profile.certifications || []).map(c => (c || '').toLowerCase());
  const reqCerts = (tender.required_certifications || []).map(c => (c || '').toLowerCase());
  if (reqCerts.length > 0 && clientCerts.length > 0) {
    const matched = reqCerts.filter(rc => clientCerts.some(cc => cc.includes(rc) || rc.includes(cc)));
    const ratio = matched.length / reqCerts.length;
    certScore = Math.round(ratio * 10);
    if (matched.length > 0) {
      reasons.push(`${matched.length}/${reqCerts.length} required certifications available`);
    }
    if (matched.length < reqCerts.length) {
      const missingCerts = reqCerts.filter(rc => !clientCerts.some(cc => cc.includes(rc) || rc.includes(cc)));
      missing.push(`Missing certifications: ${missingCerts.join(', ')}`);
    }
  } else {
    certScore = 5;
  }
  totalScore += certScore;
  factors.qualifications = { score: certScore, max: 10, label: 'Required Qualifications' };

  const confidence = totalScore >= 70 ? 'high' : totalScore >= 45 ? 'medium' : 'low';

  return {
    score: Math.min(totalScore, 100),
    reasons,
    missing,
    factors,
    confidence
  };
}

// ============================================================================
// 4. CLIENT DOCUMENT MANAGEMENT
// ============================================================================
exports.getClientDocuments = (req, res) => {
  try {
    const userId = req.user.id;
    const docs = db.find('client_documents', d => d.user_id === userId);
    res.json({ success: true, data: docs });
  } catch (err) {
    console.error('Get client documents error:', err);
    res.status(500).json({ success: false, message: 'Failed to load documents.' });
  }
};

exports.uploadClientDocument = (req, res) => {
  try {
    const userId = req.user.id;
    const { document_type, document_name, expiry_date } = req.body;
    const file = req.file;

    const docRecord = {
      user_id: userId,
      document_type: document_type || 'other',
      document_name: document_name || (file ? file.originalname : 'Untitled Document'),
      file_name: file ? file.filename : null,
      file_path: file ? `/uploads/${file.filename}` : null,
      file_size: file ? file.size : 0,
      mime_type: file ? file.mimetype : null,
      expiry_date: expiry_date || null,
      verification_status: 'pending',
      uploaded_at: new Date().toISOString()
    };

    const newDoc = db.insert('client_documents', docRecord);

    // Log activity
    db.insert('client_activity', {
      user_id: userId,
      type: 'document_uploaded',
      title: 'Document Uploaded',
      description: `Uploaded ${document_type || 'document'}: ${docRecord.document_name}`,
      icon: 'file-up'
    });

    logAudit(userId, 'UPLOAD_CLIENT_DOCUMENT', 'ClientDocument', newDoc.id);

    res.status(201).json({ success: true, message: 'Document uploaded successfully.', data: newDoc });
  } catch (err) {
    console.error('Upload client document error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload document.' });
  }
};

exports.deleteClientDocument = (req, res) => {
  try {
    const userId = req.user.id;
    const docId = req.params.id;
    const doc = db.findById('client_documents', docId);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Ownership check
    if (doc.user_id !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own documents.' });
    }

    // Delete file from disk if exists
    if (doc.file_path) {
      const fullPath = path.join(__dirname, '..', '..', doc.file_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    db.deleteById('client_documents', docId);
    logAudit(userId, 'DELETE_CLIENT_DOCUMENT', 'ClientDocument', docId);

    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (err) {
    console.error('Delete client document error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
};

// ============================================================================
// 5. CLIENT ACTIVITY LOG
// ============================================================================
exports.getClientActivity = (req, res) => {
  try {
    const userId = req.user.id;
    const activities = db.find('client_activity', a => a.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: activities });
  } catch (err) {
    console.error('Get client activity error:', err);
    res.status(500).json({ success: false, message: 'Failed to load activity log.' });
  }
};

// ============================================================================
// 6. CLIENT NOTIFICATIONS
// ============================================================================
exports.getClientNotifications = (req, res) => {
  try {
    const userId = req.user.id;
    const userIdFormatted = req.user.user_id || userId;
    const { filter } = req.query;

    let notifications = db.find('notifications', n =>
      n.user_id === userId || n.user_id === userIdFormatted
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (filter === 'unread') {
      notifications = notifications.filter(n => !n.read_status);
    } else if (filter === 'read') {
      notifications = notifications.filter(n => n.read_status);
    }

    res.json({
      success: true,
      total: notifications.length,
      unread: notifications.filter(n => !n.read_status).length,
      data: notifications
    });
  } catch (err) {
    console.error('Get client notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
};

exports.markNotificationRead = (req, res) => {
  try {
    const notifId = req.params.id;
    const userId = req.user.id;

    if (notifId === 'all') {
      const userIdFormatted = req.user.user_id || userId;
      db.update('notifications',
        n => (n.user_id === userId || n.user_id === userIdFormatted) && !n.read_status,
        { read_status: true }
      );
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }

    const notif = db.findById('notifications', notifId);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    db.updateById('notifications', notifId, { read_status: true });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

// ============================================================================
// 7. ADMIN: CLIENT MANAGEMENT
// ============================================================================
exports.adminGetAllClients = (req, res) => {
  try {
    const { search, industry, city, status, page = 1, limit = 20 } = req.query;
    let clients = db.find('users', u =>
      u.role === 'company_user' || u.role === 'vendor' || u.role === 'company' || u.role === 'bidder'
    );

    // Enrich with profiles
    let enriched = clients.map(user => {
      const clientProfile = db.findOne('client_profiles', p => p.user_id === user.id);
      const companyProfile = db.findOne('company_profiles', p => p.user_id === user.id);
      const company = db.findOne('companies', c => c.user_id === (user.user_id || user.id));
      const bids = db.find('bids', b => b.user_id === user.id);
      const docs = db.find('client_documents', d => d.user_id === user.id);

      return {
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status || 'active',
        is_active: user.is_active !== false,
        created_at: user.created_at,
        last_login: user.last_login || user.updated_at || user.created_at,
        profile: clientProfile || null,
        company_name: clientProfile?.company_name || companyProfile?.company_name || company?.company_name || '',
        industry: clientProfile?.industry || (companyProfile?.industry_sectors || [])[0] || '',
        city: clientProfile?.city || companyProfile?.city || '',
        state: clientProfile?.state || companyProfile?.state || '',
        verification_status: clientProfile?.verification_status || company?.verification_status || 'pending',
        total_bids: bids.length,
        won_bids: bids.filter(b => b.status === 'awarded').length,
        total_documents: docs.length,
        verified_documents: docs.filter(d => d.verification_status === 'verified').length
      };
    });

    // Apply filters
    if (search) {
      const q = search.toLowerCase();
      enriched = enriched.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.user_id || '').toLowerCase().includes(q) ||
        (c.company_name || '').toLowerCase().includes(q)
      );
    }
    if (industry) {
      enriched = enriched.filter(c => (c.industry || '').toLowerCase().includes(industry.toLowerCase()));
    }
    if (city) {
      enriched = enriched.filter(c => (c.city || '').toLowerCase().includes(city.toLowerCase()));
    }
    if (status) {
      enriched = enriched.filter(c => c.status === status || (status === 'verified' && c.verification_status === 'approved'));
    }

    // Pagination
    const total = enriched.length;
    const startIdx = (Number(page) - 1) * Number(limit);
    const paginated = enriched.slice(startIdx, startIdx + Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: paginated
    });
  } catch (err) {
    console.error('Admin get clients error:', err);
    res.status(500).json({ success: false, message: 'Failed to load clients.' });
  }
};

exports.adminGetClientDetail = (req, res) => {
  try {
    const clientId = req.params.id;
    const data = getFullClientProfile(clientId);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('Admin get client detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to load client details.' });
  }
};

exports.adminVerifyDocument = (req, res) => {
  try {
    const docId = req.params.id;
    const { verification_status, remarks } = req.body;

    const doc = db.findById('client_documents', docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    db.updateById('client_documents', docId, {
      verification_status: verification_status || 'verified',
      verified_by: req.user.id,
      verified_at: new Date().toISOString(),
      verification_remarks: remarks || ''
    });

    // Notify the client
    db.insert('notifications', {
      user_id: doc.user_id,
      title: 'Document Verification Update',
      message: `Your ${doc.document_type} "${doc.document_name}" has been ${verification_status || 'verified'}.${remarks ? ' Remarks: ' + remarks : ''}`,
      read_status: false
    });

    // Log activity for the client
    db.insert('client_activity', {
      user_id: doc.user_id,
      type: 'document_verified',
      title: 'Document Verification Complete',
      description: `${doc.document_name} has been ${verification_status || 'verified'} by admin.`,
      icon: 'shield-check'
    });

    logAudit(req.user.id, 'VERIFY_CLIENT_DOCUMENT', 'ClientDocument', docId);

    res.json({ success: true, message: `Document ${verification_status || 'verified'} successfully.` });
  } catch (err) {
    console.error('Admin verify document error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify document.' });
  }
};

exports.adminToggleClientStatus = (req, res) => {
  try {
    const clientId = req.params.id;
    const user = db.findById('users', clientId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const newStatus = user.is_active === false ? true : false;
    const statusLabel = newStatus ? 'active' : 'suspended';

    db.updateById('users', clientId, {
      is_active: newStatus,
      status: statusLabel
    });

    // Notify the client
    db.insert('notifications', {
      user_id: user.user_id || user.id,
      title: `Account ${statusLabel === 'active' ? 'Activated' : 'Suspended'}`,
      message: `Your account has been ${statusLabel} by the platform administrator.`,
      read_status: false
    });

    logAudit(req.user.id, 'TOGGLE_CLIENT_STATUS', 'User', clientId);

    res.json({ success: true, message: `Client account ${statusLabel}.`, is_active: newStatus });
  } catch (err) {
    console.error('Admin toggle client status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update client status.' });
  }
};

exports.adminGetClientActivity = (req, res) => {
  try {
    const clientId = req.params.id;
    const activities = db.find('client_activity', a => a.user_id === clientId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: activities });
  } catch (err) {
    console.error('Admin get client activity error:', err);
    res.status(500).json({ success: false, message: 'Failed to load client activity.' });
  }
};

// ============================================================================
// 8. TENDER APPLICATION / SAVE / VIEW DETAILS ACTIONS
// ============================================================================
exports.saveTender = (req, res) => {
  try {
    const userId = req.user.id;
    const { tender_id } = req.body;

    if (!tender_id) {
      return res.status(400).json({ success: false, message: 'tender_id is required.' });
    }

    const existing = db.findOne('saved_tenders', s => s.user_id === userId && s.tender_id === tender_id);
    if (existing) {
      return res.json({ success: true, message: 'Tender already saved.', data: existing });
    }

    const saved = db.insert('saved_tenders', {
      user_id: userId,
      tender_id,
      status: 'saved',
      is_favourite: false,
      notes: ''
    });

    db.insert('client_activity', {
      user_id: userId,
      type: 'tender_saved',
      title: 'Tender Saved',
      description: `Saved tender ${tender_id} to your shortlist.`,
      icon: 'bookmark'
    });

    res.status(201).json({ success: true, message: 'Tender saved successfully.', data: saved });
  } catch (err) {
    console.error('Save tender error:', err);
    res.status(500).json({ success: false, message: 'Failed to save tender.' });
  }
};

exports.applyToTender = (req, res) => {
  try {
    const userId = req.user.id;
    const { tender_id, bid_amount, technical_proposal, commercial_terms, delivery_timeline_months } = req.body;

    if (!tender_id) {
      return res.status(400).json({ success: false, message: 'tender_id is required.' });
    }

    const tender = db.findById('tenders', tender_id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found.' });
    }

    // Check if already applied
    const existingBid = db.findOne('bids', b => b.user_id === userId && b.tender_id === tender_id && b.status !== 'withdrawn');
    if (existingBid) {
      return res.status(400).json({ success: false, message: 'You have already submitted a bid for this tender.' });
    }

    const user = req.user;
    const companyProfile = db.findOne('company_profiles', p => p.user_id === userId);
    const clientProfile = db.findOne('client_profiles', p => p.user_id === userId);

    const newBid = db.insert('bids', {
      tender_id,
      tender_reference_no: tender.tender_reference_no,
      tender_title: tender.title,
      department: tender.organization_name,
      user_id: userId,
      bidder_name: user.name,
      bidder_email: user.email,
      company_name: clientProfile?.company_name || companyProfile?.company_name || user.name,
      bid_amount: bid_amount || 0,
      technical_proposal: technical_proposal || '',
      commercial_terms: commercial_terms || '',
      delivery_timeline_months: delivery_timeline_months || 0,
      documents: [],
      status: 'submitted',
      submitted_at: new Date().toISOString()
    });

    // Update saved tender status if exists
    const savedEntry = db.findOne('saved_tenders', s => s.user_id === userId && s.tender_id === tender_id);
    if (savedEntry) {
      db.updateById('saved_tenders', savedEntry.id, {
        status: 'submitted',
        bid_amount: bid_amount || 0,
        submission_date: new Date().toISOString()
      });
    }

    db.insert('client_activity', {
      user_id: userId,
      type: 'bid_submitted',
      title: 'Bid Submitted',
      description: `Submitted bid of ₹${(bid_amount || 0).toLocaleString('en-IN')} for ${tender.tender_reference_no}`,
      icon: 'send'
    });

    // Notification
    db.insert('notifications', {
      user_id: user.user_id || userId,
      title: 'Bid Submitted Successfully',
      message: `Your bid for "${tender.title}" (${tender.tender_reference_no}) has been submitted successfully.`,
      read_status: false
    });

    logAudit(userId, 'SUBMIT_BID_VIA_CLIENT_MODULE', 'Bid', newBid.id);

    res.status(201).json({ success: true, message: 'Bid submitted successfully.', data: newBid });
  } catch (err) {
    console.error('Apply to tender error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit bid.' });
  }
};
