'use client';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useVehiclesStore } from '@/store/vehiclesStore';

/* ── Shared micro-components ────────────────────────────────────────── */
function KpiCard({ icon, iconColor, label, value, sub, subColor, stripe, onClick }: {
  icon: string; iconColor?: string; label: string; value: string | number;
  sub?: string; subColor?: string; stripe?: string; onClick?: () => void;
}) {
  const chipBg = (iconColor ?? '#c4912a') + '15';
  return (
    <div onClick={onClick} style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 7,
      padding: '8px 10px', cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s, border-color 0.15s', position: 'relative', overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 10,
    }}
      onMouseEnter={e => { if (onClick) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 3px 10px rgba(0,0,0,0.08)'; el.style.borderColor = '#c4912a'; } }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; el.style.borderColor = 'var(--border)'; }}
    >
      {stripe && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: stripe, borderRadius: '7px 0 0 7px' }} />}
      <div style={{ width: 34, height: 34, borderRadius: 7, background: chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor ?? '#c4912a', fontSize: 16, flexShrink: 0, marginLeft: stripe ? 4 : 0 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1, color: 'var(--ink)' }}>{value}</div>
        {sub && <div style={{ fontSize: 9, marginTop: 2, color: subColor ?? 'var(--ink3)', fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = 'default', size = 'sm', disabled }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md'; disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: '#fff', color: 'var(--ink2)', border: '1px solid var(--border)' },
    primary: { background: '#c4912a', color: '#fff', border: '1px solid #c4912a' },
    danger:  { background: 'var(--red-lt)', color: 'var(--red)', border: '1px solid #fca5a5' },
    ghost:   { background: 'transparent', color: 'var(--ink3)', border: '1px solid transparent' },
  };
  const pad: Record<string, string> = { xs: '3px 8px', sm: '5px 12px', md: '7px 16px' };
  const fs: Record<string, number>  = { xs: 10, sm: 11, md: 12 };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...styles[variant], padding: pad[size], fontSize: fs[size], borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit', fontWeight: 600, display: 'inline-flex', alignItems: 'center',
        gap: 5, transition: 'opacity 0.15s', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}

/* ── Seed data ─────────────────────────────────────────────────────── */
const ROWS = [
  { id:1, vehicle:'ABC-006F', driver:'— Unassigned',    type:'After hours',     start:'23:15  22 May', duration:'45 min', location:'Brooklyn, NY',    severity:'High',   status:'Under review', tenantId:'1' },
  { id:2, vehicle:'ABC-002B', driver:'Michael Davis',   type:'Restricted zone', start:'14:30  23 May', duration:'12 min', location:'Industrial Park',  severity:'Medium', status:'Resolved',     tenantId:'1' },
  { id:3, vehicle:'ABC-004D', driver:'— Unassigned',    type:'Weekend usage',   start:'10:00  24 May', duration:'2h 30m', location:'Queens Blvd, NY', severity:'High',   status:'Under review', tenantId:'1' },
  { id:4, vehicle:'ABC-001A', driver:'James Mitchell',  type:'Route deviation', start:'09:15  21 May', duration:'25 min', location:'I-95 N, NJ',      severity:'Low',    status:'Resolved',     tenantId:'1' },
  { id:5, vehicle:'ABC-003C', driver:'— Unassigned',    type:'After hours',     start:'22:40  20 May', duration:'1h 10m', location:'Route 1, NJ',     severity:'High',   status:'Resolved',     tenantId:'1' },
];

const SEV_ICON: Record<string, string> = {
  High: 'ti-alert-octagon', Medium: 'ti-alert-triangle', Low: 'ti-info-circle',
};
const SEV: Record<string, React.CSSProperties> = {
  High:   { background: '#fef2f2', color: '#dc2626' },
  Medium: { background: '#fffbeb', color: '#d97706' },
  Low:    { background: '#eff6ff', color: '#2563eb' },
};

/* ── Page ──────────────────────────────────────────────────────────── */
export default function UnauthorizedPage() {
  const [rows, setRows]             = useState(ROWS);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch]         = useState('');

  const { user }     = useAuthStore();
  const { vehicles } = useVehiclesStore();
  const role           = user?.role ?? '';
  const tenantId       = user?.tenantId ?? null;
  const isSuperAdmin   = role === 'super_admin';
  const isVehicleOwner = role === 'vehicle_owner';
  const canResolve     = isSuperAdmin || role === 'fleet_admin' || role === 'tenant_admin' || role === 'fleet_manager';

  const accessiblePlates = useMemo<Set<string>>(() => {
    if (isSuperAdmin) return new Set(rows.map(r => r.vehicle));
    if (isVehicleOwner) {
      const ids = user?.vehicleIds?.length ? user.vehicleIds : user?.vehicleId ? [user.vehicleId] : [];
      return new Set(vehicles.filter(v => ids.includes(v.id)).map(v => v.plate));
    }
    if (tenantId) return new Set(vehicles.filter(v => v.tenantId === tenantId).map(v => v.plate));
    return new Set(rows.map(r => r.vehicle));
  }, [isSuperAdmin, isVehicleOwner, vehicles, tenantId, user?.vehicleId, user?.vehicleIds, rows]);

  const scopedRows = useMemo(
    () => rows.filter(r => accessiblePlates.size === 0 || accessiblePlates.has(r.vehicle)),
    [rows, accessiblePlates],
  );

  const resolve = (id: number) => setRows(p => p.map(r => r.id === id ? { ...r, status: 'Resolved' } : r));

  const underReview = scopedRows.filter(r => r.status === 'Under review').length;
  const resolved    = scopedRows.filter(r => r.status === 'Resolved').length;

  const visibleRows = useMemo(() => {
    let list = statusFilter === 'All' ? scopedRows : scopedRows.filter(r => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.vehicle.toLowerCase().includes(q) ||
        r.driver.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [scopedRows, statusFilter, search]);

  const th: React.CSSProperties = {
    padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1,
    borderBottom: '1px solid var(--border)', background: 'var(--cream)',
  };
  const td: React.CSSProperties = { padding: '10px 12px', fontSize: 13, color: 'var(--ink2)', borderBottom: '1px solid var(--border)' };

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius: 10, padding: '14px 18px', marginBottom: 14,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-alert-octagon" style={{ fontSize: 20, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Fleet Management</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Unauthorized Usage</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              {underReview > 0 ? `${underReview} incident${underReview !== 1 ? 's' : ''} under review` : 'No open incidents'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isVehicleOwner && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              My vehicles only
            </span>
          )}
          {!isSuperAdmin && !isVehicleOwner && tenantId && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Tenant incidents only
            </span>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard
          icon="ti-alert-triangle" iconColor="var(--red)" label="Under review" value={underReview}
          sub={underReview > 0 ? 'Requires attention' : 'All clear'} subColor={underReview > 0 ? 'var(--red)' : '#c4912a'}
          stripe="var(--red)" onClick={() => setStatusFilter(statusFilter === 'Under review' ? 'All' : 'Under review')}
        />
        <KpiCard
          icon="ti-circle-check" iconColor="var(--ink3)" label="Resolved" value={resolved}
          sub={`${scopedRows.length} total incidents`}
          stripe="var(--ink3)" onClick={() => setStatusFilter(statusFilter === 'Resolved' ? 'All' : 'Resolved')}
        />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--ink3)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search vehicle, driver, type…"
            style={{ width: '100%', padding: '6px 10px 6px 30px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--ink)', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {(['All', 'Under review', 'Resolved'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              background: statusFilter === s ? (s === 'Under review' ? 'var(--red)' : '#c4912a') : 'var(--cream)',
              color: statusFilter === s ? '#fff' : 'var(--ink2)',
              border: `1px solid ${statusFilter === s ? (s === 'Under review' ? 'var(--red)' : '#c4912a') : 'var(--border)'}`,
              fontWeight: statusFilter === s ? 600 : 400,
            }}>{s}</button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink3)' }}>{visibleRows.length} incident{visibleRows.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Vehicle', 'Driver', 'Type', 'Start', 'Duration', 'Location', 'Severity', 'Status', ''].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>No incidents match your filters.</td></tr>
            ) : visibleRows.map(r => (
              <tr key={r.id} style={{ background: r.status === 'Under review' ? '#fffdf7' : '#fff' }}>
                <td style={{ ...td, fontWeight: 600, color: 'var(--ink)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-truck" style={{ fontSize: 12, color: 'var(--ink3)' }} />
                    {r.vehicle}
                  </div>
                </td>
                <td style={{ ...td, color: r.driver.startsWith('—') ? 'var(--ink3)' : 'var(--ink2)', fontStyle: r.driver.startsWith('—') ? 'italic' : 'normal' }}>{r.driver}</td>
                <td style={td}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: 'var(--cream)', color: 'var(--ink2)' }}>{r.type}</span>
                </td>
                <td style={{ ...td, color: 'var(--ink3)', fontSize: 12 }}>{r.start}</td>
                <td style={{ ...td, fontSize: 12 }}>{r.duration}</td>
                <td style={{ ...td, fontSize: 12 }}>{r.location}</td>
                <td style={td}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, ...SEV[r.severity] }}>
                    <i className={`ti ${SEV_ICON[r.severity]}`} style={{ fontSize: 11 }} />
                    {r.severity}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: r.status === 'Under review' ? '#fffbeb' : 'var(--cream3)', color: r.status === 'Under review' ? '#d97706' : 'var(--ink3)' }}>
                    {r.status}
                  </span>
                </td>
                <td style={td}>
                  {r.status === 'Under review' && canResolve && (
                    <Btn variant="primary" size="xs" onClick={() => resolve(r.id)}>
                      <i className="ti ti-check" style={{ fontSize: 10 }} /> Resolve
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '8px 14px', background: 'var(--cream)', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--ink3)' }}>
          {visibleRows.length} of {scopedRows.length} incidents shown
        </div>
      </div>
    </div>
  );
}
