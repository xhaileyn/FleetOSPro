'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';
import type { UserRole } from '@/lib/types';

// ── Report definitions ────────────────────────────────────────────────────────

const REPORTS = [
  { id: '1', name: 'Fleet Summary',        cat: 'Operations', schedule: 'Daily',     last: 'Today 06:00',  formats: ['PDF','XLS'], icon: 'ti-truck',             desc: 'Fleet status, documents & compliance overview',                               trend: '+3% vehicles active vs last week' },
  { id: '2', name: 'Driver Performance',   cat: 'HR',         schedule: 'Weekly',    last: 'Mon 08:00',    formats: ['PDF'],       icon: 'ti-users',             desc: 'Safety scores, HOS utilisation & driver status',                              trend: '2 drivers below target score' },
  { id: '3', name: 'Fuel Consumption',     cat: 'Finance',    schedule: 'Monthly',   last: '01 May 2026',  formats: ['XLS'],       icon: 'ti-gas-station',       desc: 'Fuel levels, refuel requirements & cost estimates',                           trend: '12% above fleet average' },
  { id: '4', name: 'Geofence Violations',  cat: 'Security',   schedule: 'On demand', last: '20 May 2026',  formats: ['PDF'],       icon: 'ti-alert-hexagon',     desc: 'Zone violations, speeding & after-hours events',                              trend: '4 open violations this month' },
  { id: '5', name: 'Maintenance Schedule', cat: 'Operations', schedule: 'Weekly',    last: 'Mon 07:00',    formats: ['PDF'],       icon: 'ti-tool',              desc: 'Overdue, upcoming & completed maintenance tasks',                             trend: '3 vehicles overdue service' },
  { id: '6', name: 'Cost Analysis',        cat: 'Finance',    schedule: 'Monthly',   last: '01 May 2026',  formats: ['XLS','PDF'], icon: 'ti-currency-dollar',   desc: 'Subscription revenue, MRR/ARR & operational costs',                          trend: 'Fleet costs down 7% MoM' },
  { id: '7', name: 'Trip Summary',         cat: 'Operations', schedule: 'On demand', last: '22 May 2026',  formats: ['XLS'],       icon: 'ti-route',             desc: 'Trip log, work hours, distances, fuel & driver activity',                     trend: '184 trips completed this month' },
  { id: '8', name: 'Tracking History',     cat: 'Operations', schedule: 'On demand', last: 'Today 08:30',  formats: ['PDF','XLS'], icon: 'ti-satellite',         desc: 'Per-vehicle GPS tracking history, routes & position timeline',               trend: 'Last export 2 hours ago' },
  { id: '9', name: 'Vehicle Track Report', cat: 'Operations', schedule: 'On demand', last: 'Today 09:15',  formats: ['PDF','XLS'], icon: 'ti-map-route',         desc: 'Complete timestamped track of a single vehicle — GPS pings, speed, events', trend: 'Full audit trail with date & time filters' },
];

// ── Default role access per report ────────────────────────────────────────────
// super_admin always has access (bypass); these are the default tenant roles.

const DEFAULT_RIGHTS: Record<string, UserRole[]> = {
  '1': ['tenant_admin','fleet_admin','fleet_manager','dispatcher','viewer'],
  '2': ['tenant_admin','fleet_admin','fleet_manager'],
  '3': ['tenant_admin','fleet_admin','billing_admin'],
  '4': ['tenant_admin','fleet_admin','fleet_manager','dispatcher'],
  '5': ['tenant_admin','fleet_admin','fleet_manager'],
  '6': ['tenant_admin','fleet_admin','billing_admin'],
  '7': ['tenant_admin','fleet_admin','fleet_manager','dispatcher','vehicle_owner'],
  '8': ['tenant_admin','fleet_admin','fleet_manager','dispatcher','vehicle_owner'],
  '9': ['tenant_admin','fleet_admin','fleet_manager','dispatcher','vehicle_owner'],
};

// Roles that can be assigned report access (excludes super-level roles)
const CONFIGURABLE_ROLES: { value: UserRole; label: string; color: string; icon: string }[] = [
  { value: 'tenant_admin',  label: 'Tenant Admin',   color: '#6366f1', icon: 'ti-crown'          },
  { value: 'fleet_admin',   label: 'Fleet Admin',    color: '#0891b2', icon: 'ti-shield'         },
  { value: 'fleet_manager', label: 'Fleet Manager',  color: '#c4912a', icon: 'ti-steering-wheel' },
  { value: 'dispatcher',    label: 'Dispatcher',     color: '#7c3aed', icon: 'ti-radio'          },
  { value: 'billing_admin', label: 'Billing Admin',  color: '#d97706', icon: 'ti-credit-card'    },
  { value: 'viewer',        label: 'Viewer',         color: '#6b7280', icon: 'ti-eye'            },
  { value: 'vehicle_owner', label: 'Vehicle Owner',  color: '#16a34a', icon: 'ti-car'            },
];

// ── Meta maps ─────────────────────────────────────────────────────────────────

const CATS = ['All', 'Operations', 'HR', 'Finance', 'Security'];

const CAT_META: Record<string, { bg: string; color: string; stripe: string; icon: string }> = {
  Operations: { bg: 'rgba(196,145,42,0.12)', color: '#c4912a',        stripe: '#c4912a',        icon: 'ti-truck'           },
  HR:         { bg: '#ede9fe',               color: '#5b21b6',        stripe: '#7c3aed',        icon: 'ti-users'           },
  Finance:    { bg: '#fef3c7',               color: '#92400e',        stripe: '#d97706',        icon: 'ti-currency-dollar' },
  Security:   { bg: 'var(--red-lt)',         color: 'var(--red)',     stripe: 'var(--red)',     icon: 'ti-shield-lock'     },
};

const SCHED_META: Record<string, { bg: string; color: string; icon: string }> = {
  Daily:       { bg: 'rgba(196,145,42,0.12)', color: '#c4912a', icon: 'ti-refresh'         },
  Weekly:      { bg: '#dbeafe',               color: '#1d4ed8', icon: 'ti-calendar-repeat' },
  Monthly:     { bg: '#fef3c7',               color: '#92400e', icon: 'ti-calendar-month'  },
  'On demand': { bg: 'var(--cream3)',          color: 'var(--ink3)', icon: 'ti-bolt'        },
};

const FMT_META: Record<string, { bg: string; color: string }> = {
  PDF: { bg: '#fef2f2', color: '#b91c1c' },
  XLS: { bg: '#f0fdf4', color: '#15803d' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function KpiCard({ icon, iconColor, label, value, stripe }: {
  icon: string; iconColor: string; label: string; value: string | number; stripe: string;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: stripe, borderRadius: '7px 0 0 7px' }} />
      <div style={{ width: 34, height: 34, borderRadius: 7, background: iconColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, fontSize: 16, flexShrink: 0, marginLeft: 4 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1, color: 'var(--ink)' }}>{value}</div>
      </div>
    </div>
  );
}

// ── Access Rights Modal ───────────────────────────────────────────────────────

function RightsModal({
  rights, defaults, onSave, onClose,
}: {
  rights: Record<string, string[]>;
  defaults: Record<string, UserRole[]>;
  onSave: (next: Record<string, string[]>) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(REPORTS.map(r => [r.id, rights[r.id] ?? defaults[r.id] ?? []]))
  );

  function toggle(reportId: string, role: UserRole) {
    setLocal(prev => {
      const cur = prev[reportId] ?? [];
      return {
        ...prev,
        [reportId]: cur.includes(role) ? cur.filter(x => x !== role) : [...cur, role],
      };
    });
  }

  function resetReport(reportId: string) {
    setLocal(prev => ({ ...prev, [reportId]: [...(defaults[reportId] ?? [])] }));
  }

  function resetAll() {
    setLocal(Object.fromEntries(REPORTS.map(r => [r.id, [...(defaults[r.id] ?? [])]])));
  }

  const cm = (cat: string) => CAT_META[cat] ?? { bg: 'var(--cream3)', color: 'var(--ink3)', stripe: 'var(--ink3)', icon: 'ti-file' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.50)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '96vw', maxWidth: 980, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.28)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)', borderRadius: '14px 14px 0 0', padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(196,145,42,0.20)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-lock-access" style={{ fontSize: 17, color: '#f5d07a' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Report Access Rights</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>Configure which roles can view and generate each report</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={resetAll} style={{ padding: '6px 13px', border: '1px solid rgba(196,145,42,0.35)', borderRadius: 7, background: 'rgba(196,145,42,0.12)', color: '#f5d07a', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-refresh" style={{ fontSize: 11 }} /> Reset all defaults
            </button>
            <button onClick={onClose} style={{ width: 30, height: 30, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 14, display: 'grid', placeItems: 'center' }}>
              <i className="ti ti-x" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ padding: '10px 20px', background: 'var(--cream)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)' }}>Role legend:</span>
          {CONFIGURABLE_ROLES.map(r => (
            <span key={r.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: r.color, fontWeight: 600 }}>
              <i className={`ti ${r.icon}`} style={{ fontSize: 12 }} />{r.label}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink3)' }}>
            <i className="ti ti-crown" style={{ fontSize: 11, color: '#c4912a', marginRight: 4 }} />super_admin always has access — not shown
          </span>
        </div>

        {/* Matrix */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr style={{ background: 'var(--cream)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '9px 16px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink3)', minWidth: 220 }}>Report</th>
                <th style={{ textAlign: 'left', padding: '9px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink3)' }}>Category</th>
                {CONFIGURABLE_ROLES.map(r => (
                  <th key={r.value} style={{ textAlign: 'center', padding: '9px 6px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: r.color, minWidth: 72 }}>
                    <i className={`ti ${r.icon}`} style={{ display: 'block', fontSize: 13, marginBottom: 2 }} />
                    {r.label.split(' ')[0]}
                  </th>
                ))}
                <th style={{ padding: '9px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink3)' }}></th>
              </tr>
            </thead>
            <tbody>
              {REPORTS.map((rep, idx) => {
                const meta = cm(rep.cat);
                const rowRoles = local[rep.id] ?? [];
                const isDefault = JSON.stringify([...rowRoles].sort()) === JSON.stringify([...(defaults[rep.id] ?? [])].sort());
                return (
                  <tr key={rep.id} style={{ background: idx % 2 === 0 ? '#fff' : 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`ti ${rep.icon}`} style={{ fontSize: 15, color: meta.stripe }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{rep.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 1 }}>{rep.schedule}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: meta.bg, color: meta.color }}>
                        {rep.cat}
                      </span>
                    </td>
                    {CONFIGURABLE_ROLES.map(r => {
                      const checked = rowRoles.includes(r.value);
                      const isDefaultOn = (defaults[rep.id] ?? []).includes(r.value);
                      return (
                        <td key={r.value} style={{ textAlign: 'center', padding: '10px 6px' }}>
                          <div
                            onClick={() => toggle(rep.id, r.value)}
                            title={checked ? `Remove ${r.label} access` : `Grant ${r.label} access`}
                            style={{
                              width: 28, height: 28, borderRadius: 7, margin: '0 auto', cursor: 'pointer',
                              border: `2px solid ${checked ? r.color : 'var(--border)'}`,
                              background: checked ? r.color + '18' : '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.12s',
                              position: 'relative',
                            }}
                          >
                            {checked
                              ? <i className="ti ti-check" style={{ fontSize: 13, color: r.color, fontWeight: 700 }} />
                              : <i className="ti ti-minus" style={{ fontSize: 10, color: 'var(--border2)' }} />
                            }
                            {/* Dot if differs from default */}
                            {checked !== isDefaultOn && (
                              <div style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: checked ? '#16a34a' : '#dc2626', border: '1px solid #fff' }} />
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ padding: '10px 10px' }}>
                      {!isDefault && (
                        <button onClick={() => resetReport(rep.id)} title="Reset to default" style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 10, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <i className="ti ti-refresh" style={{ fontSize: 10 }} /> Reset
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '13px 22px', borderTop: '1px solid var(--border)', background: 'var(--cream)', borderRadius: '0 0 14px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} /> Added vs default
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} /> Removed vs default
            </span>
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancel</button>
            <button onClick={() => { onSave(local); onClose(); }} style={{ padding: '8px 22px', border: 'none', borderRadius: 8, background: '#c4912a', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-device-floppy" style={{ fontSize: 13 }} /> Save access rights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user } = useAuthStore();
  const { reportRights, setReportRights } = useConfigStore();
  const [tab,         setTab]         = useState('All');
  const [search,      setSearch]      = useState('');
  const [showRights,  setShowRights]  = useState(false);
  const [showLocked,  setShowLocked]  = useState(false);

  const role = user?.role ?? 'viewer';
  const isSuperAdmin = role === 'super_admin' || role === 'platform_admin';
  const isAdmin = isSuperAdmin || role === 'tenant_admin' || role === 'fleet_admin';

  const now = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Effective rights: stored override wins, else default
  function effectiveRoles(reportId: string): string[] {
    const stored = reportRights[reportId];
    return stored ?? (DEFAULT_RIGHTS[reportId] ?? []);
  }

  function canAccess(reportId: string): boolean {
    if (isSuperAdmin) return true;
    return effectiveRoles(reportId).includes(role);
  }

  const allFiltered = useMemo(() =>
    REPORTS.filter(r =>
      (tab === 'All' || r.cat === tab) &&
      (!search || r.name.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase()))
    ), [tab, search]);

  const visible   = allFiltered.filter(r => canAccess(r.id));
  const locked    = allFiltered.filter(r => !canAccess(r.id));
  const displayed = showLocked ? allFiltered : visible;

  function saveRights(next: Record<string, string[]>) {
    Object.entries(next).forEach(([id, roles]) => setReportRights(id, roles));
  }

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius: 10, padding: '14px 18px', marginBottom: 14,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-report-analytics" style={{ fontSize: 20, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Cost &amp; Efficiency</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Reports</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Generated {now}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {[
            { label: 'Total',     value: REPORTS.length,                                     icon: 'ti-file-description' },
            { label: 'Your Access', value: visible.length + (showLocked ? 0 : 0),            icon: 'ti-lock-open'        },
            { label: 'Scheduled', value: REPORTS.filter(r => r.schedule !== 'On demand').length, icon: 'ti-calendar-repeat' },
            { label: 'On Demand', value: REPORTS.filter(r => r.schedule === 'On demand').length, icon: 'ti-bolt'            },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '0 16px', borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none' }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 12, color: 'rgba(245,208,122,0.55)', display: 'block', marginBottom: 3 }} />
              <div style={{ fontSize: 20, fontWeight: 800, color: i === 1 ? '#4ade80' : '#fff', lineHeight: 1 }}>
                {i === 1 ? `${visible.length}/${REPORTS.length}` : s.value}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
        <KpiCard icon="ti-truck"           iconColor="#c4912a"       label="Operations" value={REPORTS.filter(r => r.cat === 'Operations').length} stripe="#c4912a"       />
        <KpiCard icon="ti-users"           iconColor="#7c3aed"       label="HR"          value={REPORTS.filter(r => r.cat === 'HR').length}         stripe="#7c3aed"       />
        <KpiCard icon="ti-currency-dollar" iconColor="#d97706"       label="Finance"     value={REPORTS.filter(r => r.cat === 'Finance').length}    stripe="#d97706"       />
        <KpiCard icon="ti-shield-lock"     iconColor="var(--red)"    label="Security"    value={REPORTS.filter(r => r.cat === 'Security').length}   stripe="var(--red)"    />
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--ink3)', pointerEvents: 'none' }} />
          <input
            placeholder="Search reports…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, color: 'var(--ink)', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--cream2)', borderRadius: 7, padding: 3 }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setTab(c)} style={{
              padding: '4px 14px', fontSize: 11, fontWeight: 600, borderRadius: 5,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              background: tab === c ? '#fff' : 'transparent',
              color:      tab === c ? 'var(--ink)' : 'var(--ink3)',
              boxShadow:  tab === c ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>{c}</button>
          ))}
        </div>

        {/* Show locked toggle — non-admins see this when there are locked reports */}
        {locked.length > 0 && (
          <button onClick={() => setShowLocked(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 7,
            background: showLocked ? 'var(--cream3)' : '#fff', cursor: 'pointer',
            fontSize: 11, fontWeight: 600, color: 'var(--ink3)', fontFamily: 'inherit',
          }}>
            <i className={`ti ${showLocked ? 'ti-eye' : 'ti-eye-off'}`} style={{ fontSize: 12 }} />
            {showLocked ? 'Hide locked' : `Show locked (${locked.length})`}
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Admin: manage rights */}
        {isAdmin && (
          <button onClick={() => setShowRights(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            background: 'rgba(99,102,241,0.10)', color: '#6366f1',
            border: '1px solid rgba(99,102,241,0.30)', borderRadius: 7,
            fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit',
          }}>
            <i className="ti ti-lock-access" style={{ fontSize: 13 }} /> Manage Access
          </button>
        )}

        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px',
          background: '#c4912a', color: '#fff', border: 'none', borderRadius: 7,
          fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit',
          boxShadow: '0 2px 8px rgba(196,145,42,0.25)',
        }}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} /> Custom Report
        </button>
      </div>

      {/* ── Role badge — show current user's access context ───────────── */}
      {!isSuperAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}>
          {(() => {
            const r = CONFIGURABLE_ROLES.find(x => x.value === role);
            return r ? (
              <>
                <i className={`ti ${r.icon}`} style={{ fontSize: 14, color: r.color }} />
                <span style={{ fontWeight: 600, color: r.color }}>{r.label}</span>
                <span style={{ color: 'var(--ink3)' }}>— you have access to <strong style={{ color: 'var(--ink)' }}>{visible.length}</strong> of {REPORTS.length} reports</span>
              </>
            ) : null;
          })()}
          {locked.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink3)' }}>
              <i className="ti ti-lock" style={{ fontSize: 11, marginRight: 4 }} />{locked.length} report{locked.length > 1 ? 's' : ''} restricted
            </span>
          )}
        </div>
      )}

      {/* ── Report cards ──────────────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <div style={{ padding: '48px 32px', textAlign: 'center', background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
          <i className="ti ti-file-search" style={{ fontSize: 36, color: 'var(--ink3)', opacity: 0.3, display: 'block', marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>No reports found</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Try a different search term or category.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 10 }}>
          {displayed.map(r => {
            const accessible = canAccess(r.id);
            const cm = CAT_META[r.cat] ?? { bg: 'var(--cream3)', color: 'var(--ink3)', stripe: 'var(--ink3)', icon: 'ti-file' };
            const sm = SCHED_META[r.schedule] ?? SCHED_META['On demand'];
            const rolesWithAccess = effectiveRoles(r.id);
            return (
              <div key={r.id} style={{
                background: accessible ? '#fff' : 'var(--cream)',
                border: `1px solid ${accessible ? 'var(--border)' : 'var(--border)'}`,
                borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
                transition: 'box-shadow 0.15s, border-color 0.15s',
                opacity: accessible ? 1 : 0.72,
              }}
                onMouseEnter={e => { if (accessible) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; el.style.borderColor = cm.stripe; } }}
                onMouseLeave={e => { if (accessible) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; el.style.borderColor = 'var(--border)'; } }}
              >
                {/* Colored top stripe */}
                <div style={{ height: 3, background: accessible ? cm.stripe : 'var(--border2)', flexShrink: 0 }} />

                {/* Lock overlay badge */}
                {!accessible && (
                  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fca5a5', fontSize: 10, fontWeight: 700, color: '#dc2626' }}>
                    <i className="ti ti-lock" style={{ fontSize: 11 }} /> Restricted
                  </div>
                )}

                {/* Admin: role access pills */}
                {isAdmin && (
                  <div style={{ padding: '6px 12px 0', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {CONFIGURABLE_ROLES.map(cr => {
                      const has = rolesWithAccess.includes(cr.value);
                      return (
                        <span key={cr.value} title={cr.label} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                          background: has ? cr.color + '15' : 'var(--cream3)',
                          color: has ? cr.color : 'var(--border2)',
                          border: `1px solid ${has ? cr.color + '35' : 'var(--border)'}`,
                          opacity: has ? 1 : 0.5,
                        }}>
                          <i className={`ti ${cr.icon}`} style={{ fontSize: 9 }} />
                          {cr.label.split(' ')[0]}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Card body */}
                <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: accessible ? cm.bg : 'var(--cream2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${r.icon}`} style={{ fontSize: 20, color: accessible ? cm.stripe : 'var(--ink3)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: accessible ? 'var(--ink)' : 'var(--ink3)' }}>{r.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: accessible ? cm.bg : 'var(--cream3)', color: accessible ? cm.color : 'var(--ink3)' }}>
                          {r.cat}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.5 }}>{r.desc}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', background: 'var(--cream)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <i className="ti ti-trending-up" style={{ fontSize: 11, color: accessible ? cm.stripe : 'var(--ink3)', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: 'var(--ink2)', lineHeight: 1.4 }}>{r.trend}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: sm.bg, color: sm.color }}>
                      <i className={`ti ${sm.icon}`} style={{ fontSize: 9 }} />{r.schedule}
                    </span>
                    {r.formats.map(f => (
                      <span key={f} style={{ fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 4, background: FMT_META[f]?.bg ?? 'var(--cream3)', color: FMT_META[f]?.color ?? 'var(--ink3)', letterSpacing: '0.3px' }}>
                        {f}
                      </span>
                    ))}
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--ink3)' }}>
                      <i className="ti ti-history" style={{ fontSize: 10 }} />{r.last}
                    </span>
                  </div>
                </div>

                {/* Generate footer */}
                <div style={{ borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto' }}>
                  {accessible ? (
                    <Link
                      href={`/reports/${r.id}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', textDecoration: 'none', background: '#fff', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--cream)'}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = '#fff'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: cm.stripe, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="ti ti-player-play" style={{ fontSize: 12, color: '#fff' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>Generate Report</div>
                          <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 2 }}>{r.formats.join(' · ')} export available</div>
                        </div>
                      </div>
                      <i className="ti ti-chevron-right" style={{ fontSize: 14, color: 'var(--ink3)' }} />
                    </Link>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', background: 'var(--cream)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ti ti-lock" style={{ fontSize: 12, color: '#fff' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', lineHeight: 1 }}>Access Restricted</div>
                        <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 2 }}>Contact your admin to gain access</div>
                      </div>
                    </div>
                  )}
                  {accessible && (
                    <button title="Schedule" style={{ padding: '10px 14px', background: 'var(--cream)', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', color: 'var(--ink3)', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream3)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream)'}>
                      <i className="ti ti-calendar-plus" style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer count */}
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ink3)', textAlign: 'center' }}>
        Showing <strong style={{ color: 'var(--ink)' }}>{displayed.length}</strong> of <strong style={{ color: 'var(--ink)' }}>{REPORTS.length}</strong> reports
        {!isSuperAdmin && locked.length > 0 && !showLocked && (
          <span style={{ marginLeft: 8, color: 'var(--ink3)' }}>· {locked.length} restricted</span>
        )}
      </div>

      {/* Rights modal */}
      {showRights && (
        <RightsModal
          rights={reportRights}
          defaults={DEFAULT_RIGHTS}
          onSave={saveRights}
          onClose={() => setShowRights(false)}
        />
      )}
    </div>
  );
}
