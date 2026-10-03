import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CircleCheck, 
  ChevronRight,
  Bookmark,
  BellRing,
  Filter
} from 'lucide-react';
import { formatINR } from '../components/TenderCard';
import { api } from '../services/api';

export default function SmartCalendar({ onViewDetailsById }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getCalendarEvents();
      setEvents(res.events || []);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = filterSavedOnly ? events.filter(e => e.is_saved) : events;

  // Group events by urgency: Urgent (<= 3 days), Warning (<= 7 days), Normal (> 7 days)
  const urgentEvents = filteredEvents.filter(e => e.urgency === 'urgent');
  const warningEvents = filteredEvents.filter(e => e.urgency === 'warning');
  const normalEvents = filteredEvents.filter(e => e.urgency === 'normal');

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Deadlines Calendar & Urgency Monitor
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Automated alerts tracking submission cutoffs (7-day warnings & 72-hour critical locks).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.85rem',
            color: '#334155',
            fontWeight: 600,
            cursor: 'pointer',
            background: '#ffffff',
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <input
              type="checkbox"
              checked={filterSavedOnly}
              onChange={e => setFilterSavedOnly(e.target.checked)}
              style={{ accentColor: '#00796b', cursor: 'pointer' }}
            />
            Show Shortlisted / Saved Only
          </label>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Computing deadline schedules...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 1. CRITICAL DEADLINES (CLOSING IN <= 3 DAYS) */}
          {urgentEvents.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="badge badge-red" style={{ fontSize: '0.82rem', padding: '5px 12px' }}>
                  🚨 CRITICAL LOCK: CLOSING WITHIN 72 HOURS ({urgentEvents.length})
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
                {urgentEvents.map(event => (
                  <div
                    key={event.id}
                    className="saas-card"
                    onClick={() => onViewDetailsById(event.id)}
                    style={{ padding: '18px 20px', borderLeft: '4px solid #dc2626', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#dc2626', fontWeight: 700 }}>
                        {event.reference_no}
                      </span>
                      <span className="badge badge-red">
                        <Clock size={12} /> {event.days_left} {event.days_left === 1 ? 'day' : 'days'} left
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>
                      {event.title}
                    </h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>Value: <strong style={{ color: '#00796b' }}>{formatINR(event.estimated_value)}</strong></span>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>Due: {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} 18:00</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. WARNING DEADLINES (CLOSING IN 4-7 DAYS) */}
          {warningEvents.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="badge badge-yellow" style={{ fontSize: '0.82rem', padding: '5px 12px' }}>
                  ⚠️ UPCOMING DEADLINES: 4 TO 7 DAYS REMAINING ({warningEvents.length})
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
                {warningEvents.map(event => (
                  <div
                    key={event.id}
                    className="saas-card"
                    onClick={() => onViewDetailsById(event.id)}
                    style={{ padding: '18px 20px', borderLeft: '4px solid #d97706', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#d97706', fontWeight: 700 }}>
                        {event.reference_no}
                      </span>
                      <span className="badge badge-yellow">
                        <Clock size={12} /> {event.days_left} days left
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>
                      {event.title}
                    </h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>Value: <strong style={{ color: '#00796b' }}>{formatINR(event.estimated_value)}</strong></span>
                      <span style={{ color: '#d97706', fontWeight: 600 }}>Due: {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. COMFORTABLE HORIZON (> 7 DAYS) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge badge-green" style={{ fontSize: '0.82rem', padding: '5px 12px' }}>
                📅 ACTIVE PROCURING WINDOW (&gt; 7 DAYS) ({normalEvents.length})
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
              {normalEvents.map(event => (
                <div
                  key={event.id}
                  className="saas-card"
                  onClick={() => onViewDetailsById(event.id)}
                  style={{ padding: '18px 20px', borderLeft: '4px solid #00796b', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#00796b', fontWeight: 700 }}>
                      {event.reference_no}
                    </span>
                    <span className="badge badge-green">
                      {event.days_left} days remaining
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>
                    {event.title}
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>Value: <strong style={{ color: '#00796b' }}>{formatINR(event.estimated_value)}</strong></span>
                    <span>Due: {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
