'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { FleetMap, STATUS_COLOR, VehiclePin } from '@/components/maps/FleetMap';
import { TENANTS_META } from '@/lib/vehiclesMaster';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useUIStore } from '@/store/uiStore';

const FILTER_OPTS = ['all', 'active', 'idle', 'offline'];

function toMapStatus(s: string): 'active' | 'idle' | 'offline' {
  if (s === 'active') return 'active';
  if (s === 'idle')   return 'idle';
  return 'offline';
}

function TenantDot({ tenantId }: { tenantId: string }) {
  const meta = TENANTS_META[tenantId];
  if (!meta) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
      background: meta.color + '18', color: meta.color, border: `1px solid ${meta.color}40`,
    }}>
      {meta.name}
    </span>
  );
}

/* ── Mock geofences ─────────────────────────────────────────────── */
const MOCK_GEOFENCES = [
  { id: 'gz-1', name: 'Manhattan Distribution Zone', shape: 'Circle',    radius: '2 km',   tenantId: '1', status: 'Active',   trigger: 'Entry & Exit', vehicles: 3 },
  { id: 'gz-2', name: 'JFK Airport Perimeter',       shape: 'Polygon',   radius: '—',      tenantId: '1', status: 'Breached', trigger: 'Exit',         vehicles: 1 },
  { id: 'gz-3', name: 'Newark Industrial Depot',     shape: 'Rectangle', radius: '—',      tenantId: '1', status: 'Active',   trigger: 'Entry',        vehicles: 2 },
  { id: 'gz-4', name: 'Houston Port Zone',           shape: 'Circle',    radius: '3 km',   tenantId: '2', status: 'Active',   trigger: 'Entry & Exit', vehicles: 2 },
  { id: 'gz-5', name: 'Dallas Distribution Hub',     shape: 'Polygon',   radius: '—',      tenantId: '2', status: 'Active',   trigger: 'Entry',        vehicles: 1 },
  { id: 'gz-6', name: 'London City Centre',          shape: 'Circle',    radius: '1.5 km', tenantId: '3', status: 'Active',   trigger: 'Entry & Exit', vehicles: 1 },
  { id: 'gz-7', name: 'Felixstowe Port Terminal',    shape: 'Polygon',   radius: '—',      tenantId: '5', status: 'Active',   trigger: 'Exit',         vehicles: 2 },
];

const GZ_STATUS: Record<string, React.CSSProperties> = {
  Active:   { background: 'rgba(196,145,42,0.12)',  color: '#c4912a' },
  Breached: { background: '#fef2f2',         color: '#dc2626' },
  Inactive: { background: '#f3f4f6',         color: '#6b7280' },
};

/* ── Mock events ─────────────────────────────────────────────────── */
const MOCK_EVENTS = [
  { id: 'ev-1', type: 'Geofence breach', severity: 'critical', vehicle: 'ABC-006F', msg: 'Left JFK Airport Perimeter',              time: '52m ago', tenantId: '1' },
  { id: 'ev-2', type: 'Speed alert',     severity: 'warning',  vehicle: 'ABC-001A', msg: 'Exceeded 55 mph in 45 zone',               time: '1h ago',  tenantId: '1' },
  { id: 'ev-3', type: 'Low fuel',        severity: 'warning',  vehicle: 'ABC-002B', msg: 'Fuel at 45% — nearest station 8 mi',       time: '1h ago',  tenantId: '1' },
  { id: 'ev-4', type: 'Engine off',      severity: 'info',     vehicle: 'ABC-003C', msg: 'Vehicle idling for 45 minutes',             time: '2h ago',  tenantId: '1' },
  { id: 'ev-5', type: 'Geofence entry',  severity: 'info',     vehicle: 'TXS-001A', msg: 'Entered Houston Port Zone',                time: '30m ago', tenantId: '2' },
  { id: 'ev-6', type: 'Speed alert',     severity: 'warning',  vehicle: 'TXS-002B', msg: 'Exceeded 75 mph on I-45 highway',          time: '45m ago', tenantId: '2' },
  { id: 'ev-7', type: 'Low fuel',        severity: 'warning',  vehicle: 'LON-001A', msg: 'Fuel at 22% — low tank alert',             time: '15m ago', tenantId: '3' },
  { id: 'ev-8', type: 'Geofence entry',  severity: 'info',     vehicle: 'FLX-001A', msg: 'Entered Felixstowe Port Terminal',         time: '1h ago',  tenantId: '5' },
];

const EV_COLOR: Record<string, string> = {
  critical: 'var(--red)',
  warning:  'var(--amber)',
  info:     'var(--blue)',
};
const EV_BG: Record<string, string> = {
  critical: '#fef2f2',
  warning:  '#fffbeb',
  info:     '#eff6ff',
};

type MapPanelTab = 'Vehicles' | 'Geofences' | 'Events';

export default function MapPage() {
  const { user }        = useAuthStore();
  const role            = user?.role ?? 'viewer';
  const isSuperAdmin    = role === 'super_admin' || role === 'platform_admin';
  const isVehicleOwner  = role === 'vehicle_owner';
  const tenantId        = user?.tenantId ?? '1';

  const router = useRouter();

  const [panelOpen,    setPanelOpen]   = useState(true);
  const [panelTab,     setPanelTab]    = useState<MapPanelTab>('Vehicles');
  const [filter,       setFilter]      = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const setSelectedVehicleId = useUIStore(s => s.setSelectedVehicleId);
  const [selected, setSelected] = useState<string | null>(null);
  /* Persist selection cross-page so playback can pick it up */
  const selectVehicle = (id: string | null) => {
    setSelected(id);
    if (id) setSelectedVehicleId(id);
  };
  const [gzFilter,     setGzFilter]    = useState<'all' | 'Active' | 'Breached'>('all');
  const [evFilter,     setEvFilter]    = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [selectedGz,   setSelectedGz]  = useState<string | null>(null);
  const vehicles = useVehiclesStore(s => s.vehicles);

  function openTracking(pin: VehiclePin) {
    const master = sourceVehicles.find(v => v.plate === pin.id) ?? null;
    if (!master) return;
    router.push(`/vehicles/${master.id}?from=map`);
  }

  /* Scope vehicles: super_admin → all, vehicle_owner → owned only, else → tenant */
  const sourceVehicles = useMemo(() => {
    if (isSuperAdmin) return vehicles;
    if (isVehicleOwner) {
      const ids = user?.vehicleIds?.length ? user.vehicleIds : user?.vehicleId ? [user.vehicleId] : [];
      return vehicles.filter(v => ids.includes(v.id));
    }
    return vehicles.filter(v => v.tenantId === tenantId);
  }, [isSuperAdmin, isVehicleOwner, vehicles, tenantId, user?.vehicleId, user?.vehicleIds]);

  const allPins = useMemo(() =>
    sourceVehicles
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
  [sourceVehicles]);

  const shown: VehiclePin[] = useMemo(() => allPins.filter(v => {
    const matchStatus = filter === 'all' || v.status === filter;
    const matchTenant = !isSuperAdmin || tenantFilter === 'all' || v.tenantId === tenantFilter;
    return matchStatus && matchTenant;
  }), [allPins, filter, tenantFilter, isSuperAdmin]);

  const center = useMemo((): [number, number] => {
    if (!shown.length) return [-1.2921, 36.8219];
    return [
      shown.reduce((s, v) => s + v.lat, 0) / shown.length,
      shown.reduce((s, v) => s + v.lng, 0) / shown.length,
    ];
  }, [shown]);

  /* Use fitAll whenever there are multi-region vehicles (super admin all-tenant view
     or any tenant with GPS pins spread across different countries) */
  const useFitAll = shown.length > 1;

  /* Scope geofences & events to tenant */
  const scopedGeofences = useMemo(() =>
    isSuperAdmin
      ? (tenantFilter === 'all' ? MOCK_GEOFENCES : MOCK_GEOFENCES.filter(g => g.tenantId === tenantFilter))
      : MOCK_GEOFENCES.filter(g => g.tenantId === tenantId),
  [isSuperAdmin, tenantId, tenantFilter]);

  const filteredGeofences = useMemo(() =>
    gzFilter === 'all' ? scopedGeofences : scopedGeofences.filter(g => g.status === gzFilter),
  [scopedGeofences, gzFilter]);

  const scopedEvents = useMemo(() => {
    if (isSuperAdmin)
      return tenantFilter === 'all' ? MOCK_EVENTS : MOCK_EVENTS.filter(e => e.tenantId === tenantFilter);
    if (isVehicleOwner) {
      const ownerPlate = sourceVehicles[0]?.plate ?? '';
      return MOCK_EVENTS.filter(e => e.vehicle === ownerPlate);
    }
    return MOCK_EVENTS.filter(e => e.tenantId === tenantId);
  }, [isSuperAdmin, isVehicleOwner, tenantId, tenantFilter, sourceVehicles]);

  const filteredEvents = useMemo(() =>
    evFilter === 'all' ? scopedEvents : scopedEvents.filter(e => e.severity === evFilter),
  [scopedEvents, evFilter]);

  const breachedCount = scopedGeofences.filter(g => g.status === 'Breached').length;
  const criticalEvents = scopedEvents.filter(e => e.severity === 'critical').length;

  /* ── Panel tab bar ─────────────────────────────────────────────── */
  const tabs: MapPanelTab[] = ['Vehicles', 'Geofences', 'Events'];

  const activeCount  = shown.filter(p => p.status === 'active').length;
  const idleCount    = shown.filter(p => p.status === 'idle').length;
  const offlineCount = shown.filter(p => p.status === 'offline').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 54px)' }}>

      {/* ══ Header — same style as Live Dashboard ══════════════════════ */}
      <div style={{ padding: '10px 12px 10px', flexShrink: 0 }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        padding: '12px 16px', color: '#fff', borderRadius: 10,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
      }}>
        {/* Left: title + subtitle */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <i className="ti ti-map-2" style={{ fontSize: 20, color: '#f5d07a' }} />
            <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.5px' }}>Live Fleet Map</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(196,145,42,0.20)', border: '1px solid rgba(196,145,42,0.35)', color: '#f5d07a' }}>
              <span style={{ color: '#4ade80', fontSize: 8 }}>●</span> LIVE
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            Real-time GPS tracking · {shown.length} vehicle{shown.length !== 1 ? 's' : ''} · {new Date().toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Right: role badge + filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Role badge */}
          {isSuperAdmin
            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.20)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-eye" style={{ fontSize: 11 }} /> All Tenants
              </span>
            : isVehicleOwner
              ? <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-truck" style={{ fontSize: 11 }} /> My Vehicles
                </span>
              : <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-lock" style={{ fontSize: 11 }} /> {user?.tenantName ?? 'Tenant'}
                </span>
          }

          {/* Status counts */}
          {[
            { label: 'Active',  value: activeCount,  color: '#4ade80' },
            { label: 'Idle',    value: idleCount,    color: '#f5d07a' },
            { label: 'Offline', value: offlineCount, color: 'rgba(255,255,255,0.40)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(196,145,42,0.10)', border: '1px solid rgba(196,145,42,0.15)', textAlign: 'center', minWidth: 48 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      </div>{/* end header padding wrapper */}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div style={{
        width: panelOpen ? 270 : 44,
        flexShrink: 0,
        position: 'relative',
        background: '#fff',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>

      {/* ── Collapsed icon strip (shown when panel closed) ─────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 10, gap: 5,
        opacity: panelOpen ? 0 : 1,
        pointerEvents: panelOpen ? 'none' : 'auto',
        transition: 'opacity 0.15s',
      }}>
        {/* Expand */}
        <button
          onClick={() => setPanelOpen(true)}
          title="Expand panel"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#c4912a', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >›</button>

        <div style={{ width: 26, height: 1, background: 'var(--border)', margin: '3px 0' }} />

        {/* Tab icon buttons */}
        {(['Vehicles','Geofences','Events'] as MapPanelTab[]).map(t => {
          const icon  = t === 'Vehicles' ? '🚗' : t === 'Geofences' ? '📍' : '⚡';
          const badge = t === 'Geofences' ? breachedCount : t === 'Events' ? criticalEvents : 0;
          const active = panelTab === t;
          return (
            <button
              key={t}
              title={t}
              onClick={() => { setPanelTab(t); setPanelOpen(true); }}
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none',
                background: active ? 'rgba(196,145,42,0.12)' : 'transparent',
                cursor: 'pointer', position: 'relative', fontSize: 17,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {icon}
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: 3, right: 3,
                  width: 11, height: 11, borderRadius: '50%',
                  background: 'var(--red)', color: '#fff',
                  fontSize: 7, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{badge}</span>
              )}
            </button>
          );
        })}

        {/* Compact live counts */}
        <div style={{ marginTop: 'auto', paddingBottom: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR.active }}
            title={`${shown.filter(v=>v.status==='active').length} active`}>
            {shown.filter(v=>v.status==='active').length}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR.idle }}
            title={`${shown.filter(v=>v.status==='idle').length} idle`}>
            {shown.filter(v=>v.status==='idle').length}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR.offline }}
            title={`${shown.filter(v=>v.status==='offline').length} offline`}>
            {shown.filter(v=>v.status==='offline').length}
          </span>
        </div>
      </div>

      {/* ── Full panel content (shown when open) ───────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        width: 270,
        display: 'flex', flexDirection: 'column',
        opacity: panelOpen ? 1 : 0,
        pointerEvents: panelOpen ? 'auto' : 'none',
        transition: 'opacity 0.12s',
      }}>

        {/* Panel header */}
        <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Live map</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isSuperAdmin
                ? <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--amber-lt)', color: 'var(--amber)' }}>ALL TENANTS</span>
                : isVehicleOwner
                ? <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#dcfce7', color: '#166534' }}>🔒 MY VEHICLE</span>
                : <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(196,145,42,0.12)', color: '#c4912a' }}>🔒 TENANT ONLY</span>
              }
              <button
                onClick={() => setPanelOpen(false)}
                title="Collapse panel"
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--cream)',
                  color: 'var(--ink3)', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >‹</button>
            </div>
          </div>

          {isSuperAdmin && (
            <select value={tenantFilter} onChange={e => { setTenantFilter(e.target.value); setSelected(null); }}
              style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border2)', borderRadius: 6, fontSize: 11, color: 'var(--ink)', marginBottom: 8 }}>
              <option value="all">All tenants — {allPins.length} vehicles with GPS</option>
              {Object.entries(TENANTS_META).map(([tid, meta]) => {
                const cnt = allPins.filter(v => v.tenantId === tid).length;
                return <option key={tid} value={tid}>{meta.name} ({cnt} with GPS)</option>;
              })}
            </select>
          )}

          {/* Panel tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
            {tabs.map(t => {
              const badge = t === 'Geofences' ? breachedCount : t === 'Events' ? criticalEvents : 0;
              return (
                <button key={t} onClick={() => setPanelTab(t)} style={{
                  flex: 1, padding: '6px 4px', fontSize: 11, fontWeight: panelTab === t ? 600 : 400,
                  color: panelTab === t ? '#c4912a' : 'var(--ink3)',
                  border: 'none', borderBottom: `2px solid ${panelTab === t ? '#c4912a' : 'transparent'}`,
                  background: 'transparent', cursor: 'pointer', marginBottom: -1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  {t}
                  {badge > 0 && (
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 8, background: 'var(--red-lt)', color: 'var(--red)' }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Vehicles panel ──────────────────────────────────────── */}
        {panelTab === 'Vehicles' && (
          <>
            <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                {FILTER_OPTS.map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, cursor: 'pointer', border: '1px solid var(--border)', background: filter === f ? '#c4912a' : 'var(--cream)', color: filter === f ? '#fff' : 'var(--ink2)', textTransform: 'capitalize' }}>
                    {f}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 10 }}>
                <span style={{ color: STATUS_COLOR.active  }}>● {shown.filter(v => v.status === 'active').length} active</span>
                <span style={{ color: STATUS_COLOR.idle    }}>● {shown.filter(v => v.status === 'idle').length} idle</span>
                <span style={{ color: STATUS_COLOR.offline }}>● {shown.filter(v => v.status === 'offline').length} offline</span>
              </div>
              {!isSuperAdmin && (
                <div style={{ marginTop: 6, padding: '4px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                  background: isVehicleOwner ? '#dcfce7' : 'rgba(196,145,42,0.12)',
                  color:      isVehicleOwner ? '#166534' : '#c4912a',
                }}>
                  🔒 {isVehicleOwner ? `My vehicle — ${sourceVehicles[0]?.plate ?? ''}` : `Scoped to ${user?.tenantName ?? 'your tenant'}`}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {shown.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink3)', fontSize: 12 }}>No vehicles match your filters</div>
              )}
              {shown.map(v => (
                <div key={v.id}
                  onClick={() => selectVehicle(v.id === selected ? null : v.id)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selected === v.id ? 'rgba(196,145,42,0.12)' : 'transparent', transition: 'background 0.1s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[v.status], display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 12, color: selected === v.id ? '#c4912a' : 'var(--ink)', flex: 1, letterSpacing: 0.5 }}>{v.id}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: v.status === 'active' ? 'rgba(196,145,42,0.12)' : v.status === 'idle' ? 'var(--amber-lt)' : 'var(--cream3)', color: v.status === 'active' ? '#c4912a' : v.status === 'idle' ? 'var(--amber)' : 'var(--ink3)' }}>
                      {v.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 16, marginBottom: 2 }}>{v.driver}</div>
                  {v.status === 'active' && v.speed > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 16 }}>{v.speed} km/h · ⛽ {v.fuel}%</div>
                  )}
                  {isSuperAdmin && v.tenantId && <div style={{ marginLeft: 16, marginTop: 4 }}><TenantDot tenantId={v.tenantId} /></div>}
                  {/* Live tracking shortcut */}
                  <button
                    onClick={e => { e.stopPropagation(); openTracking(v); }}
                    style={{
                      marginTop: 6, marginLeft: 16, padding: '3px 9px', fontSize: 10, fontWeight: 600,
                      borderRadius: 5, border: '1px solid #c4912a', background: 'rgba(196,145,42,0.12)',
                      color: '#c4912a', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    📍 Live Tracking
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Geofences panel ─────────────────────────────────────── */}
        {panelTab === 'Geofences' && (
          <>
            <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['all', 'Active', 'Breached'] as const).map(f => (
                  <button key={f} onClick={() => setGzFilter(f)}
                    style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, cursor: 'pointer', border: '1px solid var(--border)', background: gzFilter === f ? '#c4912a' : 'var(--cream)', color: gzFilter === f ? '#fff' : 'var(--ink2)', textTransform: 'capitalize', fontFamily: 'inherit' }}>
                    {f}
                  </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink3)', alignSelf: 'center' }}>{filteredGeofences.length} zones</span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredGeofences.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink3)', fontSize: 12 }}>No geofences match filter</div>
              ) : filteredGeofences.map(gz => {
                const isSelected = selectedGz === gz.id;
                return (
                  <div
                    key={gz.id}
                    onClick={() => setSelectedGz(isSelected ? null : gz.id)}
                    style={{
                      padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      background: isSelected ? 'rgba(196,145,42,0.12)' : gz.status === 'Breached' ? '#fff9f9' : '#fff',
                      borderLeft: isSelected ? '3px solid #c4912a' : '3px solid transparent',
                      transition: 'background 0.12s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{gz.status === 'Breached' ? '🚨' : '📍'}</span>
                      <span style={{ fontWeight: 600, fontSize: 12, color: isSelected ? '#c4912a' : 'var(--ink)', flex: 1 }}>{gz.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, ...GZ_STATUS[gz.status] }}>{gz.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink3)', display: 'flex', gap: 10, marginLeft: 20 }}>
                      <span>{gz.shape}{gz.radius !== '—' ? ` · ${gz.radius}` : ''}</span>
                      <span>🚗 {gz.vehicles} vehicles</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginLeft: 20, marginTop: 2 }}>Trigger: {gz.trigger}</div>
                    {isSuperAdmin && <div style={{ marginLeft: 20, marginTop: 4 }}><TenantDot tenantId={gz.tenantId} /></div>}

                    {/* Expanded detail */}
                    {isSelected && (
                      <div style={{ marginTop: 10, marginLeft: 20, padding: '8px 10px', background: 'rgba(0,128,128,0.06)', borderRadius: 6, borderTop: '1px solid #c4912a20' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: 10, marginBottom: 8 }}>
                          <span style={{ color: 'var(--ink3)' }}>Shape</span>
                          <strong style={{ color: 'var(--ink)' }}>{gz.shape}</strong>
                          {gz.radius !== '—' && <><span style={{ color: 'var(--ink3)' }}>Radius</span><strong style={{ color: 'var(--ink)' }}>{gz.radius}</strong></>}
                          <span style={{ color: 'var(--ink3)' }}>Trigger</span>
                          <strong style={{ color: 'var(--ink)' }}>{gz.trigger}</strong>
                          <span style={{ color: 'var(--ink3)' }}>Vehicles</span>
                          <strong style={{ color: gz.vehicles > 0 ? '#c4912a' : 'var(--ink3)' }}>{gz.vehicles} inside</strong>
                        </div>
                        <a
                          href="/geofences"
                          onClick={e => { e.stopPropagation(); router.push('/geofences'); }}
                          style={{ fontSize: 10, fontWeight: 600, color: '#c4912a', textDecoration: 'none', display: 'inline-block' }}
                        >
                          Manage geofences →
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Events panel ────────────────────────────────────────── */}
        {panelTab === 'Events' && (
          <>
            <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['all', 'critical', 'warning', 'info'] as const).map(f => (
                  <button key={f} onClick={() => setEvFilter(f)}
                    style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, cursor: 'pointer', border: '1px solid var(--border)', background: evFilter === f ? '#c4912a' : 'var(--cream)', color: evFilter === f ? '#fff' : 'var(--ink2)', textTransform: 'capitalize', fontFamily: 'inherit' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredEvents.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink3)', fontSize: 12 }}>No events for selected filter</div>
              ) : filteredEvents.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => router.push(`/alerts?vehicle=${encodeURIComponent(ev.vehicle)}`)}
                  style={{
                    padding: '10px 14px', borderBottom: '1px solid var(--border)',
                    background: EV_BG[ev.severity], cursor: 'pointer',
                    borderLeft: `3px solid ${EV_COLOR[ev.severity]}`,
                    transition: 'filter 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = 'brightness(0.97)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: EV_COLOR[ev.severity], display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--ink)', flex: 1 }}>{ev.type}</span>
                    <span style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'monospace' }}>{ev.time}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginLeft: 12, marginBottom: 2 }}>{ev.vehicle}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 12 }}>{ev.msg}</div>
                  {isSuperAdmin && <div style={{ marginLeft: 12, marginTop: 4 }}><TenantDot tenantId={ev.tenantId} /></div>}
                  <div style={{ marginLeft: 12, marginTop: 4, fontSize: 9, color: EV_COLOR[ev.severity], fontWeight: 700 }}>
                    Handle alert →
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Legend + count */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 5 }}>
            {Object.entries(STATUS_COLOR).map(([s, c]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--ink2)', textTransform: 'capitalize' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                {s}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: 'var(--ink3)' }}>
            {shown.length} of {allPins.length} vehicle{allPins.length !== 1 ? 's' : ''} have live GPS
          </div>
        </div>
      </div>{/* end full-panel inner wrapper */}
      </div>{/* end outer collapsible panel */}

      {/* ── Map ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {shown.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f4f0', gap: 12 }}>
            <div style={{ fontSize: 40 }}>🗺️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>No vehicles to display</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Adjust filters or check that vehicles have active GPS</div>
          </div>
        ) : (
          <FleetMap
            vehicles={shown}
            height="100%"
            zoom={isSuperAdmin && tenantFilter === 'all' ? 4 : 11}
            center={center}
            fitAll={useFitAll}
            selectedId={selected}
            onSelectId={selectVehicle}
            onPinClick={openTracking}
          />
        )}
      </div>
      </div>{/* end flex:1 row wrapper */}
    </div>
  );
}
