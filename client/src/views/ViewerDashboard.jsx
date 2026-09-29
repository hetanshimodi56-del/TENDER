import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Download, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Building2, 
  ShieldCheck, 
  ExternalLink,
  Info,
  Lock,
  Eye,
  CheckCircle2,
  Tag,
  Sparkles,
  Bot,
  HelpCircle,
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatINR } from '../components/TenderCard';
import { api } from '../services/api';
import { downloadTenderRFP } from '../utils/downloadRFP';

export default function ViewerDashboard({ onViewDetails, onShowToast, onOpenAskAI }) {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [activeTab, setActiveTab] = useState('all'); // all, recent, closing_soon
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    'All',
    'Information Technology',
    'Smart Infrastructure',
    'Healthcare & Medical',
    'Civil Works & Highways',
    'Renewable Energy',
    'Education & Training',
    'Cybersecurity & Defence'
  ];

  const states = ['All', 'Gujarat', 'Delhi', 'Maharashtra', 'Karnataka', 'Pan-India'];

  useEffect(() => {
    loadPublicTenders();
  }, [selectedCategory, selectedState]);

  const loadPublicTenders = async () => {
    setLoading(true);
    try {
      const res = await api.getTenders({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        state: selectedState !== 'All' ? selectedState : undefined,
        status: 'published'
      });
      setTenders(res.data || []);
    } catch (err) {
      console.error('Failed to load public tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenders = tenders.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (
        t.title?.toLowerCase().includes(q) ||
        t.tender_reference_no?.toLowerCase().includes(q) ||
        t.organization_name?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    if (activeTab === 'closing_soon') {
      const closing = new Date(t.closing_date).getTime();
      const days = (closing - Date.now()) / 86400000;
      if (days < 0 || days > 7) return false;
    }
    return true;
  });

  const faqs = [
    {
      q: 'What is EMD (Earnest Money Deposit) and is it refundable?',
      a: 'EMD is a mandatory security deposit submitted with your tender bid to ensure serious participation. For unsuccessful bidders, EMD is 100% refundable upon tender financial evaluation. For the winning bidder, EMD converts or is held until Performance Security is deposited.'
    },
    {
      q: 'How does the AI Assistant analyze tender documents without hallucinating?',
      a: 'Our AI Tender Assistant uses a strict Retrieval-Augmented Generation (RAG) architecture. When you ask a question, it only retrieves factual paragraphs from the indexed tender notice and documents. If the requested information is absent, it strictly responds: "I could not find this information in the available tender data or document."'
    },
    {
      q: 'Can MSMEs and Startups apply with turnover exemptions?',
      a: 'Yes! Under Public Procurement Policy for MSEs Order 2012 and DPIIT guidelines, recognized MSMEs and startups may qualify for EMD waivers and prior turnover/experience exemptions depending on the tender terms.'
    },
    {
      q: 'How do I submit an official bid for these published tenders?',
      a: 'Log in with a registered Vendor / Company account. Navigate to the tender page, click "Apply / Bid", review the required document checklist, calculate optimal pricing with BOQ Estimator, and submit your sealed bid proposal.'
    }
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* 1. Hero Section (Requirement 25) */}
      <div style={{
        background: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%)',
        borderRadius: 20,
        padding: '48px 44px',
        color: '#ffffff',
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 240,
          height: 240,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 820, position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px',
            borderRadius: 24,
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(129, 140, 248, 0.4)',
            marginBottom: 16
          }}>
            <Sparkles size={14} color="#a5b4fc" />
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#c7d2fe', letterSpacing: '0.04em' }}>
              NEXT-GEN E-PROCUREMENT & TENDER INTELLIGENCE
            </span>
          </div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            lineHeight: 1.2,
            margin: '0 0 14px',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI-Powered Tender Intelligence
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            margin: '0 0 28px',
            maxWidth: 680
          }}>
            Discover, understand and manage tenders with intelligent AI assistance. Grounded document retrieval, one-click eligibility verification, and instant answers with verifiable source citations.
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="#explore-tenders"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: '#ffffff',
                padding: '12px 26px',
                borderRadius: 10,
                fontSize: '0.9rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <Search size={16} /> Explore Tenders
            </a>

            <button
              onClick={() => onOpenAskAI?.()}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '12px 26px',
                borderRadius: 10,
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease'
              }}
            >
              <Bot size={17} color="#a5b4fc" /> Ask AI
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Published Tenders</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{tenders.length}</div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} /> 100% Verified Open Competition
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Government Departments</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00796b', marginTop: 4 }}>6 Active</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
            GUDM, AIIMS, BEL, NHAI, SECI, ReBIT
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Cumulative Procurement Value</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5', marginTop: 4 }}>
            {formatINR(tenders.reduce((acc, t) => acc + (Number(t.estimated_value) || 0), 0))}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
            Public development budget
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Public NIT Documents</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>Available</div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: 4 }}>
            ✓ Free public download
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {/* Quick Search */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: '8px 14px'
          }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search by tender name, department, GeM ID or keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.86rem',
                width: '100%',
                color: '#0f172a'
              }}
            />
          </div>

          {/* State Filter */}
          <div style={{ width: 200 }}>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                background: '#f8fafc',
                color: '#0f172a',
                outline: 'none'
              }}
            >
              {states.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All Locations' : s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginRight: 4 }}>
            CATEGORIES:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                border: '1px solid ' + (selectedCategory === cat ? '#0284c7' : '#e2e8f0'),
                background: selectedCategory === cat ? '#0284c7' : '#f8fafc',
                color: selectedCategory === cat ? '#ffffff' : '#475569',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: selectedCategory === cat ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tender List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#64748b' }}>
            Loading published tenders...
          </div>
        ) : filteredTenders.length === 0 ? (
          <div style={{
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
            color: '#64748b'
          }}>
            No published tenders found matching "{searchQuery}".
          </div>
        ) : (
          filteredTenders.map(t => (
            <div
              key={t.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '18px 24px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 20,
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#94a3b8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    background: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: 6
                  }}>
                    {t.tender_reference_no}
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    {t.category}
                  </span>
                  <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                    <MapPin size={11} /> {t.location_city ? `${t.location_city}, ` : ''}{t.location_state}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
                    ● Published & Live
                  </span>
                </div>

                <h3
                  onClick={() => onViewDetails(t)}
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: 'pointer',
                    margin: '0 0 6px',
                    lineHeight: 1.4
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0284c7'}
                  onMouseLeave={e => e.currentTarget.style.color = '#0f172a'}
                >
                  {t.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#64748b', marginBottom: 10 }}>
                  <Building2 size={13} />
                  <span>{t.organization_name}</span>
                </div>

                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.45, maxWidth: 900 }}>
                  {t.description?.substring(0, 180)}...
                </p>
              </div>

              {/* Right Column: Values & Actions */}
              <div style={{
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 8,
                borderLeft: '1px solid #f1f5f9',
                paddingLeft: 20
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Estimated Value</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{formatINR(t.estimated_value)}</div>
                  <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600, marginTop: 2 }}>
                    Closing: {new Date(t.closing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => onOpenAskAI?.(t)}
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)'
                    }}
                    title="Ask AI about this tender"
                  >
                    <Bot size={13} /> Ask AI
                  </button>

                  <button
                    onClick={() => downloadTenderRFP(t)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                    title="Download Official Notice Inviting Tender (NIT)"
                  >
                    <Download size={13} /> NIT Doc
                  </button>

                  <button
                    onClick={() => onViewDetails(t)}
                    className="btn btn-sm btn-primary"
                    style={{ borderRadius: 6, fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. How It Works Section */}
      <div style={{ marginTop: 60, marginBottom: 50 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            background: '#e0e7ff',
            color: '#4338ca',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: 8
          }}>
            <Zap size={13} /> SIMPLE & POWERFUL WORKFLOW
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 8px' }}>
            How Tender Intelligence Works
          </h2>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', maxWidth: 600, margin: '0 auto' }}>
            From discovery to bid preparation, our grounded AI engine accelerates procurement compliance.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            {
              step: '01',
              title: 'Discover & Filter',
              desc: 'Use natural-language or structured filters to pinpoint relevant government & PSU opportunities across India.',
              icon: Search
            },
            {
              step: '02',
              title: 'Grounded AI Analysis',
              desc: 'Instantly extract key EMD, eligibility thresholds, required documents, and important dates with source citations.',
              icon: Bot
            },
            {
              step: '03',
              title: 'Verify Eligibility',
              desc: 'Compare company turnover, past experience, and certifications side-by-side with tender requirements.',
              icon: Target
            },
            {
              step: '04',
              title: 'Prepare & Win',
              desc: 'Generate optimal BOQ pricing structures and export structured proposal data for final submission.',
              icon: BarChart3
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="saas-card"
                style={{
                  padding: '24px 20px',
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-card, #e2e8f0)',
                  borderRadius: 14,
                  position: 'relative'
                }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#4f46e5',
                  background: '#eef2ff',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: 8 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.5, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Platform Features Section */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-card, #e2e8f0)',
        borderRadius: 20,
        padding: '36px',
        marginBottom: 50
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 6px' }}>
            Built for Enterprise Bidding & Procurement Precision
          </h2>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.88rem' }}>
            Enterprise features designed to eliminate disqualifications and maximize contract win rates.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <div style={{ padding: '16px', borderRadius: 12, border: '1px solid var(--border-subtle, #f1f5f9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ padding: 8, borderRadius: 8, background: '#fdf2f8', color: '#db2777' }}>
                <Sparkles size={18} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                Anti-Hallucination AI
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.5, margin: 0 }}>
              Strict RAG grounding guarantees that the AI never makes up numbers, dates, or eligibility requirements.
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: 12, border: '1px solid var(--border-subtle, #f1f5f9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ padding: 8, borderRadius: 8, background: '#eef2ff', color: '#4f46e5' }}>
                <Search size={18} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                Natural Language Search
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.5, margin: 0 }}>
              Ask conversational queries like "Show IT tenders in Gujarat above 10 lakh" and get instant filtered results.
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: 12, border: '1px solid var(--border-subtle, #f1f5f9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ padding: 8, borderRadius: 8, background: '#ecfdf5', color: '#059669' }}>
                <CheckCircle2 size={18} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                5-Point Eligibility Engine
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.5, margin: 0 }}>
              Structured comparison across turnover, experience, blacklist status, MSME preferences, and GST compliance.
            </p>
          </div>
        </div>
      </div>

      {/* 4. FAQ Accordion Section */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            background: '#f1f5f9',
            color: '#475569',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: 8
          }}>
            <HelpCircle size={13} /> FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
            Got Questions? We Have Answers.
          </h2>
        </div>

        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-card, #e2e8f0)',
                  borderRadius: 12,
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: 'var(--text-main, #0f172a)'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} color="#4f46e5" /> : <ChevronDown size={18} color="#94a3b8" />}
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 20px 18px',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted, #475569)',
                    lineHeight: 1.6,
                    borderTop: '1px solid var(--border-subtle, #f1f5f9)'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
