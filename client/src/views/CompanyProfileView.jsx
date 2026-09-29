import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Sliders, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  MapPin, 
  IndianRupee,
  Layers,
  Sparkles,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../utils/LanguageContext';

export default function CompanyProfileView({ onProfileUpdated }) {
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Profile fields
  const [companyName, setCompanyName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [turnover, setTurnover] = useState(550000000);
  const [experienceYears, setExperienceYears] = useState(8);
  const [state, setState] = useState('Gujarat');
  const [city, setCity] = useState('Ahmedabad');
  const [certificationsText, setCertificationsText] = useState('ISO 9001:2015, ISO 27001:2022, CMMI Level 3, MSME Registered');
  const [industryText, setIndustryText] = useState('Information Technology, Smart City Solutions, IoT & Surveillance, Cloud Infrastructure');
  const [capabilitiesText, setCapabilitiesText] = useState('Intelligent Traffic Systems, AI Video Analytics, Cloud ERP Implementation, SCADA');

  // Preferences fields
  const [prefCategories, setPrefCategories] = useState('Information Technology, Smart City & IoT, Electronics & Instrumentation');
  const [prefLocations, setPrefLocations] = useState('Gujarat, Maharashtra, Delhi, Karnataka');
  const [minValue, setMinValue] = useState(50000000);
  const [maxValue, setMaxValue] = useState(800000000);
  const [maxDeadlineDays, setMaxDeadlineDays] = useState(45);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const res = await api.getMe();
      if (res.companyProfile) {
        const p = res.companyProfile;
        setCompanyName(p.company_name || '');
        setPanNumber(p.pan_number || '');
        setGstNumber(p.gst_number || '');
        setTurnover(p.annual_turnover || 550000000);
        setExperienceYears(p.years_of_experience || 8);
        setState(p.state || 'Gujarat');
        setCity(p.city || 'Ahmedabad');
        setCertificationsText((p.certifications || []).join(', '));
        setIndustryText((p.industry_sectors || []).join(', '));
        setCapabilitiesText((p.core_capabilities || []).join(', '));
      }
      if (res.userPreferences) {
        const pref = res.userPreferences;
        setPrefCategories((pref.categories || []).join(', '));
        setPrefLocations((pref.locations || []).join(', '));
        setMinValue(pref.min_value || 50000000);
        setMaxValue(pref.max_value || 800000000);
        setMaxDeadlineDays(pref.max_deadline_days || 45);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      // 1. Update Profile
      await api.updateProfile({
        company_name: companyName,
        pan_number: panNumber,
        gst_number: gstNumber,
        annual_turnover: Number(turnover),
        years_of_experience: Number(experienceYears),
        state,
        city,
        certifications: certificationsText.split(',').map(s => s.trim()).filter(Boolean),
        industry_sectors: industryText.split(',').map(s => s.trim()).filter(Boolean),
        core_capabilities: capabilitiesText.split(',').map(s => s.trim()).filter(Boolean)
      });

      // 2. Update Preferences
      await api.updatePreferences({
        categories: prefCategories.split(',').map(s => s.trim()).filter(Boolean),
        locations: prefLocations.split(',').map(s => s.trim()).filter(Boolean),
        min_value: Number(minValue),
        max_value: Number(maxValue),
        max_deadline_days: Number(maxDeadlineDays),
        alert_email_enabled: true,
        alert_in_app_enabled: true
      });

      setSuccessMsg('Profile credentials & matching preferences saved! AI match models recalibrated.');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading credentials...</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Company Profile & Matching Preferences
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Verified company metrics feed the mathematical scoring engine and one-click eligibility validator.
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          background: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          color: '#34d399',
          padding: '12px 18px',
          borderRadius: 10,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 24
        }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Section 1: Statutory & Financial Qualifications */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
            <Building size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>1. Corporate & Financial Credentials</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Registered Enterprise Legal Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Permanent Account Number (PAN)</label>
              <input
                type="text"
                required
                value={panNumber}
                onChange={e => setPanNumber(e.target.value)}
                className="form-input"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label className="form-label">GST Identification Number (GSTIN)</label>
              <input
                type="text"
                required
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value)}
                className="form-input"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label className="form-label">Annual Audited Turnover (INR)</label>
              <input
                type="number"
                required
                value={turnover}
                onChange={e => setTurnover(e.target.value)}
                className="form-input"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Current: ₹{(turnover / 10000000).toFixed(1)} Crores
              </span>
            </div>

            <div>
              <label className="form-label">Years of Proven Experience</label>
              <input
                type="number"
                required
                value={experienceYears}
                onChange={e => setExperienceYears(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Operating State / Base HQ</label>
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Accreditations & Core Capabilities */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
            <Award size={20} color="#8b5cf6" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>2. Certifications & Core Capabilities</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Active Certifications & Standards (Comma Separated)</label>
              <input
                type="text"
                value={certificationsText}
                onChange={e => setCertificationsText(e.target.value)}
                className="form-input"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                e.g. ISO 9001:2015, ISO 27001:2022, CMMI Level 3, BIS, AERB, MSME
              </span>
            </div>

            <div>
              <label className="form-label">Primary Industry Sectors (Comma Separated)</label>
              <input
                type="text"
                value={industryText}
                onChange={e => setIndustryText(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Core Technical Capabilities & Solutions (Comma Separated)</label>
              <input
                type="text"
                value={capabilitiesText}
                onChange={e => setCapabilitiesText(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Matching & Alert Preferences */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
            <Sliders size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>3. Tender Matching & Alert Preferences</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Target Procurement Categories</label>
              <input
                type="text"
                value={prefCategories}
                onChange={e => setPrefCategories(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Target Geographic States</label>
              <input
                type="text"
                value={prefLocations}
                onChange={e => setPrefLocations(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Minimum Target Value (INR)</label>
              <input
                type="number"
                value={minValue}
                onChange={e => setMinValue(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Maximum Target Value (INR)</label>
              <input
                type="number"
                value={maxValue}
                onChange={e => setMaxValue(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Language & Regional Preferences */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
            <Globe size={20} color="#4f46e5" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              4. Language & Regional Preferences / પ્રાદેશિક ભાષા સેટિંગ્સ
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { code: 'en', label: '🇬🇧 English', sub: 'Enterprise Default E-Procurement' },
              { code: 'gu', label: '🇮🇳 ગુજરાતી (Gujarati)', sub: 'ગુજરાત રાજ્ય ઈ-ટેન્ડરિંગ સિસ્ટમ' },
              { code: 'hi', label: '🇮🇳 हिन्दी (Hindi)', sub: 'राष्ट्रीय ई-निविदा एवं खरीद पोर्टल' }
            ].map(item => (
              <div
                key={item.code}
                onClick={() => setLanguage(item.code)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: language === item.code ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  background: language === item.code ? '#eef2ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 700, color: language === item.code ? '#4f46e5' : '#0f172a' }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '12px 28px' }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save & Recalibrate AI Recommendations'}
          </button>
        </div>
      </form>
    </div>
  );
}
