import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Sparkles, 
  ArrowUpDown, 
  RefreshCw, 
  X,
  Layers,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import TenderCard from '../components/TenderCard';
import { api } from '../services/api';

export default function TenderDiscovery({
  onViewDetails,
  onCheckEligibility,
  savedTenderIds = new Set(),
  onToggleSave,
  comparedIds = new Set(),
  onToggleCompare,
  userRole = 'company_user'
}) {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [sortBy, setSortBy] = useState('match_score');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [maxDeadlineDays, setMaxDeadlineDays] = useState('');

  const categories = [
    'All',
    'Information Technology',
    'Healthcare & Medical Equipment',
    'Civil Works & Construction',
    'Renewable Energy',
    'Electronics & Hardware',
    'Healthcare & Maintenance'
  ];

  const states = ['All', 'Gujarat', 'Delhi', 'Karnataka', 'Maharashtra', 'Rajasthan'];

  useEffect(() => {
    fetchTenders();
  }, [selectedCategory, selectedState, sortBy]);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const params = {
        q: searchQuery,
        category: selectedCategory,
        state: selectedState,
        sort_by: sortBy,
        min_value: minValue || undefined,
        max_value: maxValue || undefined,
        max_deadline_days: maxDeadlineDays || undefined
      };
      const res = await api.getTenders(params);
      setTenders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTenders();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedState('All');
    setMinValue('');
    setMaxValue('');
    setMaxDeadlineDays('');
    setSortBy('match_score');
    setTimeout(fetchTenders, 50);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.35), rgba(15, 23, 42, 0.8))',
        border: '1px solid var(--border-accent)',
        borderRadius: 16,
        padding: '32px 36px',
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 750 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: 12 }}>
            <Sparkles size={14} color="#60a5fa" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd' }}>
              EXPLAINABLE AI RECOMMENDATION ENGINE ACTIVE
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: 10, lineHeight: 1.25 }}>
            Personalized Government & PSU Tender Discovery
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Explore verified official tenders indexed from Indian departments and PSUs. Powered by weighted multi-factor matching, grounded document citations, and instant eligibility validation.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        background: 'rgba(15, 23, 42, 0.6)',
        padding: '16px 20px',
        borderRadius: 14,
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flex: 1, minWidth: 300, maxWidth: 540 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: 12 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by tender ID, keywords, department, state..."
              className="form-input"
              style={{ paddingLeft: 38 }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 18px' }}>
            Search
          </button>
        </form>

        {/* Filters & Sorting */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: 170 }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* State Dropdown */}
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: 120 }}
          >
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(15, 23, 42, 0.8)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <ArrowUpDown size={14} color="#94a3b8" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="match_score">Highest AI Match</option>
              <option value="deadline">Approaching Deadline</option>
              <option value="newest">Newly Published</option>
              <option value="value_high">Value: High to Low</option>
              <option value="value_low">Value: Low to High</option>
            </select>
          </div>

          {/* Filter Drawer Toggle */}
          <button
            type="button"
            className={`btn btn-sm ${showFilterDrawer ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          >
            <SlidersHorizontal size={14} /> Advanced
          </button>
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {showFilterDrawer && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '20px 24px',
          borderRadius: 12,
          border: '1px solid var(--border-accent)',
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr) auto',
          gap: 16,
          alignItems: 'end'
        }}>
          <div>
            <label className="form-label">Min Value (INR)</label>
            <input
              type="number"
              value={minValue}
              onChange={e => setMinValue(e.target.value)}
              placeholder="e.g. 10000000 (1 Cr)"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Max Value (INR)</label>
            <input
              type="number"
              value={maxValue}
              onChange={e => setMaxValue(e.target.value)}
              placeholder="e.g. 500000000 (50 Cr)"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Closing Window (Days)</label>
            <input
              type="number"
              value={maxDeadlineDays}
              onChange={e => setMaxDeadlineDays(e.target.value)}
              placeholder="e.g. 15 days"
              className="form-input"
            />
          </div>

          <div>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={fetchTenders}
              style={{ width: '100%', height: 42 }}
            >
              Apply Filters
            </button>
          </div>

          <div>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleClearFilters}
              style={{ height: 42 }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: '#fff' }}>{tenders.length}</strong> Opportunities Found
        </div>

        <button 
          onClick={fetchTenders}
          className="btn btn-sm btn-secondary"
          style={{ fontSize: '0.78rem' }}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tender Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" color="#3b82f6" style={{ margin: '0 auto 12px' }} />
          <div>Evaluating tender requirements and calculating explainable match scores...</div>
        </div>
      ) : tenders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: 14,
          border: '1px solid var(--border-subtle)'
        }}>
          <Search size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 6 }}>No matching tenders found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Try adjusting your search keywords, broadening category filters, or clearing value parameters.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={handleClearFilters}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tenders.map(tender => (
            <TenderCard
              key={tender.id}
              tender={tender}
              onViewDetails={onViewDetails}
              onCheckEligibility={onCheckEligibility}
              onToggleSave={onToggleSave}
              isSaved={savedTenderIds.has(tender.id)}
              isCompared={comparedIds.has(tender.id)}
              onToggleCompare={onToggleCompare}
              userRole={userRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}
