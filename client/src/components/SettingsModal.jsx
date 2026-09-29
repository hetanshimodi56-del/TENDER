import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Globe, 
  CheckCircle2, 
  Bell, 
  ShieldCheck, 
  User, 
  Sparkles,
  Check
} from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

export default function SettingsModal({ user, onClose, onShowToast }) {
  const { language, setLanguage, t } = useLanguage();
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [selectedLang, setSelectedLang] = useState(language);

  const handleLanguageSelect = (langCode) => {
    setSelectedLang(langCode);
    setLanguage(langCode);
    if (onShowToast) {
      const names = { en: 'English', gu: 'ગુજરાતી (Gujarati)', hi: 'हिन्दी (Hindi)' };
      onShowToast(`Language updated to ${names[langCode] || langCode}!`, 'success');
    }
  };

  const languages = [
    {
      code: 'en',
      title: t('lang_en_title'),
      desc: t('lang_en_desc'),
      native: 'English (Global Enterprise)',
      icon: '🇬🇧',
      color: '#4f46e5',
      bg: '#eef2ff',
      border: '#c7d2fe'
    },
    {
      code: 'gu',
      title: t('lang_gu_title'),
      desc: t('lang_gu_desc'),
      native: 'ગુજરાતી (ગુજરાત રાજ્ય ઈ-ટેન્ડરિંગ)',
      icon: '🇮🇳',
      color: '#00796b',
      bg: '#e0f2f1',
      border: '#80cbc4'
    },
    {
      code: 'hi',
      title: t('lang_hi_title'),
      desc: t('lang_hi_desc'),
      native: 'हिन्दी (राष्ट्रीय ई-निविदा पोर्टल)',
      icon: '🇮🇳',
      color: '#d97706',
      bg: '#fef3c7',
      border: '#fde68a'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 620, padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #f8fafc, #edf2f7)',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
            }}>
              <Settings size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {t('settings_title')}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                {t('settings_subtitle')}
              </p>
            </div>
          </div>

          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onClose}
            style={{ width: 32, height: 32, padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', maxHeight: '78vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* SECTION 1: LANGUAGE SELECTION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={18} color="#4f46e5" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {t('language_section')}
                </h4>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                {t('active_language')}: {selectedLang.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 14 }}>
              {t('language_desc')}
            </p>

            {/* Language Option Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {languages.map(lang => {
                const isSelected = selectedLang === lang.code;
                return (
                  <div
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: 10,
                      border: isSelected ? `2px solid ${lang.color}` : '1px solid #e2e8f0',
                      background: isSelected ? lang.bg : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '1.4rem' }}>{lang.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isSelected ? lang.color : '#0f172a' }}>
                          {lang.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {lang.desc} • <span style={{ fontStyle: 'italic' }}>{lang.native}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: isSelected ? `2px solid ${lang.color}` : '2px solid #cbd5e1',
                      background: isSelected ? lang.color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: SYSTEM NOTIFICATIONS & ALERTS */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Bell size={18} color="#00796b" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Notification & Real-Time Alert Preferences
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                    Live Corrigendum & Pre-Bid Addendum Alerts
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Receive real-time push alerts when department officers publish corrigendums
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={e => setSoundAlerts(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#4f46e5', cursor: 'pointer' }}
                />
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                    24-Hour Submission Deadline Countdown Warning
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Receive priority alert 24 hours prior to closing of shortlisted bids
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={deadlineAlerts}
                  onChange={e => setDeadlineAlerts(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#4f46e5', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          {/* SECTION 3: USER & SESSION TELEMETRY */}
          {user && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ShieldCheck size={18} color="#16a34a" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Active Session & Security Profile
                </h4>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                fontSize: '0.8rem'
              }}>
                <div>
                  <span style={{ color: '#64748b' }}>Authenticated User:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{user.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{user.email}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Role Level:</span>
                  <div>
                    <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                      {user.role?.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: 3 }}>
                    ✓ 256-Bit SSL Token Active
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          <button 
            className="btn btn-primary"
            onClick={onClose}
            style={{ minWidth: 140 }}
          >
            {t('save_settings')}
          </button>
        </div>
      </div>
    </div>
  );
}
