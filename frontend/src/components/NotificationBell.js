import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../services/notificationApi';

const SSE_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const parseUtc = iso => {
  if (!iso) return null;
  const s = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
  return new Date(s);
};

const fmtRelative = iso => {
  const d = parseUtc(iso);
  if (!d) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const STATUS_BADGE = {
  unread:  { bg: '#eff6ff', color: '#2563eb', label: 'Unread'  },
  read:    { bg: '#f3f4f6', color: '#6b7280', label: 'Read'    },
  deleted: { bg: '#fef2f2', color: '#dc2626', label: 'Deleted' },
};

function NotificationBell() {
  const navigate = useNavigate();
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [connected,     setConnected]     = useState(false);
  const [dropPos,       setDropPos]       = useState({ top: 0, left: 0 });
  const ref      = useRef(null);
  const dropRef  = useRef(null);
  const esRef    = useRef(null);
  const retryRef = useRef(null);

  const connectSSE = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Close existing connection
    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    const url = `${SSE_BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => { setConnected(true); clearTimeout(retryRef.current); };

    es.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.type === 'init') {
          setNotifications(msg.notifications || []);
          setUnread(msg.unread ?? 0);
        } else if (msg.type === 'new') {
          setNotifications(prev => [msg.notification, ...prev]);
          setUnread(msg.unread ?? 0);
        } else if (msg.type === 'count') {
          setUnread(msg.unread ?? 0);
        }
      } catch { /* ignore malformed */ }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;
      // Reconnect after 5 s
      retryRef.current = setTimeout(connectSSE, 5000);
    };
  }, []);

  useEffect(() => {
    connectSSE();
    return () => {
      if (esRef.current) esRef.current.close();
      clearTimeout(retryRef.current);
    };
  }, [connectSSE]);

  // Close dropdown on outside click — exclude both the bell and the portalled dropdown
  useEffect(() => {
    const handler = e => {
      const inBell = ref.current?.contains(e.target);
      const inDrop = dropRef.current?.contains(e.target);
      if (!inBell && !inDrop) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async n => {
    if (n.status === 'unread') {
      await notificationApi.markRead(n.id).catch(() => {});
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, status: 'read' } : x));
      setUnread(u => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.redirect_path) navigate(n.redirect_path);
  };

  const handleDelete = async (e, n) => {
    e.stopPropagation();
    await notificationApi.remove(n.id).catch(() => {});
    setNotifications(prev => prev.filter(x => x.id !== n.id));
    if (n.status === 'unread') setUnread(u => Math.max(0, u - 1));
  };

  const handleMarkAll = async () => {
    await notificationApi.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(x => x.status === 'unread' ? { ...x, status: 'read' } : x));
    setUnread(0);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* ── Bell button ── */}
      <button
        onClick={() => {
          if (ref.current) {
            const r = ref.current.getBoundingClientRect();
            setDropPos({ top: r.top, left: r.right + 8 });
          }
          setOpen(o => !o);
        }}
        title="Notifications"
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36,
          border: 'none', background: 'none',
          cursor: 'pointer',
          color: open ? '#fff' : 'rgba(220,220,210,.75)',
          flexShrink: 0, transition: 'color .15s',
          padding: 0,
        }}
      >
        {/* Bell SVG — matches the reference image style */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: open ? 'brightness(1.3)' : 'none', transition: 'filter .15s' }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {/* Badge — large, overlapping top-right like the reference */}
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -4,
            minWidth: 20, height: 20, borderRadius: '50%',
            background: '#e53e3e', color: '#fff',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
            border: '2px solid var(--brand)',
            boxShadow: '0 2px 6px rgba(229,62,62,.5)',
            animation: 'nb-pop .25s cubic-bezier(.34,1.56,.64,1)',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}

        {/* Live connection dot */}
        <span style={{
          position: 'absolute', bottom: 2, right: 0,
          width: 6, height: 6, borderRadius: '50%',
          background: connected ? '#4ade80' : '#6b7280',
          border: '1.5px solid var(--brand)',
        }} title={connected ? 'Live' : 'Reconnecting…'} />
      </button>

      {/* ── Dropdown — portalled to <body> to escape all stacking contexts ── */}
      {open && createPortal(
        <div ref={dropRef} style={{
          position: 'fixed', left: dropPos.left, top: dropPos.top,
          width: 340,
          background: '#fff', borderRadius: 12,
          border: '1px solid var(--line)',
          boxShadow: '0 8px 28px rgba(0,0,0,.13)',
          zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 14px', borderBottom: '1px solid var(--line)', flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', flex: 1 }}>
              Notifications
              {unread > 0 && (
                <span style={{
                  marginLeft: 7, background: '#dc2626', color: '#fff',
                  fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '1px 6px',
                  fontFamily: 'var(--mono)',
                }}>{unread} unread</span>
              )}
            </span>
            {unread > 0 && (
              <button onClick={handleMarkAll} style={{
                fontSize: 11, color: 'var(--brand)', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>Mark all read</button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', maxHeight: 252, scrollbarWidth: 'thin', scrollbarColor: 'var(--line) transparent' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
                No notifications yet.
              </div>
            ) : notifications.map(n => {
              const badge = STATUS_BADGE[n.status] || STATUS_BADGE.read;
              return (
                <div
                  key={n.id}
                  onMouseDown={() => handleClick(n)}
                  style={{
                    display: 'flex', gap: 10, padding: '11px 14px',
                    borderBottom: '1px solid var(--line)', cursor: 'pointer',
                    background: n.status === 'unread' ? '#f0f7ff' : '#fff',
                    transition: 'background .12s', position: 'relative',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = n.status === 'unread' ? '#dbeafe' : 'var(--surface)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.status === 'unread' ? '#f0f7ff' : '#fff'; }}
                >
                  {/* Unread dot */}
                  <div style={{ paddingTop: 5, flexShrink: 0 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: n.status === 'unread' ? '#2563eb' : 'var(--line)',
                    }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title + status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: n.status === 'unread' ? 700 : 500, fontSize: 13, color: 'var(--ink)', lineHeight: 1.3 }}>
                        {n.title}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, fontFamily: 'var(--mono)',
                        textTransform: 'uppercase', padding: '1px 5px', borderRadius: 99,
                        background: badge.bg, color: badge.color, flexShrink: 0,
                      }}>{badge.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 3, lineHeight: 1.4 }}>
                      {n.description}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                      {fmtRelative(n.created_at)}
                    </div>
                  </div>

                  {/* Delete ✕ */}
                  <button
                    onMouseDown={ev => { ev.stopPropagation(); handleDelete(ev, n); }}
                    style={{
                      flexShrink: 0, alignSelf: 'flex-start',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink-mute)', fontSize: 13, lineHeight: 1,
                      padding: '0 2px', marginTop: 1,
                    }}
                    title="Dismiss"
                  >✕</button>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes nb-pop {
          0%   { transform: scale(0);   opacity: 0; }
          60%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default NotificationBell;
