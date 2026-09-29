import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AccessDenied({ user, attemptedTab, onGoHome }) {
  const getRoleDisplayName = (r) => {
    switch (r) {
      case 'super_admin': return 'Super Admin';
      case 'tender_authority': return 'Tender Authority / Department Head';
      case 'company_user': return 'Vendor / Bidder Company';
      case 'viewer': return 'Normal User / Public Viewer';
      case 'evaluator': return 'Technical Evaluator';
      default: return r || 'Authenticated User';
    }
  };

  return (
    <div style={{
      maxWidth: 720,
      margin: '60px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #fee2e2',
        borderRadius: 16,
        padding: '36px 32px',
        boxShadow: '0 20px 35px -5px rgba(239, 68, 68, 0.1), 0 8px 10px -6px rgba(239, 68, 68, 0.1)',
        width: '100%'
      }}>
        {/* Shield Icon Badge */}
        <div style={{
          width: 68,
          height: 68,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)'
        }}>
          <ShieldAlert size={36} color="#dc2626" />
        </div>

        {/* Security Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          padding: '4px 12px',
          borderRadius: 9999,
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#b91c1c',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 12
        }}>
          <Lock size={12} /> 403 Forbidden – RBAC Security Guard
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 0 10px'
        }}>
          Access Denied: Restricted Workspace
        </h2>

        <p style={{
          fontSize: '0.88rem',
          color: '#64748b',
          lineHeight: 1.55,
          margin: '0 0 24px',
          maxWidth: 540
        }}>
          You do not have the required permissions to access this restricted dashboard or feature. Direct URL tampering, unauthorized role switching, and horizontal privilege escalation are strictly prevented.
        </p>

        {/* Diagnostic Context Box */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '16px 20px',
          textAlign: 'left',
          marginBottom: 24,
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 12px', color: '#475569' }}>
            <span style={{ fontWeight: 600, color: '#64748b' }}>Authenticated User:</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{user?.name || 'Unknown'} ({user?.user_id || user?.id || 'N/A'})</span>

            <span style={{ fontWeight: 600, color: '#64748b' }}>Current Role:</span>
            <span style={{ fontWeight: 700, color: '#0284c7' }}>{getRoleDisplayName(user?.role)}</span>

            <span style={{ fontWeight: 600, color: '#64748b' }}>Attempted Target:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>{attemptedTab}</span>

            <span style={{ fontWeight: 600, color: '#64748b' }}>Enforcement:</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>Active Role Isolation & Data Boundary</span>
          </div>
        </div>

        {/* Return Button */}
        <button
          onClick={onGoHome}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={16} /> Return to Your Authorized Dashboard
        </button>
      </div>
    </div>
  );
}
