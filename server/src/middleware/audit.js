const db = require('../db/db');

function formatRoleLabel(role) {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'tender_authority': return 'Tender Authority';
    case 'company_user': return 'Company / Bidder';
    case 'viewer': return 'Viewer';
    case 'evaluator': return 'Technical Evaluator';
    default: return 'System User';
  }
}

function formatDatePretty(isoDate = new Date().toISOString()) {
  const d = new Date(isoDate);
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  return d.toLocaleString('en-IN', options);
}

function logAudit(userId, action, entityType, entityId, details = {}, ip = '127.0.0.1', device = 'Web Client') {
  try {
    let userName = 'System Automator';
    let userRole = 'System';
    let userUniqueId = 'SYS001';

    if (userId && userId !== 'ANONYMOUS') {
      const user = db.findById('users', userId);
      if (user) {
        userUniqueId = user.user_id || userId;
        userName = user.name ? user.name.split(' (')[0] : 'Authorized User';
        userRole = formatRoleLabel(user.role);
      }
    }

    // Determine related tender if available
    let relatedTender = details.tender_reference_no || details.reference_no || details.related_tender || '';
    if (!relatedTender && entityType === 'Tender' && entityId) {
      const tender = db.findById('tenders', entityId);
      if (tender) {
        relatedTender = tender.tender_reference_no;
      }
    }

    const prettyTimestamp = formatDatePretty();

    // Standardized enterprise audit entry incorporating User ID (e.g. AUTH001 / ADM001)
    let formattedEntry = `${userUniqueId} (${userName} – ${userRole}) – ${action}`;
    if (relatedTender) {
      formattedEntry += ` #${relatedTender.replace('#', '')}`;
    }
    formattedEntry += ` – ${prettyTimestamp}`;

    return db.insert('audit_logs', {
      user_id: userUniqueId,
      user_db_id: userId || 'ANONYMOUS',
      user_name: userName,
      user_role: userRole,
      action,
      entity_type: entityType,
      entity_id: String(entityId || ''),
      related_tender: relatedTender,
      details,
      ip_address: ip,
      device_info: device,
      formatted_entry: formattedEntry,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}

module.exports = { logAudit, formatRoleLabel, formatDatePretty };
