'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuditRow {
  id: string;
  tenantId: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string;
  outcome: string;
  ipAddress: string;
  details: Record<string, unknown> | string | null;
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      dateStyle: 'short', timeStyle: 'short',
    });
  } catch { return iso; }
}

function roleLabel(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function actionLabel(action: string) {
  return action.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const th: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1,
  borderBottom: '1px solid var(--border)',
};
const td: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, color: 'var(--ink2)',
  borderBottom: '1px solid var(--border)',
};

export default function AuthSessionsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'login' | 'activity'>('login');
  const [loginRows, setLoginRows]    = useState<AuditRow[]>([]);
  const [activityRows, setActivityRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const tid = user?.tenantId;
    const tq  = tid ? `&tenantId=${tid}` : '';
    try {
      const [loginData, activityData] = await Promise.all([
        fetch(`/api/v1/audit-events?action=login,login_failed${tq}&limit=100`).then(r => r.json()),
        fetch(`/api/v1/audit-events?${tq}&limit=200`).then(r => r.json()),
      ]);
      setLoginRows(Array.isArray(loginData) ? loginData : []);
      // Activity log = all events except login/login_failed
      const nonLogin = (Array.isArray(activityData) ? activityData : []).filter(
        (r: AuditRow) => r.action !== 'login' && r.action !== 'login_failed'
      );
      setActivityRows(nonLogin);
    } catch (err) {
      console.error('[auth-sessions]', err);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const outcomeChip = (outcome: string) => {
    const ok = outcome === 'success';
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
        background: ok ? '#dcfce7' : '#fee2e2',
        color: ok ? '#15803d' : '#dc2626',
      }}>
        {ok ? 'Success' : 'Failed'}
      </span>
    );
  };

  const tabBtn = (key: 'login' | 'activity', label: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        padding: '6px 16px', fontSize: 13, fontWeight: 500, borderRadius: 6,
        border: 'none', cursor: 'pointer',
        background: tab === key ? '#0d1b2a' : 'transparent',
        color: tab === key ? '#f5d07a' : 'var(--ink3)',
        border: tab === key ? '1px solid rgba(196,145,42,0.35)' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  );

  const emptyRow = (msg: string) => (
    <tr>
      <td colSpan={99} style={{ ...td, textAlign: 'center', color: 'var(--ink3)', padding: 32 }}>
        {msg}
      </td>
    </tr>
  );

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border: '1px solid rgba(196,145,42,0.18)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 20,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-history" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Security &amp; Auth</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Login History &amp; Activity</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Audit log of all login events and user actions</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Login Events',    value: String(loginRows.length) },
              { label: 'Activity Events', value: String(activityRows.length) },
            ].map((s, i) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '0 18px', borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={fetchData}
            style={{ padding: '7px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(196,145,42,0.35)', background: 'rgba(196,145,42,0.12)', color: '#f5d07a', fontWeight: 600 }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#e8e3dc', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {tabBtn('login',    'Login history')}
        {tabBtn('activity', 'Activity log')}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {tab === 'login' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['User', 'Role', 'IP address', 'Outcome', 'When', 'Details'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? emptyRow('Loading…')
                : loginRows.length === 0
                  ? emptyRow('No login events recorded yet. Login events will appear here after users sign in.')
                  : loginRows.map(r => (
                    <tr key={r.id} style={{ background: '#fff' }}>
                      <td style={{ ...td, fontWeight: 500, color: 'var(--ink)' }}>{r.actor}</td>
                      <td style={td}>{roleLabel(r.actorRole)}</td>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{r.ipAddress || '—'}</td>
                      <td style={td}>{outcomeChip(r.outcome)}</td>
                      <td style={{ ...td, color: 'var(--ink3)', fontSize: 12 }}>{fmtTime(r.timestamp)}</td>
                      <td style={{ ...td, fontSize: 12, color: 'var(--ink3)' }}>
                        {(() => {
                          const d = typeof r.details === 'string' ? JSON.parse(r.details || '{}') : (r.details ?? {});
                          return d.reason
                            ? <span style={{ color: '#dc2626' }}>{String(d.reason).replace(/_/g, ' ')}</span>
                            : (d.fullName ? String(d.fullName) : (d.source ? String(d.source) : '—'));
                        })()}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        )}

        {tab === 'activity' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Actor', 'Role', 'Action', 'Resource', 'Resource ID', 'Outcome', 'When'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? emptyRow('Loading…')
                : activityRows.length === 0
                  ? emptyRow('No activity events recorded yet. User and alert actions will appear here.')
                  : activityRows.map(r => (
                    <tr key={r.id} style={{ background: '#fff' }}>
                      <td style={{ ...td, fontWeight: 500, color: 'var(--ink)' }}>{r.actor}</td>
                      <td style={td}>{roleLabel(r.actorRole)}</td>
                      <td style={{ ...td, fontWeight: 500 }}>
                        <span style={{
                          fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 600,
                          background: r.action.startsWith('alert') ? '#fef9c3'
                            : r.action.startsWith('user') ? '#eff6ff' : '#f3f4f6',
                          color: r.action.startsWith('alert') ? '#a16207'
                            : r.action.startsWith('user') ? '#1d4ed8' : '#374151',
                        }}>
                          {actionLabel(r.action)}
                        </span>
                      </td>
                      <td style={td}>{r.resource}</td>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.resourceId || '—'}
                      </td>
                      <td style={td}>{outcomeChip(r.outcome)}</td>
                      <td style={{ ...td, color: 'var(--ink3)', fontSize: 12 }}>{fmtTime(r.timestamp)}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink3)' }}>
          {tab === 'login'
            ? `${loginRows.length} login event${loginRows.length !== 1 ? 's' : ''} shown`
            : `${activityRows.length} activity event${activityRows.length !== 1 ? 's' : ''} shown`}
        </div>
      )}
    </div>
  );
}
