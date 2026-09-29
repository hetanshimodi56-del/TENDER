const jwt = require('jsonwebtoken');
const db = require('../db/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ai_etender_super_secret_jwt_key_2026';

// Helper to parse cookies from request header
function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

/**
 * Multi-layer Authentication Middleware
 * Supports:
 * 1. Token-Based Authentication (JWT Bearer Token for APIs)
 * 2. Secure Server-Side Session-Based Authentication (Session Cookie / X-Session-Id)
 * 3. User ID & Account Status Verification
 */
function authenticateToken(req, res, next) {
  const cookies = parseCookies(req);
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.split(' ')[1];
  const sessionCookie = cookies['tenderhub_session'] || req.headers['x-session-id'];

  let authenticatedUser = null;
  let authType = null;

  // Layer 1: Check Active Server-Side Session in Database
  if (sessionCookie) {
    const session = db.findOne('sessions', s => s.session_token === sessionCookie || s.session_id === sessionCookie);
    if (session) {
      const isExpired = new Date(session.expires_at) <= new Date();
      if (!isExpired) {
        const user = db.findById('users', session.user_id) || db.findOne('users', u => u.user_id === session.user_id || u.id === session.user_id);
        if (user) {
          authenticatedUser = user;
          authType = 'session';
          req.session = session;
        }
      } else {
        // Purge expired session
        db.delete('sessions', s => s.session_token === sessionCookie || s.session_id === sessionCookie);
      }
    }
  }

  // Layer 2: Check JWT Token for APIs
  if (!authenticatedUser && bearerToken) {
    try {
      const decoded = jwt.verify(bearerToken, JWT_SECRET);
      const user = db.findById('users', decoded.id) || db.findOne('users', u => u.user_id === decoded.user_id || u.id === decoded.id);
      if (user) {
        authenticatedUser = user;
        authType = 'jwt';
      }
    } catch (err) {
      // Token invalid or expired
    }
  }

  if (!authenticatedUser) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Unauthenticated. Please provide a valid session or authorization token.'
    });
  }

  // Account Status Verification
  if (authenticatedUser.is_active === false || authenticatedUser.status === 'inactive' || authenticatedUser.status === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Your account has been suspended or deactivated. Contact Super Admin.'
    });
  }

  // Attach enriched identity to request context
  req.user = authenticatedUser;
  req.userId = authenticatedUser.user_id || authenticatedUser.id; // Unique User ID (e.g. ADM001, AUTH001, BID001)
  req.userRole = authenticatedUser.role;
  req.authType = authType;

  next();
}

/**
 * Standard Role-Based Access Control (RBAC) Middleware
 * Checks if user's role has permission to access the endpoint with alias support
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
    }

    const userRole = req.user.role;
    // Map normalized roles
    const normalized = allowedRoles.flatMap(r => {
      if (r === 'admin' || r === 'super_admin') return ['admin', 'super_admin'];
      if (r === 'vendor' || r === 'company' || r === 'company_user' || r === 'bidder') return ['company_user', 'vendor', 'company', 'bidder'];
      if (r === 'authority' || r === 'tender_authority') return ['tender_authority', 'authority'];
      if (r === 'user' || r === 'viewer') return ['viewer', 'user'];
      return [r];
    });

    if (!normalized.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `403 – Access Denied: Role '${userRole}' is not authorized to access this resource.`
      });
    }
    next();
  };
}

/**
 * Dedicated Admin Middleware (Guards Admin-only APIs & Actions)
 */
function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: `403 Forbidden: Administrator access required. Your role '${req.user.role}' is not authorized.`
    });
  }
  next();
}

/**
 * Dedicated Vendor / Company Middleware
 */
function vendorMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }
  const isVendor = ['company_user', 'vendor', 'company', 'bidder', 'super_admin', 'admin'].includes(req.user.role);
  if (!isVendor) {
    return res.status(403).json({
      success: false,
      message: `403 Forbidden: Vendor/Company access required. Your role '${req.user.role}' is not authorized.`
    });
  }
  next();
}

/**
 * Dedicated Tender Authority Middleware
 */
function authorityMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }
  const isAuthority = ['tender_authority', 'authority', 'super_admin', 'admin', 'company_user', 'vendor', 'company'].includes(req.user.role);
  if (!isAuthority) {
    return res.status(403).json({
      success: false,
      message: `403 Forbidden: Tender Authority access required. Your role '${req.user.role}' is not authorized.`
    });
  }
  next();
}

/**
 * Dedicated User Middleware (Validates Authenticated User)
 */
function userMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }
  next();
}

/**
 * User ID & Ownership-Based Data Access Middleware
 * Protects against Insecure Direct Object References (IDOR).
 * Ensures users only access records they own or are authorized by department.
 */
function requireOwnership(entityType, paramKey = 'id') {
  return (req, res, next) => {
    const user = req.user;
    const entityId = req.params[paramKey];

    // Super Admin has global override
    if (user.role === 'super_admin') {
      return next();
    }

    if (entityType === 'Bid') {
      const bid = db.findById('bids', entityId);
      if (!bid) {
        return res.status(404).json({ success: false, message: 'Bid record not found.' });
      }

      // Company/Bidder can only access their own bid
      if (user.role === 'company_user') {
        const isOwner = bid.user_id === user.id || bid.user_id === user.user_id;
        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: '403 – Access Denied: You do not have ownership permission to view or modify this bid.'
          });
        }
      }

      // Tender Authority can only view bids belonging to their department
      if (user.role === 'tender_authority') {
        const tender = db.findById('tenders', bid.tender_id);
        if (tender) {
          const isDeptAuthorized = 
            tender.department_id === user.department_id ||
            tender.organization_id === user.organization_id ||
            tender.created_by === user.id ||
            tender.authority_user_id === user.user_id;

          if (!isDeptAuthorized) {
            return res.status(403).json({
              success: false,
              message: '403 – Access Denied: You cannot evaluate bids for another department.'
            });
          }
        }
      }
    }

    if (entityType === 'Tender') {
      const tender = db.findById('tenders', entityId);
      if (!tender) {
        return res.status(404).json({ success: false, message: 'Tender record not found.' });
      }

      // Tender Authority can only edit their own department's tenders
      if (user.role === 'tender_authority') {
        const isDeptAuthorized = 
          tender.department_id === user.department_id ||
          tender.organization_id === user.organization_id ||
          tender.created_by === user.id ||
          tender.authority_user_id === user.user_id;

        if (!isDeptAuthorized) {
          return res.status(403).json({
            success: false,
            message: '403 – Access Denied: You are not authorized to modify tenders belonging to another department.'
          });
        }
      }
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authMiddleware: authenticateToken,
  adminMiddleware,
  vendorMiddleware,
  userMiddleware,
  authorityMiddleware,
  requireRole,
  requireOwnership,
  parseCookies,
  JWT_SECRET
};
