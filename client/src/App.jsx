import React, { useState, useEffect } from 'react';
import TenderHeader from './components/TenderHeader';
import TenderSidebar from './components/TenderSidebar';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';

import SalesDashboard from './views/SalesDashboard';
import FinanceDashboard from './views/FinanceDashboard';
import TendersListView from './views/TendersListView';
import MyTenders from './views/MyTenders';
import SmartCalendar from './views/SmartCalendar';
import CompanyProfileView from './views/CompanyProfileView';
import AuthorityPortal from './views/AuthorityPortal';
import AdminDashboard from './views/AdminDashboard';
import EvaluatorPortal from './views/EvaluatorPortal';
import TenderTasksView from './views/TenderTasksView';

import TenderDetailsModal from './components/TenderDetailsModal';
import EligibilityModal from './components/EligibilityModal';
import AIRecommendationModal from './components/AIRecommendationModal';
import TenderComparisonModal from './components/TenderComparisonModal';
import AddTenderModal from './components/AddTenderModal';
import BidProposalGeneratorModal from './components/BidProposalGeneratorModal';
import WinProbabilityModal from './components/WinProbabilityModal';
import BOQEstimatorModal from './components/BOQEstimatorModal';
import DocumentVaultModal from './components/DocumentVaultModal';

import MISReportsModal from './components/MISReportsModal';
import FileManagerModal from './components/FileManagerModal';
import RolesRightsModal from './components/RolesRightsModal';
import FinanceModal from './components/FinanceModal';

import ViewerDashboard from './views/ViewerDashboard';
import SubmitBidModal from './components/SubmitBidModal';
import AccessDenied from './components/AccessDenied';

import AITenderAssistant from './components/AITenderAssistant';
import AIAssistantLauncher from './components/AIAssistantLauncher';
import CommandPalette from './components/CommandPalette';

import { api } from './services/api';

// RBAC Permission Helper: Returns authorized home tab for role
function getAuthorizedHomeTab(role) {
  if (role === 'super_admin' || role === 'admin') return 'admin';
  if (role === 'tender_authority' || role === 'authority') return 'authority';
  if (role === 'viewer' || role === 'user') return 'viewer';
  if (role === 'evaluator') return 'evaluator';
  if (!role || role === 'guest') return 'tenders';
  return 'dashboard'; // company_user / vendor
}

// RBAC Route Guard: Validates whether a tab is allowed for user's role
function checkTabPermission(tab, role) {
  // Shared public discovery tabs allowed for everyone (including guests & public viewers)
  if (tab === 'tenders' || tab === 'discover' || tab === 'viewer' || tab === 'viewer_categories' || tab === 'viewer_search') {
    return true;
  }

  if (!role) return false;
  const isSuperAdmin = role === 'super_admin' || role === 'admin';
  const isAuthority = role === 'tender_authority' || role === 'authority';
  const isVendor = role === 'company_user' || role === 'vendor' || role === 'company' || role === 'bidder';
  const isViewer = role === 'viewer' || role === 'user';
  const isEvaluator = role === 'evaluator';

  // Admin tabs (super_admin only)
  if (tab === 'admin' || tab.startsWith('admin_')) {
    return isSuperAdmin;
  }

  // Authority tabs (tender_authority or super_admin)
  if (tab === 'authority' || tab.startsWith('authority_')) {
    return isAuthority || isSuperAdmin;
  }

  // Evaluator tab
  if (tab === 'evaluator') {
    return isEvaluator || isSuperAdmin;
  }

  // Vendor / Company & Dashboard tabs:
  if (tab === 'dashboard' || tab === 'sales' || tab === 'finance' || tab === 'my_bids' || tab === 'my_tenders' || tab === 'profile' || tab === 'tasks' || tab === 'calendar') {
    return isVendor || isSuperAdmin;
  }

  // Normal User / Viewer tabs:
  if (tab === 'viewer' || tab.startsWith('viewer_')) {
    return isViewer || isVendor || isSuperAdmin;
  }

  // Saved / Recommended
  if (tab === 'saved' || tab === 'recommended') {
    return isVendor || isViewer || isAuthority;
  }

  return false;
}

// URL Mapping Helpers for Direct URL Navigation and Back/Forward Sync
function getTabFromUrl() {
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/admin')) {
    if (path.includes('user')) return 'admin_users';
    if (path.includes('compan')) return 'admin_companies';
    if (path.includes('authorit')) return 'admin_authorities';
    if (path.includes('tender')) return 'admin_tenders';
    if (path.includes('bid')) return 'admin_bids';
    if (path.includes('setting')) return 'admin_settings';
    if (path.includes('audit')) return 'admin_audits';
    return 'admin';
  }
  if (path.startsWith('/vendor')) {
    if (path.includes('finance')) return 'finance';
    if (path.includes('profile')) return 'profile';
    if (path.includes('bid')) return 'my_bids';
    if (path.includes('task')) return 'tasks';
    return 'dashboard';
  }
  if (path === '/finance') return 'finance';
  if (path.startsWith('/authority')) return 'authority';
  if (path.startsWith('/user') || path.startsWith('/viewer')) return 'viewer';
  if (path === '/tenders') return 'tenders';
  return null;
}

function getUrlFromTab(tab) {
  if (tab === 'admin') return '/admin/dashboard';
  if (tab === 'admin_users') return '/admin/users';
  if (tab === 'admin_companies') return '/admin/companies';
  if (tab === 'admin_authorities') return '/admin/authorities';
  if (tab === 'admin_tenders') return '/admin/tenders';
  if (tab === 'admin_bids') return '/admin/bids';
  if (tab === 'admin_settings') return '/admin/settings';
  if (tab === 'admin_audits') return '/admin/audits';
  if (tab === 'dashboard' || tab === 'sales') return '/vendor/dashboard';
  if (tab === 'finance') return '/vendor/finance';
  if (tab === 'profile') return '/vendor/profile';
  if (tab === 'my_bids') return '/vendor/bids';
  if (tab === 'authority') return '/authority/dashboard';
  if (tab === 'viewer') return '/user/dashboard';
  if (tab === 'tenders') return '/tenders';
  return null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(getTabFromUrl() || 'dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals state
  const [selectedTender, setSelectedTender] = useState(null);
  const [tenderDetailsData, setTenderDetailsData] = useState(null);

  const [eligibilityTender, setEligibilityTender] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const [recommendationTender, setRecommendationTender] = useState(null);
  const [recommendationData, setRecommendationData] = useState(null);

  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showAddTenderModal, setShowAddTenderModal] = useState(false);
  const [comparedTenderIds, setComparedTenderIds] = useState(new Set());
  const [comparisonMatrix, setComparisonMatrix] = useState([]);

  // Sidebar Modals
  const [showMISModal, setShowMISModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);

  // Advanced AI & Compliance Modals
  const [proposalTender, setProposalTender] = useState(null);
  const [winTender, setWinTender] = useState(null);
  const [boqTender, setBOQTender] = useState(null);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [bidModalTender, setBidModalTender] = useState(null);

  // Cross-view filter navigation
  const [tendersInitialFilter, setTendersInitialFilter] = useState({
    category: 'All',
    state: 'All',
    statFilter: 'all',
    subTab: 'all'
  });

  // Global Floating AI Tender Assistant State
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiAssistantTender, setAiAssistantTender] = useState(null);

  // Authentication & Guest Navigation State - Default to showing Login if not logged in
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState('company_user');
  const [authMessage, setAuthMessage] = useState('');
  const [pendingTenderId, setPendingTenderId] = useState(null);

  const handleRequireLogin = (tender = null, preferredRole = 'company_user', customMsg = '') => {
    if (tender) {
      setPendingTenderId(tender.id);
      setAuthMessage(customMsg || `Please sign in as Bidder / Viewer to proceed with tender ${tender.tender_reference_no}.`);
    } else {
      setAuthMessage(customMsg || '');
    }
    setAuthInitialRole(preferredRole);
    setShowAuthModal(true);
  };

  const handleOpenAskAI = (tender = null) => {
    setAiAssistantTender(tender);
    setIsAIAssistantOpen(true);
  };

  // Saved tenders set
  const [savedTenderIds, setSavedTenderIds] = useState(new Set());

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleNavigateToTenders = (filterType, filterVal) => {
    if (filterType === 'category') {
      setTendersInitialFilter({ category: filterVal, state: 'All', statFilter: 'all', subTab: 'fresh' });
    } else if (filterType === 'state') {
      setTendersInitialFilter({ category: 'All', state: filterVal, statFilter: 'all', subTab: 'fresh' });
    } else if (filterType === 'interested') {
      setTendersInitialFilter({ category: 'All', state: 'All', statFilter: 'interested', subTab: 'fresh' });
    } else if (filterType === 'my') {
      setCurrentTab('saved');
      return;
    } else {
      setTendersInitialFilter({ category: 'All', state: 'All', statFilter: 'all', subTab: 'fresh' });
    }
    navigateToTab('tenders');
  };

  const navigateToTab = (tab) => {
    if (tab === 'login') {
      handleRequireLogin(null, 'viewer');
      return;
    }
    setCurrentTab(tab);
    const url = getUrlFromTab(tab);
    if (url && window.location.pathname !== url) {
      window.history.pushState(null, '', url);
    }
  };

  useEffect(() => {
    checkAuth();

    const handlePopState = () => {
      const urlTab = getTabFromUrl();
      if (urlTab) setCurrentTab(urlTab);
    };
    window.addEventListener('popstate', handlePopState);

    // Global Command Palette (Ctrl+K or Cmd+K)
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('etender_token');
    if (!token) {
      setLoading(false);
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setShowAuthModal(false);
      const urlTab = getTabFromUrl();
      if (urlTab) {
        setCurrentTab(urlTab);
      } else {
        setCurrentTab(getAuthorizedHomeTab(res.user.role));
      }
      loadSavedTenders();
    } catch (err) {
      console.error('Session expired:', err);
      localStorage.removeItem('etender_token');
      localStorage.removeItem('etender_session_id');
      setUser(null);
      setShowAuthModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedTenders = async () => {
    try {
      const savedRes = await api.getSavedTenders().catch(() => ({ data: [] }));
      setSavedTenderIds(new Set((savedRes.data || []).map(s => s.tender.id)));
    } catch (err) {
      console.error('Failed to load saved:', err);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setShowAuthModal(false);
    setAuthMessage('');
    const homeTab = getAuthorizedHomeTab(loggedInUser.role);
    navigateToTab(homeTab);
    loadSavedTenders();
    showToast(`Welcome to TenderHub, ${loggedInUser.name}!`);

    // If login was initiated from clicking a specific tender, open its detail page immediately!
    if (pendingTenderId) {
      const tenderIdToOpen = pendingTenderId;
      setPendingTenderId(null);
      setTimeout(() => {
        handleOpenDetailsById(tenderIdToOpen);
      }, 250);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout().catch(() => {});
    } catch (_) {}
    localStorage.removeItem('etender_token');
    localStorage.removeItem('etender_session_id');
    setUser(null);
    setSelectedTender(null);
    setTenderDetailsData(null);
    setPendingTenderId(null);
    setShowAuthModal(true); // Open Login Page directly on logout!
    setAuthMessage('You have been logged out successfully. Sign in to your account.');
    window.history.replaceState(null, '', '/');
    showToast('Signed out of platform successfully.', 'info');
  };

  // Open Tender Details Modal
  const handleOpenDetails = async (tender) => {
    try {
      const res = await api.getTenderById(tender.id);
      setSelectedTender(res.tender);
      setTenderDetailsData(res);
    } catch (err) {
      showToast('Failed to open tender details', 'error');
    }
  };

  const handleOpenDetailsById = async (id) => {
    try {
      const res = await api.getTenderById(id);
      setSelectedTender(res.tender);
      setTenderDetailsData(res);
    } catch (err) {
      showToast('Failed to open tender', 'error');
    }
  };

  // Check Eligibility
  const handleCheckEligibility = async (tender) => {
    setEligibilityTender(tender);
    setEligibilityLoading(true);
    try {
      const res = await api.checkEligibility(tender.id);
      setEligibilityResult(res.data);
    } catch (err) {
      showToast('Failed to check eligibility', 'error');
    } finally {
      setEligibilityLoading(false);
    }
  };

  // AI Recommendation Breakdown
  const handleViewRecommendation = async (tender) => {
    try {
      const res = await api.getRecommendation(tender.id);
      setRecommendationTender(tender);
      setRecommendationData(res.data);
    } catch (err) {
      showToast('Failed to load AI recommendation', 'error');
    }
  };

  // Toggle Save / Interested
  const handleToggleSave = async (tenderId) => {
    try {
      await api.toggleSaveTender(tenderId);
      loadSavedTenders();
    } catch (err) {
      console.error('Toggle save error:', err);
    }
  };

  // Toggle Compare
  const handleToggleCompare = (tenderId) => {
    const next = new Set(comparedTenderIds);
    if (next.has(tenderId)) {
      next.delete(tenderId);
      showToast('Removed tender from comparison');
    } else {
      if (next.size >= 5) {
        showToast('Maximum 5 tenders can be compared simultaneously.', 'error');
        return;
      }
      next.add(tenderId);
      showToast(`Added to comparison (${next.size}/5 selected)`);
    }
    setComparedTenderIds(next);
  };

  // Compare Modal
  const handleOpenCompareModal = async () => {
    if (comparedTenderIds.size < 2) {
      showToast('Please select at least 2 tenders to compare side-by-side.', 'error');
      return;
    }

    try {
      const ids = Array.from(comparedTenderIds);
      const res = await api.compareTenders(ids);
      setComparisonMatrix(res.data || []);
      setShowCompareModal(true);
    } catch (err) {
      showToast(err.message || 'Failed to compare tenders', 'error');
    }
  };

  const handleRemoveFromCompare = (tenderId) => {
    const next = new Set(comparedTenderIds);
    next.delete(tenderId);
    setComparedTenderIds(next);
    setComparisonMatrix(prev => prev.filter(p => p.id !== tenderId));
    if (next.size < 2) {
      setShowCompareModal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#4f46e5', fontWeight: 600 }}>
        Loading BidSphere AI Platform...
      </div>
    );
  }

  // If Auth modal is requested explicitly or guest requires login
  if (!user && showAuthModal) {
    return (
      <AuthModal
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setShowAuthModal(false)}
        onBrowseGuest={() => {
          setShowAuthModal(false);
          navigateToTab('tenders');
        }}
        initialRole={authInitialRole}
        message={authMessage}
      />
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-gradient)' }}>
      {/* BidSphere AI Left Sidebar (Fixed 100vh, Independent Scroll) */}
      <TenderSidebar
        currentTab={currentTab}
        setCurrentTab={navigateToTab}
        user={user}
        collapsed={sidebarCollapsed}
        onOpenAddTender={() => user ? setShowAddTenderModal(true) : handleRequireLogin(null, 'company_user')}
        onOpenVault={() => user ? setShowVaultModal(true) : handleRequireLogin(null, 'company_user')}
        onOpenMIS={() => user ? setShowMISModal(true) : handleRequireLogin(null, 'company_user')}
        onOpenFiles={() => user ? setShowFilesModal(true) : handleRequireLogin(null, 'company_user')}
        onOpenRoles={() => user ? setShowRolesModal(true) : handleRequireLogin(null, 'super_admin')}
        onOpenFinance={() => user ? setShowFinanceModal(true) : handleRequireLogin(null, 'company_user')}
      />

      {/* Main Content Area (Fixed 100vh, Column) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, overflow: 'hidden' }}>
        {/* BidSphere AI Top Header (Pinned 60px) */}
        <TenderHeader
          user={user}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          compareCount={comparedTenderIds.size}
          onOpenCompare={handleOpenCompareModal}
          onOpenAddTender={() => user ? setShowAddTenderModal(true) : handleRequireLogin(null, 'company_user')}
          onOpenVault={() => user ? setShowVaultModal(true) : handleRequireLogin(null, 'company_user')}
          onOpenAIAssistant={() => handleOpenAskAI(null)}
          onOpenLogin={() => { setAuthMessage(''); setAuthInitialRole('viewer'); setShowAuthModal(true); }}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onShowToast={showToast}
        />

        {/* View Switcher with Strict RBAC Route Guard & Independent Scrolling */}
        <main className="main-scroll-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', height: 'calc(100vh - 60px)' }}>
          {!checkTabPermission(currentTab, user?.role) ? (
            <AccessDenied
              user={user}
              attemptedTab={currentTab}
              onGoHome={() => navigateToTab(getAuthorizedHomeTab(user?.role))}
            />
          ) : (
            <>
              {(currentTab === 'dashboard' || currentTab === 'sales') && (
                <SalesDashboard
                  onNavigateToTenders={handleNavigateToTenders}
                  onViewDetailsById={handleOpenDetailsById}
                  onOpenAddTender={() => setShowAddTenderModal(true)}
                  onOpenAskAI={handleOpenAskAI}
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'finance' && (
                <FinanceDashboard
                  onOpenFinanceModal={() => setShowFinanceModal(true)}
                  onOpenAddTender={() => setShowAddTenderModal(true)}
                  onOpenAskAI={handleOpenAskAI}
                  onShowToast={showToast}
                />
              )}

              {/* Public Viewer Portal */}
              {(currentTab === 'viewer' || currentTab === 'viewer_categories' || currentTab === 'viewer_search') && (
                <ViewerDashboard
                  initialCategory={currentTab === 'viewer_categories' ? 'All' : undefined}
                  onViewDetails={handleOpenDetails}
                  onOpenAskAI={handleOpenAskAI}
                />
              )}

              {(currentTab === 'tenders' || currentTab === 'discover') && (
                <TendersListView
                  onViewDetails={handleOpenDetails}
                  onCheckEligibility={handleCheckEligibility}
                  onViewRecommendation={handleViewRecommendation}
                  savedTenderIds={savedTenderIds}
                  onToggleSave={handleToggleSave}
                  onToggleCompare={handleToggleCompare}
                  comparedIds={comparedTenderIds}
                  onShowToast={showToast}
                  onOpenAddTender={() => setShowAddTenderModal(true)}
                  onOpenAskAI={handleOpenAskAI}
                  initialFilter={tendersInitialFilter}
                />
              )}

              {currentTab === 'recommended' && (
                <TendersListView
                  onViewDetails={handleOpenDetails}
                  onCheckEligibility={handleCheckEligibility}
                  onViewRecommendation={handleViewRecommendation}
                  savedTenderIds={savedTenderIds}
                  onToggleSave={handleToggleSave}
                  onToggleCompare={handleToggleCompare}
                  comparedIds={comparedTenderIds}
                  onShowToast={showToast}
                  onOpenAddTender={() => setShowAddTenderModal(true)}
                  onOpenAskAI={handleOpenAskAI}
                  initialFilter={{ category: 'All', state: 'All', statFilter: 'all', subTab: 'high_match' }}
                />
              )}

              {(currentTab === 'saved' || currentTab === 'my_tenders' || currentTab === 'my_bids') && (
                <MyTenders
                  initialTab={currentTab === 'my_bids' ? 'my_bids' : 'all'}
                  onViewDetails={handleOpenDetails}
                  onCheckEligibility={handleCheckEligibility}
                  onRefresh={loadSavedTenders}
                  onNavigateToTasks={() => navigateToTab('tasks')}
                  onOpenAddTender={() => setShowAddTenderModal(true)}
                  onOpenProposal={(t) => setProposalTender(t)}
                  onOpenWinProbability={(t) => setWinTender(t)}
                  onOpenBOQ={(t) => setBOQTender(t)}
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'tasks' && (
                <TenderTasksView
                  onViewDetailsById={handleOpenDetailsById}
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'calendar' && (
                <SmartCalendar onViewDetailsById={handleOpenDetailsById} />
              )}

              {currentTab === 'profile' && (
                <CompanyProfileView onProfileUpdated={loadSavedTenders} />
              )}

              {/* Tender Authority / Department Head */}
              {(currentTab === 'authority' || currentTab.startsWith('authority_')) && (
                <AuthorityPortal
                  user={user}
                  initialTab={currentTab}
                  onViewDetails={handleOpenDetails}
                  onShowToast={showToast}
                />
              )}

              {/* Super Admin Complete Control Suite */}
              {(currentTab === 'admin' || currentTab.startsWith('admin_')) && (
                <AdminDashboard
                  user={user}
                  initialTab={currentTab}
                  onViewDetails={handleOpenDetails}
                  onOpenAddTender={() => setShowAddTenderModal(true)}
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'evaluator' && (
                <EvaluatorPortal user={user} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Interactive Modals */}
      {selectedTender && (
        <TenderDetailsModal
          tender={selectedTender}
          similarTenders={tenderDetailsData?.similarTenders || []}
          aiEvaluation={tenderDetailsData?.aiEvaluation}
          eligibilityEvaluation={tenderDetailsData?.eligibilityEvaluation}
          isSaved={savedTenderIds.has(selectedTender.id)}
          onClose={() => { setSelectedTender(null); setTenderDetailsData(null); }}
          onCheckEligibility={user ? handleCheckEligibility : () => handleRequireLogin(selectedTender, 'company_user', 'Please log in as Company / Bidder to check eligibility with company profile.')}
          onViewRecommendation={handleViewRecommendation}
          onToggleSave={user ? handleToggleSave : () => handleRequireLogin(selectedTender, 'company_user', 'Please log in to save tenders to your shortlist.')}
          onSelectSimilar={handleOpenDetailsById}
          onOpenProposal={(t) => user ? setProposalTender(t) : handleRequireLogin(t, 'company_user', 'Please log in to generate AI bid proposals.')}
          onOpenWinProbability={(t) => user ? setWinTender(t) : handleRequireLogin(t, 'company_user', 'Please log in to calculate Win Probability.')}
          onOpenBOQ={(t) => user ? setBOQTender(t) : handleRequireLogin(t, 'company_user', 'Please log in to use the BOQ Estimator.')}
          onSubmitBid={(t) => user ? setBidModalTender(t) : handleRequireLogin(t, 'company_user', 'Please log in as Company / Bidder to apply and submit sealed bids.')}
          onOpenAskAI={handleOpenAskAI}
          onLoginRequired={(t) => handleRequireLogin(t, 'company_user', `Please log in to apply for tender ${t?.tender_reference_no || ''}.`)}
          userRole={user?.role || 'viewer'}
        />
      )}

      {eligibilityTender && eligibilityResult && (
        <EligibilityModal
          tender={eligibilityTender}
          evaluation={eligibilityResult}
          onClose={() => { setEligibilityTender(null); setEligibilityResult(null); }}
          onRecheck={() => handleCheckEligibility(eligibilityTender)}
          onGoToProfile={() => {
            setEligibilityTender(null);
            setEligibilityResult(null);
            setCurrentTab('profile');
          }}
          loading={eligibilityLoading}
        />
      )}

      {recommendationTender && recommendationData && (
        <AIRecommendationModal
          tender={recommendationTender}
          recommendation={recommendationData}
          onClose={() => { setRecommendationTender(null); setRecommendationData(null); }}
        />
      )}

      {showCompareModal && (
        <TenderComparisonModal
          tenders={comparisonMatrix}
          onClose={() => setShowCompareModal(false)}
          onRemoveFromCompare={handleRemoveFromCompare}
        />
      )}

      {showAddTenderModal && (
        <AddTenderModal
          user={user}
          onClose={() => setShowAddTenderModal(false)}
          onTenderCreated={(newTender) => {
            loadSavedTenders();
            handleOpenDetails(newTender);
          }}
          onShowToast={showToast}
        />
      )}

      {/* Advanced AI & Enterprise Features Modals */}
      {proposalTender && (
        <BidProposalGeneratorModal
          tender={proposalTender}
          user={user}
          onClose={() => setProposalTender(null)}
          onShowToast={showToast}
        />
      )}

      {winTender && (
        <WinProbabilityModal
          tender={winTender}
          onClose={() => setWinTender(null)}
          onApplyL1Price={(price) => {
            showToast(`Applied optimal L1 bid ₹${price?.toLocaleString('en-IN')} to bidding strategy!`, 'success');
            setWinTender(null);
          }}
        />
      )}

      {boqTender && (
        <BOQEstimatorModal
          tender={boqTender}
          onClose={() => setBOQTender(null)}
          onApplyQuote={(total) => {
            showToast(`Applied BOQ total ₹${total?.toLocaleString('en-IN')} to quoted bid!`, 'success');
            setBOQTender(null);
          }}
        />
      )}

      {showVaultModal && (
        <DocumentVaultModal
          onClose={() => setShowVaultModal(false)}
          onShowToast={showToast}
        />
      )}

      {/* Official Sealed Bid Submission Wizard Modal */}
      {bidModalTender && (
        <SubmitBidModal
          tender={bidModalTender}
          user={user}
          onClose={() => setBidModalTender(null)}
          onBidSubmitted={(newBid) => {
            setBidModalTender(null);
            showToast(`Official bid ₹${newBid?.bid_amount?.toLocaleString('en-IN')} submitted successfully!`, 'success');
            setCurrentTab('my_bids');
          }}
        />
      )}

      {/* Working Sidebar Modals */}
      {showMISModal && (
        <MISReportsModal onClose={() => setShowMISModal(false)} />
      )}

      {/* Global Command Palette (Ctrl+K / Cmd+K Spotlight Search) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigateToTab={navigateToTab}
        onSelectTender={handleOpenDetails}
        onOpenAIAssistant={() => handleOpenAskAI(null)}
        onOpenVault={() => user ? setShowVaultModal(true) : handleRequireLogin(null, 'company_user')}
      />

      {showFilesModal && (
        <FileManagerModal onClose={() => setShowFilesModal(false)} />
      )}

      {showRolesModal && (
        <RolesRightsModal onClose={() => setShowRolesModal(false)} />
      )}

      {showFinanceModal && (
        <FinanceModal onClose={() => setShowFinanceModal(false)} />
      )}

      {/* Permanent Floating AI Assistant Launcher & Modal */}
      <AIAssistantLauncher
        onClick={() => setIsAIAssistantOpen(true)}
        isOpen={isAIAssistantOpen}
        hasActiveTender={!!aiAssistantTender}
      />

      <AITenderAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        activeTender={aiAssistantTender}
        onClearActiveTender={() => setAiAssistantTender(null)}
        onViewTenderDetails={handleOpenDetails}
      />

      {/* Floating SaaS Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
