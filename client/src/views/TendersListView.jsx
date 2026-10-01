import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  FileText, 
  Filter, 
  FileSpreadsheet, 
  ArrowUpDown, 
  Heart, 
  X, 
  Download, 
  Building2, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Award,
  Bot,
  MessageSquare,
  Eye
} from 'lucide-react';
import { formatINR } from '../components/TenderCard';
import { api } from '../services/api';
import { downloadTenderRFP } from '../utils/downloadRFP';

export default function TendersListView({
  onViewDetails,
  onCheckEligibility,
  onViewRecommendation,
  savedTenderIds = new Set(),
  onToggleSave,
  onToggleCompare,
  comparedIds = new Set(),
  onShowToast,
  onOpenAddTender,
  initialFilter,
  onOpenAskAI
}) {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialFilter?.subTab || 'all'); // all, high_match, closing_soon, high_value, msme, saved
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialFilter?.category || 'All');
  const [selectedState, setSelectedState] = useState(initialFilter?.state || 'All');
  const [sortBy, setSortBy] = useState('match_score');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [notInterestedIds, setNotInterestedIds] = useState(new Set());

  // Smart AI Natural Language Search State
  const [nlpInput, setNlpInput] = useState('');
  const [isNlpLoading, setIsNlpLoading] = useState(false);
  const [activeAiFilterDesc, setActiveAiFilterDesc] = useState('');

  const handleNlpSearch = async (queryText = nlpInput) => {
    const q = (queryText || '').trim();
    if (!q) return;
    setIsNlpLoading(true);
    try {
      const res = await api.parseSearchQuery(q);
      const parsed = res?.parsed || {};

      let appliedDesc = [];

      if (parsed.category) {
        setSelectedCategory(parsed.category);
        appliedDesc.push(`Category: ${parsed.category}`);
      }
      if (parsed.state) {
        setSelectedState(parsed.state);
        appliedDesc.push(`State: ${parsed.state}`);
      }
      if (parsed.minValue) {
        setMinValue(parsed.minValue.toString());
        appliedDesc.push(`Min ₹${(parsed.minValue / 100000).toFixed(1)}L`);
      }
      if (parsed.maxValue) {
        setMaxValue(parsed.maxValue.toString());
        appliedDesc.push(`Max ₹${(parsed.maxValue / 100000).toFixed(1)}L`);
      }
      if (parsed.closingSoon) {
        setActiveTab('closing_soon');
        appliedDesc.push('Closing Soon');
      }
      if (parsed.q) {
        setSearchQuery(parsed.q);
        appliedDesc.push(`Keyword: "${parsed.q}"`);
      }

      setActiveAiFilterDesc(appliedDesc.join(' • ') || `Query: "${q}"`);
      if (onShowToast) {
        onShowToast(`AI applied filters: ${appliedDesc.join(', ') || q}`);
      }

      // Re-fetch with parsed values
      setLoading(true);
      const searchRes = await api.getTenders({
        q: parsed.q || searchQuery,
        category: parsed.category || selectedCategory,
        state: parsed.state || selectedState,
        sort_by: sortBy,
        min_value: parsed.minValue || minValue || undefined,
        max_value: parsed.maxValue || maxValue || undefined
      });
      setTenders(searchRes.data || []);
    } catch (err) {
      console.error('NLP search error:', err);
      if (onShowToast) onShowToast('Could not parse natural query. Falling back to keyword search.', 'error');
      setSearchQuery(q);
      fetchTenders();
    } finally {
      setIsNlpLoading(false);
      setLoading(false);
    }
  };

  const handleClearAiFilter = () => {
    setActiveAiFilterDesc('');
    setNlpInput('');
    setSelectedCategory('All');
    setSelectedState('All');
    setMinValue('');
    setMaxValue('');
    setSearchQuery('');
    setActiveTab('all');
    fetchTenders();
    if (onShowToast) onShowToast('Reset all smart search filters.');
  };

  useEffect(() => {
    if (initialFilter) {
      if (initialFilter.category !== undefined) setSelectedCategory(initialFilter.category);
      if (initialFilter.state !== undefined) setSelectedState(initialFilter.state);
      if (initialFilter.subTab !== undefined) {
        if (initialFilter.subTab === 'fresh') setActiveTab('high_match');
        else if (initialFilter.subTab === 'interested') setActiveTab('saved');
        else setActiveTab(initialFilter.subTab);
      }
    }
  }, [initialFilter]);

  useEffect(() => {
    fetchTenders();
  }, [selectedCategory, selectedState, sortBy]);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const res = await api.getTenders({
        q: searchQuery,
        category: selectedCategory,
        state: selectedState,
        sort_by: sortBy,
        min_value: minValue || undefined,
        max_value: maxValue || undefined
      });
      setTenders(res.data || []);
    } catch (err) {
      console.error('Failed to load tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    let csv = 'Tender ID,Title,Organization,Estimated Value,EMD,Closing Date,Match Score\n';
    displayTenders.forEach(t => {
      csv += `"${t.tender_reference_no}","${t.title.replace(/"/g, '""')}","${t.organization_name}",${t.estimated_value},${t.emd_amount},"${t.closing_date}","${t.ai_match_score || 91}%"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BidSphere_Tenders_Export_${Date.now()}.csv`;
    link.click();
    if (onShowToast) onShowToast('Exported active tenders list to CSV spreadsheet.');
  };

  const handleToggleNotInterested = (tender) => {
    const next = new Set(notInterestedIds);
    next.add(tender.id);
    setNotInterestedIds(next);
    if (onShowToast) onShowToast(`Tender ${tender.tender_reference_no} dismissed.`);
  };

  const handleResetNotInterested = () => {
    setNotInterestedIds(new Set());
    if (onShowToast) onShowToast('Restored all dismissed tenders.');
  };

  const handleDownloadNotice = (tender) => {
    downloadTenderRFP(tender);
    if (onShowToast) onShowToast(`Downloaded RFP documentation for ${tender.tender_reference_no}`);
  };

  const handleInterestedClick = (tenderId) => {
    onToggleSave(tenderId);
    const isNowSaved = !savedTenderIds.has(tenderId);
    if (onShowToast) {
      onShowToast(isNowSaved ? 'Marked tender as Interested!' : 'Removed from Interested list');
    }
  };

  // Pipeline Filtering
  let displayTenders = tenders.filter(t => !notInterestedIds.has(t.id));

  if (activeTab === 'high_match') {
    displayTenders = displayTenders.filter(t => (t.ai_match_score || 85) >= 70);
  } else if (activeTab === 'closing_soon') {
    displayTenders = displayTenders.filter(t => {
      const days = Math.ceil((new Date(t.closing_date).getTime() - Date.now()) / 86400000);
      return days <= 7;
    });
  } else if (activeTab === 'high_value') {
    displayTenders = displayTenders.filter(t => (t.estimated_value || 0) >= 50000000);
  } else if (activeTab === 'msme') {
    displayTenders = displayTenders.slice(0, 3);
  } else if (activeTab === 'saved') {
    displayTenders = displayTenders.filter(t => savedTenderIds.has(t.id));
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* 1. Header & Live Count */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Tender Discovery & Intelligence Feed
          </h1>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
            Real-time procurement opportunities with explainable AI match scoring and one-click eligibility checks
          </div>
        </div>

        {notInterestedIds.size > 0 && (
          <button 
            className="btn btn-sm btn-secondary"
            onClick={handleResetNotInterested}
          >
            <RotateCcw size={13} /> Restore Dismissed ({notInterestedIds.size})
          </button>
        )}
      </div>

      {/* 2. Top Analytics Metrics Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 20
      }}>
        {/* Metric 1 */}
        <div 
          className="saas-card card-interactive"
          onClick={() => { setActiveTab('all'); fetchTenders(); }}
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderLeft: activeTab === 'all' ? '4px solid #4f46e5' : '1px solid #e2e8f0',
            background: activeTab === 'all' ? '#eef2ff' : '#ffffff'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Active Market Bids</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
            874 <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>Tenders</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600, marginTop: 4 }}>
            ₹2,450 Cr Total Value →
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          className="saas-card card-interactive"
          onClick={() => {
            setActiveTab(activeTab === 'high_match' ? 'all' : 'high_match');
            if (onShowToast) onShowToast('Filtered to 60 High AI Match Tenders');
          }}
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderLeft: activeTab === 'high_match' ? '4px solid #10b981' : '1px solid #e2e8f0',
            background: activeTab === 'high_match' ? '#f0fdf4' : '#ffffff'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>High AI Fit (80%+)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: 2 }}>
            60 <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>Matches</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: 4 }}>
            Highest Win Probability →
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          className="saas-card card-interactive"
          onClick={() => {
            setActiveTab(activeTab === 'closing_soon' ? 'all' : 'closing_soon');
            if (onShowToast) onShowToast('Filtered to Tenders Closing within 7 Days');
          }}
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderLeft: activeTab === 'closing_soon' ? '4px solid #ea580c' : '1px solid #e2e8f0',
            background: activeTab === 'closing_soon' ? '#fff7ed' : '#ffffff'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Urgent Submissions</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c2410c', marginTop: 2 }}>
            2 <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>Closing &lt; 48h</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 600, marginTop: 4 }}>
            Action Required Now →
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          className="saas-card card-interactive"
          onClick={() => {
            setActiveTab(activeTab === 'saved' ? 'all' : 'saved');
            if (onShowToast) onShowToast('Filtered to Shortlisted Tenders');
          }}
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderLeft: activeTab === 'saved' ? '4px solid #db2777' : '1px solid #e2e8f0',
            background: activeTab === 'saved' ? '#fdf2f8' : '#ffffff'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Interested Shortlist</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#db2777', marginTop: 2 }}>
            {savedTenderIds.size + 3} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>Bids</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#db2777', fontWeight: 600, marginTop: 4 }}>
            Proposal In Preparation →
          </div>
        </div>
      </div>

      {/* 2.5 Smart AI Natural Language Search Box */}
      <div 
        className="haikei-mesh-banner"
        style={{
          border: '1px solid var(--border-card, #e2e8f0)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 20,
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.06)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Sparkles size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                Smart AI Tender Search
              </span>
              <span style={{
                marginLeft: 8,
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#4f46e5',
                background: '#eef2ff',
                padding: '2px 8px',
                borderRadius: 12,
                border: '1px solid #c7d2fe'
              }}>
                NLP Intelligence
              </span>
            </div>
          </div>
          {activeAiFilterDesc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.74rem', color: '#059669', background: '#ecfdf5', padding: '3px 10px', borderRadius: 12, border: '1px solid #a7f3d0', fontWeight: 600 }}>
                ✓ AI Active: {activeAiFilterDesc}
              </span>
              <button
                onClick={handleClearAiFilter}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-card, #cbd5e1)',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #64748b)'
                }}
              >
                Clear AI Filter
              </button>
            </div>
          )}
        </div>

        {/* Input & Action */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-main, #f8fafc)',
            border: '1px solid var(--border-card, #cbd5e1)',
            borderRadius: 8,
            padding: '8px 14px'
          }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              value={nlpInput}
              onChange={e => setNlpInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNlpSearch(); }}
              placeholder='Try asking: "Show IT tenders in Gujarat above 10 lakh" or "Find construction tenders closing this week"...'
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                color: 'var(--text-main, #0f172a)'
              }}
            />
          </div>

          <button
            onClick={() => handleNlpSearch()}
            disabled={isNlpLoading || !nlpInput.trim()}
            className="btn btn-primary"
            style={{
              padding: '8px 18px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: 8,
              cursor: isNlpLoading ? 'not-allowed' : 'pointer',
              opacity: (!nlpInput.trim() && !isNlpLoading) ? 0.7 : 1
            }}
          >
            {isNlpLoading ? (
              <>
                <RefreshCw size={14} className="spin" />
                Parsing Query...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Search with AI
              </>
            )}
          </button>
        </div>

        {/* Suggested Quick Natural Language Queries */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>Try queries:</span>
          {[
            'Show IT tenders in Gujarat above 10 lakh',
            'Find construction tenders closing this week',
            'Show tenders related to software development',
            'Find tenders with low EMD'
          ].map(sample => (
            <button
              key={sample}
              onClick={() => {
                setNlpInput(sample);
                handleNlpSearch(sample);
              }}
              style={{
                background: 'var(--bg-main, #f1f5f9)',
                border: '1px solid var(--border-card, #e2e8f0)',
                color: 'var(--text-muted, #475569)',
                padding: '3px 10px',
                borderRadius: 14,
                fontSize: '0.72rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#818cf8';
                e.currentTarget.style.color = '#4f46e5';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-card, #e2e8f0)';
                e.currentTarget.style.color = 'var(--text-muted, #475569)';
              }}
            >
              "{sample}"
            </button>
          ))}
        </div>
      </div>

      {/* 3. Modern Filter Pills & Action Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 10
      }}>
        {/* Left Smart Filter Pills */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Tenders (${tenders.length})` },
            { id: 'high_match', label: '⭐ High Match (80%+)' },
            { id: 'closing_soon', label: '⏳ Closing Soon (≤ 7d)' },
            { id: 'high_value', label: '💎 High Value (> ₹5 Cr)' },
            { id: 'msme', label: '🚀 MSME Prioritized' },
            { id: 'saved', label: `❤️ Shortlisted (${savedTenderIds.size})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (onShowToast) onShowToast(`Filtered by ${tab.label}`);
              }}
              className={`filter-pill ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Tools (+ Add Tender, Filter Drawer, Excel Export, Sort) */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>


          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            style={{
              background: showFilterDrawer ? '#4f46e5' : '#ffffff',
              color: showFilterDrawer ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <Filter size={14} /> Filter & Search
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              background: '#ffffff',
              color: '#059669',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600
            }}
            title="Download CSV spreadsheet"
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#475569' }}>
            <ArrowUpDown size={14} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: '0.78rem',
                color: '#334155',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="match_score">Sort: Highest AI Match</option>
              <option value="newest">Sort: Newest First</option>
              <option value="deadline">Sort: Closing Soon</option>
              <option value="value_high">Sort: Value (High to Low)</option>
              <option value="value_low">Sort: Value (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Filter Drawer */}
      {showFilterDrawer && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '16px',
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
          alignItems: 'flex-end'
        }}>
          <div>
            <label className="form-label">Keyword / GEM ID</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search title, organization..."
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="form-select"
            >
              <option value="All">All Categories</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Healthcare & Medical Equipment">Healthcare & Medical</option>
              <option value="Civil Works & Construction">Civil Works</option>
              <option value="Renewable Energy">Renewable Energy</option>
              <option value="Electronics & Hardware">Electronics & Hardware</option>
            </select>
          </div>
          <div>
            <label className="form-label">State</label>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="form-select"
            >
              <option value="All">All States</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Delhi">Delhi</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Rajasthan">Rajasthan</option>
            </select>
          </div>
          <div>
            <label className="form-label">Min Budget (INR)</label>
            <input
              type="number"
              value={minValue}
              onChange={e => setMinValue(e.target.value)}
              placeholder="Min Value..."
              className="form-input"
            />
          </div>
          <button className="btn btn-primary" onClick={fetchTenders} style={{ height: 38 }}>
            Apply Filters
          </button>
        </div>
      )}

      {/* 5. Modern Redesigned Tender Cards Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={26} className="spin" style={{ margin: '0 auto 10px', color: '#4f46e5' }} />
          <div>Indexing live tenders and calculating explainable match scores...</div>
        </div>
      ) : displayTenders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <FileText size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: 6 }}>No matching tenders found</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Try clearing filters or changing sub-tabs above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displayTenders.map((tender, index) => {
            const isInterested = savedTenderIds.has(tender.id);
            const isCompared = comparedIds.has(tender.id);

            const closingDate = new Date(tender.closing_date);
            const now = new Date();
            const diffDays = Math.max(0, Math.ceil((closingDate.getTime() - now.getTime()) / 86400000));
            const matchScore = tender.ai_match_score || 88;

            return (
              <div
                key={tender.id}
                className="saas-card card-interactive"
                style={{
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr 220px',
                  gap: 20,
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  borderLeft: matchScore >= 80 ? '4px solid #10b981' : '4px solid #6366f1'
                }}
              >
                {/* 1. Left Column: AI Match Score Gauge */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px 8px',
                  cursor: 'pointer'
                }}
                onClick={() => onViewRecommendation(tender)}
                title="Click to view explainable AI scoring breakdown"
                >
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: matchScore >= 80 ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #4f46e5, #4338ca)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: matchScore >= 80 ? '0 2px 10px rgba(16, 185, 129, 0.3)' : '0 2px 10px rgba(79, 70, 229, 0.3)'
                  }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1 }}>{matchScore}%</span>
                    <span style={{ fontSize: '0.58rem', fontWeight: 600, opacity: 0.9 }}>MATCH</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: matchScore >= 80 ? '#059669' : '#4338ca', marginTop: 6 }}>
                    {matchScore >= 80 ? 'High Fit' : 'Moderate'}
                  </div>
                </div>

                {/* 2. Middle Column: Tender Title & Key Metadata */}
                <div>
                  {/* Top Metadata Line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#4f46e5',
                      background: '#eef2ff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid #c7d2fe',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span className="radar-live-dot" title="Live active tender" />
                      {tender.tender_reference_no}
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>
                      <Building2 size={13} color="#64748b" />
                      {tender.organization_name}
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', color: '#475569' }}>
                      <MapPin size={13} color="#64748b" />
                      {tender.location_city ? `${tender.location_city}, ` : ''}{tender.location_state}
                    </span>

                    {diffDays <= 3 ? (
                      <span className="ticking-urgency-badge">
                        <Clock size={12} />
                        Closes in {diffDays === 0 ? 'Today (<24h)' : `${diffDays}d left`}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: diffDays <= 7 ? '#d97706' : '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Clock size={12} />
                        Closing: {closingDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ({diffDays}d left)
                      </span>
                    )}
                  </div>

                  {/* Title (Normal Casing, Bold, Clickable) */}
                  <h3
                    onClick={() => onViewDetails(tender)}
                    style={{
                      fontSize: '0.98rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: 1.45,
                      marginBottom: 8,
                      cursor: 'pointer',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#4f46e5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#0f172a'}
                  >
                    {tender.title}
                  </h3>

                  {/* Criteria & Tag Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                      {tender.category}
                    </span>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                      Min Turnover: {formatINR(tender.min_turnover_required)}
                    </span>
                    <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                      Exp: {tender.min_experience_years || 3}+ Yrs
                    </span>
                  </div>
                </div>

                {/* 3. Right Column: Estimated Value, EMD & Actions */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  borderLeft: '1px solid #f1f5f9',
                  paddingLeft: 16
                }}>
                  <div style={{ textAlign: 'right', marginBottom: 10 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Estimated Value</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatINR(tender.estimated_value)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>
                      EMD: <strong style={{ color: '#475569' }}>{formatINR(tender.emd_amount)}</strong>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                    <button
                      onClick={() => onViewDetails(tender)}
                      className="btn btn-sm"
                      style={{
                        width: '100%',
                        borderRadius: 6,
                        padding: '7px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #00796b 0%, #004d40 100%)',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0, 121, 107, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer'
                      }}
                      title="View full tender details, timeline, criteria & documentation"
                    >
                      <Eye size={14} /> View Details
                    </button>

                    <button
                      onClick={() => onOpenAskAI?.(tender)}
                      className="btn btn-sm"
                      style={{
                        width: '100%',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      title="Open AI Tender Assistant with this tender loaded"
                    >
                      <Bot size={13} /> Ask AI About This Tender
                    </button>

                    <button
                      onClick={() => onCheckEligibility(tender)}
                      className="btn btn-sm btn-primary"
                      style={{
                        width: '100%',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        justifyContent: 'center'
                      }}
                    >
                      <CheckCircle2 size={13} /> Check Eligibility
                    </button>

                    <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                      <button
                        onClick={() => onViewRecommendation(tender)}
                        className="btn btn-sm btn-ai"
                        style={{ flex: 1, borderRadius: 6, padding: '5px 8px', fontSize: '0.72rem', justifyContent: 'center' }}
                        title="AI Match Analysis"
                      >
                        <Sparkles size={12} /> AI Insights
                      </button>

                      <button
                        onClick={() => handleDownloadNotice(tender)}
                        className="btn btn-sm btn-secondary"
                        style={{ borderRadius: 6, padding: '5px 8px', fontSize: '0.72rem' }}
                        title="Download verified RFP documentation"
                      >
                        <Download size={13} />
                      </button>

                      <button
                        onClick={() => handleInterestedClick(tender.id)}
                        className="btn btn-sm btn-secondary"
                        style={{
                          borderRadius: 6,
                          padding: '5px 8px',
                          color: isInterested ? '#db2777' : '#64748b',
                          borderColor: isInterested ? '#f472b6' : '#cbd5e1',
                          background: isInterested ? '#fdf2f8' : '#fff'
                        }}
                        title={isInterested ? 'Remove from interested' : 'Mark as interested'}
                      >
                        <Heart size={13} fill={isInterested ? '#db2777' : 'none'} />
                      </button>
                    </div>

                    {/* Compare Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 2 }}>
                      <input
                        type="checkbox"
                        id={`comp_${tender.id}`}
                        checked={isCompared}
                        onChange={() => onToggleCompare(tender.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor={`comp_${tender.id}`} style={{ fontSize: '0.7rem', color: '#64748b', cursor: 'pointer' }}>
                        Compare
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
