// AI E-Tender Platform Core Server
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const apiRoutes = require('./routes/api');
const db = require('./db/db');

// Auto-seed database on startup if empty (handles fresh Render.com deploys)
const autoSeed = () => {
  try {
    const users = db.getTable('users');
    if (!users || users.length === 0) {
      console.log('📦 Empty database detected — running auto-seed...');
      require('./db/seed')();
      console.log('✅ Auto-seed complete. Demo accounts ready.');
    }
  } catch (err) {
    console.error('⚠️  Auto-seed failed:', err.message);
  }
};
autoSeed();


const app = express();
const PORT = process.env.PORT || 5000;

// Enterprise Security Headers to prevent clickjacking, MIME sniffing, data theft & scraping
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
});

// Anti-Scraping & Rate Limiting Protection Middleware
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 120; // 120 reqs/min max

app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  let clientRecord = requestCounts.get(clientIp);
  if (!clientRecord || (now - clientRecord.startTime) > RATE_LIMIT_WINDOW_MS) {
    clientRecord = { count: 1, startTime: now };
    requestCounts.set(clientIp, clientRecord);
  } else {
    clientRecord.count++;
  }

  // Prevent automated bulk data scraping
  if (clientRecord.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded: Too many requests. Automated data scraping & harvesting is prohibited by security policy.',
      retryAfterSeconds: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - clientRecord.startTime)) / 1000)
    });
  }

  next();
});

// Enable CORS with Credentials for frontend & API clients
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://tender-pmts.onrender.com',
  /\.vercel\.app$/,
  /\.netlify\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    const isAllowed = ALLOWED_ORIGINS.some(allowed =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );
    if (isAllowed) return callback(null, true);
    // Allow any localhost port for development
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(null, true); // Permissive for academic project
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

// Cookie Parser Middleware for Session Authentication
app.use((req, res, next) => {
  const cookies = {};
  const cookieHeader = req.headers?.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(c => {
      const parts = c.split('=');
      const key = parts[0]?.trim();
      if (key) {
        cookies[key] = decodeURIComponent(parts.slice(1).join('=').trim());
      }
    });
  }
  req.cookies = cookies;
  next();
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Root Route & Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AI E-Tender Platform API',
    version: '1.0.0',
    tenders_count: db.count('tenders'),
    users_count: db.count('users'),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res, next) => {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  if (require('fs').existsSync(clientDist)) {
    return res.sendFile(path.join(clientDist, 'index.html'));
  }
  res.json({
    status: 'online',
    service: 'AI E-Tender Platform API Backend',
    message: 'Backend server is running successfully.',
    health_check: '/api/health'
  });
});

// Mount Central API Routes
app.use('/api', apiRoutes);

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');

// Helper to extract authenticated user for page requests (via session cookie or header)
function getRequestUser(req) {
  const sessionToken = req.cookies?.tenderhub_session || req.headers['x-session-id'];
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.split(' ')[1];

  if (sessionToken) {
    const session = db.findOne('sessions', s => s.session_token === sessionToken || s.session_id === sessionToken);
    if (session && new Date(session.expires_at) > new Date()) {
      const user = db.findById('users', session.user_id) || db.findOne('users', u => u.user_id === session.user_id || u.id === session.user_id);
      if (user && user.is_active !== false && user.status !== 'suspended' && user.status !== 'inactive') {
        return user;
      }
    }
  }

  if (bearerToken) {
    try {
      const decoded = jwt.verify(bearerToken, JWT_SECRET);
      const user = db.findById('users', decoded.id) || db.findOne('users', u => u.user_id === decoded.user_id || u.id === decoded.id);
      if (user && user.is_active !== false && user.status !== 'suspended' && user.status !== 'inactive') {
        return user;
      }
    } catch (e) {}
  }

  return null;
}

// HTML 403 Forbidden error page generator for direct browser URL tampering
function render403Html(res, message, userRole, requiredRole) {
  res.status(403).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>403 Forbidden – Access Denied</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; max-width: 520px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { font-size: 1.8rem; margin: 0 0 10px; color: #f87171; }
    .badge { display: inline-block; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; font-size: 0.75rem; font-weight: 700; padding: 4px 12px; border-radius: 9999px; letter-spacing: 0.05em; margin-bottom: 16px; }
    p { font-size: 0.92rem; color: #94a3b8; line-height: 1.5; margin: 0 0 24px; }
    .btn { display: inline-block; background: #4f46e5; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.88rem; transition: background 0.15s; }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🛡️</div>
    <div class="badge">403 FORBIDDEN – RBAC ENFORCED</div>
    <h1>Access Denied</h1>
    <p>${message || 'You do not have permission to access this page.'}<br/><br/>
    Logged-in Role: <strong>${userRole || 'Unauthenticated'}</strong><br/>
    Required Role: <strong>${requiredRole || 'Authorized Role'}</strong></p>
    <a href="/" class="btn">Return to Home Dashboard</a>
  </div>
</body>
</html>`);
}

// Serve Frontend Build if available
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (require('fs').existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // Route Protection for Direct URL Navigation: /admin/*
  app.get(['/admin', '/admin/*'], (req, res, next) => {
    const user = getRequestUser(req);
    if (!user) {
      return res.redirect('/?login=true&redirect=' + encodeURIComponent(req.originalUrl));
    }
    const isAdmin = user.role === 'super_admin' || user.role === 'admin';
    if (!isAdmin) {
      return render403Html(res, 'Administrator privileges required. Your account does not have access to Admin Management.', user.role, 'Super Admin');
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });

  // Convenience redirects for dashboard shortcuts
  app.get(['/finance', '/sales', '/dashboard'], (req, res) => {
    res.redirect('/vendor' + req.path);
  });

  // Route Protection for Direct URL Navigation: /vendor/*
  app.get(['/vendor', '/vendor/*'], (req, res, next) => {
    const user = getRequestUser(req);
    if (!user) {
      return res.redirect('/?login=true&redirect=' + encodeURIComponent(req.originalUrl));
    }
    const isVendor = user.role === 'company_user' || user.role === 'vendor' || user.role === 'company' || user.role === 'super_admin';
    if (!isVendor) {
      return render403Html(res, 'Vendor/Company privileges required.', user.role, 'Company / Bidder');
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });

  // Route Protection for Direct URL Navigation: /authority/*
  app.get(['/authority', '/authority/*'], (req, res, next) => {
    const user = getRequestUser(req);
    if (!user) {
      return res.redirect('/?login=true&redirect=' + encodeURIComponent(req.originalUrl));
    }
    const isAuthority = user.role === 'tender_authority' || user.role === 'authority' || user.role === 'super_admin';
    if (!isAuthority) {
      return render403Html(res, 'Tender Authority privileges required.', user.role, 'Tender Authority');
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });

  // Route Protection for Direct URL Navigation: /user/*
  app.get(['/user', '/user/*'], (req, res, next) => {
    const user = getRequestUser(req);
    if (!user) {
      return res.redirect('/?login=true&redirect=' + encodeURIComponent(req.originalUrl));
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AI E-Tender Platform Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Application URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);

  if (process.env.OPEN_BROWSER === 'true') {
    const url = `http://localhost:${PORT}`;
    const startCmd = process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
    require('child_process').exec(startCmd, (err) => {
      if (err) {
        console.error('Notice: Could not automatically open browser:', err.message);
      }
    });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️  Port ${PORT} is already in use by another process.`);
    console.error(`   Freeing port or please close the existing server window.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

module.exports = { app, server };
