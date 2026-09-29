const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const { JWT_SECRET } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Generate Unique Formatted User ID (e.g. ADM001, AUTH001, BID001, VIEW001, EVAL001)
function generateUserId(role) {
  let prefix = 'BID';
  if (role === 'super_admin' || role === 'admin') prefix = 'ADM';
  else if (role === 'tender_authority' || role === 'authority') prefix = 'AUTH';
  else if (role === 'company_user' || role === 'bidder' || role === 'company') prefix = 'BID';
  else if (role === 'viewer') prefix = 'VIEW';
  else if (role === 'evaluator') prefix = 'EVAL';

  const users = db.getTable('users');
  let maxNum = 0;
  users.forEach(u => {
    if (u.user_id && u.user_id.startsWith(prefix)) {
      const numPart = parseInt(u.user_id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
    }
  });
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

// Generate JWT token with User ID and Role claims
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      user_id: user.user_id || user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department_id: user.department_id || null,
      organization_id: user.organization_id || null
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Create Secure Server-Side Session and Cookie (Regenerates session on login)
function createServerSession(user, req, res, rememberMe = false) {
  // Purge any existing session for this cookie/client to prevent session fixation
  const existingCookie = req.cookies?.tenderhub_session || req.headers?.['x-session-id'];
  if (existingCookie) {
    db.delete('sessions', s => s.session_token === existingCookie || s.session_id === existingCookie);
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const durationDays = rememberMe ? 30 : 1;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  db.insert('sessions', {
    user_id: user.id,
    account_user_id: user.user_id,
    role: user.role,
    session_token: sessionToken,
    session_id: sessionToken,
    expires_at: expiresAt,
    user_agent: req.headers['user-agent'] || '',
    ip_address: req.ip || req.connection?.remoteAddress || ''
  });

  // Set secure session cookie
  res.cookie('tenderhub_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: durationDays * 24 * 60 * 60 * 1000
  });

  return sessionToken;
}

// User Registration with Unique User ID Assignment
exports.register = (req, res) => {
  try {
    const { name, email, password, role = 'company_user', phone, organization_name, department_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    // Check if email already registered
    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Role restrictions: normal registration can only create company_user or request tender_authority
    let finalRole = role;
    if (role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super Admin accounts cannot be created via public registration.' });
    }

    let orgId = null;
    if (organization_name) {
      const org = db.insert('organizations', {
        name: organization_name,
        type: role === 'tender_authority' ? 'Government / PSU' : 'Corporate',
        verified: false
      });
      orgId = org.id;
    }

    const uniqueUserId = generateUserId(finalRole);
    const passwordHash = bcrypt.hashSync(password, 10);

    const user = db.insert('users', {
      user_id: uniqueUserId,
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: finalRole,
      department_id: department_id || null,
      phone: phone || '',
      status: 'active',
      is_active: true,
      organization_id: orgId
    });

    // If company_user, initialize company record and preferences
    if (finalRole === 'company_user') {
      db.insert('companies', {
        user_id: uniqueUserId,
        company_name: organization_name || name + ' Enterprises',
        registration_number: 'PENDING-REG-' + Date.now().toString().slice(-6),
        GST_number: 'PENDING',
        address: 'Registered Office',
        experience: '1 Year',
        verification_status: 'pending'
      });

      db.insert('company_profiles', {
        user_id: user.id,
        company_name: organization_name || name + ' Enterprises',
        annual_turnover: 10000000,
        years_of_experience: 1,
        certifications: [],
        state: 'Gujarat',
        city: 'Ahmedabad',
        industry_sectors: ['Information Technology'],
        core_capabilities: [],
        verified: false
      });

      db.insert('user_preferences', {
        user_id: user.id,
        categories: ['Information Technology'],
        locations: ['Gujarat'],
        min_value: 1000000,
        max_value: 100000000,
        keywords: [],
        max_deadline_days: 30,
        alert_email_enabled: true,
        alert_in_app_enabled: true
      });
    }

    // If tender_authority, create pending authority record
    if (finalRole === 'tender_authority') {
      db.insert('tender_authorities', {
        user_id: user.id,
        organization_id: orgId,
        department_id: department_id || null,
        designation: 'Officer',
        approval_status: 'pending'
      });
    }

    logAudit(user.user_id || user.id, 'USER_REGISTERED', 'User', user.id, { email: user.email, role: user.role });

    const sessionId = createServerSession(user, req, res, false);
    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.status(201).json({
      success: true,
      message: `Registration successful! Assigned User ID: ${uniqueUserId}`,
      token,
      sessionId,
      user: safeUser
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// User Login (Supports Email OR Unique User ID / Username + Session & Token Generation)
exports.login = (req, res) => {
  try {
    const { email, password, remember_me, rememberMe } = req.body;
    const identifier = (req.body.email || req.body.username || req.body.user_id || req.body.identifier || '').trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email or User ID and password are required.' });
    }

    // Find user by either email OR unique user_id
    const user = db.findOne('users', u => {
      const matchEmail = u.email && u.email.toLowerCase() === identifier;
      const matchUserId = u.user_id && u.user_id.toLowerCase() === identifier;
      return matchEmail || matchUserId;
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User ID or Email not found.' });
    }

    // Account status verification
    if (!user.is_active || user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This account has been deactivated or suspended. Please contact support.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    // Create authenticated server session & cookie
    const isRemembered = Boolean(remember_me || rememberMe);
    const sessionId = createServerSession(user, req, res, isRemembered);
    const token = generateToken(user);

    logAudit(user.user_id || user.id, 'USER_LOGIN', 'User', user.id, {
      user_id: user.user_id,
      email: user.email,
      auth_type: 'Session + Token'
    });

    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: `Login successful! Authenticated as ${user.name} (${user.user_id})`,
      token,
      sessionId,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// Quick Demo Login (Seamless 1-click viva/demo switching)
exports.demoLogin = (req, res) => {
  try {
    const { role } = req.body;
    let targetUserId;
    switch (role) {
      case 'super_admin':
        targetUserId = 'ADM001';
        break;
      case 'tender_authority':
        targetUserId = 'AUTH001';
        break;
      case 'company_user':
        targetUserId = 'BID001';
        break;
      case 'viewer':
        targetUserId = 'VIEW001';
        break;
      case 'evaluator':
        targetUserId = 'EVAL001';
        break;
      default:
        targetUserId = 'BID001';
    }

    const user = db.findOne('users', u => u.user_id === targetUserId || u.role === role);
    if (!user) {
      return res.status(404).json({ success: false, message: `Demo account for role '${role}' not found. Please re-seed database.` });
    }

    const sessionId = createServerSession(user, req, res, true);
    const token = generateToken(user);

    logAudit(user.user_id || user.id, 'DEMO_LOGIN_SWITCH', 'User', user.id, { role: user.role, user_id: user.user_id });

    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: `Switched session to ${user.name} (${user.user_id} – ${user.role})`,
      token,
      sessionId,
      user: safeUser
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ success: false, message: 'Failed to switch demo account.' });
  }
};

// User Logout (Destroys Server Session & Clears Cookies)
exports.logout = (req, res) => {
  try {
    const sessionToken = req.cookies?.tenderhub_session || req.headers['x-session-id'];
    if (sessionToken) {
      db.delete('sessions', s => s.session_token === sessionToken || s.session_id === sessionToken);
    }

    res.clearCookie('tenderhub_session');

    if (req.user) {
      logAudit(req.user.user_id || req.user.id, 'USER_LOGOUT', 'User', req.user.id, {
        message: 'Active session destroyed successfully'
      });
    }

    res.json({ success: true, message: 'Logged out successfully. Session terminated.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

// Forgot Password – Generates a 6-Digit Verification Code
exports.forgotPassword = (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please provide your registered Email or User ID.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = db.findOne('users', u => {
      return (u.email && u.email.toLowerCase() === cleanId) ||
             (u.user_id && u.user_id.toLowerCase() === cleanId);
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with that Email or User ID.' });
    }

    if (!user.is_active || user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact administrator.' });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    db.insert('password_resets', {
      user_id: user.user_id || user.id,
      reset_code: resetCode,
      expires_at: expiresAt,
      used: false
    });

    logAudit(user.user_id || user.id, 'PASSWORD_RESET_REQUESTED', 'User', user.id, {
      email: user.email,
      user_id: user.user_id
    });

    res.json({
      success: true,
      message: 'Password reset code generated successfully (valid for 15 minutes).',
      reset_code: resetCode, // Returned for instant viva/demo verification without SMTP setup
      user_id: user.user_id,
      email: user.email
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Error initiating password reset.' });
  }
};

// Reset Password – Validates Reset Code and Sets New Encrypted Password
exports.resetPassword = (req, res) => {
  try {
    const { reset_code, new_password } = req.body;
    if (!reset_code || !new_password) {
      return res.status(400).json({ success: false, message: 'Reset code and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanCode = reset_code.trim();
    const now = Date.now();

    const resetRecord = db.findOne('password_resets', r => {
      return r.reset_code === cleanCode && !r.used && new Date(r.expires_at).getTime() > now;
    });

    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset code.' });
    }

    const user = db.findOne('users', u => u.user_id === resetRecord.user_id || u.id === resetRecord.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Associated user account not found.' });
    }

    const passwordHash = bcrypt.hashSync(new_password, 10);
    db.updateById('users', user.id, {
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    });

    // Mark reset code as used
    db.updateById('password_resets', resetRecord.id, {
      used: true
    });

    logAudit(user.user_id || user.id, 'PASSWORD_RESET_COMPLETED', 'User', user.id, {
      email: user.email,
      user_id: user.user_id
    });

    res.json({
      success: true,
      message: `Password has been reset successfully for ${user.user_id}! You can now log in.`
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Error resetting password.' });
  }
};

// Get Current User Profile, Company Details & Preferences
exports.getCurrentUser = (req, res) => {
  try {
    const user = req.user;
    const { password_hash, ...safeUser } = user;

    let companyProfile = null;
    let userPreferences = null;
    let organization = null;
    let authorityRecord = null;

    if (user.role === 'company_user') {
      companyProfile = db.findOne('company_profiles', p => p.user_id === user.id);
      userPreferences = db.findOne('user_preferences', p => p.user_id === user.id);
    }

    if (user.organization_id) {
      organization = db.findById('organizations', user.organization_id);
    }

    if (user.role === 'tender_authority') {
      authorityRecord = db.findOne('tender_authorities', a => a.user_id === user.id);
    }

    res.json({
      success: true,
      user: safeUser,
      companyProfile,
      userPreferences,
      organization,
      authorityRecord
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving profile data.' });
  }
};

// Update Company Profile
exports.updateCompanyProfile = (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    let profile = db.findOne('company_profiles', p => p.user_id === userId);
    if (profile) {
      db.updateById('company_profiles', profile.id, {
        company_name: updates.company_name ?? profile.company_name,
        pan_number: updates.pan_number ?? profile.pan_number,
        gst_number: updates.gst_number ?? profile.gst_number,
        annual_turnover: Number(updates.annual_turnover ?? profile.annual_turnover),
        years_of_experience: Number(updates.years_of_experience ?? profile.years_of_experience),
        certifications: updates.certifications ?? profile.certifications,
        state: updates.state ?? profile.state,
        city: updates.city ?? profile.city,
        industry_sectors: updates.industry_sectors ?? profile.industry_sectors,
        core_capabilities: updates.core_capabilities ?? profile.core_capabilities
      });
      profile = db.findById('company_profiles', profile.id);
    } else {
      profile = db.insert('company_profiles', {
        user_id: userId,
        ...updates
      });
    }

    logAudit(userId, 'UPDATE_COMPANY_PROFILE', 'CompanyProfile', profile.id);
    res.json({ success: true, message: 'Company profile updated successfully!', companyProfile: profile });
  } catch (err) {
    console.error('Update company profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update company profile.' });
  }
};

// Update User Preferences
exports.updatePreferences = (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    let pref = db.findOne('user_preferences', p => p.user_id === userId);
    if (pref) {
      db.updateById('user_preferences', pref.id, {
        categories: updates.categories ?? pref.categories,
        locations: updates.locations ?? pref.locations,
        min_value: Number(updates.min_value ?? pref.min_value),
        max_value: Number(updates.max_value ?? pref.max_value),
        keywords: updates.keywords ?? pref.keywords,
        max_deadline_days: Number(updates.max_deadline_days ?? pref.max_deadline_days),
        alert_email_enabled: updates.alert_email_enabled ?? pref.alert_email_enabled,
        alert_in_app_enabled: updates.alert_in_app_enabled ?? pref.alert_in_app_enabled
      });
      pref = db.findById('user_preferences', pref.id);
    } else {
      pref = db.insert('user_preferences', {
        user_id: userId,
        ...updates
      });
    }

    logAudit(userId, 'UPDATE_PREFERENCES', 'UserPreferences', pref.id);
    res.json({ success: true, message: 'Preferences updated successfully!', userPreferences: pref });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ success: false, message: 'Failed to update preferences.' });
  }
};
