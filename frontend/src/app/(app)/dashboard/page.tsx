'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { DashboardSummary } from '@/lib/types';
import { AlertSeverityBadge } from '@/components/ui/Badge';
import { FleetMap } from '@/components/maps/FleetMap';
import type { VehiclePin } from '@/components/maps/FleetMap';
import { PlaybackMap } from '@/components/maps/PlaybackMap';
import type { RoutePoint } from '@/components/maps/PlaybackMap';
import { useAuthStore } from '@/store/authStore';
import { TENANTS_META, VehicleMaster } from '@/lib/vehiclesMaster';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useUIStore } from '@/store/uiStore';
import { VehicleTrackingModal } from '@/components/tracking/VehicleTrackingModal';
import { AlertDetailModal } from '@/components/alerts/AlertDetailModal';

/* ── Helpers ──────────────────────────────────────────────────────── */
function toMapStatus(s: string): 'active' | 'idle' | 'offline' {
  if (s === 'active') return 'active';
  if (s === 'idle')   return 'idle';
  return 'offline';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'Just now';
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

function exportCSV(rows: VehicleMaster[], isSuperAdmin: boolean) {
  const headers = ['Plate','Driver','Status','Speed (km/h)','Fuel (%)','Category','Make','Model','Year','Odometer','Customer', ...(isSuperAdmin ? ['Tenant'] : [])];
  const lines = rows.map(v => [
    v.plate, v.driverName ?? '', v.status, v.speedKmh ?? '', v.fuelLevel ?? '',
    v.category ?? '', v.make ?? '', v.model ?? '', v.year ?? '', v.odometer ?? '',
    v.customerName ?? '', ...(isSuperAdmin ? [TENANTS_META[v.tenantId]?.name ?? ''] : []),
  ].map(x => `"${String(x).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `fleet-vehicles-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

function exportAlertsCSV(alerts: DashboardSummary['recentAlerts']) {
  const headers = ['ID','Title','Description','Severity','Vehicle','Occurred At','Acknowledged'];
  const lines = alerts.map(a => [
    a.id, a.title, a.description, a.severity, a.vehiclePlate ?? '',
    a.occurredAt, a.acknowledged ? 'Yes' : 'No',
  ].map(x => `"${String(x).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  const el = document.createElement('a');
  el.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  el.download = `fleet-alerts-${new Date().toISOString().slice(0,10)}.csv`;
  el.click();
}

/* ── Mock route generator (until real history API is wired up) ──── */
const MOCK_EVENTS = ['', '', '', '', 'Speeding', 'Hard brake', '', 'Geofence exit', '', ''];
function generateMockRoute(vehicle: VehicleMaster, count = 50): RoutePoint[] {
  const baseLat = vehicle.latitude  ?? -1.2921;
  const baseLng = vehicle.longitude ?? 36.8219;
  const startMs = Date.now() - 2 * 60 * 60 * 1000; // 2 h ago
  let lat = baseLat, lng = baseLng, heading = Math.random() * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    heading += (Math.random() - 0.5) * 0.45;
    const step = 0.0025 + Math.random() * 0.0015;
    lat += Math.cos(heading) * step;
    lng += Math.sin(heading) * step;
    const t   = new Date(startMs + (i / count) * 2 * 60 * 60 * 1000);
    const spd = (i === 0 || i === count - 1) ? 0 : Math.round(15 + Math.random() * 90);
    const ev  = Math.random() < 0.12 ? MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)] || null : null;
    return { lat, lng, time: t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), speed: spd, event: ev };
  });
}

/* ── CSS-in-JS constants ─────────────────────────────────────────── */
const STATUS_PILL: Record<string, React.CSSProperties> = {
  active:      { background: 'rgba(196,145,42,0.12)',  color: '#c4912a', border: '1px solid #bfdbfe' },
  idle:        { background: '#fffbeb',         color: '#d97706',        border: '1px solid #fde68a' },
  offline:     { background: 'var(--cream2)',   color: 'var(--ink3)',    border: '1px solid var(--border2)' },
  maintenance: { background: 'var(--blue-lt)',  color: 'var(--blue)',    border: '1px solid #bfdbfe' },
  disposed:    { background: 'var(--red-lt)',   color: 'var(--red)',     border: '1px solid #fecaca' },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  active:      <i className="ti ti-player-play" />,
  idle:        <i className="ti ti-player-pause" />,
  offline:     <i className="ti ti-wifi-off" />,
  maintenance: <i className="ti ti-tool" />,
};

/* ── KPI Card ─────────────────────────────────────────────────────── */
function KpiCard({ icon, iconColor, label, value, unit, sub, subColor, stripe, onClick, trend }: {
  icon: string; iconColor?: string; label: string; value: string | number; unit?: string; sub?: string;
  subColor?: string; stripe?: string; onClick?: () => void; trend?: 'up' | 'down' | 'flat';
}) {
  const chipBg = (iconColor ?? '#c4912a') + '15';
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 7,
        padding: '8px 10px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
      onMouseEnter={e => {
        if (onClick) {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = '0 3px 10px rgba(196,145,42,0.12)';
          el.style.borderColor = '#c4912a';
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
        el.style.borderColor = 'var(--border)';
      }}
    >
      {stripe && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: stripe, borderRadius: '7px 0 0 7px' }} />}
      {/* Icon chip */}
      <div style={{ width: 34, height: 34, borderRadius: 7, background: chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor ?? '#c4912a', fontSize: 16, flexShrink: 0, marginLeft: stripe ? 4 : 0 }}>
        <i className={`ti ${icon}`} />
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#c4912a', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1, color: '#0d1b2a' }}>
          {value}{unit && <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: 0, marginLeft: 2, color: '#6b5a30' }}>{unit}</span>}
        </div>
        {sub && <div style={{ fontSize: 9, marginTop: 2, color: subColor ?? '#8a7040', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
      {/* Trend badge */}
      {trend && (
        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 10, flexShrink: 0,
          background: trend === 'up' ? 'var(--green-lt)' : trend === 'down' ? 'var(--red-lt)' : 'var(--cream2)',
          color: trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--ink3)' }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      )}
    </div>
  );
}

/* ── Section header ──────────────────────────────────────────────── */
function SectionHeader({ title, icon, action }: { title: string; icon?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 12, color: '#c4912a' }} />}
        <span style={{ fontSize: 10, fontWeight: 700, color: '#0d1b2a', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{title}</span>
      </div>
      {action}
    </div>
  );
}

/* ── Stat pill ───────────────────────────────────────────────────── */
function StatPill({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: bg, borderRadius: 6, border: `1px solid ${color}28`, flex: 1 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 16, fontWeight: 300, letterSpacing: '-0.5px', color }}>{count}</div>
        <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: color + 'bb', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Progress bar ─────────────────────────────────────────────────── */
function ProgressBar({ label, count, total, color, onClick }: {
  label: string; count: number; total: number; color: string; onClick?: () => void;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      onClick={onClick}
      style={{ marginBottom: 7, cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{STATUS_ICON[label.toLowerCase()] ?? <i className="ti ti-circle" />}</span>
          <span style={{ fontSize: 10, color: 'var(--ink2)', fontWeight: 500 }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{count}</span>
          <span style={{ fontSize: 9, color: 'var(--ink3)', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 5, background: 'var(--cream2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

/* ── Fuel bar ─────────────────────────────────────────────────────── */
function FuelBar({ level }: { level: number | null }) {
  if (level === null) return <span style={{ color: 'var(--ink3)', fontSize: 11 }}>—</span>;
  const color = level < 20 ? 'var(--red)' : level < 40 ? 'var(--amber)' : 'var(--green)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 50, height: 5, background: 'var(--cream2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${level}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{level}%</span>
    </div>
  );
}

/* ── Tab bar ───────────────────────────────────────────────────────── */
const DASH_TABS = ['Overview', 'Live Map', 'Playback', 'Vehicles', 'Alerts', 'Analytics'] as const;
type DashTab = typeof DASH_TABS[number];

const TAB_ICONS: Record<string, string> = {
  Overview:  'ti-layout-dashboard',
  'Live Map':'ti-map',
  Playback:  'ti-player-play',
  Vehicles:  'ti-truck',
  Alerts:    'ti-bell',
  Analytics: 'ti-chart-bar',
};

function TabBar({ active, onChange, tabs, badges }: {
  active: string; onChange: (t: string) => void; tabs: readonly string[];
  badges?: Record<string, number>;
}) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #e8d5b0', marginBottom: 20, gap: 2 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: '10px 18px',
          fontSize: 12,
          fontWeight: active === t ? 700 : 500,
          color: active === t ? '#0d1b2a' : 'var(--ink3)',
          border: 'none',
          borderBottom: `2px solid ${active === t ? '#c4912a' : 'transparent'}`,
          marginBottom: -2,
          background: active === t ? 'rgba(196,145,42,0.08)' : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.15s',
          borderRadius: '6px 6px 0 0',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => { if (active !== t) (e.currentTarget as HTMLElement).style.color = '#0d1b2a'; }}
        onMouseLeave={e => { if (active !== t) (e.currentTarget as HTMLElement).style.color = 'var(--ink3)'; }}
        >
          <i className={`ti ${TAB_ICONS[t]}`} style={{ fontSize: 14 }} />
          {t}
          {badges?.[t] ? (
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 10, background: 'var(--red)', color: '#fff', minWidth: 18, textAlign: 'center' }}>
              {badges[t]}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/* ── SVG Bar chart ───────────────────────────────────────────────── */
function BarChart({ data, color = '#c4912a' }: { data: { label: string; value: number }[]; color?: string }) {
  const max    = Math.max(...data.map(d => d.value), 1);
  const bw     = 28;
  const gap    = data.length > 10 ? 4 : 8;
  const colW   = bw + gap;
  const svgW   = data.length * colW;
  const svgH   = 130;
  const areaH  = 88;
  const baseY  = svgH - 24;
  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={0} x2={svgW} y1={baseY - f * areaH} y2={baseY - f * areaH} stroke="#f3f4f6" strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const x  = i * colW + gap / 2;
        const bh = d.value > 0 ? Math.max(3, (d.value / max) * areaH) : 0;
        return (
          <g key={i}>
            <rect x={x} y={baseY - bh} width={bw} height={bh} fill={d.value === 0 ? '#f1f5f9' : color} rx={2} opacity={d.value === 0 ? 0.4 : 0.88} />
            {d.value > 0 && <text x={x + bw / 2} y={baseY - bh - 3} textAnchor="middle" fontSize={7} fill={color} fontWeight="bold">{d.value}</text>}
            <text x={x + bw / 2} y={svgH - 5} textAnchor="middle" fontSize={data.length > 10 ? 7 : 8} fill="#9ca3af">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── SVG Line / area chart ───────────────────────────────────────── */
function LineChart({ data, color = '#16a34a', unit = '' }: { data: { label: string; value: number }[]; color?: string; unit?: string }) {
  const lastIdx = data.reduce((last, d, i) => d.value > 0 ? i : last, -1);
  if (lastIdx < 0) return (
    <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', fontSize: 11, fontStyle: 'italic' }}>
      No data yet for this period
    </div>
  );
  const visible = data.slice(0, lastIdx + 1);
  const max    = Math.max(...visible.map(d => d.value), 1);
  const min    = Math.min(...visible.map(d => d.value));
  const range  = max - min || 1;
  const total  = data.length;
  const svgW   = 400;
  const svgH   = 130;
  const areaH  = 88;
  const baseY  = svgH - 24;
  const toX    = (i: number) => total <= 1 ? svgW / 2 : (i / (total - 1)) * svgW;
  const toY    = (v: number) => baseY - ((v - min) / range * 0.82 + 0.08) * areaH;
  const pts    = visible.map((d, i) => ({ x: toX(i), y: toY(d.value), v: d.value }));
  const lineD  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD  = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)} ${baseY} L ${pts[0].x.toFixed(1)} ${baseY} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={0} x2={svgW} y1={baseY - f * areaH} y2={baseY - f * areaH} stroke="#f3f4f6" strokeWidth={1} />
      ))}
      <path d={areaD} fill={color} opacity={0.10} />
      <path d={lineD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke={color} strokeWidth={2} />
          <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize={8} fill={color} fontWeight="bold">{p.v}{unit}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={toX(i).toFixed(1)} y={svgH - 5} textAnchor="middle" fontSize={total > 10 ? 7 : 8} fill="#9ca3af">{d.label}</text>
      ))}
    </svg>
  );
}

/* ── Btn ─────────────────────────────────────────────────────────── */
function Btn({ children, onClick, variant = 'default', size = 'sm' }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: '#fff', color: 'var(--ink2)', border: '1px solid var(--border)' },
    primary: { background: '#c4912a', color: '#fff', border: '1px solid #a07520' },
    danger:  { background: 'var(--red-lt)', color: 'var(--red)', border: '1px solid #fca5a5' },
    ghost:   { background: 'transparent', color: 'var(--ink3)', border: '1px solid transparent' },
  };
  const pad: Record<string, string> = { xs: '3px 8px', sm: '5px 12px', md: '7px 16px' };
  const fs:  Record<string, number>  = { xs: 10, sm: 11, md: 12 };
  return (
    <button
      onClick={onClick}
      style={{
        ...styles[variant],
        padding: pad[size],
        fontSize: fs[size],
        borderRadius: 6,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        transition: 'opacity 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
    >
      {children}
    </button>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router          = useRouter();
  const { user }        = useAuthStore();
  const role            = user?.role ?? 'viewer';
  const isSuperAdmin    = role === 'super_admin' || role === 'platform_admin';
  const isVehicleOwner  = role === 'vehicle_owner';
  const tenantId        = user?.tenantId ?? '1';

  const [activeTab, setActiveTab] = useState<DashTab>('Overview');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [alertSearch, setAlertSearch] = useState('');
  const [vSearch, setVSearch] = useState('');
  const [vStatusFilter, setVStatusFilter] = useState('all');
  const [vSortCol, setVSortCol] = useState<string>('plate');
  const [vSortDir, setVSortDir] = useState<'asc' | 'desc'>('asc');
  const [vViewMode, setVViewMode] = useState<'table' | 'cards'>('table');
  const [vPage, setVPage] = useState(1);
  const [vPageSize, setVPageSize] = useState(25);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [showTrails, setShowTrails] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [colMenuOpen, setColMenuOpen] = useState(false);

  /* ── Live Map tab state ─────────────────────────────────────────── */
  const [lmSearch,       setLmSearch]       = useState('');
  const [lmStatusFilter, setLmStatusFilter] = useState('all');
  const [lmSelectedId,   setLmSelectedId]   = useState<string | null>(null);

  /* ── Playback tab state ─────────────────────────────────────────── */
  const [pbVehicleId,   setPbVehicleId]   = useState('');
  const [pbRoute,       setPbRoute]       = useState<RoutePoint[]>([]);
  const [pbStep,        setPbStep]        = useState(0);
  const [pbPlaying,     setPbPlaying]     = useState(false);
  const [pbSpeed,       setPbSpeed]       = useState(2);   // ticks per second
  const [pbRouteCount,  setPbRouteCount]  = useState(50);
  const pbIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const vehicles = useVehiclesStore(s => s.vehicles);
  const uiSelectedVehicleId = useUIStore(s => s.selectedVehicleId);

  /* Playback interval — advances step while playing */
  useEffect(() => {
    if (pbIntervalRef.current) clearInterval(pbIntervalRef.current);
    if (!pbPlaying || pbRoute.length === 0) return;
    const delay = Math.round(1000 / pbSpeed);
    pbIntervalRef.current = setInterval(() => {
      setPbStep(s => {
        if (s >= pbRoute.length - 1) { setPbPlaying(false); return pbRoute.length - 1; }
        return s + 1;
      });
    }, delay);
    return () => { if (pbIntervalRef.current) clearInterval(pbIntervalRef.current); };
  }, [pbPlaying, pbSpeed, pbRoute.length]);

  function loadRoute(vehicleId: string) {
    const vm = sourceVehicles.find(v => v.id === vehicleId || v.plate === vehicleId);
    if (!vm) return;
    setPbRoute(generateMockRoute(vm, pbRouteCount));
    setPbStep(0);
    setPbPlaying(false);
  }

  /* Scope vehicles */
  const sourceVehicles = useMemo(() => {
    if (isSuperAdmin) return vehicles;
    if (isVehicleOwner) {
      const ids = user?.vehicleIds?.length ? user.vehicleIds : user?.vehicleId ? [user.vehicleId] : [];
      return vehicles.filter(v => ids.includes(v.id));
    }
    return vehicles.filter(v => v.tenantId === tenantId);
  }, [isSuperAdmin, isVehicleOwner, vehicles, tenantId, user?.vehicleId, user?.vehicleIds]);

  const filteredVehicles = useMemo(() =>
    isSuperAdmin && tenantFilter !== 'all'
      ? sourceVehicles.filter(v => v.tenantId === tenantFilter)
      : sourceVehicles,
  [sourceVehicles, isSuperAdmin, tenantFilter]);

  const fleetPins: VehiclePin[] = useMemo(() =>
    filteredVehicles
      .filter(v => v.latitude !== null && v.longitude !== null)
      .map(v => ({
        id: v.plate, driver: v.driverName ?? 'No driver',
        status: toMapStatus(v.status), speed: v.speedKmh ?? 0,
        lat: v.latitude!, lng: v.longitude!,
        fuel: v.fuelLevel, tenantId: v.tenantId,
        make: v.make, model: v.model, year: v.year,
        category: v.category,
        customerName: v.customerName ?? undefined,
        odometer: v.odometer,
        tenantName: TENANTS_META[v.tenantId]?.name,
      })),
  [filteredVehicles]);

  const liveStats = useMemo(() => {
    const active      = filteredVehicles.filter(v => v.status === 'active').length;
    const idle        = filteredVehicles.filter(v => v.status === 'idle').length;
    const offline     = filteredVehicles.filter(v => v.status === 'offline').length;
    const maintenance = filteredVehicles.filter(v => v.status === 'maintenance').length;
    const total       = filteredVehicles.length;
    const withGps     = fleetPins.length;
    const avgFuel     = total ? Math.round(filteredVehicles.reduce((s, v) => s + (v.fuelLevel ?? 0), 0) / total) : 0;
    const lowFuel     = filteredVehicles.filter(v => (v.fuelLevel ?? 100) < 30).length;
    const avgSpeed    = active ? Math.round(filteredVehicles.filter(v => v.status === 'active').reduce((s, v) => s + (v.speedKmh ?? 0), 0) / active) : 0;
    return { active, idle, offline, maintenance, total, withGps, avgFuel, lowFuel, avgSpeed };
  }, [filteredVehicles, fleetPins]);

  const mapCenter = useMemo((): [number, number] => {
    if (!fleetPins.length) return [-1.2921, 36.8219];
    return [
      fleetPins.reduce((s, v) => s + v.lat, 0) / fleetPins.length,
      fleetPins.reduce((s, v) => s + v.lng, 0) / fleetPins.length,
    ];
  }, [fleetPins]);

  const analytics = useMemo(() => {
    const now        = new Date();
    const active     = filteredVehicles.filter(v => v.status === 'active');
    const avgSpeed   = active.length ? Math.round(active.reduce((s, v) => s + (v.speedKmh ?? 0), 0) / active.length) : 0;
    const avgFuel    = filteredVehicles.length ? Math.round(filteredVehicles.reduce((s, v) => s + (v.fuelLevel ?? 0), 0) / filteredVehicles.length) : 0;
    const lowFuel    = filteredVehicles.filter(v => (v.fuelLevel ?? 100) < 30).length;
    const topSpeeder = filteredVehicles.filter(v => v.status === 'active').sort((a, b) => (b.speedKmh ?? 0) - (a.speedKmh ?? 0)).slice(0, 5);
    const fuelSorted = filteredVehicles.slice().sort((a, b) => (a.fuelLevel ?? 0) - (b.fuelLevel ?? 0));

    const baseTrips = active.length * 2 + Math.floor(liveStats.idle * 0.7);
    const baseKm    = Math.round(active.reduce((s, v) => s + (v.speedKmh ?? 0) * 8, 0));
    const liveUtil  = liveStats.total ? Math.round((liveStats.active / liveStats.total) * 100) : 0;
    const n         = filteredVehicles.length || 1;

    const weekFactor  = 5 + ((n * 3) % 3) / 10;
    const monthFactor = 22 + ((n * 7) % 5);
    const multiplier  = analyticsPeriod === 'today' ? 1 : analyticsPeriod === 'week' ? weekFactor : monthFactor;

    const trips         = Math.round(baseTrips * multiplier);
    const km            = Math.round(baseKm    * multiplier);
    const utilRate      = analyticsPeriod === 'today' ? liveUtil
                        : analyticsPeriod === 'week'  ? Math.min(100, Math.round(liveUtil * 1.18 + (n % 5)))
                        :                               Math.min(100, Math.round(liveUtil * 1.30 + (n % 8)));
    const driversOnDuty = analyticsPeriod === 'today' ? liveStats.active
                        : analyticsPeriod === 'week'  ? Math.min(n, liveStats.active * 4 + (n % 3))
                        :                               Math.min(n, liveStats.active * 9 + (n % 5));
    const fuelEfficiency = avgSpeed > 0
      ? Math.round((km / (((100 - avgFuel) / 100) * liveStats.total + 0.1)) * 10) / 10
      : 0;

    // ── Chart data — deterministic (no Math.random) ─────────────────
    // det(i, salt) → stable 0..1 value per index + salt
    const det = (i: number, salt: number) => ((n * salt + i * (salt + 3)) % 97) / 97;

    const curHour        = now.getHours();
    const curDow         = now.getDay();                      // 0=Sun
    const curDowMon0     = curDow === 0 ? 6 : curDow - 1;    // Mon=0…Sun=6
    const curWeekOfMonth = Math.min(3, Math.floor((now.getDate() - 1) / 7));

    type ChartPt = { label: string; value: number };
    let tripsChart: ChartPt[], speedChart: ChartPt[], utilChart: ChartPt[];

    if (analyticsPeriod === 'today') {
      const hours = [6,7,8,9,10,11,12,13,14,15,16,17,18];
      tripsChart = hours.map((h, i) => ({
        label: `${h}`,
        value: h > curHour ? 0 : Math.max(1, Math.round(baseTrips * (0.05 + det(i, 11) * 0.12))),
      }));
      speedChart = hours.map((h, i) => ({
        label: `${h}`,
        value: h > curHour ? 0 : Math.max(15, Math.round(avgSpeed * (0.78 + det(i, 7) * 0.44))),
      }));
      utilChart = hours.map((h, i) => ({
        label: `${h}`,
        value: h > curHour ? 0 : Math.min(100, Math.max(5, Math.round(liveUtil * (0.65 + det(i, 13) * 0.70)))),
      }));
    } else if (analyticsPeriod === 'week') {
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      tripsChart = days.map((d, i) => ({
        label: d,
        value: i > curDowMon0 ? 0 : Math.max(1, Math.round((trips / 5) * (0.72 + det(i, 11) * 0.56))),
      }));
      speedChart = days.map((d, i) => ({
        label: d,
        value: i > curDowMon0 ? 0 : Math.max(15, Math.round(avgSpeed * (0.82 + det(i, 7) * 0.36))),
      }));
      utilChart = days.map((d, i) => ({
        label: d,
        value: i > curDowMon0 ? 0 : Math.min(100, Math.max(5, Math.round(utilRate * (0.75 + det(i, 13) * 0.50)))),
      }));
    } else {
      const weeks = ['Wk 1','Wk 2','Wk 3','Wk 4'];
      tripsChart = weeks.map((w, i) => ({
        label: w,
        value: i > curWeekOfMonth ? 0 : Math.max(1, Math.round((trips / 4) * (0.78 + det(i, 11) * 0.44))),
      }));
      speedChart = weeks.map((w, i) => ({
        label: w,
        value: i > curWeekOfMonth ? 0 : Math.max(15, Math.round(avgSpeed * (0.88 + det(i, 7) * 0.24))),
      }));
      utilChart = weeks.map((w, i) => ({
        label: w,
        value: i > curWeekOfMonth ? 0 : Math.min(100, Math.max(5, Math.round(utilRate * (0.82 + det(i, 13) * 0.36)))),
      }));
    }

    return { avgSpeed, avgFuel, lowFuel, trips, km, utilRate, driversOnDuty, topSpeeder, fuelSorted, fuelEfficiency, tripsChart, speedChart, utilChart };
  }, [filteredVehicles, liveStats, analyticsPeriod]);

  /* Vehicles tab rows with sort */
  const vehicleRows = useMemo(() => {
    let vs = filteredVehicles;
    if (vSearch) vs = vs.filter(v =>
      v.plate.toLowerCase().includes(vSearch.toLowerCase()) ||
      (v.driverName ?? '').toLowerCase().includes(vSearch.toLowerCase()) ||
      (v.customerName ?? '').toLowerCase().includes(vSearch.toLowerCase()),
    );
    if (vStatusFilter !== 'all') vs = vs.filter(v => v.status === vStatusFilter);
    vs = [...vs].sort((a, b) => {
      let av: string | number = '', bv: string | number = '';
      if (vSortCol === 'plate')    { av = a.plate; bv = b.plate; }
      if (vSortCol === 'driver')   { av = a.driverName ?? ''; bv = b.driverName ?? ''; }
      if (vSortCol === 'status')   { av = a.status; bv = b.status; }
      if (vSortCol === 'speed')    { av = a.speedKmh ?? 0; bv = b.speedKmh ?? 0; }
      if (vSortCol === 'fuel')     { av = a.fuelLevel ?? 0; bv = b.fuelLevel ?? 0; }
      if (vSortCol === 'odometer') { av = a.odometer ?? 0; bv = b.odometer ?? 0; }
      if (typeof av === 'string') return vSortDir === 'asc' ? av.localeCompare(String(bv)) : String(bv).localeCompare(av);
      return vSortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return vs;
  }, [filteredVehicles, vSearch, vStatusFilter, vSortCol, vSortDir]);

  const totalVehiclePages = Math.max(1, Math.ceil(vehicleRows.length / vPageSize));
  const pagedVehicleRows  = vehicleRows.slice((vPage - 1) * vPageSize, vPage * vPageSize);

  function toggleSort(col: string) {
    if (vSortCol === col) setVSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setVSortCol(col); setVSortDir('asc'); }
  }

  /* Live tracking state */
  const [livePins,  setLivePins]  = useState<VehiclePin[]>([]);
  const [trails,    setTrails]    = useState<Record<string, [number, number][]>>({});
  const headingsRef               = useRef<Record<string, number>>({});

  useEffect(() => {
    setLivePins(fleetPins);
    const initTrails: Record<string, [number, number][]> = {};
    const initHeadings: Record<string, number>           = {};
    fleetPins.forEach(p => {
      initTrails[p.id]   = [[p.lat, p.lng]];
      initHeadings[p.id] = Math.random() * Math.PI * 2;
    });
    setTrails(initTrails);
    headingsRef.current = initHeadings;
  }, [fleetPins]);

  useEffect(() => {
    const id = setInterval(() => {
      setLivePins(prevPins => {
        const nextPins = prevPins.map(pin => {
          if (pin.status !== 'active') return pin;
          const h    = (headingsRef.current[pin.id] ?? 0) + (Math.random() - 0.5) * 0.5;
          headingsRef.current[pin.id] = h;
          const step = 0.00018 + Math.random() * 0.00012;
          return { ...pin, lat: pin.lat + Math.cos(h) * step, lng: pin.lng + Math.sin(h) * step, speed: Math.round(20 + Math.random() * 65) };
        });
        setTrails(t => {
          const next = { ...t };
          nextPins.forEach(pin => {
            if (pin.status === 'active') next[pin.id] = [...(t[pin.id] ?? []).slice(-29), [pin.lat, pin.lng] as [number, number]];
          });
          return next;
        });
        return nextPins;
      });
    }, 2500);
    return () => clearInterval(id);
  }, []);

  /* Auto-refresh countdown */
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      setRefreshCountdown(c => {
        if (c <= 1) { load(); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  /* Vehicle tracking modal */
  const [trackingVehicle, setTrackingVehicle] = useState<VehicleMaster | null>(null);
  const [trackingPin,     setTrackingPin]     = useState<VehiclePin | null>(null);
  const [dashAlert,       setDashAlert]       = useState<(typeof filteredAlerts)[0] | null>(null);

  function openTracking(plate: string) {
    const vm  = filteredVehicles.find(v => v.plate === plate);
    if (!vm) return;
    const pin = livePins.find(p => p.id === plate) ?? null;
    setTrackingVehicle(vm);
    setTrackingPin(pin);
  }

  /* Alerts */
  const [alertData, setAlertData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState('');

  const load = useCallback(async () => {
    try {
      const result = await api.dashboard.summary() as DashboardSummary;
      setAlertData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function acknowledge(id: string) {
    await api.dashboard.acknowledgeAlert(id);
    load();
  }

  const filteredAlerts = useMemo(() => {
    if (!alertData) return [];
    let alerts = alertData.recentAlerts;
    if (alertFilter !== 'all') alerts = alerts.filter(a => a.severity === alertFilter);
    if (alertSearch) alerts = alerts.filter(a =>
      a.title.toLowerCase().includes(alertSearch.toLowerCase()) ||
      (a.vehiclePlate ?? '').toLowerCase().includes(alertSearch.toLowerCase()),
    );
    return alerts;
  }, [alertData, alertFilter, alertSearch]);

  const alertCounts = useMemo(() => ({
    critical:     alertData?.recentAlerts.filter(a => a.severity === 'critical').length ?? 0,
    warning:      alertData?.recentAlerts.filter(a => a.severity === 'warning').length ?? 0,
    info:         alertData?.recentAlerts.filter(a => a.severity === 'info').length ?? 0,
    acknowledged: alertData?.recentAlerts.filter(a => a.acknowledged).length ?? 0,
  }), [alertData]);

  const alertBadge = alertData?.openAlerts ?? 0;

  if (loading) return (
    <div style={{ padding: 40, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink3)', fontSize: 13 }}>
      <span style={{ animation: '_lpulse 1.2s ease-in-out infinite', display: 'inline-block', color: '#c4912a', fontSize: 18 }}>◌</span>
      Loading dashboard…
    </div>
  );
  if (error) return (
    <div style={{ padding: 40, background: 'var(--red-lt)', border: '1px solid #fca5a5', borderRadius: 10, margin: 20, color: 'var(--red)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Connection Error</div>
      <div style={{ fontSize: 12 }}>{error} — is the backend running?</div>
    </div>
  );

  /* ── Column definitions for vehicle table ─────────────────────── */
  const ALL_COLS = ['Plate','Driver','Status','Speed','Fuel','Category','Make / Model','Odometer','Customer', ...(isSuperAdmin ? ['Tenant'] : [])] as const;
  const visibleCols = ALL_COLS.filter(c => !hiddenCols.has(c));

  function SortTh({ col, label }: { col: string; label: string }) {
    return (
      <th
        onClick={() => toggleSort(col)}
        style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: vSortCol === col ? '#c4912a' : 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', background: 'var(--cream)' }}
      >
        {label} {vSortCol === col ? (vSortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>
      <style>{`
        @keyframes _lpulse { 0%,100%{opacity:1} 50%{opacity:0.15} }
        ._lpulse { animation: _lpulse 1.2s ease-in-out infinite; }
        @keyframes _spin { to { transform: rotate(360deg); } }
        ._spin { animation: _spin 1s linear infinite; display: inline-block; }
      `}</style>

      {/* ══════════════ HEADER ══════════════════════════════════════════ */}
      <div style={{
        marginBottom: 14,
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius: 10,
        padding: '12px 16px',
        color: '#fff',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <i className="ti ti-layout-dashboard" style={{ fontSize: 20, color: '#c4912a' }} />
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.5px' }}>Live Operations Dashboard</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(196,145,42,0.20)', border: '1px solid rgba(196,145,42,0.45)', color: '#f5d07a' }}>
              <span className="_lpulse" style={{ color: '#6ee7b7', fontSize: 8 }}>●</span> LIVE
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
            Real-time fleet monitoring · {liveStats.total} vehicle{liveStats.total !== 1 ? 's' : ''} · {new Date().toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Role badge */}
          {isSuperAdmin
            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.20)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.40)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-eye" style={{ fontSize: 11 }} /> All Tenants
              </span>
            : isVehicleOwner
              ? <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.30)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-truck" style={{ fontSize: 11 }} /> My Vehicle{sourceVehicles.length !== 1 ? 's' : ''}
                </span>
              : <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.30)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-lock" style={{ fontSize: 11 }} /> {user?.tenantName ?? 'Tenant'}
                </span>
          }

          {/* Auto-refresh */}
          <button
            onClick={() => setAutoRefresh(a => !a)}
            style={{ padding: '5px 11px', fontSize: 10, fontWeight: 700, borderRadius: 20, border: '1px solid rgba(196,145,42,0.35)', background: autoRefresh ? 'rgba(196,145,42,0.15)' : 'rgba(0,0,0,0.2)', color: autoRefresh ? '#f5d07a' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            {autoRefresh ? <span className="_spin">↻</span> : '↻'} {autoRefresh ? `${refreshCountdown}s` : 'Paused'}
          </button>

          {/* Refresh now */}
          <button onClick={() => { load(); setRefreshCountdown(30); }}
            style={{ padding: '5px 13px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid rgba(196,145,42,0.40)', background: 'rgba(196,145,42,0.18)', color: '#f5d07a', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Tenant selector ─────────────────────────────────────────── */}
      {isSuperAdmin && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 600 }}>Filter tenant:</span>
          <select value={tenantFilter} onChange={e => setTenantFilter(e.target.value)}
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--ink)', background: '#fff', fontFamily: 'inherit' }}>
            <option value="all">All tenants ({vehicles.length} vehicles)</option>
            {Object.entries(TENANTS_META).map(([tid, meta]) => (
              <option key={tid} value={tid}>{meta.name} ({vehicles.filter(v => v.tenantId === tid).length} vehicles)</option>
            ))}
          </select>
          {tenantFilter !== 'all' && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: (TENANTS_META[tenantFilter]?.color ?? '#000') + '1a', color: TENANTS_META[tenantFilter]?.color ?? 'var(--ink3)', border: `1px solid ${(TENANTS_META[tenantFilter]?.color ?? '#000')}40` }}>
              {TENANTS_META[tenantFilter]?.name}
            </span>
          )}
        </div>
      )}

      {!isSuperAdmin && !isVehicleOwner && (
        <div style={{ marginBottom: 16, padding: '8px 14px', background: 'rgba(196,145,42,0.12)', borderRadius: 8, fontSize: 11, color: '#c4912a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-lock" style={{ fontSize: 12 }} /> Scoped to <strong>{user?.tenantName ?? 'your tenant'}</strong>
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <TabBar
        active={activeTab}
        onChange={t => {
          if (t === 'Playback') {
            // resolve vehicle: current selection → persisted uiStore → first in scope
            const nextId = pbVehicleId || uiSelectedVehicleId || sourceVehicles[0]?.id || '';
            if (nextId && nextId !== pbVehicleId) setPbVehicleId(nextId);
            // auto-load route if nothing is loaded yet
            if (nextId && pbRoute.length === 0) loadRoute(nextId);
          }
          setActiveTab(t as DashTab);
        }}
        tabs={DASH_TABS}
        badges={{ Alerts: alertBadge }}
      />

      {/* ════════════════════ OVERVIEW TAB ══════════════════════════════ */}
      {activeTab === 'Overview' && (
        <>
          {/* 8-up KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, marginBottom: 7 }}>
            <KpiCard icon="ti-player-play" iconColor="#c4912a" label="Active Vehicles" value={liveStats.active}
              sub={`${liveStats.active > 0 ? Math.round((liveStats.active / liveStats.total) * 100) : 0}% of fleet`}
              stripe="#c4912a" trend="up"
              onClick={() => { setActiveTab('Vehicles'); setVStatusFilter('active'); }} />
            <KpiCard icon="ti-player-pause" iconColor="var(--amber)" label="Idle Vehicles" value={liveStats.idle}
              sub={liveStats.idle > 0 ? 'Consider reassigning' : 'None idle'}
              subColor={liveStats.idle > 0 ? 'var(--amber)' : 'var(--green)'}
              stripe="var(--amber)" trend="flat"
              onClick={() => { setActiveTab('Vehicles'); setVStatusFilter('idle'); }} />
            <KpiCard icon="ti-wifi-off" iconColor="var(--ink3)" label="Offline" value={liveStats.offline}
              sub={liveStats.offline > 0 ? 'Check connectivity' : 'All connected'}
              subColor={liveStats.offline > 0 ? 'var(--red)' : 'var(--green)'}
              stripe="var(--ink3)"
              onClick={() => { setActiveTab('Vehicles'); setVStatusFilter('offline'); }} />
            <KpiCard icon="ti-tool" iconColor="var(--blue)" label="Maintenance" value={liveStats.maintenance}
              sub={liveStats.maintenance > 0 ? 'In service bay' : 'All clear'}
              subColor={liveStats.maintenance > 0 ? 'var(--blue)' : 'var(--green)'}
              stripe="var(--blue)"
              onClick={() => { setActiveTab('Vehicles'); setVStatusFilter('maintenance'); }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, marginBottom: 14 }}>
            <KpiCard icon="ti-satellite" iconColor="var(--green)" label="GPS Online" value={liveStats.withGps}
              sub={`${liveStats.total - liveStats.withGps} without signal`}
              subColor={liveStats.total - liveStats.withGps > 0 ? 'var(--amber)' : 'var(--green)'}
              stripe="var(--green)" />
            <KpiCard icon="ti-gauge" iconColor="var(--purple)" label="Avg Speed" value={liveStats.avgSpeed} unit="km/h"
              sub="Active vehicles only"
              stripe="var(--purple)" />
            <KpiCard icon="ti-gas-station" iconColor={liveStats.avgFuel < 40 ? 'var(--red)' : 'var(--green)'} label="Avg Fuel Level" value={liveStats.avgFuel} unit="%"
              sub={`${liveStats.lowFuel} low-fuel vehicle${liveStats.lowFuel !== 1 ? 's' : ''}`}
              subColor={liveStats.lowFuel > 0 ? 'var(--red)' : 'var(--green)'}
              stripe={liveStats.avgFuel < 40 ? 'var(--red)' : 'var(--green)'}
              onClick={() => setActiveTab('Analytics')} />
            <KpiCard icon="ti-bell-ringing" iconColor="var(--red)" label="Open Alerts" value={alertData?.openAlerts ?? 0}
              sub={(alertData?.criticalAlerts ?? 0) > 0 ? `${alertData!.criticalAlerts} critical!` : 'All clear'}
              subColor={(alertData?.criticalAlerts ?? 0) > 0 ? 'var(--red)' : 'var(--green)'}
              stripe="var(--red)" trend={(alertData?.criticalAlerts ?? 0) > 0 ? 'up' : 'flat'}
              onClick={() => { setActiveTab('Alerts'); setAlertFilter('all'); }} />
          </div>

          {/* Map + Fleet sidebar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 10, marginBottom: 12, minHeight: 460, alignItems: 'stretch' }}>
            {/* Map card */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cream)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-map" style={{ fontSize: 15, color: 'var(--ink3)' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                    Live Fleet Map {isSuperAdmin && tenantFilter !== 'all' ? `— ${TENANTS_META[tenantFilter]?.name}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn variant="ghost" size="xs" onClick={() => setShowTrails(t => !t)}>
                    {showTrails ? '↩ Hide trails' : '↩ Show trails'}
                  </Btn>
                </div>
              </div>

              {livePins.length === 0 ? (
                <div style={{ flex: 1, minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--cream2)', gap: 12 }}>
                  <i className="ti ti-map-off" style={{ fontSize: 40, color: 'var(--ink3)', opacity: 0.4 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>No vehicles with GPS</div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Vehicles will appear here when GPS data is available</div>
                </div>
              ) : (
                <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                  {/* Overlays */}
                  <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 5, pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(15,23,42,0.80)', backdropFilter: 'blur(6px)', color: '#fff', padding: '5px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      <span className="_lpulse" style={{ color: '#6ee7b7', fontSize: 9 }}>●</span>
                      LIVE · <span style={{ color: '#6ee7b7' }}>{livePins.filter(p => p.status === 'active').length} active</span>
                      {liveStats.idle > 0 && <> · <span style={{ color: '#f59e0b' }}>{liveStats.idle} idle</span></>}
                      {liveStats.offline > 0 && <> · <span style={{ color: '#94a3b8' }}>{liveStats.offline} offline</span></>}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 30, right: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(4px)', borderRadius: 8, padding: '8px 11px', fontSize: 10, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} /> Active</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> Idle</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} /> Offline</div>
                    </div>
                  </div>
                  <FleetMap
                    vehicles={livePins}
                    height="100%"
                    zoom={isSuperAdmin && tenantFilter === 'all' ? 4 : 11}
                    center={mapCenter}
                    fitAll={livePins.length > 1}
                    trails={showTrails ? trails : {}}
                    onSelectId={id => { if (id) openTracking(id); }}
                  />
                </div>
              )}
            </div>

            {/* Fleet status sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Status breakdown */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', flex: 1 }}>
                <SectionHeader title="Fleet Status" icon="ti-chart-donut" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
                  {[
                    { label: 'Active',      count: liveStats.active,      color: '#16a34a' },
                    { label: 'Idle',        count: liveStats.idle,        color: '#d97706' },
                    { label: 'Offline',     count: liveStats.offline,     color: '#94a3b8' },
                    { label: 'Maintenance', count: liveStats.maintenance, color: 'var(--blue)' },
                  ].map(r => (
                    <ProgressBar key={r.label} label={r.label} count={r.count} total={liveStats.total} color={r.color}
                      onClick={() => { setActiveTab('Vehicles'); setVStatusFilter(r.label.toLowerCase()); }} />
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span style={{ color: 'var(--ink3)' }}>Fleet utilisation</span>
                    <span style={{ fontWeight: 700, color: liveStats.active / liveStats.total > 0.5 ? 'var(--green)' : 'var(--amber)' }}>
                      {liveStats.total ? Math.round((liveStats.active / liveStats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick alerts summary */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <SectionHeader title="Alert Summary" icon="ti-bell" action={
                  <Btn variant="ghost" size="xs" onClick={() => setActiveTab('Alerts')}>View all →</Btn>
                } />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { label: 'Critical', count: alertCounts.critical, color: 'var(--red)', bg: 'var(--red-lt)' },
                    { label: 'Warning',  count: alertCounts.warning,  color: 'var(--amber)', bg: 'var(--amber-lt)' },
                    { label: 'Info',     count: alertCounts.info,     color: 'var(--blue)', bg: 'var(--blue-lt)' },
                  ].map(r => (
                    <div key={r.label} onClick={() => { setActiveTab('Alerts'); setAlertFilter(r.label.toLowerCase() as 'critical'|'warning'|'info'); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: r.count > 0 ? r.bg : 'var(--cream)', borderRadius: 5, cursor: 'pointer', border: `1px solid ${r.count > 0 ? r.color + '40' : 'transparent'}`, transition: 'opacity 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                    >
                      <span style={{ fontSize: 10, fontWeight: 600, color: r.count > 0 ? r.color : 'var(--ink3)' }}>{r.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 300, color: r.count > 0 ? r.color : 'var(--ink3)', letterSpacing: '-0.5px' }}>{r.count}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: 'var(--cream)', borderRadius: 5 }}>
                    <span style={{ fontSize: 10, color: 'var(--ink3)' }}>Acknowledged</span>
                    <span style={{ fontSize: 14, fontWeight: 300, color: 'var(--green)', letterSpacing: '-0.5px' }}>{alertCounts.acknowledged}</span>
                  </div>
                </div>
              </div>

              {/* GPS coverage */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <SectionHeader title="GPS Coverage" icon="ti-satellite" />
                <div style={{ textAlign: 'center', marginBottom: 7 }}>
                  <div style={{ fontSize: 26, fontWeight: 200, letterSpacing: '-1.5px', color: '#c4912a' }}>
                    {liveStats.total ? Math.round((liveStats.withGps / liveStats.total) * 100) : 0}
                    <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: 0 }}>%</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 1 }}>{liveStats.withGps} / {liveStats.total} online</div>
                </div>
                <div style={{ height: 5, background: 'var(--cream2)', borderRadius: 3 }}>
                  <div style={{ width: `${liveStats.total ? (liveStats.withGps / liveStats.total) * 100 : 0}%`, height: '100%', background: '#c4912a', borderRadius: 3, transition: 'width 0.6s' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Tenant breakdown for super admin */}
          {isSuperAdmin && tenantFilter === 'all' && Object.keys(TENANTS_META).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <SectionHeader title="Tenant Breakdown" icon="ti-building" />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(TENANTS_META).map(([tid, meta]) => {
                  const tvs    = vehicles.filter(v => v.tenantId === tid);
                  const active = tvs.filter(v => v.status === 'active').length;
                  const idle   = tvs.filter(v => v.status === 'idle').length;
                  return (
                    <div key={tid}
                      onClick={() => setTenantFilter(tid)}
                      style={{ flex: '1 1 140px', padding: '7px 10px', borderRadius: 7, background: meta.color + '0d', border: `1px solid ${meta.color}30`, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = meta.color + '1a'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = meta.color + '0d'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                        <span style={{ fontWeight: 700, fontSize: 12, color: meta.color }}>{meta.name}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>{active} active</span>
                        {' · '}<span style={{ color: '#d97706' }}>{idle} idle</span>
                        {' · '}{tvs.length} total
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════ LIVE MAP TAB ══════════════════════════════ */}
      {activeTab === 'Live Map' && (() => {
        const lmPins = livePins.filter(p => {
          if (lmStatusFilter !== 'all' && p.status !== lmStatusFilter) return false;
          if (lmSearch && !p.id.toLowerCase().includes(lmSearch.toLowerCase()) && !p.driver.toLowerCase().includes(lmSearch.toLowerCase())) return false;
          return true;
        });
        const lmSelected = lmPins.find(p => p.id === lmSelectedId) ?? null;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: 14, height: 'calc(100vh - 210px)', minHeight: 520 }}>
            {/* ── Left sidebar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', height: '100%' }}>
              {/* Sidebar header */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="_lpulse" style={{ color: '#16a34a', fontSize: 9 }}>●</span> Live Fleet
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink3)', fontWeight: 400 }}>{lmPins.length} shown</span>
                </div>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <input placeholder="Search plate or driver…" value={lmSearch} onChange={e => setLmSearch(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px 6px 26px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11, fontFamily: 'inherit', background: '#fff' }} />
                  <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink3)' }}>⌕</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['all','active','idle','offline'].map(s => (
                    <button key={s} onClick={() => setLmStatusFilter(s)}
                      style={{ flex: 1, padding: '3px 0', fontSize: 10, borderRadius: 5, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', fontWeight: lmStatusFilter === s ? 700 : 400, background: lmStatusFilter === s ? '#c4912a' : '#fff', color: lmStatusFilter === s ? '#fff' : 'var(--ink3)', transition: 'all 0.12s' }}>
                      {s === 'all' ? 'All' : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {lmPins.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink3)', fontSize: 12 }}>No vehicles match filters</div>
                ) : lmPins.map(p => {
                  const isSelected = p.id === lmSelectedId;
                  const statusColor = p.status === 'active' ? '#16a34a' : p.status === 'idle' ? '#d97706' : '#94a3b8';
                  return (
                    <div key={p.id} onClick={() => setLmSelectedId(isSelected ? null : p.id)}
                      style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSelected ? 'rgba(196,145,42,0.12)' : '#fff', borderLeft: isSelected ? '3px solid #c4912a' : '3px solid transparent', transition: 'all 0.12s' }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontWeight: 800, fontSize: 12, fontFamily: 'monospace', color: isSelected ? '#c4912a' : 'var(--ink)' }}>{p.id}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, color: statusColor }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                          {p.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 4 }}>{p.driver !== 'No driver' ? p.driver : <em>Unassigned</em>}</div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {p.status === 'active' && p.speed > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: p.speed > 100 ? 'var(--red)' : '#16a34a', display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-gauge" /> {p.speed} km/h</span>
                        )}
                        {typeof p.fuel === 'number' && (
                          <span style={{ fontSize: 10, color: p.fuel < 30 ? 'var(--red)' : 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-gas-station" /> {p.fuel}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected vehicle info panel */}
              {lmSelected && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: 'rgba(196,145,42,0.12)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#c4912a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Selected vehicle</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      { label: 'Plate',   value: lmSelected.id },
                      { label: 'Driver',  value: lmSelected.driver !== 'No driver' ? lmSelected.driver : 'Unassigned' },
                      { label: 'Speed',   value: lmSelected.status === 'active' ? `${lmSelected.speed} km/h` : '—' },
                      { label: 'Fuel',    value: typeof lmSelected.fuel === 'number' ? `${lmSelected.fuel}%` : '—' },
                      { label: 'GPS',     value: `${lmSelected.lat.toFixed(5)}, ${lmSelected.lng.toFixed(5)}` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#c4912a', opacity: 0.7 }}>{label}</span>
                        <span style={{ fontWeight: 600, color: '#c4912a', fontFamily: label === 'GPS' ? 'monospace' : 'inherit', fontSize: label === 'GPS' ? 9 : 11 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button onClick={() => openTracking(lmSelected.id)}
                      style={{ flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 700, borderRadius: 7, border: 'none', background: '#c4912a', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Open Tracker
                    </button>
                    <button onClick={() => { setPbVehicleId(lmSelected.id); loadRoute(lmSelected.id); setActiveTab('Playback'); }}
                      style={{ flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 700, borderRadius: 7, border: '1px solid #c4912a', background: '#fff', color: '#c4912a', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Playback →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Main map ── */}
            <div style={{ position: 'relative', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Overlays */}
              <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', gap: 6, flexDirection: 'column', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(15,23,42,0.82)', backdropFilter: 'blur(6px)', color: '#fff', padding: '6px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  <span className="_lpulse" style={{ color: '#6ee7b7', fontSize: 9 }}>●</span>
                  LIVE · {lmPins.filter(p => p.status === 'active').length} active
                  · {lmPins.filter(p => p.status === 'idle').length} idle
                  · {lmPins.filter(p => p.status === 'offline').length} offline
                </div>
                {lmSelected && (
                  <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', color: 'var(--ink)', padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: '1px solid var(--border)' }}>
                    Focused: <span style={{ fontFamily: 'monospace', color: '#c4912a' }}>{lmSelected.id}</span>
                    {' '}<span style={{ color: 'var(--ink3)', fontWeight: 400 }}>· {lmSelected.speed} km/h</span>
                  </div>
                )}
              </div>

              {/* Map legend */}
              <div style={{ position: 'absolute', bottom: 30, right: 10, zIndex: 1000, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', borderRadius: 8, padding: '8px 12px', fontSize: 10, border: '1px solid var(--border)' }}>
                {[['#16a34a','Active'],['#d97706','Idle'],['#94a3b8','Offline']].map(([c,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                    {l}
                  </div>
                ))}
              </div>

              {/* Map fills the remaining height of the card */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <FleetMap
                  vehicles={lmPins}
                  height="100%"
                  zoom={lmSelectedId ? 14 : (isSuperAdmin && tenantFilter === 'all' ? 4 : 11)}
                  center={lmSelected ? [lmSelected.lat, lmSelected.lng] : mapCenter}
                  selectedId={lmSelectedId}
                  onSelectId={id => { setLmSelectedId(id); if (id) openTracking(id); }}
                  fitAll={!lmSelectedId && lmPins.length > 1}
                  trails={showTrails ? trails : {}}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════ PLAYBACK TAB ══════════════════════════════ */}
      {activeTab === 'Playback' && (() => {
        const pbVehicle = sourceVehicles.find(v => v.id === pbVehicleId || v.plate === pbVehicleId);
        const pbCurrent = pbRoute[pbStep];
        const pbProgress = pbRoute.length > 1 ? Math.round((pbStep / (pbRoute.length - 1)) * 100) : 0;
        const pbDistEst  = pbStep > 0 ? Math.round(pbRoute.slice(0, pbStep + 1).reduce((d, pt, i, arr) => {
          if (i === 0) return 0;
          const prev = arr[i - 1];
          const dlat = pt.lat - prev.lat, dlng = pt.lng - prev.lng;
          return d + Math.sqrt(dlat * dlat + dlng * dlng) * 111;
        }, 0) * 10) / 10 : 0;
        const pbEvents = pbRoute.map((p, i) => ({ ...p, index: i })).filter(p => p.event);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* ── Config bar ── */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Vehicle</label>
                  <select value={pbVehicleId} onChange={e => { setPbVehicleId(e.target.value); setPbRoute([]); setPbStep(0); setPbPlaying(false); }}
                    style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', minWidth: 220, background: '#fff', color: 'var(--ink)' }}>
                    <option value="">— Select a vehicle —</option>
                    {sourceVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate}{v.driverName ? ` · ${v.driverName}` : ''} ({v.status})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Route points</label>
                  <select value={pbRouteCount} onChange={e => setPbRouteCount(Number(e.target.value))}
                    style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: '#fff', color: 'var(--ink)' }}>
                    {[20, 35, 50, 75, 100].map(n => <option key={n} value={n}>{n} points (~{Math.round(n * 2.4)} min)</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Playback speed</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 5, 10].map(s => (
                      <button key={s} onClick={() => setPbSpeed(s)}
                        style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', background: pbSpeed === s ? '#c4912a' : '#fff', color: pbSpeed === s ? '#fff' : 'var(--ink2)', transition: 'all 0.12s' }}>
                        {s}×
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginLeft: 'auto' }}>
                  <button
                    onClick={() => { if (pbVehicleId) loadRoute(pbVehicleId); }}
                    disabled={!pbVehicleId}
                    style={{ padding: '8px 20px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', background: pbVehicleId ? '#c4912a' : 'var(--cream2)', color: pbVehicleId ? '#fff' : 'var(--ink3)', cursor: pbVehicleId ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
                    ↺ Load Route
                  </button>
                </div>
              </div>
            </div>

            {pbRoute.length === 0 ? (
              /* Empty state */
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 60, textAlign: 'center' }}>
                <i className="ti ti-player-play" style={{ fontSize: 48, color: 'var(--ink3)', opacity: 0.3, marginBottom: 16, display: 'block' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Route Playback</div>
                <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 20 }}>Select a vehicle above and click <strong>Load Route</strong> to replay its trip history.</div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', fontSize: 12, color: 'var(--ink3)' }}>
                  {['Pick any vehicle from the fleet','Adjust route density & playback speed','Use transport controls to scrub through the trip'].map((s, i) => (
                    <div key={i} style={{ background: 'var(--cream)', borderRadius: 8, padding: '10px 16px', maxWidth: 180 }}>
                      <div style={{ fontSize: 16, marginBottom: 6 }}>{['①','②','③'][i]}</div>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* ── Route summary strip ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  {[
                    { icon: 'ti-truck',        label: 'Vehicle',      value: pbVehicle?.plate ?? pbVehicleId },
                    { icon: 'ti-clock-play',   label: 'Start time',   value: pbRoute[0]?.time ?? '—' },
                    { icon: 'ti-clock-stop',   label: 'End time',     value: pbRoute[pbRoute.length - 1]?.time ?? '—' },
                    { icon: 'ti-map-pin',      label: 'Est. distance',value: `${pbDistEst} km` },
                    { icon: 'ti-alert-triangle', label: 'Events',     value: `${pbEvents.length} flagged` },
                  ].map(k => (
                    <div key={k.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 15, marginBottom: 4, color: 'var(--ink3)' }}><i className={`ti ${k.icon}`} /></div>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink3)', marginBottom: 3 }}>{k.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.3px' }}>{k.value}</div>
                    </div>
                  ))}
                </div>

                {/* ── Map + event log ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14 }}>
                  {/* Map */}
                  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--cream)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                        {pbVehicle?.plate ?? 'Vehicle'} — Route Replay
                      </span>
                      {pbCurrent && (
                        <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
                          Step {pbStep + 1}/{pbRoute.length} · {pbCurrent.time}
                          {pbCurrent.speed > 0 && <> · <span style={{ color: pbCurrent.speed > 100 ? 'var(--red)' : '#c4912a', fontWeight: 700 }}>{pbCurrent.speed} km/h</span></>}
                        </span>
                      )}
                      {pbCurrent?.event && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'var(--red-lt)', color: 'var(--red)', marginLeft: 'auto' }}>
                          <i className="ti ti-alert-triangle" /> {pbCurrent.event}
                        </span>
                      )}
                    </div>
                    <PlaybackMap points={pbRoute} stepIndex={pbStep} height={440} />
                  </div>

                  {/* Event log */}
                  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--cream)', fontSize: 12, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i className="ti ti-alert-triangle" style={{ color: 'var(--amber)' }} /> Event Log</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: pbEvents.length > 0 ? 'var(--red-lt)' : 'var(--green-lt)', color: pbEvents.length > 0 ? 'var(--red)' : 'var(--green)' }}>
                        {pbEvents.length} event{pbEvents.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {pbEvents.length === 0 ? (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--green)', fontSize: 12, fontWeight: 700 }}>✓ No events on this route</div>
                      ) : pbEvents.map((ev, i) => (
                        <div key={i}
                          onClick={() => { setPbPlaying(false); setPbStep(ev.index); }}
                          style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: pbStep === ev.index ? 'var(--amber-lt)' : '#fff', transition: 'background 0.12s' }}
                          onMouseEnter={e => { if (pbStep !== ev.index) (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; }}
                          onMouseLeave={e => { if (pbStep !== ev.index) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                            <i className={`ti ${ev.event === 'Speeding' ? 'ti-gauge' : ev.event === 'Hard brake' ? 'ti-brake' : ev.event === 'Geofence exit' ? 'ti-map-pin-off' : 'ti-alert-triangle'}`} style={{ fontSize: 12, color: 'var(--red)' }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>{ev.event}</span>
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--ink3)' }}>
                            {ev.time} · Step {ev.index + 1}
                            {ev.speed > 0 && <> · {ev.speed} km/h</>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Step through events */}
                    {pbEvents.length > 0 && (
                      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', background: 'var(--cream)', display: 'flex', gap: 6 }}>
                        <button onClick={() => { const prev = pbEvents.filter(e => e.index < pbStep).pop(); if (prev) { setPbStep(prev.index); setPbPlaying(false); } }}
                          style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 700, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>‹ Prev event</button>
                        <button onClick={() => { const next = pbEvents.find(e => e.index > pbStep); if (next) { setPbStep(next.index); setPbPlaying(false); } }}
                          style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 700, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Next event ›</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Transport controls ── */}
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
                  {/* Progress bar / scrubber */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink3)', marginBottom: 6 }}>
                      <span>{pbRoute[0]?.time}</span>
                      <span style={{ fontWeight: 700, color: '#c4912a' }}>
                        {pbCurrent?.time} · Step {pbStep + 1}/{pbRoute.length} ({pbProgress}%)
                      </span>
                      <span>{pbRoute[pbRoute.length - 1]?.time}</span>
                    </div>
                    <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                      {/* Event markers on scrubber */}
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: 8, background: 'var(--cream2)', borderRadius: 4 }}>
                        <div style={{ width: `${pbProgress}%`, height: '100%', background: '#c4912a', borderRadius: 4, transition: 'width 0.2s' }} />
                        {pbEvents.map((ev, i) => {
                          const pct = Math.round((ev.index / (pbRoute.length - 1)) * 100);
                          return (
                            <div key={i} onClick={() => { setPbStep(ev.index); setPbPlaying(false); }}
                              title={`${ev.event} · ${ev.time}`}
                              style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 10, height: 10, background: 'var(--red)', borderRadius: '50%', border: '2px solid #fff', cursor: 'pointer', zIndex: 10 }} />
                          );
                        })}
                      </div>
                      <input type="range" min={0} max={pbRoute.length - 1} value={pbStep}
                        onChange={e => { setPbPlaying(false); setPbStep(Number(e.target.value)); }}
                        style={{ width: '100%', height: 20, opacity: 0, cursor: 'pointer', position: 'relative', zIndex: 20 }} />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    {/* |◀ */}
                    <button onClick={() => { setPbPlaying(false); setPbStep(0); }}
                      title="Jump to start"
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏮</button>
                    {/* −10 */}
                    <button onClick={() => { setPbPlaying(false); setPbStep(s => Math.max(0, s - 10)); }}
                      title="Back 10 steps"
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>-10</button>
                    {/* ◀ */}
                    <button onClick={() => { setPbPlaying(false); setPbStep(s => Math.max(0, s - 1)); }}
                      title="Step back"
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◀</button>

                    {/* ▶ / ⏸ */}
                    <button onClick={() => { if (pbStep >= pbRoute.length - 1) setPbStep(0); setPbPlaying(p => !p); }}
                      style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: '#c4912a', color: '#fff', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(13,110,94,0.4)' }}>
                      {pbPlaying ? '⏸' : '▶'}
                    </button>

                    {/* ▶ */}
                    <button onClick={() => { setPbPlaying(false); setPbStep(s => Math.min(pbRoute.length - 1, s + 1)); }}
                      title="Step forward"
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
                    {/* +10 */}
                    <button onClick={() => { setPbPlaying(false); setPbStep(s => Math.min(pbRoute.length - 1, s + 10)); }}
                      title="Forward 10 steps"
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+10</button>
                    {/* ▶| */}
                    <button onClick={() => { setPbPlaying(false); setPbStep(pbRoute.length - 1); }}
                      title="Jump to end"
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏭</button>

                    {/* Speed label */}
                    <div style={{ marginLeft: 12, fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      Speed:
                      {[1, 2, 5, 10].map(s => (
                        <button key={s} onClick={() => setPbSpeed(s)}
                          style={{ padding: '4px 9px', fontSize: 11, fontWeight: 700, borderRadius: 5, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', background: pbSpeed === s ? '#c4912a' : '#fff', color: pbSpeed === s ? '#fff' : 'var(--ink2)' }}>
                          {s}×
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current point detail */}
                  {pbCurrent && (
                    <div style={{ marginTop: 14, display: 'flex', gap: 16, justifyContent: 'center', fontSize: 11, color: 'var(--ink3)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-clock" /> <strong style={{ color: 'var(--ink)' }}>{pbCurrent.time}</strong></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-gauge" /> <strong style={{ color: pbCurrent.speed > 100 ? 'var(--red)' : '#c4912a' }}>{pbCurrent.speed} km/h</strong></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-map-pin" /> <strong style={{ color: 'var(--ink)', fontFamily: 'monospace', fontSize: 10 }}>{pbCurrent.lat.toFixed(5)}, {pbCurrent.lng.toFixed(5)}</strong></span>
                      {pbCurrent.event && <span style={{ fontWeight: 700, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-alert-triangle" /> {pbCurrent.event}</span>}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ════════════════════ VEHICLES TAB ══════════════════════════════ */}
      {activeTab === 'Vehicles' && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--cream)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                placeholder="Search plate, driver, customer…"
                value={vSearch}
                onChange={e => { setVSearch(e.target.value); setVPage(1); }}
                style={{ padding: '6px 10px 6px 30px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, width: 230, fontFamily: 'inherit', background: '#fff' }}
              />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink3)' }}>⌕</span>
            </div>

            {/* Status filters */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'active', 'idle', 'offline', 'maintenance'].map(s => (
                <button key={s} onClick={() => { setVStatusFilter(s); setVPage(1); }}
                  style={{ padding: '5px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: '1px solid var(--border)', background: vStatusFilter === s ? '#c4912a' : '#fff', color: vStatusFilter === s ? '#fff' : 'var(--ink2)', textTransform: 'capitalize', fontFamily: 'inherit', fontWeight: vStatusFilter === s ? 700 : 400, transition: 'all 0.15s' }}>
                  {s === 'all' ? `All (${filteredVehicles.length})` : `${s} (${filteredVehicles.filter(v => v.status === s).length})`}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* View toggle */}
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
                {(['table', 'cards'] as const).map(m => (
                  <button key={m} onClick={() => setVViewMode(m)}
                    style={{ padding: '5px 11px', fontSize: 11, border: 'none', cursor: 'pointer', background: vViewMode === m ? '#c4912a' : '#fff', color: vViewMode === m ? '#fff' : 'var(--ink3)', fontFamily: 'inherit', fontWeight: 600 }}>
                    {m === 'table' ? <><i className="ti ti-table" /> Table</> : <><i className="ti ti-layout-grid" /> Cards</>}
                  </button>
                ))}
              </div>

              {/* Column toggle */}
              <div style={{ position: 'relative' }}>
                <Btn variant="default" size="sm" onClick={() => setColMenuOpen(o => !o)}>⊙ Columns</Btn>
                {colMenuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 12, zIndex: 200, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Show / hide columns</div>
                    {ALL_COLS.map(col => (
                      <label key={col} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 12, color: 'var(--ink2)' }}>
                        <input type="checkbox" checked={!hiddenCols.has(col)} onChange={e => {
                          const next = new Set(hiddenCols);
                          if (e.target.checked) next.delete(col); else next.add(col);
                          setHiddenCols(next);
                        }} />
                        {col}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Page size */}
              <select value={vPageSize} onChange={e => { setVPageSize(Number(e.target.value)); setVPage(1); }}
                style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11, fontFamily: 'inherit', background: '#fff', color: 'var(--ink)' }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>

              {/* Export */}
              <Btn variant="primary" size="sm" onClick={() => exportCSV(vehicleRows, isSuperAdmin)}>
                ↓ Export CSV
              </Btn>
            </div>
          </div>

          {/* Vehicles count bar */}
          <div style={{ padding: '7px 16px', background: '#f9fafb', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
              Showing <strong style={{ color: 'var(--ink)' }}>{(vPage - 1) * vPageSize + 1}–{Math.min(vPage * vPageSize, vehicleRows.length)}</strong> of <strong style={{ color: 'var(--ink)' }}>{vehicleRows.length}</strong> vehicles
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { label: '▶ Active',      count: filteredVehicles.filter(v => v.status === 'active').length,      color: '#16a34a' },
                { label: '⏸ Idle',        count: filteredVehicles.filter(v => v.status === 'idle').length,        color: '#d97706' },
                { label: '○ Offline',     count: filteredVehicles.filter(v => v.status === 'offline').length,     color: '#94a3b8' },
                { label: '⚙ Maintenance', count: filteredVehicles.filter(v => v.status === 'maintenance').length, color: 'var(--blue)' },
              ].map(r => (
                <span key={r.label} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--cream2)', color: r.color, fontWeight: 700 }}>{r.label}: {r.count}</span>
              ))}
            </div>
          </div>

          {/* Table view */}
          {vViewMode === 'table' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} onClick={() => setColMenuOpen(false)}>
                <thead>
                  <tr>
                    {visibleCols.includes('Plate')        && <SortTh col="plate"    label="Plate" />}
                    {visibleCols.includes('Driver')       && <SortTh col="driver"   label="Driver" />}
                    {visibleCols.includes('Status')       && <SortTh col="status"   label="Status" />}
                    {visibleCols.includes('Speed')        && <SortTh col="speed"    label="Speed" />}
                    {visibleCols.includes('Fuel')         && <SortTh col="fuel"     label="Fuel" />}
                    {visibleCols.includes('Category')     && <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>Category</th>}
                    {visibleCols.includes('Make / Model') && <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>Make / Model</th>}
                    {visibleCols.includes('Odometer')     && <SortTh col="odometer" label="Odometer" />}
                    {visibleCols.includes('Customer')     && <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>Customer</th>}
                    {isSuperAdmin && visibleCols.includes('Tenant') && <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>Tenant</th>}
                    <th style={{ padding: '9px 14px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedVehicleRows.length === 0 ? (
                    <tr><td colSpan={12} style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>No vehicles match your filters.</td></tr>
                  ) : pagedVehicleRows.map(v => (
                    <tr key={v.id}
                      onClick={() => router.push('/vehicles/' + v.id)}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f0faf7'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                    >
                      {visibleCols.includes('Plate') && (
                        <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: 12, color: 'var(--ink)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                          {v.plate}
                        </td>
                      )}
                      {visibleCols.includes('Driver') && (
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink2)' }}>
                          {v.driverName ?? <span style={{ color: 'var(--ink3)', fontStyle: 'italic' }}>Unassigned</span>}
                        </td>
                      )}
                      {visibleCols.includes('Status') && (
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize', ...STATUS_PILL[v.status] }}>
                            {STATUS_ICON[v.status]} {v.status}
                          </span>
                        </td>
                      )}
                      {visibleCols.includes('Speed') && (
                        <td style={{ padding: '10px 14px', fontSize: 12 }}>
                          {v.status === 'active' && v.speedKmh
                            ? <span style={{ fontWeight: 700, color: v.speedKmh > 100 ? 'var(--red)' : v.speedKmh > 80 ? 'var(--amber)' : 'var(--green)' }}>{v.speedKmh} <span style={{ fontWeight: 400, color: 'var(--ink3)' }}>km/h</span></span>
                            : <span style={{ color: 'var(--ink3)' }}>—</span>}
                        </td>
                      )}
                      {visibleCols.includes('Fuel') && (
                        <td style={{ padding: '10px 14px' }}><FuelBar level={v.fuelLevel} /></td>
                      )}
                      {visibleCols.includes('Category') && (
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--ink3)', textTransform: 'capitalize' }}>{v.category ?? '—'}</td>
                      )}
                      {visibleCols.includes('Make / Model') && (
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--ink2)' }}>
                          {v.make && v.model ? `${v.make} ${v.model}${v.year ? ` (${v.year})` : ''}` : <span style={{ color: 'var(--ink3)' }}>—</span>}
                        </td>
                      )}
                      {visibleCols.includes('Odometer') && (
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--ink3)', fontFamily: 'monospace' }}>
                          {v.odometer ? `${v.odometer.toLocaleString()} km` : '—'}
                        </td>
                      )}
                      {visibleCols.includes('Customer') && (
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--ink3)' }}>{v.customerName ?? '—'}</td>
                      )}
                      {isSuperAdmin && visibleCols.includes('Tenant') && (
                        <td style={{ padding: '10px 14px', fontSize: 11 }}>
                          {TENANTS_META[v.tenantId] && (
                            <span style={{ fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: TENANTS_META[v.tenantId].color + '1a', color: TENANTS_META[v.tenantId].color }}>
                              {TENANTS_META[v.tenantId].name}
                            </span>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <Btn variant="primary" size="xs" onClick={() => openTracking(v.plate)}>Track</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cards view */}
          {vViewMode === 'cards' && (
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {pagedVehicleRows.length === 0
                ? <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>No vehicles match your filters.</div>
                : pagedVehicleRows.map(v => (
                  <div key={v.id}
                    onClick={() => router.push('/vehicles/' + v.id)}
                    style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s', background: '#fff' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = '#c4912a'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.5px', color: 'var(--ink)' }}>{v.plate}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, textTransform: 'capitalize', ...STATUS_PILL[v.status] }}>{STATUS_ICON[v.status]} {v.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 4 }}>{v.driverName ?? <span style={{ color: 'var(--ink3)', fontStyle: 'italic' }}>Unassigned</span>}</div>
                    {v.make && <div style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 6 }}>{v.make} {v.model} {v.year && `(${v.year})`}</div>}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <FuelBar level={v.fuelLevel} />
                      {v.status === 'active' && v.speedKmh && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: v.speedKmh > 100 ? 'var(--red)' : 'var(--green)', marginLeft: 'auto' }}>{v.speedKmh} km/h</span>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* Pagination */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>Page {vPage} of {totalVehiclePages}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <Btn variant="default" size="xs" onClick={() => setVPage(1)} >«</Btn>
              <Btn variant="default" size="xs" onClick={() => setVPage(p => Math.max(1, p - 1))}>‹ Prev</Btn>
              {Array.from({ length: Math.min(5, totalVehiclePages) }, (_, i) => {
                const pg = Math.max(1, Math.min(totalVehiclePages - 4, vPage - 2)) + i;
                return (
                  <button key={pg} onClick={() => setVPage(pg)}
                    style={{ padding: '3px 9px', fontSize: 11, borderRadius: 5, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', background: vPage === pg ? '#c4912a' : '#fff', color: vPage === pg ? '#fff' : 'var(--ink2)', fontWeight: vPage === pg ? 700 : 400 }}>
                    {pg}
                  </button>
                );
              })}
              <Btn variant="default" size="xs" onClick={() => setVPage(p => Math.min(totalVehiclePages, p + 1))}>Next ›</Btn>
              <Btn variant="default" size="xs" onClick={() => setVPage(totalVehiclePages)}>»</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ ALERTS TAB ════════════════════════════════ */}
      {activeTab === 'Alerts' && (
        <div>
          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <StatPill label="Total" count={alertData?.recentAlerts.length ?? 0} color="var(--ink2)" bg="var(--cream)" />
            <StatPill label="Critical" count={alertCounts.critical} color="var(--red)" bg="var(--red-lt)" />
            <StatPill label="Warning"  count={alertCounts.warning}  color="var(--amber)" bg="var(--amber-lt)" />
            <StatPill label="Info"     count={alertCounts.info}     color="var(--blue)" bg="var(--blue-lt)" />
            <StatPill label="Acknowledged" count={alertCounts.acknowledged} color="var(--green)" bg="var(--green-lt)" />
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                placeholder="Search title or plate…"
                value={alertSearch}
                onChange={e => setAlertSearch(e.target.value)}
                style={{ padding: '6px 10px 6px 30px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, width: 210, fontFamily: 'inherit', background: '#fff' }}
              />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink3)' }}>⌕</span>
            </div>

            {/* Severity filter */}
            {(['all', 'critical', 'warning', 'info'] as const).map(s => {
              const counts: Record<string, number> = { all: alertData?.recentAlerts.length ?? 0, critical: alertCounts.critical, warning: alertCounts.warning, info: alertCounts.info };
              return (
                <button key={s} onClick={() => setAlertFilter(s)}
                  style={{ padding: '5px 13px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', border: '1px solid var(--border)', background: alertFilter === s ? '#c4912a' : '#fff', color: alertFilter === s ? '#fff' : 'var(--ink2)', fontWeight: alertFilter === s ? 700 : 400, transition: 'all 0.15s' }}>
                  {s} ({counts[s] ?? 0})
                </button>
              );
            })}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {/* Bulk acknowledge */}
              {filteredAlerts.filter(a => !a.acknowledged).length > 0 && (
                <Btn variant="default" size="sm" onClick={async () => {
                  for (const a of filteredAlerts.filter(x => !x.acknowledged)) await api.dashboard.acknowledgeAlert(a.id);
                  load();
                }}>
                  ✓ Acknowledge all ({filteredAlerts.filter(a => !a.acknowledged).length})
                </Btn>
              )}
              <Btn variant="primary" size="sm" onClick={() => exportAlertsCSV(filteredAlerts)}>↓ Export CSV</Btn>
            </div>
          </div>

          {filteredAlerts.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center', background: '#fff', border: '1px solid var(--border)', borderRadius: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>No alerts</div>
              <div style={{ fontSize: 12, color: 'var(--ink3)' }}>All clear for the selected filter.</div>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {filteredAlerts.map((alert, i) => (
                <div key={alert.id}
                  onClick={() => setDashAlert(alert)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px',
                    borderBottom: i < filteredAlerts.length - 1 ? '1px solid var(--border)' : 'none',
                    background: alert.acknowledged ? '#fafafa' : alert.severity === 'critical' ? '#fff8f8' : '#fff',
                    cursor: 'pointer', transition: 'background 0.12s',
                    opacity: alert.acknowledged ? 0.6 : 1,
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f0faf7'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = alert.acknowledged ? '#fafafa' : alert.severity === 'critical' ? '#fff8f8' : '#fff'}
                >
                  {/* Severity stripe */}
                  <div style={{ width: 4, alignSelf: 'stretch', flexShrink: 0, borderRadius: 2, background: alert.severity === 'critical' ? 'var(--red)' : alert.severity === 'warning' ? 'var(--amber)' : 'var(--blue)' }} />

                  {/* Icon */}
                  <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: alert.severity === 'critical' ? 'var(--red-lt)' : alert.severity === 'warning' ? 'var(--amber-lt)' : 'var(--blue-lt)', fontSize: 16 }}>
                    <i className={`ti ${alert.severity === 'critical' ? 'ti-bell-ringing' : alert.severity === 'warning' ? 'ti-alert-triangle' : 'ti-info-circle'}`} style={{ color: alert.severity === 'critical' ? 'var(--red)' : alert.severity === 'warning' ? 'var(--amber)' : 'var(--blue)' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{alert.title}</span>
                      {alert.acknowledged && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: 'var(--green-lt)', color: 'var(--green)' }}>ACKNOWLEDGED</span>}
                      {alert.vehiclePlate && <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--ink3)', fontWeight: 700, background: 'var(--cream2)', padding: '1px 6px', borderRadius: 4 }}>{alert.vehiclePlate}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.5, marginBottom: 4 }}>{alert.description}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'monospace' }}>
                      🕐 {timeAgo(alert.occurredAt)} · {new Date(alert.occurredAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                    <AlertSeverityBadge severity={alert.severity} />
                    {!alert.acknowledged && (
                      <button onClick={e => { e.stopPropagation(); acknowledge(alert.id); }}
                        style={{ padding: '4px 11px', fontSize: 11, border: '1px solid var(--border)', borderRadius: 6, background: '#fff', cursor: 'pointer', color: 'var(--ink2)', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--green-lt)'; (e.currentTarget as HTMLElement).style.color = 'var(--green)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--green)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = 'var(--ink2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                      >
                        ✓ Ack
                      </button>
                    )}
                    <span onClick={e => e.stopPropagation()}><Btn variant="ghost" size="xs" onClick={() => openTracking(alert.vehiclePlate ?? '')}>Track →</Btn></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ ANALYTICS TAB ═════════════════════════════ */}
      {activeTab === 'Analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Period selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 600 }}>Period:</span>
            {(['today', 'week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setAnalyticsPeriod(p)}
                style={{ padding: '5px 14px', fontSize: 12, borderRadius: 20, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', background: analyticsPeriod === p ? '#c4912a' : '#fff', color: analyticsPeriod === p ? '#fff' : 'var(--ink2)', fontWeight: analyticsPeriod === p ? 700 : 400, transition: 'all 0.15s' }}>
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink3)' }}>
              {analyticsPeriod === 'today'
                ? `Live snapshot · ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
                : analyticsPeriod === 'week'
                  ? `This week · Mon–${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
                  : `This month · ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
            </span>
          </div>

          {/* KPI row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
            <KpiCard icon="ti-route" iconColor="#c4912a"
              label={analyticsPeriod === 'today' ? 'Trips Today' : analyticsPeriod === 'week' ? 'Trips This Week' : 'Trips This Month'}
              value={analytics.trips} stripe="#c4912a" trend="up" />
            <KpiCard icon="ti-map-pin" iconColor="var(--blue)"
              label={analyticsPeriod === 'today' ? 'Est. Distance Today' : analyticsPeriod === 'week' ? 'Est. Distance (Week)' : 'Est. Distance (Month)'}
              value={analytics.km.toLocaleString()} unit=" km" stripe="var(--blue)" />
            <KpiCard icon="ti-gauge" iconColor="var(--purple)" label="Avg Speed (Active)" value={analytics.avgSpeed} unit=" km/h" stripe="var(--purple)" />
            <KpiCard icon="ti-chart-pie" iconColor="var(--green)"
              label={analyticsPeriod === 'today' ? 'Utilisation (Now)' : analyticsPeriod === 'week' ? 'Avg Utilisation (Week)' : 'Avg Utilisation (Month)'}
              value={analytics.utilRate} unit="%"
              sub={analytics.utilRate > 70 ? 'Excellent' : analytics.utilRate > 40 ? 'Moderate' : 'Low'}
              subColor={analytics.utilRate > 70 ? 'var(--green)' : analytics.utilRate > 40 ? 'var(--amber)' : 'var(--red)'}
              stripe="var(--green)" />
          </div>

          {/* KPI row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
            <KpiCard icon="ti-gas-station" iconColor={analytics.avgFuel < 30 ? 'var(--red)' : analytics.avgFuel < 50 ? 'var(--amber)' : 'var(--green)'} label="Avg Fuel Level" value={analytics.avgFuel} unit="%"
              sub={analytics.avgFuel < 30 ? 'Low — refuel needed' : analytics.avgFuel < 50 ? 'Moderate' : 'Good'}
              subColor={analytics.avgFuel < 30 ? 'var(--red)' : analytics.avgFuel < 50 ? 'var(--amber)' : 'var(--green)'}
              stripe={analytics.avgFuel < 30 ? 'var(--red)' : analytics.avgFuel < 50 ? 'var(--amber)' : 'var(--green)'} />
            <KpiCard icon="ti-alert-triangle" iconColor={analytics.lowFuel > 0 ? 'var(--red)' : 'var(--green)'} label="Low Fuel Vehicles" value={analytics.lowFuel}
              sub={analytics.lowFuel > 0 ? 'Below 30% threshold' : 'All vehicles fuelled'}
              subColor={analytics.lowFuel > 0 ? 'var(--red)' : 'var(--green)'}
              stripe={analytics.lowFuel > 0 ? 'var(--red)' : 'var(--green)'}
              trend={analytics.lowFuel > 0 ? 'down' : 'flat'}
              onClick={() => { setActiveTab('Vehicles'); setVStatusFilter('all'); }} />
            <KpiCard icon="ti-speedboat" iconColor={analytics.topSpeeder[0]?.speedKmh && analytics.topSpeeder[0].speedKmh > 100 ? 'var(--red)' : 'var(--amber)'} label="Top Speed (Live)"
              value={analytics.topSpeeder[0]?.speedKmh ?? 0} unit=" km/h"
              sub={analytics.topSpeeder[0] ? analytics.topSpeeder[0].plate : 'No active vehicles'}
              subColor={analytics.topSpeeder[0]?.speedKmh && analytics.topSpeeder[0].speedKmh > 100 ? 'var(--red)' : 'var(--ink3)'}
              stripe={analytics.topSpeeder[0]?.speedKmh && analytics.topSpeeder[0].speedKmh > 100 ? 'var(--red)' : 'var(--amber)'} />
            <KpiCard icon="ti-steering-wheel" iconColor="#c4912a"
              label={analyticsPeriod === 'today' ? 'Drivers on Duty' : analyticsPeriod === 'week' ? 'Drivers This Week' : 'Drivers This Month'}
              value={analytics.driversOnDuty}
              sub={analyticsPeriod === 'today' ? 'Active right now' : analyticsPeriod === 'week' ? 'Unique drivers this week' : 'Unique drivers this month'}
              stripe="#c4912a" />
          </div>

          {/* ── Activity charts ─────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
            {/* Trips bar chart */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px' }}>
              <SectionHeader
                title={analyticsPeriod === 'today' ? 'Trips — Hourly (Today)' : analyticsPeriod === 'week' ? 'Trips — Daily (This Week)' : 'Trips — Weekly (This Month)'}
                icon="ti-route"
              />
              <BarChart data={analytics.tripsChart} color="#c4912a" />
            </div>
            {/* Avg speed line chart */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px' }}>
              <SectionHeader
                title={analyticsPeriod === 'today' ? 'Avg Speed — Hourly' : analyticsPeriod === 'week' ? 'Avg Speed — Daily' : 'Avg Speed — Weekly'}
                icon="ti-gauge"
              />
              <LineChart data={analytics.speedChart} color="#7c3aed" unit=" km/h" />
            </div>
            {/* Fleet utilisation line chart */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px' }}>
              <SectionHeader
                title={analyticsPeriod === 'today' ? 'Utilisation — Hourly' : analyticsPeriod === 'week' ? 'Utilisation — Daily' : 'Utilisation — Weekly'}
                icon="ti-chart-pie"
              />
              <LineChart data={analytics.utilChart} color="#16a34a" unit="%" />
            </div>
          </div>

          {/* Fleet utilisation + low fuel split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Fleet utilisation */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px' }}>
              <SectionHeader title="Fleet Utilisation Breakdown" icon="ti-chart-donut" />
              {[
                { label: 'Active',      count: liveStats.active,      color: '#16a34a' },
                { label: 'Idle',        count: liveStats.idle,        color: '#d97706' },
                { label: 'Offline',     count: liveStats.offline,     color: '#94a3b8' },
                { label: 'Maintenance', count: liveStats.maintenance, color: 'var(--blue)' },
              ].map(r => (
                <ProgressBar key={r.label} label={r.label} count={r.count} total={liveStats.total} color={r.color}
                  onClick={() => { setActiveTab('Vehicles'); setVStatusFilter(r.label.toLowerCase()); }} />
              ))}
              <div style={{ marginTop: 8, padding: '7px 10px', background: 'rgba(196,145,42,0.12)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#c4912a', fontWeight: 600 }}>Overall utilisation rate</span>
                <span style={{ fontSize: 16, fontWeight: 300, color: '#c4912a', letterSpacing: '-0.5px' }}>{analytics.utilRate}%</span>
              </div>
            </div>

            {/* Fuel distribution */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px' }}>
              <SectionHeader title="Fuel Distribution" icon="ti-gas-station" />
              {[
                { label: 'Critical (< 20%)', count: filteredVehicles.filter(v => (v.fuelLevel ?? 100) < 20).length, color: 'var(--red)' },
                { label: 'Low (20–39%)',     count: filteredVehicles.filter(v => { const f = v.fuelLevel ?? 100; return f >= 20 && f < 40; }).length, color: 'var(--amber)' },
                { label: 'Medium (40–69%)',  count: filteredVehicles.filter(v => { const f = v.fuelLevel ?? 100; return f >= 40 && f < 70; }).length, color: '#60a5fa' },
                { label: 'Good (≥ 70%)',     count: filteredVehicles.filter(v => (v.fuelLevel ?? 0) >= 70).length, color: 'var(--green)' },
              ].map(r => (
                <ProgressBar key={r.label} label={r.label} count={r.count} total={liveStats.total} color={r.color} />
              ))}
              <div style={{ marginTop: 8, padding: '7px 10px', background: liveStats.avgFuel < 40 ? 'var(--amber-lt)' : 'var(--green-lt)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: liveStats.avgFuel < 40 ? 'var(--amber)' : 'var(--green)', fontWeight: 600 }}>Fleet average fuel</span>
                <span style={{ fontSize: 16, fontWeight: 300, color: liveStats.avgFuel < 40 ? 'var(--amber)' : 'var(--green)', letterSpacing: '-0.5px' }}>{liveStats.avgFuel}%</span>
              </div>
            </div>
          </div>

          {/* Top speeders + Low fuel table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Top speeders */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <i className="ti ti-gauge" style={{ fontSize: 14, color: 'var(--ink3)' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Top Active Vehicles by Speed</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{analytics.topSpeeder.length} vehicles</span>
              </div>
              {analytics.topSpeeder.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink3)', fontSize: 12 }}>No active vehicles</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--cream)' }}>
                      <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>#</th>
                      <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Plate</th>
                      <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Driver</th>
                      <th style={{ padding: '7px 14px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topSpeeder.map((v, i) => (
                      <tr key={v.id} onClick={() => openTracking(v.plate)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f0faf7'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                        <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--ink3)', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 800, fontSize: 12, fontFamily: 'monospace', color: 'var(--ink)' }}>{v.plate}</td>
                        <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--ink3)' }}>{v.driverName ?? 'Unassigned'}</td>
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, fontSize: 12, color: (v.speedKmh ?? 0) > 100 ? 'var(--red)' : (v.speedKmh ?? 0) > 80 ? 'var(--amber)' : 'var(--green)' }}>
                          {v.speedKmh ?? 0} km/h
                          {(v.speedKmh ?? 0) > 100 && <i className="ti ti-alert-triangle" style={{ fontSize: 10, marginLeft: 4 }} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Low fuel */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <i className="ti ti-gas-station" style={{ fontSize: 14, color: 'var(--ink3)' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Low Fuel Vehicles</span>
                </div>
                {analytics.lowFuel > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'var(--red-lt)', color: 'var(--red)' }}>{analytics.lowFuel} need refuel</span>}
              </div>
              {analytics.lowFuel === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--green)', fontSize: 12, fontWeight: 700 }}>✓ All vehicles have sufficient fuel</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--cream)' }}>
                      <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Plate</th>
                      <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Driver</th>
                      <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Fuel</th>
                      <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.fuelSorted.filter(v => (v.fuelLevel ?? 100) < 30).map(v => (
                      <tr key={v.id} onClick={() => openTracking(v.plate)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fff8f0'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                        <td style={{ padding: '9px 14px', fontWeight: 800, fontFamily: 'monospace', fontSize: 12, color: 'var(--ink)' }}>{v.plate}</td>
                        <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--ink3)' }}>{v.driverName ?? 'Unassigned'}</td>
                        <td style={{ padding: '9px 14px' }}><FuelBar level={v.fuelLevel} /></td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, textTransform: 'capitalize', ...STATUS_PILL[v.status] }}>{v.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Tenant analytics for super admin */}
          {isSuperAdmin && tenantFilter === 'all' && Object.keys(TENANTS_META).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
              <SectionHeader title="Per-Tenant Analytics" icon="ti-building" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: 'var(--cream)' }}>
                      {['Tenant','Total','Active','Idle','Offline','Maint.','Avg Fuel','GPS'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: h === 'Tenant' ? 'left' : 'center', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(TENANTS_META).map(([tid, meta]) => {
                      const tvs     = vehicles.filter(v => v.tenantId === tid);
                      const tActive = tvs.filter(v => v.status === 'active').length;
                      const tIdle   = tvs.filter(v => v.status === 'idle').length;
                      const tOffline = tvs.filter(v => v.status === 'offline').length;
                      const tMaint  = tvs.filter(v => v.status === 'maintenance').length;
                      const tFuel   = tvs.length ? Math.round(tvs.reduce((s, v) => s + (v.fuelLevel ?? 0), 0) / tvs.length) : 0;
                      const tGps    = tvs.filter(v => v.latitude !== null).length;
                      return (
                        <tr key={tid}
                          onClick={() => { setTenantFilter(tid); setActiveTab('Overview'); }}
                          style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = meta.color + '0d'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                        >
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />
                              <span style={{ fontWeight: 700, fontSize: 12, color: meta.color }}>{meta.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{tvs.length}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{tActive}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: '#d97706' }}>{tIdle}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: '#94a3b8' }}>{tOffline}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--blue)' }}>{tMaint}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{ color: tFuel < 30 ? 'var(--red)' : tFuel < 50 ? 'var(--amber)' : 'var(--green)', fontWeight: 700 }}>{tFuel}%</span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, color: 'var(--ink3)' }}>{tGps} / {tvs.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Vehicle tracking modal ─────────────────────────────────── */}
      {trackingVehicle && (
        <VehicleTrackingModal
          vehicle={trackingVehicle}
          initialPin={trackingPin}
          onClose={() => { setTrackingVehicle(null); setTrackingPin(null); }}
        />
      )}

      {/* ── Alert detail modal ────────────────────────────────────── */}
      {dashAlert && (
        <AlertDetailModal
          plate={dashAlert.vehiclePlate ?? ''}
          severity={dashAlert.severity}
          type={dashAlert.title}
          status={dashAlert.acknowledged ? 'Acknowledged' : 'Active'}
          time={timeAgo(dashAlert.occurredAt)}
          onClose={() => setDashAlert(null)}
          onSave={(_response, _newStatus) => { acknowledge(dashAlert.id); setDashAlert(null); }}
        />
      )}
    </div>
  );
}
