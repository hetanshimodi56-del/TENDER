import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Building, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2,
  Eye,
  EyeOff,
  Crown,
  Building2,
  Briefcase,
  HelpCircle,
  KeyRound,
  RotateCcw,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState('company_user'); // super_admin, tender_authority, company_user, viewer
  const [identifier, setIdentifier] = useState('BID001'); // Accepts User ID or Email
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Registration fields
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  // Status & loaders
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot Password / Reset Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = request code, 2 = enter code & reset
  const [forgotIdentifier, setForgotIdentifier] = useState('BID001');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Help & Support Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);

  // 4 Core Roles defined by the user specification with Unique User IDs
  const roleDefinitions = [
    {
      role: 'super_admin',
      userId: 'ADM001',
      title: '🔐 Super Admin',
      shortTitle: 'Super Admin',
      subtitle: 'Complete System Governance',
      desc: 'Full control: User & role management, department authorities, company approvals, audit logs, system settings.',
      icon: Crown,
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.12)',
      border: 'rgba(124, 58, 237, 0.35)',
      demoIdentifier: 'ADM001',
      demoEmail: 'admin@etender.gov.in',
      demoName: 'Vikramaditya Sharma'
    },
    {
      role: 'tender_authority',
      userId: 'AUTH001',
      title: '🏢 Tender Authority / Department Head',
      shortTitle: 'Tender Authority',
      subtitle: 'Official Department Procurement',
      desc: 'Department head: Create & publish tenders, extend deadlines, review bids, shortlist and reject with mandatory reason.',
      icon: Building2,
      color: '#00796b',
      bg: 'rgba(0, 121, 107, 0.12)',
      border: 'rgba(0, 121, 107, 0.35)',
      demoIdentifier: 'AUTH001',
      demoEmail: 'authority@gudm.gov.in',
      demoName: 'Dr. Rajeshwari Patel (GUDM)'
    },
    {
      role: 'company_user',
      userId: 'BID001',
      title: '🏭 Company / Bidder',
      shortTitle: 'Company / Bidder',
      subtitle: 'Bid Preparation & Submission',
      desc: 'Bidders: Discover tenders, submit technical & commercial bids, upload documents, track bid status, anti-IDOR isolation.',
      icon: Briefcase,
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.12)',
      border: 'rgba(2, 132, 199, 0.35)',
      demoIdentifier: 'BID001',
      demoEmail: 'aarav@techinfra.com',
      demoName: 'Aarav Mehta (TechInfra)'
    },
    {
      role: 'viewer',
      userId: 'VIEW001',
      title: '👁️ Viewer',
      shortTitle: 'Viewer',
      subtitle: 'Public & Citizen Access',
      desc: 'Public viewing: Search published tenders, browse categories, download public notices (no bidding or admin access).',
      icon: Eye,
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.12)',
      border: 'rgba(217, 119, 6, 0.35)',
      demoIdentifier: 'VIEW001',
      demoEmail: 'viewer@etender.gov.in',
      demoName: 'Pooja Verma (Public Auditor)'
    }
  ];

  const currentRoleInfo = roleDefinitions.find(r => r.role === selectedRole) || roleDefinitions[2];

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setError('');
    const target = roleDefinitions.find(r => r.role === roleKey);
    if (target && !isRegister) {
      setIdentifier(target.demoIdentifier);
      setPassword('Password@123');
    }
  };

  const handleDemoLogin = async (targetRole) => {
    setLoading(true);
    setError('');
    try {
      const target = roleDefinitions.find(r => r.role === targetRole);
      const res = await api.login(target ? target.demoIdentifier : targetRole, 'Password@123', true);
      localStorage.setItem('etender_token', res.token);
      if (res.sessionId) localStorage.setItem('etender_session_id', res.sessionId);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      let res;
      if (isRegister) {
        res = await api.register({
          name,
          email: identifier,
          password,
          role: selectedRole === 'super_admin' ? 'company_user' : selectedRole,
          organization_name: orgName,
          registration_number: regNumber,
          gst_number: gstNumber
        });
      } else {
        res = await api.login(identifier, password, rememberMe);
      }

      localStorage.setItem('etender_token', res.token);
      if (res.sessionId) localStorage.setItem('etender_session_id', res.sessionId);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 1: Request Code
  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await api.forgotPassword(forgotIdentifier);
      setForgotSuccess(res.message);
      if (res.reset_code) {
        setResetCode(res.reset_code); // Pre-fill for instant demo/viva verification
      }
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Failed to request reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password Step 2: Confirm Reset
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await api.resetPassword(resetCode, newPassword);
      setForgotSuccess(res.message);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setSuccessMsg('Password updated! Please log in with your new password.');
        setPassword(newPassword);
      }, 1600);
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 50% 15%, rgba(14, 165, 233, 0.15), transparent 75%), #090e17',
      position: 'relative'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1120,
        display: 'grid',
        gridTemplateColumns: '1.08fr 1fr',
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 70px -15px rgba(0,0,0,0.85)',
        background: '#0d1322'
      }}>
        {/* Left Side: Brand Showcase & Role Selection */}
        <div style={{
          padding: '40px 36px',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.7))',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Platform Header */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: 14 }}>
              <ShieldCheck size={15} color="#38bdf8" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#bae6fd', letterSpacing: '0.04em' }}>
                ENTERPRISE RBAC & SESSION GATEWAY
              </span>
            </div>

            <h1 style={{ fontSize: '2.1rem', lineHeight: 1.15, fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
              WELCOME TO <span style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TENDERHUB</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 20px', fontWeight: 500 }}>
              Secure Tender Management & Bidding Portal
            </p>

            {/* Select Login Type Header */}
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#cbd5e1',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Select Login Type / Role</span>
              <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.72rem' }}>Unique User IDs</span>
            </div>

            {/* Role Option Selector Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {roleDefinitions.map(r => {
                const isSelected = selectedRole === r.role;
                const IconComponent = r.icon;
                return (
                  <div
                    key={r.role}
                    onClick={() => handleRoleSelect(r.role)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '11px 14px',
                      borderRadius: 12,
                      background: isSelected ? r.bg : 'rgba(255, 255, 255, 0.03)',
                      border: `1.5px solid ${isSelected ? r.color : 'rgba(255, 255, 255, 0.07)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 0 15px ${r.bg}` : 'none'
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: isSelected ? r.color : 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <IconComponent size={18} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                            {r.title}
                          </span>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.08)',
                            color: isSelected ? r.color : '#94a3b8',
                            border: `1px solid ${isSelected ? r.border : 'rgba(255,255,255,0.06)'}`
                          }}>
                            {r.userId}
                          </span>
                        </div>
                        {isSelected && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: r.color, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 10 }}>
                            ACTIVE ROLE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2, lineHeight: 1.35 }}>
                        {r.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Demo Access Bar */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Instant Evaluation (1-Click Demo)
              </span>
              <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600 }}>
                Pass: Password@123
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDemoLogin(selectedRole)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: currentRoleInfo.bg,
                border: `1px solid ${currentRoleInfo.color}`,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={14} color={currentRoleInfo.color} />
              <span>Log in as <strong>{currentRoleInfo.shortTitle}</strong> ({currentRoleInfo.userId})</span>
            </button>
          </div>
        </div>

        {/* Right Side: Login & Registration Form */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Sign In vs Company Registration Switcher */}
          <div style={{
            display: 'flex',
            gap: 6,
            marginBottom: 20,
            background: 'rgba(15, 23, 42, 0.9)',
            padding: 4,
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                background: !isRegister ? '#0284c7' : 'transparent',
                color: !isRegister ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.84rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                background: isRegister ? '#0284c7' : 'transparent',
                color: isRegister ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.84rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Company Registration
            </button>
          </div>

          {/* Active Role Notice */}
          <div style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: currentRoleInfo.bg,
            border: `1px solid ${currentRoleInfo.border}`,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: currentRoleInfo.color, fontWeight: 800, fontSize: '0.78rem' }}>
                Selected Role:
              </div>
              <div style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 700 }}>
                {currentRoleInfo.title}
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', color: currentRoleInfo.color, fontWeight: 700 }}>
              ID: {currentRoleInfo.userId}
            </span>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isRegister && (
              <>
                <div>
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Aarav Mehta"
                    className="form-input"
                    style={{ background: '#090e17', color: '#fff', border: '1px solid #334155' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                    Account Role *
                  </label>
                  <select
                    value={selectedRole}
                    onChange={e => handleRoleSelect(e.target.value)}
                    className="form-select"
                    style={{ background: '#090e17', color: '#fff', border: '1px solid #334155' }}
                  >
                    <option value="company_user">3. Company / Bidder (Submit Bids)</option>
                    <option value="tender_authority">2. Tender Authority / Department Head</option>
                    <option value="viewer">4. Viewer (Public Citizen)</option>
                  </select>
                </div>

                {selectedRole !== 'viewer' && (
                  <>
                    <div>
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                        Company / Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        placeholder="e.g. TechInfra Smart Systems Pvt Ltd"
                        className="form-input"
                        style={{ background: '#090e17', color: '#fff', border: '1px solid #334155' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                          CIN / Reg Number
                        </label>
                        <input
                          type="text"
                          value={regNumber}
                          onChange={e => setRegNumber(e.target.value)}
                          placeholder="U72900GJ2016PTC089761"
                          className="form-input"
                          style={{ background: '#090e17', color: '#fff', border: '1px solid #334155' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                          GST Number
                        </label>
                        <input
                          type="text"
                          value={gstNumber}
                          onChange={e => setGstNumber(e.target.value)}
                          placeholder="24AAACT1234F1Z8"
                          className="form-input"
                          style={{ background: '#090e17', color: '#fff', border: '1px solid #334155' }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                {isRegister ? 'Official Email Address *' : 'Email / Username / User ID *'}
              </label>
              <input
                type={isRegister ? 'email' : 'text'}
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={isRegister ? 'name@company.com' : 'e.g. ADM001 / BID001 / admin@etender.gov.in'}
                className="form-input"
                style={{ background: '#090e17', color: '#fff', border: '1px solid #334155' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem', margin: 0 }}>
                  Password *
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotStep(1); setForgotError(''); setForgotSuccess(''); }}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input"
                  style={{ background: '#090e17', color: '#fff', border: '1px solid #334155', paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            {!isRegister && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: '#94a3b8', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#0284c7', width: 14, height: 14 }}
                  />
                  <span>Remember Me (Keep 30-Day Session Active)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  <HelpCircle size={13} color="#38bdf8" />
                  <span>Help / Support</span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: 6,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
              }}
            >
              {loading ? 'Authenticating...' : (isRegister ? 'Complete Company Registration' : `Sign In as ${currentRoleInfo.shortTitle}`)}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Security & Architecture Notice */}
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.72rem', color: '#64748b' }}>
            🔒 Authenticated via User ID + RBAC + HTTP-Only Session Cookies + JWT API Tokens.
          </div>
        </div>
      </div>

      {/* =========================================================================
          FORGOT / RESET PASSWORD MODAL
          ========================================================================= */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            width: '100%',
            maxWidth: 460,
            background: '#0d1322',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <KeyRound size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff', fontWeight: 700 }}>
                  {forgotStep === 1 ? 'Forgot Password' : 'Set New Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {forgotError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', marginBottom: 14 }}>
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', marginBottom: 14 }}>
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetCode} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                  Enter your registered <strong>User ID</strong> (e.g. ADM001, AUTH001, BID001) or <strong>Email address</strong> to generate a secure password reset code.
                </p>
                <div>
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                    User ID or Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={e => setForgotIdentifier(e.target.value)}
                    placeholder="e.g. BID001 or aarav@techinfra.com"
                    className="form-input"
                    style={{ background: '#090e17', color: '#fff', border: '1px solid #334155' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    padding: '10px',
                    borderRadius: 8,
                    background: '#0284c7',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {forgotLoading ? 'Generating Code...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                  Enter the 6-digit reset code and your new encrypted password.
                </p>
                <div>
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                    6-Digit Verification Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="form-input"
                    style={{ background: '#090e17', color: '#fff', border: '1px solid #334155', letterSpacing: '0.15em', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                    New Secure Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="form-input"
                    style={{ background: '#090e17', color: '#fff', border: '1px solid #334155' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    padding: '10px',
                    borderRadius: 8,
                    background: '#10b981',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {forgotLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          HELP & SUPPORT MODAL
          ========================================================================= */}
      {showHelpModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            width: '100%',
            maxWidth: 540,
            background: '#0d1322',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HelpCircle size={22} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: 700 }}>
                  TenderHub Help & Support Desk
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.82rem', color: '#94a3b8' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#ffffff', fontWeight: 700, marginBottom: 4 }}>📞 24x7 e-Procurement Helpline</div>
                <div>Toll Free: 1800-111-TENDER (1800-111-8363) | Email: support@tenderhub.gov.in</div>
              </div>

              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#ffffff', fontWeight: 700, marginBottom: 4 }}>🔑 Unique User ID System</div>
                <div>Every account is assigned a unique prefixed ID:</div>
                <ul style={{ margin: '6px 0 0 18px', padding: 0, lineHeight: 1.5 }}>
                  <li><strong style={{ color: '#7c3aed' }}>ADM001</strong> – Super Admin (Platform governance & approvals)</li>
                  <li><strong style={{ color: '#00796b' }}>AUTH001</strong> – Tender Authority (Department-based publishing & scoring)</li>
                  <li><strong style={{ color: '#0284c7' }}>BID001</strong> – Company / Bidder (Bidding, documents & private vault)</li>
                  <li><strong style={{ color: '#d97706' }}>VIEW001</strong> – Citizen Viewer (Public discovery only)</li>
                </ul>
              </div>

              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#ffffff', fontWeight: 700, marginBottom: 4 }}>🛡️ Anti-IDOR & Department Isolation</div>
                <div>Company bids and documents are strictly private. Bidders cannot view each other's quotes. Department Heads manage only their assigned department tenders.</div>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{
                  padding: '10px',
                  borderRadius: 8,
                  background: '#0284c7',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: 6
                }}
              >
                Close Help Desk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
