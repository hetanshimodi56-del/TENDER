const db = require('../db/db');
const { logAudit } = require('../middleware/audit');
const aiEngine = require('../services/aiEngine');

// Toggle Save / Favourite Tender
exports.toggleSaveTender = (req, res) => {
  try {
    const userId = req.user.id;
    const { tender_id, notes, is_favourite } = req.body;

    if (!tender_id) {
      return res.status(400).json({ success: false, message: 'tender_id is required.' });
    }

    const existing = db.findOne('saved_tenders', s => s.user_id === userId && s.tender_id === tender_id);

    if (existing) {
      // If already saved and no specific is_favourite update requested, toggle removal
      if (is_favourite !== undefined || notes !== undefined) {
        db.updateById('saved_tenders', existing.id, {
          is_favourite: is_favourite !== undefined ? is_favourite : existing.is_favourite,
          notes: notes !== undefined ? notes : existing.notes
        });
        const updated = db.findById('saved_tenders', existing.id);
        return res.json({ success: true, message: 'Saved tender updated.', data: updated });
      } else {
        db.deleteById('saved_tenders', existing.id);
        logAudit(userId, 'REMOVE_SAVED_TENDER', 'Tender', tender_id);
        return res.json({ success: true, message: 'Tender removed from saved list.', isSaved: false });
      }
    } else {
      const newSaved = db.insert('saved_tenders', {
        user_id: userId,
        tender_id,
        notes: notes || '',
        is_favourite: is_favourite !== undefined ? is_favourite : false
      });
      logAudit(userId, 'SAVE_TENDER', 'Tender', tender_id);
      return res.status(201).json({ success: true, message: 'Tender saved successfully.', isSaved: true, data: newSaved });
    }
  } catch (err) {
    console.error('Toggle save tender error:', err);
    res.status(500).json({ success: false, message: 'Failed to update saved tender.' });
  }
};

// Get User's Saved & Favourite Tenders with Status and Tasks
exports.getSavedTenders = (req, res) => {
  try {
    const userId = req.user.id;
    const savedList = db.find('saved_tenders', s => s.user_id === userId);

    const profile = db.findOne('company_profiles', p => p.user_id === userId);
    const preferences = db.findOne('user_preferences', p => p.user_id === userId);
    const allTasks = db.getTable('tender_tasks');

    const enriched = savedList.map(item => {
      const tender = db.findById('tenders', item.tender_id);
      if (!tender) return null;

      const matchData = aiEngine.calculateMatchScore(profile, preferences, tender);
      const tenderTasks = allTasks.filter(t => t.tender_id === item.tender_id);
      const completedTasks = tenderTasks.filter(t => t.status === 'completed');

      return {
        saved_id: item.id,
        notes: item.notes,
        is_favourite: item.is_favourite,
        saved_at: item.created_at,
        status: item.status || 'saved', // saved, preparing, submitted, under_evaluation, awarded, lost
        bid_amount: item.bid_amount || null,
        submission_date: item.submission_date || null,
        status_history: item.status_history || [
          { status: 'saved', timestamp: item.created_at, note: 'Tender shortlisted to bidding pipeline' }
        ],
        task_stats: {
          total: tenderTasks.length,
          completed: completedTasks.length,
          percentage: tenderTasks.length > 0 ? Math.round((completedTasks.length / tenderTasks.length) * 100) : 0
        },
        tender: {
          ...tender,
          ai_match_score: matchData.score,
          match_confidence: matchData.confidence
        }
      };
    }).filter(Boolean);

    res.json({
      success: true,
      total: enriched.length,
      data: enriched
    });
  } catch (err) {
    console.error('Get saved tenders error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve saved tenders.' });
  }
};

// Update Bid Status (e.g. saved -> preparing -> submitted -> under_evaluation -> awarded -> lost)
exports.updateBidStatus = (req, res) => {
  try {
    const userId = req.user.id;
    const { tender_id } = req.params;
    const { status, bid_amount, submission_date, note } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    let saved = db.findOne('saved_tenders', s => s.user_id === userId && s.tender_id === tender_id);

    // If not yet in saved tenders, automatically add it with the new status
    if (!saved) {
      saved = db.insert('saved_tenders', {
        user_id: userId,
        tender_id,
        notes: note || '',
        is_favourite: false,
        status,
        bid_amount: bid_amount ? Number(bid_amount) : null,
        submission_date: submission_date || (status === 'submitted' ? new Date().toISOString() : null),
        status_history: [
          { status, timestamp: new Date().toISOString(), note: note || `Status set to ${status}`, updated_by: req.user.name }
        ]
      });
    } else {
      const history = Array.isArray(saved.status_history) ? [...saved.status_history] : [
        { status: saved.status || 'saved', timestamp: saved.created_at, note: 'Tender shortlisted' }
      ];

      history.push({
        status,
        timestamp: new Date().toISOString(),
        note: note || `Bid status transitioned to ${status}`,
        updated_by: req.user.name
      });

      const updates = {
        status,
        status_history: history
      };

      if (bid_amount !== undefined) updates.bid_amount = Number(bid_amount);
      if (submission_date) updates.submission_date = submission_date;
      else if (status === 'submitted' && !saved.submission_date) updates.submission_date = new Date().toISOString();
      if (note) updates.notes = note;

      db.updateById('saved_tenders', saved.id, updates);
      saved = db.findById('saved_tenders', saved.id);
    }

    logAudit(userId, 'UPDATE_BID_STATUS', 'Tender', tender_id, {
      status,
      bid_amount,
      note
    });

    res.json({
      success: true,
      message: `Bid status successfully updated to ${status}.`,
      data: saved
    });
  } catch (err) {
    console.error('Update bid status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update bid status.' });
  }
};

// Get User Notifications / Alerts
exports.getAlerts = (req, res) => {
  try {
    const userId = req.user.id;
    const alerts = db.find('tender_alerts', a => a.user_id === userId);
    const unreadCount = alerts.filter(a => !a.is_read).length;

    // Enrich alerts with tender reference if applicable
    const enriched = alerts.map(a => {
      const tender = a.tender_id ? db.findById('tenders', a.tender_id) : null;
      return {
        ...a,
        tender_reference_no: tender ? tender.tender_reference_no : null
      };
    });

    res.json({
      success: true,
      unreadCount,
      data: enriched.reverse()
    });
  } catch (err) {
    console.error('Get alerts error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve alerts.' });
  }
};

// Mark Alert as Read
exports.markAlertRead = (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      db.update('tender_alerts', a => a.user_id === req.user.id, { is_read: true });
      return res.json({ success: true, message: 'All alerts marked as read.' });
    }

    db.updateById('tender_alerts', id, { is_read: true });
    res.json({ success: true, message: 'Alert marked as read.' });
  } catch (err) {
    console.error('Mark alert read error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark alert as read.' });
  }
};

// Smart Calendar Deadlines
exports.getCalendarEvents = (req, res) => {
  try {
    const userId = req.user.id;
    // Get all published tenders + user's saved status
    const tenders = db.find('tenders', t => t.status === 'published' || t.status === 'closing_soon');
    const savedTenderIds = new Set(db.find('saved_tenders', s => s.user_id === userId).map(s => s.tender_id));

    const events = tenders.map(tender => {
      const isSaved = savedTenderIds.has(tender.id);
      const closing = new Date(tender.closing_date);
      const now = new Date();
      const diffHours = (closing.getTime() - now.getTime()) / 3600000;

      let urgency = 'normal';
      if (diffHours < 0) urgency = 'closed';
      else if (diffHours <= 72) urgency = 'urgent'; // <= 3 days
      else if (diffHours <= 168) urgency = 'warning'; // <= 7 days

      return {
        id: tender.id,
        title: tender.title,
        reference_no: tender.tender_reference_no,
        date: tender.closing_date,
        opening_date: tender.opening_date,
        category: tender.category,
        estimated_value: tender.estimated_value,
        is_saved: isSaved,
        urgency,
        days_left: Math.max(0, Math.ceil(diffHours / 24))
      };
    });

    res.json({
      success: true,
      events
    });
  } catch (err) {
    console.error('Calendar events error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve calendar events.' });
  }
};

// Side-by-Side Tender Comparison (2 to 5 tenders)
exports.compareTenders = (req, res) => {
  try {
    const { tender_ids } = req.body; // array of IDs

    if (!Array.isArray(tender_ids) || tender_ids.length < 2 || tender_ids.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide between 2 and 5 tender IDs for side-by-side comparison.'
      });
    }

    const userId = req.user.id;
    const profile = db.findOne('company_profiles', p => p.user_id === userId);
    const preferences = db.findOne('user_preferences', p => p.user_id === userId);

    const comparisonItems = tender_ids.map(id => {
      const tender = db.findById('tenders', id);
      if (!tender) return null;

      const aiMatch = aiEngine.calculateMatchScore(profile, preferences, tender);
      const eligibility = aiEngine.checkEligibility(profile, tender);

      return {
        id: tender.id,
        reference_no: tender.tender_reference_no,
        title: tender.title,
        organization: tender.organization_name,
        category: tender.category,
        industry: tender.industry,
        location: `${tender.location_city}, ${tender.location_state}`,
        estimated_value: tender.estimated_value,
        emd_amount: tender.emd_amount,
        tender_fee: tender.tender_fee,
        closing_date: tender.closing_date,
        min_turnover_required: tender.min_turnover_required,
        min_experience_years: tender.min_experience_years,
        required_certifications: tender.required_certifications,
        ai_match_score: aiMatch.score,
        eligibility_status: eligibility.status,
        missing_criteria_count: eligibility.missingCriteria.length,
        reasons: aiMatch.reasons.slice(0, 2),
        gaps: aiMatch.gaps
      };
    }).filter(Boolean);

    logAudit(userId, 'COMPARE_TENDERS', 'TenderList', tender_ids.join(','));

    res.json({
      success: true,
      count: comparisonItems.length,
      data: comparisonItems
    });
  } catch (err) {
    console.error('Compare tenders error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate comparison matrix.' });
  }
};

// ==========================================
// 8. Relational Notifications (Section 13)
// ==========================================
exports.getNotifications = (req, res) => {
  try {
    const user = req.user;
    const notifs = db.find('notifications', n => n.user_id === user.id || (user.user_id && n.user_id === user.user_id));
    res.json({
      success: true,
      unreadCount: notifs.filter(n => !n.read_status).length,
      data: notifs.reverse()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

exports.markNotificationRead = (req, res) => {
  try {
    const { id } = req.params;
    db.updateById('notifications', id, { read_status: true });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

// ==========================================
// 9. Relational Documents Vault (Section 13)
// ==========================================
exports.getDocuments = (req, res) => {
  try {
    const user = req.user;
    let docs = [];
    if (user.role === 'super_admin') {
      docs = db.getTable('documents');
    } else {
      docs = db.find('documents', d => d.user_id === user.id || (user.user_id && d.user_id === user.user_id));
    }
    res.json({ success: true, data: docs.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
};

exports.uploadDocument = (req, res) => {
  try {
    const user = req.user;
    const { tender_id, bid_id, document_name } = req.body;
    const file = req.file;

    const newDoc = db.insert('documents', {
      user_id: user.user_id || user.id,
      tender_id: tender_id || null,
      bid_id: bid_id || null,
      document_name: document_name || (file ? file.originalname : 'Document.pdf'),
      file_path: file ? `/uploads/${file.filename}` : '/uploads/sample.pdf',
      uploaded_at: new Date().toISOString()
    });

    logAudit(user.user_id || user.id, `Uploaded Document: ${newDoc.document_name}`, 'Document', newDoc.id);
    res.status(201).json({ success: true, message: 'Document vaulted successfully.', data: newDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to upload document.' });
  }
};

exports.deleteDocument = (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const doc = db.findById('documents', id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (doc.user_id !== user.id && doc.user_id !== user.user_id && user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: '403 – Access Denied: You cannot delete another user\'s document.' });
    }

    db.deleteById('documents', id);
    logAudit(user.user_id || user.id, `Deleted Document: ${doc.document_name}`, 'Document', id);
    res.json({ success: true, message: 'Document removed from vault.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
};
