const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { 
  authenticateToken, 
  authMiddleware, 
  adminMiddleware, 
  vendorMiddleware, 
  userMiddleware, 
  authorityMiddleware, 
  requireRole 
} = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const tenderCtrl = require('../controllers/tenderController');
const eligibilityCtrl = require('../controllers/eligibilityController');
const aiCtrl = require('../controllers/aiController');
const userCtrl = require('../controllers/userFeaturesController');
const adminCtrl = require('../controllers/adminController');
const evalCtrl = require('../controllers/evaluatorController');
const taskCtrl = require('../controllers/taskController');
const bidCtrl = require('../controllers/bidController');

// Multer storage for uploads
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv', '.pdf', '.docx', '.png', '.jpg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: xlsx, xls, csv, pdf, docx.'));
    }
  }
});

/* ==========================================================================
   1. AUTHENTICATION & USER MANAGEMENT
   ========================================================================== */
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/logout', authCtrl.logout);
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/reset-password', authCtrl.resetPassword);
router.post('/auth/demo-login', authCtrl.demoLogin);
router.get('/auth/me', authMiddleware, authCtrl.getCurrentUser);
router.put('/user/profile', authMiddleware, authCtrl.updateCompanyProfile);
router.put('/user/preferences', authMiddleware, authCtrl.updatePreferences);

// Notifications & Document Vault (Section 13)
router.get('/notifications', authMiddleware, userCtrl.getNotifications);
router.patch('/notifications/:id/read', authMiddleware, userCtrl.markNotificationRead);
router.get('/documents', authMiddleware, userCtrl.getDocuments);
router.post('/documents', authMiddleware, upload.single('file'), userCtrl.uploadDocument);
router.delete('/documents/:id', authMiddleware, userCtrl.deleteDocument);

/* ==========================================================================
   2. TENDERS & DISCOVERY
   ========================================================================== */
// Optional auth to attach user personalized match scores
router.get('/tenders', (req, res, next) => {
  if (req.headers['authorization'] || req.cookies?.tenderhub_session || req.headers['x-session-id']) {
    return authMiddleware(req, res, next);
  }
  next();
}, tenderCtrl.getTenders);

router.get('/tenders/:id', (req, res, next) => {
  if (req.headers['authorization'] || req.cookies?.tenderhub_session || req.headers['x-session-id']) {
    return authMiddleware(req, res, next);
  }
  next();
}, tenderCtrl.getTenderById);

// Tender publishing and modification actions (Tender Authority & Super Admin only)
router.post('/tenders', authMiddleware, authorityMiddleware, tenderCtrl.createTender);
router.put('/tenders/:id', authMiddleware, authorityMiddleware, tenderCtrl.updateTender);
router.patch('/tenders/:id/status', authMiddleware, authorityMiddleware, tenderCtrl.updateTenderStatus);
router.get('/authority/tenders', authMiddleware, authorityMiddleware, tenderCtrl.getAuthorityTenders);

/* ==========================================================================
   3. BID MANAGEMENT & APPLICATION TRACKING (SECURE RBAC & ANTI-IDOR)
   ========================================================================== */
router.post('/bids', authMiddleware, requireRole('company_user', 'super_admin', 'viewer'), bidCtrl.submitBid);
router.get('/bids/my', authMiddleware, requireRole('company_user', 'super_admin', 'viewer'), bidCtrl.getMyBids);
router.get('/bids/department', authMiddleware, authorityMiddleware, bidCtrl.getDepartmentBids);
router.get('/bids/all', authMiddleware, adminMiddleware, bidCtrl.getAllBids);
router.get('/bids/:id', authMiddleware, bidCtrl.getBidById);
router.patch('/bids/:id/evaluate', authMiddleware, authorityMiddleware, bidCtrl.evaluateBid);
router.post('/bids/:id/withdraw', authMiddleware, requireRole('company_user', 'super_admin', 'viewer'), bidCtrl.withdrawBid);

/* ==========================================================================
   4. TENDER TASKS & BID PREPARATION WORKFLOW
   ========================================================================== */
router.get('/tasks', authMiddleware, taskCtrl.getTasks);
router.post('/tasks', authMiddleware, taskCtrl.createTask);
router.patch('/tasks/:id', authMiddleware, taskCtrl.updateTask);
router.delete('/tasks/:id', authMiddleware, taskCtrl.deleteTask);

/* ==========================================================================
   5. AI RECOMMENDATION & MATCHING ENGINE
   ========================================================================== */
router.get('/recommendations/:tender_id', authMiddleware, aiCtrl.getTenderRecommendation);
router.post('/ai/ask', (req, res, next) => {
  // Allow ask endpoint with optional auth
  if (req.headers['authorization'] || req.cookies?.tenderhub_session || req.headers['x-session-id']) {
    return authMiddleware(req, res, next);
  }
  next();
}, aiCtrl.askTenderAI);
router.get('/ai/chat-history/:tender_id', (req, res, next) => {
  if (req.headers['authorization'] || req.cookies?.tenderhub_session || req.headers['x-session-id']) {
    return authMiddleware(req, res, next);
  }
  next();
}, aiCtrl.getTenderChatHistory);
router.delete('/ai/chat-history/:tender_id', authMiddleware, aiCtrl.clearChatHistory);
router.post('/ai/parse-search', aiCtrl.parseSearchQuery);
router.post('/tenders/:tender_id/documents', authMiddleware, upload.single('file'), aiCtrl.uploadAndIndexTenderDocument);
router.get('/ai/document-summary/:tender_id', aiCtrl.getTenderDocumentSummary);
router.post('/ai/generate-proposal', authMiddleware, requireRole('company_user', 'viewer', 'super_admin'), aiCtrl.generateBidProposal);
router.get('/ai/win-prediction/:tender_id', authMiddleware, aiCtrl.getWinPrediction);

/* ==========================================================================
   6. ONE-CLICK ELIGIBILITY CHECKER
   ========================================================================== */
router.post('/eligibility/check', authMiddleware, eligibilityCtrl.checkEligibility);
router.get('/eligibility/history', authMiddleware, eligibilityCtrl.getEligibilityHistory);

/* ==========================================================================
   7. PERSONALIZATION: SAVED, BID STATUS, ALERTS, CALENDAR & COMPARISON
   ========================================================================== */
router.post('/saved', authMiddleware, userCtrl.toggleSaveTender);
router.get('/saved', authMiddleware, userCtrl.getSavedTenders);
router.patch('/saved/:tender_id/status', authMiddleware, userCtrl.updateBidStatus);
router.get('/alerts', authMiddleware, userCtrl.getAlerts);
router.patch('/alerts/:id/read', authMiddleware, userCtrl.markAlertRead);
router.get('/calendar', authMiddleware, userCtrl.getCalendarEvents);
router.post('/compare', authMiddleware, userCtrl.compareTenders);

/* ==========================================================================
   8. SUPER ADMIN & ENTERPRISE GOVERNANCE (STRICT ADMIN MIDDLEWARE)
   ========================================================================== */
router.get('/admin/kpis', authMiddleware, adminMiddleware, adminCtrl.getAdminKPIs);
router.post('/admin/import', authMiddleware, adminMiddleware, upload.single('file'), adminCtrl.importTenders);
router.get('/admin/authorities', authMiddleware, adminMiddleware, adminCtrl.getAuthorityRequests);
router.patch('/admin/authorities/:id', authMiddleware, adminMiddleware, adminCtrl.updateAuthorityStatus);

// User CRUD & Role Management
router.get('/admin/users', authMiddleware, adminMiddleware, adminCtrl.getUsers);
router.post('/admin/users', authMiddleware, adminMiddleware, adminCtrl.createUser);
router.put('/admin/users/:id', authMiddleware, adminMiddleware, adminCtrl.updateUser);
router.delete('/admin/users/:id', authMiddleware, adminMiddleware, adminCtrl.deleteUser);
router.patch('/admin/users/:id/toggle', authMiddleware, adminMiddleware, adminCtrl.toggleUserStatus);

// Company Verification & Profile Approvals
router.get('/admin/companies', authMiddleware, adminMiddleware, adminCtrl.getCompanies);
router.patch('/admin/companies/:id/verify', authMiddleware, adminMiddleware, adminCtrl.verifyCompany);

// Categories & Departments
router.get('/admin/categories', adminCtrl.getCategories);
router.post('/admin/categories', authMiddleware, adminMiddleware, adminCtrl.addCategory);
router.delete('/admin/categories/:id', authMiddleware, adminMiddleware, adminCtrl.deleteCategory);

router.get('/admin/departments', adminCtrl.getDepartments);
router.post('/admin/departments', authMiddleware, adminMiddleware, adminCtrl.addDepartment);

// Settings
router.get('/admin/settings', authMiddleware, adminMiddleware, adminCtrl.getSystemSettings);
router.put('/admin/settings', authMiddleware, adminMiddleware, adminCtrl.updateSystemSettings);

// Delete Tender
router.delete('/admin/tenders/:id', authMiddleware, adminMiddleware, adminCtrl.deleteTender);

// Audit Logs
router.get('/admin/audit-logs', authMiddleware, adminMiddleware, adminCtrl.getAuditLogs);
router.get('/admin/audits', authMiddleware, adminMiddleware, adminCtrl.getAuditLogs);

/* ==========================================================================
   9. EVALUATOR PORTAL
   ========================================================================== */
router.get('/evaluations', authMiddleware, requireRole('evaluator', 'super_admin'), evalCtrl.getAssignedEvaluations);
router.patch('/evaluations/:id', authMiddleware, requireRole('evaluator', 'super_admin'), evalCtrl.updateEvaluationScore);

module.exports = router;
