const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('etender_token');
  const sessionId = localStorage.getItem('etender_session_id');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (sessionId) headers['x-session-id'] = sessionId;
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
    ...options.headers
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}

export const api = {
  // Auth (Session-based + Token-based + User ID identification)
  login: (email, password, rememberMe = false) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember_me: rememberMe, rememberMe })
  }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  forgotPassword: (identifier) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier }) }),
  resetPassword: (reset_code, new_password) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ reset_code, new_password }) }),
  demoLogin: (role) => request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/user/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  updatePreferences: (prefData) => request('/user/preferences', { method: 'PUT', body: JSON.stringify(prefData) }),

  // Tenders
  getTenders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tenders?${qs}`);
  },
  getTenderById: (id) => request(`/tenders/${id}`),
  createTender: (tenderData) => request('/tenders', { method: 'POST', body: JSON.stringify(tenderData) }),
  updateTenderStatus: (id, statusData) => request(`/tenders/${id}/status`, { method: 'PATCH', body: JSON.stringify(statusData) }),
  getAuthorityTenders: () => request('/authority/tenders'),

  // AI & Intelligence
  getRecommendation: (tenderId) => request(`/recommendations/${tenderId}`),
  askTenderAI: (tenderId, query) => request('/ai/ask', { method: 'POST', body: JSON.stringify({ tender_id: tenderId || 'general', query }) }),
  getChatHistory: (tenderId) => request(`/ai/chat-history/${tenderId || 'general'}`),
  clearChatHistory: (tenderId) => request(`/ai/chat-history/${tenderId || 'general'}`, { method: 'DELETE' }),
  parseSearchQuery: (query) => request('/ai/parse-search', { method: 'POST', body: JSON.stringify({ query }) }),
  uploadTenderDocument: (tenderId, formData) => request(`/tenders/${tenderId}/documents`, { method: 'POST', body: formData }),
  getDocumentSummary: (tenderId) => request(`/ai/document-summary/${tenderId}`),
  generateBidProposal: (tenderId, emphasis = 'balanced') => request('/ai/generate-proposal', {
    method: 'POST',
    body: JSON.stringify({ tender_id: tenderId, emphasis })
  }),
  getWinPrediction: (tenderId) => request(`/ai/win-prediction/${tenderId}`),

  // Eligibility
  checkEligibility: (tenderId) => request('/eligibility/check', { method: 'POST', body: JSON.stringify({ tender_id: tenderId }) }),
  getEligibilityHistory: () => request('/eligibility/history'),

  // Tender Tasks
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks?${qs}`);
  },
  createTask: (taskData) => request('/tasks', { method: 'POST', body: JSON.stringify(taskData) }),
  updateTask: (id, updates) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Personalization & Bid Tracking
  toggleSaveTender: (tenderId, notes, isFavourite) => request('/saved', {
    method: 'POST',
    body: JSON.stringify({ tender_id: tenderId, notes, is_favourite: isFavourite })
  }),
  getSavedTenders: () => request('/saved'),
  updateBidStatus: (tenderId, statusData) => request(`/saved/${tenderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData)
  }),
  getAlerts: () => request('/alerts'),
  markAlertRead: (id) => request(`/alerts/${id}/read`, { method: 'PATCH' }),
  getCalendarEvents: () => request('/calendar'),
  compareTenders: (tenderIds) => request('/compare', { method: 'POST', body: JSON.stringify({ tender_ids: tenderIds }) }),

  // Bids & Applications Management (RBAC & Anti-IDOR)
  submitBid: (bidData) => request('/bids', { method: 'POST', body: JSON.stringify(bidData) }),
  getMyBids: () => request('/bids/my'),
  getBidById: (id) => request(`/bids/${id}`),
  getDepartmentBids: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/bids/department${qs ? '?' + qs : ''}`);
  },
  getAllBids: () => request('/bids/all'),
  evaluateBid: (id, evalData) => request(`/bids/${id}/evaluate`, { method: 'PATCH', body: JSON.stringify(evalData) }),
  withdrawBid: (id) => request(`/bids/${id}/withdraw`, { method: 'POST' }),

  // Relational Notifications & Document Vault (Section 13)
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  getDocuments: () => request('/documents'),
  uploadDocument: (formData) => request('/documents', { method: 'POST', body: formData }),
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

  // Tender Authority & Admin Tender Management
  updateTender: (id, tenderData) => request(`/tenders/${id}`, { method: 'PUT', body: JSON.stringify(tenderData) }),

  // Admin
  getAdminKPIs: () => request('/admin/kpis'),
  importTenders: (formData) => request('/admin/import', { method: 'POST', body: formData }),
  getAuthorityRequests: () => request('/admin/authorities'),
  updateAuthorityStatus: (id, status, reason = '') => request(`/admin/authorities/${id}`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
  getUsers: () => request('/admin/users'),
  createUser: (userData) => request('/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id, userData) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  toggleUserStatus: (id) => request(`/admin/users/${id}/toggle`, { method: 'PATCH' }),
  getCompanies: () => request('/admin/companies'),
  verifyCompany: (id, verified) => request(`/admin/companies/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verified }) }),
  getCategories: () => request('/admin/categories'),
  addCategory: (data) => request('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),
  getDepartments: () => request('/admin/departments'),
  addDepartment: (data) => request('/admin/departments', { method: 'POST', body: JSON.stringify(data) }),
  getSystemSettings: () => request('/admin/settings'),
  updateSystemSettings: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  deleteTender: (id) => request(`/admin/tenders/${id}`, { method: 'DELETE' }),
  getAuditLogs: () => request('/admin/audit-logs'),

  // Evaluator
  getEvaluations: () => request('/evaluations'),
  updateEvaluation: (id, evalData) => request(`/evaluations/${id}`, { method: 'PATCH', body: JSON.stringify(evalData) })
};
