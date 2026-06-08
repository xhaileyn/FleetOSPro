'use client';
import { useState } from 'react';

const SEED = [
  { id: 1, severity: 'Critical', tenant: 'KAM Transport',    cat: 'Billing',   msg: 'Payment overdue 30+ days — account at risk of suspension', time: '01 May 2026',     status: 'Active' },
  { id: 2, severity: 'Warning',  tenant: 'SwiftCargo Ltd',   cat: 'Security',  msg: '5 consecutive failed login attempts detected',             time: 'Today 10:40',     status: 'Active' },
  { id: 3, severity: 'Warning',  tenant: 'PeakFleet Co',     cat: 'Usage',     msg: 'API rate limit at 85% of monthly quota',                   time: 'Today 09:15',     status: 'Active' },
  { id: 4, severity: 'Info',     tenant: 'NextDay Express',  cat: 'Devices',   msg: 'GPS device TMP-006F offline for >24 hours',                time: 'Yesterday 08:00', status: 'Active' },
  { id: 5, severity: 'Info',     tenant: 'ACME Logistics',   cat: 'System',    msg: 'Scheduled maintenance window completed successfully',       time: 'Yesterday 03:00', status: 'Resolved' },
  { id: 6, severity: 'Warning',  tenant: 'SwiftDeliver Co',   cat: 'Trial',    msg: 'Trial expires in 5 days — no payment method on file',               time: '22 May 2026',    status: 'Active'   },
  { id: 7, severity: 'Warning',  tenant: 'BritFleet Solutions',cat: 'Devices',  msg: 'GPS device BF-V007 reported low battery — replacement recommended', time: 'Today 07:20',    status: 'Active'   },
  { id: 8, severity: 'Info',     tenant: 'Atlantic Freight Inc',cat: 'System',  msg: 'New tenant onboarded — initial fleet sync completed',               time: '03 Mar 2026',    status: 'Resolved' },
];

const SEV_STYLE: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  Critical: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
  Warning:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' },
  Info:     { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' },
};

const FILTERS = ['All', 'Active', 'Resolved', 'Critical', 'Warning', 'Info'];

export default function GlobalAlertsPage() {
  const [rows, setRows] = useState(SEED);
  const [filter, setFilter] = useState('All');

  const resolve = (id: number) => setRows(p => p.map(r => r.id === id ? { ...r, status: 'Resolved' } : r));
  const shown = filter === 'All' ? rows : rows.filter(r => r.severity === filter || r.status === filter);

  const activeCount   = rows.filter(r => r.status === 'Active').length;
  const criticalCount = rows.filter(r => r.severity === 'Critical' && r.status === 'Active').length;

  const th: React.CSSProperties = {
    padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700,
    color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1.1,
    borderBottom: '1px solid var(--border)', background: 'var(--cream)',
  };
  const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: 'var(--ink2)', borderBottom: '1px solid var(--border)' };

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>
      <style>{`
        ._resolvebtn:hover { background: #c4912a !important; color: #0d1b2a !important; }
        ._filterbtn:hover { background: var(--cream2) !important; }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-alert-octagon" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Platform Ops</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Global Alerting</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Cross-tenant alerts, billing flags, and security warnings</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:0 }}>
          {[{ label:'Active', value:String(activeCount) },{ label:'Critical', value:String(criticalCount) },{ label:'Total', value:String(rows.length) }].map((s,i)=>(
            <div key={s.label} style={{ textAlign:'center', padding:'0 18px', borderLeft:i>0?'1px solid rgba(196,145,42,0.20)':'none' }}>
              <div style={{ fontSize:20, fontWeight:700, color: i===1&&criticalCount>0?'#fca5a5':'#fff' }}>{s.value}</div>
              <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const active = filter === f;
          const isSev = f === 'Critical' || f === 'Warning' || f === 'Info';
          const sev = SEV_STYLE[f];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={active ? '' : '_filterbtn'}
              style={{
                padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: active ? 700 : 500,
                cursor: 'pointer', fontFamily: 'inherit',
                border: active
                  ? `1.5px solid ${isSev && sev ? sev.border : '#c4912a'}`
                  : '1px solid var(--border)',
                background: active
                  ? (isSev && sev ? sev.bg : 'rgba(196,145,42,0.12)')
                  : '#fff',
                color: active
                  ? (isSev && sev ? sev.color : '#c4912a')
                  : 'var(--ink2)',
                transition: 'all 0.12s',
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Severity', 'Tenant', 'Category', 'Message', 'Time', 'Status', ''].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', padding: 40, color: 'var(--ink3)' }}>
                  No alerts match this filter.
                </td>
              </tr>
            )}
            {shown.map(r => {
              const sev = SEV_STYLE[r.severity];
              const rowBg = r.status === 'Active' && r.severity === 'Critical' ? '#fffef7' : '#fff';
              return (
                <tr key={r.id} style={{ background: rowBg }}>
                  <td style={td}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
                      padding: '3px 8px', borderRadius: 4,
                      background: sev?.bg ?? '#f8fafc',
                      color: sev?.color ?? 'var(--ink2)',
                      border: `1px solid ${sev?.border ?? 'var(--border)'}` }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: sev?.dot ?? '#94a3b8', flexShrink: 0 }} />
                      {r.severity}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 600, color: 'var(--ink)' }}>{r.tenant}</td>
                  <td style={td}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      background: 'var(--cream3)', color: 'var(--ink3)',
                      textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {r.cat}
                    </span>
                  </td>
                  <td style={{ ...td, maxWidth: 320 }}>{r.msg}</td>
                  <td style={{ ...td, color: 'var(--ink3)', fontSize: 12, whiteSpace: 'nowrap' }}>{r.time}</td>
                  <td style={td}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600,
                      padding: '3px 8px', borderRadius: 4,
                      background: r.status === 'Active' ? '#fef2f2' : 'var(--cream3)',
                      color: r.status === 'Active' ? '#b91c1c' : 'var(--ink3)',
                      border: `1px solid ${r.status === 'Active' ? '#fecaca' : 'var(--border)'}` }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ ...td, paddingRight: 16 }}>
                    {r.status === 'Active' && (
                      <button
                        onClick={() => resolve(r.id)}
                        className="_resolvebtn"
                        style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 5,
                          cursor: 'pointer', border: '1px solid #c4912a',
                          background: 'rgba(196,145,42,0.12)', color: '#c4912a',
                          fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
