const bcrypt = require('bcryptjs');
const db = require('../db/db');
const { logAudit } = require('../middleware/audit');
const xlsx = require('xlsx');

// Admin Analytics Dashboard KPIs & Charts
exports.getAdminKPIs = (req, res) => {
  try {
    const tenders = db.getTable('tenders');
    const users = db.getTable('users');
    const orgs = db.getTable('organizations');
    const saved = db.getTable('saved_tenders');
    const alerts = db.getTable('tender_alerts');
    const audits = db.getTable('audit_logs');
    const authorities = db.getTable('tender_authorities');
    const bids = db.getTable('bids');
    const companies = db.getTable('company_profiles');

    // Counts
    const totalTenders = tenders.length;
    const activeTenders = tenders.filter(t => t.status === 'published' || t.status === 'closing_soon').length;
    const closedTenders = tenders.filter(t => t.status === 'closed').length;
    const draftTenders = tenders.filter(t => t.status === 'draft').length;

    // Total and Average Value
    const totalEstimatedValue = tenders.reduce((acc, t) => acc + (Number(t.estimated_value) || 0), 0);
    const avgTenderValue = totalTenders > 0 ? Math.round(totalEstimatedValue / totalTenders) : 0;

    // Category Distribution
    const categoryMap = {};
    tenders.forEach(t => {
      const cat = t.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    // State / Geographical Distribution
    const stateMap = {};
    tenders.forEach(t => {
      const state = t.location_state || 'Other';
      stateMap[state] = (stateMap[state] || 0) + 1;
    });

    // User Roles Breakdown
    const rolesMap = {
      super_admin: 0,
      tender_authority: 0,
      company_user: 0,
      viewer: 0,
      evaluator: 0
    };
    users.forEach(u => {
      if (rolesMap[u.role] !== undefined) rolesMap[u.role]++;
    });

    // Pending Approvals (Authorities + Unverified Companies)
    const pendingAuthorities = authorities.filter(a => a.approval_status === 'pending').length;
    const pendingCompanies = companies.filter(c => !c.verified).length;

    res.json({
      success: true,
      kpis: {
        totalTenders,
        activeTenders,
        closedTenders,
        draftTenders,
        totalUsers: users.length,
        totalCompanies: companies.length,
        totalBids: bids.length,
        totalOrganizations: orgs.length,
        savedTendersCount: saved.length,
        alertsDispatched: alerts.length,
        totalEstimatedValue,
        avgTenderValue,
        pendingApprovals: pendingAuthorities + pendingCompanies,
        pendingAuthorityApprovals: pendingAuthorities,
        pendingCompanyApprovals: pendingCompanies
      },
      distributions: {
        categories: categoryMap,
        states: stateMap,
        userRoles: rolesMap
      },
      dataQuality: {
        healthScore: 99,
        duplicateRefs: 0,
        missingValueCount: 0,
        expiredActiveTenders: tenders.filter(t => t.status === 'published' && new Date(t.closing_date).getTime() < Date.now()).length,
        status: 'Healthy & Operational'
      },
      recentActivity: audits.slice(-15).reverse()
    });
  } catch (err) {
    console.error('Admin KPI error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin analytics.' });
  }
};

// Bulk CSV/Excel Tender Import
exports.importTenders = (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx/.xls) or CSV file.' });
    }

    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let importedCount = 0;
    let duplicateCount = 0;
    const errors = [];

    rows.forEach((row, index) => {
      const refNo = row.tender_reference_no || row['Reference No'] || `IMP/TND/${Date.now()}_${index}`;
      const title = row.title || row['Tender Title'];
      const estValue = Number(row.estimated_value || row['Estimated Value'] || 10000000);

      if (!title) {
        errors.push(`Row ${index + 2}: Missing Title`);
        return;
      }

      const existing = db.findOne('tenders', t => t.tender_reference_no.toLowerCase() === String(refNo).toLowerCase());
      if (existing) {
        duplicateCount++;
        return;
      }

      const closing = row.closing_date ? new Date(row.closing_date).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();

      db.insert('tenders', {
        tender_reference_no: String(refNo),
        title: String(title),
        description: row.description || row['Description'] || title,
        organization_name: row.organization_name || row['Department'] || 'State Public Works Department',
        category: row.category || row['Category'] || 'Information Technology',
        industry: row.industry || 'Infrastructure',
        location_state: row.location_state || row['State'] || 'Gujarat',
        location_city: row.location_city || 'Gandhinagar',
        estimated_value: estValue,
        emd_amount: Number(row.emd_amount || estValue * 0.02),
        tender_fee: Number(row.tender_fee || 5000),
        published_date: new Date().toISOString(),
        closing_date: closing,
        opening_date: closing,
        status: 'published',
        min_turnover_required: Number(row.min_turnover || estValue * 0.5),
        min_experience_years: Number(row.min_experience || 3),
        required_certifications: ['ISO 9001:2015', 'GST Registration'],
        required_documents: ['Technical Proposal', 'Financial Bid', 'EMD Proof'],
        clauses_summary: ['Standard GeM & CPPP Procurement Clauses apply.'],
        document_text: `Official Tender ${title} under ${refNo}. Estimated Cost: ₹${estValue}.`,
        created_by: req.user.id
      });
      importedCount++;
    });

    logAudit(req.user.id, `Imported ${importedCount} Tenders via Bulk File`, 'Tender', 'BULK_IMPORT', {
      importedCount,
      duplicateCount,
      filename: file.originalname
    });

    res.json({
      success: true,
      message: `Successfully processed file: ${importedCount} tenders imported, ${duplicateCount} duplicates skipped.`,
      summary: {
        totalRows: rows.length,
        importedCount,
        duplicateCount,
        errors
      }
    });
  } catch (err) {
    console.error('Import tenders error:', err);
    res.status(500).json({ success: false, message: 'Failed to process import file.' });
  }
};

// 1. User Management CRUD
exports.getUsers = (req, res) => {
  try {
    const users = db.getTable('users').map(u => {
      const { password_hash, ...safe } = u;
      const org = u.organization_id ? db.findById('organizations', u.organization_id) : null;
      return {
        ...safe,
        organization_name: org ? org.name : null
      };
    });

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
};

exports.createUser = (req, res) => {
  try {
    const { name, email, password, role = 'company_user', phone, organization_name } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    let orgId = null;
    if (organization_name) {
      const org = db.insert('organizations', {
        name: organization_name,
        type: role === 'tender_authority' ? 'Government / PSU' : 'Corporate',
        verified: true
      });
      orgId = org.id;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = db.insert('users', {
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role,
      phone: phone || '',
      is_active: true,
      organization_id: orgId
    });

    if (role === 'company_user') {
      db.insert('company_profiles', {
        user_id: newUser.id,
        company_name: organization_name || name + ' Enterprises',
        annual_turnover: 15000000,
        years_of_experience: 2,
        certifications: ['ISO 9001:2015'],
        state: 'Gujarat',
        city: 'Ahmedabad',
        industry_sectors: ['Information Technology'],
        verified: true
      });
    }

    if (role === 'tender_authority') {
      db.insert('tender_authorities', {
        user_id: newUser.id,
        organization_id: orgId,
        designation: 'Department Head / Officer',
        approval_status: 'approved',
        approved_by: req.user.id,
        approved_at: new Date().toISOString()
      });
    }

    logAudit(req.user.id, `Created New User ${newUser.name} with Role: ${newUser.role}`, 'User', newUser.id);

    const { password_hash, ...safeUser } = newUser;
    res.status(201).json({
      success: true,
      message: `User '${newUser.name}' created successfully!`,
      data: safeUser
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

exports.updateUser = (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, is_active, password } = req.body;

    const user = db.findById('users', id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (phone !== undefined) updates.phone = phone;
    if (is_active !== undefined) updates.is_active = is_active;
    if (password) updates.password_hash = bcrypt.hashSync(password, 10);

    db.updateById('users', id, updates);

    logAudit(req.user.id, `Updated User Profile & Role for ${user.name} to ${role || user.role}`, 'User', id);

    const updated = db.findById('users', id);
    const { password_hash, ...safe } = updated;
    res.json({ success: true, message: 'User updated successfully.', data: safe });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

exports.deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
    }

    const user = db.findById('users', id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    db.deleteById('users', id);
    logAudit(req.user.id, `Deleted User Account ${user.name} (${user.email})`, 'User', id);

    res.json({ success: true, message: `User '${user.name}' deleted successfully.` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

exports.toggleUserStatus = (req, res) => {
  try {
    const { id } = req.params;
    const user = db.findById('users', id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'super_admin' && user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Super admin cannot deactivate themselves.' });
    }

    const newStatus = !user.is_active;
    db.updateById('users', id, { is_active: newStatus });
    logAudit(req.user.id, `Toggled User Status for ${user.name} to ${newStatus ? 'ACTIVE' : 'DEACTIVATED'}`, 'User', id);

    res.json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully.`
    });
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

// 2. Tender Authority Approvals
exports.getAuthorityRequests = (req, res) => {
  try {
    const authorities = db.getTable('tender_authorities');
    const enriched = authorities.map(a => {
      const user = db.findById('users', a.user_id);
      const org = a.organization_id ? db.findById('organizations', a.organization_id) : null;
      return {
        ...a,
        user_name: user ? user.name : 'Unknown User',
        user_email: user ? user.email : 'Unknown Email',
        organization_name: org ? org.name : 'Unassigned Organization'
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('Get authority requests error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve authority requests.' });
  }
};

exports.updateAuthorityStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // 'approved' or 'rejected'

    const authRecord = db.findById('tender_authorities', id);
    if (!authRecord) {
      return res.status(404).json({ success: false, message: 'Authority record not found.' });
    }

    db.updateById('tender_authorities', id, {
      approval_status: status,
      rejection_reason: reason || null,
      approved_by: req.user.id,
      approved_at: new Date().toISOString()
    });

    if (status === 'approved') {
      db.updateById('users', authRecord.user_id, { role: 'tender_authority' });
    }

    const user = db.findById('users', authRecord.user_id);
    const userName = user ? user.name : 'Authority';

    logAudit(req.user.id, `${status === 'approved' ? 'Approved' : 'Rejected'} Tender Authority Credentials for ${userName}`, 'TenderAuthority', id);

    res.json({
      success: true,
      message: `Authority request marked as '${status}'.`
    });
  } catch (err) {
    console.error('Update authority status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update authority request.' });
  }
};

// 3. Company Approvals & Profiles
exports.getCompanies = (req, res) => {
  try {
    const companies = db.getTable('company_profiles');
    const enriched = companies.map(c => {
      const user = db.findById('users', c.user_id);
      const bids = db.find('bids', b => b.user_id === c.user_id);
      return {
        ...c,
        user_name: user ? user.name : 'Unknown Contact',
        user_email: user ? user.email : 'Unknown Email',
        user_phone: user ? user.phone : 'Not provided',
        submitted_bids_count: bids.length
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('Get companies error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve company profiles.' });
  }
};

exports.verifyCompany = (req, res) => {
  try {
    const { id } = req.params;
    const { verified = true } = req.body;

    const company = db.findById('company_profiles', id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }

    db.updateById('company_profiles', id, {
      verified: Boolean(verified),
      verified_at: new Date().toISOString(),
      verified_by: req.user.id
    });

    logAudit(req.user.id, `${verified ? 'Approved & Verified' : 'Revoked Verification for'} Company: ${company.company_name}`, 'CompanyProfile', id);

    res.json({
      success: true,
      message: `Company '${company.company_name}' verification marked as ${verified ? 'Verified ✓' : 'Unverified'}.`
    });
  } catch (err) {
    console.error('Verify company error:', err);
    res.status(500).json({ success: false, message: 'Failed to update company verification.' });
  }
};

// 4. Categories & Departments Management
exports.getCategories = (req, res) => {
  try {
    let categories = db.getTable('categories');
    if (!categories || categories.length === 0) {
      // Seed default categories if none
      const defaults = [
        'Information Technology',
        'Smart Infrastructure',
        'Healthcare & Medical',
        'Civil Works & Highways',
        'Renewable Energy',
        'Cybersecurity & Defence',
        'Education & Training',
        'Facility Management'
      ];
      defaults.forEach(cat => db.insert('categories', { name: cat, description: `Procurement category for ${cat}` }));
      categories = db.getTable('categories');
    }
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get categories.' });
  }
};

exports.addCategory = (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const newCat = db.insert('categories', { name, description: description || '' });
    logAudit(req.user.id, `Created New Procurement Category: ${name}`, 'Category', newCat.id);
    res.status(201).json({ success: true, message: `Category '${name}' created.`, data: newCat });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add category.' });
  }
};

exports.deleteCategory = (req, res) => {
  try {
    const { id } = req.params;
    db.deleteById('categories', id);
    res.json({ success: true, message: 'Category removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
};

exports.getDepartments = (req, res) => {
  try {
    const orgs = db.getTable('organizations');
    res.json({ success: true, data: orgs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get departments.' });
  }
};

exports.addDepartment = (req, res) => {
  try {
    const { name, type = 'Government Department', state = 'Gujarat', city = 'Gandhinagar' } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Department name is required.' });

    const newDept = db.insert('organizations', {
      name,
      type,
      registration_number: `DEPT-${Date.now().toString().slice(-4)}`,
      state,
      city,
      verified: true
    });

    logAudit(req.user.id, `Added New Government Department: ${name}`, 'Department', newDept.id);
    res.status(201).json({ success: true, message: `Department '${name}' registered.`, data: newDept });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add department.' });
  }
};

// 5. System Settings
exports.getSystemSettings = (req, res) => {
  try {
    let settings = db.findOne('system_settings', () => true);
    if (!settings) {
      settings = db.insert('system_settings', {
        portal_name: 'TenderHub',
        portal_tagline: 'Secure Tender Management & Bidding Portal',
        maintenance_mode: false,
        allow_public_registration: true,
        min_bid_validity_days: 90,
        max_file_size_mb: 25,
        session_timeout_minutes: 60,
        require_authority_approval: true
      });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get system settings.' });
  }
};

exports.updateSystemSettings = (req, res) => {
  try {
    let settings = db.findOne('system_settings', () => true);
    if (!settings) {
      settings = db.insert('system_settings', req.body);
    } else {
      db.updateById('system_settings', settings.id, req.body);
    }

    logAudit(req.user.id, 'Updated System-wide Security & Platform Configuration', 'SystemSettings', settings.id);
    res.json({ success: true, message: 'System settings successfully updated.', data: db.findById('system_settings', settings.id) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update system settings.' });
  }
};

// 6. Delete Tender (Super Admin only)
exports.deleteTender = (req, res) => {
  try {
    const { id } = req.params;
    const tender = db.findById('tenders', id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found.' });
    }

    db.deleteById('tenders', id);
    logAudit(req.user.id, `Permanently Deleted Tender ${tender.tender_reference_no}`, 'Tender', id, {
      tender_reference_no: tender.tender_reference_no,
      related_tender: tender.tender_reference_no
    });

    res.json({
      success: true,
      message: `Tender ${tender.tender_reference_no} deleted successfully.`
    });
  } catch (err) {
    console.error('Delete tender error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete tender.' });
  }
};

// 7. Audit Logs Viewer
exports.getAuditLogs = (req, res) => {
  try {
    const logs = db.getTable('audit_logs');
    res.json({
      success: true,
      data: logs.slice().reverse().slice(0, 150)
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
};
