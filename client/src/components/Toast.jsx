import React from 'react';
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className="toast">
          {toast.type === 'error' ? (
            <CircleAlert size={18} color="#ef4444" />
          ) : toast.type === 'info' ? (
            <Info size={18} color="#0284c7" />
          ) : (
            <CircleCheck size={18} color="#10b981" />
          )}
          <span style={{ flex: 1, fontSize: '0.84rem' }}>{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
