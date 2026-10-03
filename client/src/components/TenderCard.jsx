import React from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  IndianRupee, 
  Sparkles, 
  Bookmark, 
  CheckCircle, 
  ChevronRight,
  ShieldCheck,
  Scale,
  Bot
} from 'lucide-react';

export function formatINR(amount) {
  if (!amount || isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export default function TenderCard({ 
  tender, 
  onViewDetails, 
  onCheckEligibility, 
  onToggleSave,
  onOpenAskAI,
  isSaved = false,
  isCompared = false,
  onToggleCompare,
  userRole = 'company_user'
}) {
  const closingDate = tender.closing_date ? new Date(tender.closing_date) : new Date();
  const now = new Date();
  const diffDays = tender.closing_date && !isNaN(closingDate.getTime()) 
    ? Math.ceil((closingDate.getTime() - now.getTime()) / 86400000) 
    : 0;

  let urgencyBadge = null;
  if (!tender.closing_date || isNaN(closingDate.getTime())) {
    urgencyBadge = <span className="badge badge-gray">No Deadline</span>;
  } else if (diffDays <= 0) {
    urgencyBadge = <span className="badge badge-gray">Closed</span>;
  } else if (diffDays <= 3) {
    urgencyBadge = <span className="badge badge-danger"><Clock size={12} /> Closes in {diffDays} {diffDays === 1 ? 'day' : 'days'}</span>;
  } else if (diffDays <= 7) {
    urgencyBadge = <span className="badge badge-warning"><Clock size={12} /> {diffDays} days left</span>;
  } else {
    urgencyBadge = <span className="badge badge-primary"><Calendar size={12} /> Closes {closingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>;
  }

  // Match score styles
  const matchScore = tender.ai_match_score || 50;
  let matchBadgeClass = 'match-score-pill match-score-low';
  if (matchScore >= 80) matchBadgeClass = 'match-score-pill match-score-high';
  else if (matchScore >= 60) matchBadgeClass = 'match-score-pill match-score-medium';

  return (
    <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Header: Reference, Category, Badges & Save Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#60a5fa', fontWeight: 700, background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
            {tender.tender_reference_no}
          </span>
          <span className="badge badge-gray">{tender.category}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <MapPin size={12} /> {tender.location_city ? `${tender.location_city}, ` : ''}{tender.location_state}
          </span>
          {urgencyBadge}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Comparison Checkbox */}
          {userRole === 'company_user' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: isCompared ? '#38bdf8' : 'var(--text-dim)', cursor: 'pointer', userSelect: 'none' }}>
              <input 
                type="checkbox"
                checked={isCompared}
                onChange={() => onToggleCompare(tender.id)}
                style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              Compare
            </label>
          )}

          {/* Save / Bookmark Button */}
          {userRole === 'company_user' && (
            <button
              onClick={() => onToggleSave(tender.id)}
              className="btn btn-sm btn-secondary"
              style={{
                width: 32,
                height: 32,
                padding: 0,
                background: isSaved ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: isSaved ? '#3b82f6' : 'transparent'
              }}
              title={isSaved ? 'Saved to My Tenders' : 'Save tender'}
            >
              <Bookmark size={15} color={isSaved ? '#60a5fa' : '#94a3b8'} fill={isSaved ? '#60a5fa' : 'none'} />
            </button>
          )}
        </div>
      </div>

      {/* Tender Title & Authority */}
      <div>
        <h3 
          onClick={() => onViewDetails(tender)}
          style={{ fontSize: '1.15rem', color: '#fff', cursor: 'pointer', lineHeight: 1.4, marginBottom: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = '#60a5fa'}
          onMouseLeave={e => e.currentTarget.style.color = '#fff'}
        >
          {tender.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <Building2 size={14} color="#94a3b8" />
          <span>{tender.organization_name || 'Procuring Authority'}</span>
        </div>
      </div>

      {/* Financials & AI Match Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        alignItems: 'center',
        gap: 24,
        background: 'rgba(15, 23, 42, 0.5)',
        padding: '12px 16px',
        borderRadius: 10,
        border: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Estimated Value
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399' }}>
            {formatINR(tender.estimated_value)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            EMD Amount
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e2e8f0' }}>
            {formatINR(tender.emd_amount)}
          </div>
        </div>

        {/* Explainable AI Match Badge */}
        {userRole === 'company_user' && (
          <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={matchBadgeClass}>
              <Sparkles size={14} />
              <span>{matchScore}% Match</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {tender.match_summary && (
            <span>💡 {tender.match_summary}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {onOpenAskAI && (
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => onOpenAskAI(tender)}
              style={{ fontSize: '0.78rem', color: '#7c3aed', borderColor: 'rgba(124, 58, 237, 0.3)' }}
              title="Ask AI about this tender"
            >
              <Bot size={13} /> Ask AI
            </button>
          )}

          {userRole === 'company_user' && (
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => onCheckEligibility(tender)}
              style={{ fontSize: '0.78rem' }}
            >
              <CheckCircle size={14} color="#34d399" /> Check Eligibility
            </button>
          )}

          <button 
            className="btn btn-sm btn-primary"
            onClick={() => onViewDetails(tender)}
            style={{ fontSize: '0.78rem' }}
          >
            View Details <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
