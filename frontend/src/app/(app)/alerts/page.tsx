'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSearchParams } from 'next/navigation';
import { FleetMap, VehiclePin, STATUS_COLOR } from '@/components/maps/FleetMap';
import { TENANTS_META } from '@/lib/vehiclesMaster';
import { Customer } from '@/lib/customers';
import { useAuthStore } from '@/store/authStore';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useCustomersStore } from '@/store/customersStore';
import { getSubscription, computeSubStatus } from '@/lib/subscriptions';
import { api } from '@/lib/api';

/* ── Severity / status style maps ──────────────────────────────────── */
const SEV_STYLE: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  Critical: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
  Warning:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' },
  Info:     { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' },
};
const STA_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Active:       { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  Acknowledged: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  Closed:       { bg: 'rgba(196,145,42,0.12)', color: '#c4912a', border: '#c4912a' },
};
const SEV_BAR: Record<string, string> = {
  Critical: '#ef4444', Warning: '#f59e0b', Info: '#3b82f6',
};

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface OperatorResponse { text: string; operator: string; recordedAt: string; }
interface CmdEntry { id: string; text: string; sentAt: string; status: 'sending' | 'ack' | 'failed'; }
interface Alert {
  id: string; severity: string; type: string; vehicle: string;
  driver: string; location: string; time: string; status: string;
  response?: OperatorResponse;
}
interface SecurityConfig {
  pin: string;
  questions: { q: string; a: string }[];
  notes: string;
  updatedAt: string;
  updatedBy: string;
}

const PRESET_CMDS = [
  { key: 'REQ_LOC',    label: 'Request Location', danger: false },
  { key: 'HORN',       label: 'Horn',             danger: false },
  { key: 'MSG_DRIVER', label: 'Msg Driver',       danger: false },
  { key: 'RESTART',    label: 'Restart Device',   danger: false },
  { key: 'DOOR_LOCK',  label: 'Lock Doors',       danger: false },
  { key: 'ENGINE_CUT', label: 'Cut Engine',       danger: true  },
] as const;

/* Maps a raw DB row to the Alert UI shape */
function rowToAlert(row: Record<string, unknown>): Alert {
  const sev = String(row.severity ?? '');
  const severityMap: Record<string, string> = {
    critical: 'Critical', warning: 'Warning', info: 'Info',
  };
  const typeMap: Record<string, string> = {
    geofence_breach: 'Geofence breach', low_fuel: 'Low fuel',
    speeding: 'Speed violation', hos_violation: 'Driver HOS limit',
    obd_fault: 'OBD fault', unauthorized_use: 'Unauthorized use',
  };
  const rawStatus = String(row.status ?? 'Active');
  const status = rawStatus === 'Acknowledged' ? 'Acknowledged'
    : rawStatus === 'Closed' ? 'Closed' : 'Active';

  const occurred = row.occurredAt ? new Date(row.occurredAt as string) : new Date();
  const diffMs   = Date.now() - occurred.getTime();
  const diffMin  = Math.round(diffMs / 60000);
  const timeLabel =
    diffMin < 2  ? 'just now'
    : diffMin < 60 ? `${diffMin} min ago`
    : diffMin < 1440 ? `${Math.round(diffMin / 60)} hr ago`
    : `${Math.round(diffMin / 1440)} d ago`;

  const response = row.operatorResponse
    ? {
        text:       String(row.operatorResponse),
        operator:   String(row.operatorName ?? 'Operator'),
        recordedAt: row.closedAt
          ? new Date(row.closedAt as string).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
          : '',
      }
    : undefined;

  return {
    id:       String(row.id),
    severity: severityMap[sev] ?? sev,
    type:     typeMap[String(row.type ?? '')] ?? String(row.type ?? 'Alert'),
    vehicle:  String(row.vehiclePlate ?? '—'),
    driver:   String(row.driverName ?? 'Unknown driver'),
    location: String(row.latitude && row.longitude
      ? `${Number(row.latitude).toFixed(4)}, ${Number(row.longitude).toFixed(4)}`
      : (row.description ?? '—')),
    time:     timeLabel,
    status,
    response,
  };
}

const TABS = [
  { id: 'All',          label: 'All' },
  { id: 'Active',       label: 'Active' },
  { id: 'Acknowledged', label: 'Acknowledged' },
  { id: 'Closed',       label: 'Closed' },
  { id: 'Critical',     label: 'Critical' },
  { id: 'Warning',      label: 'Warning' },
  { id: 'Info',         label: 'Info' },
];

function loadSecurity(vehicleId: string): SecurityConfig | null {
  try {
    const raw = localStorage.getItem(`fleetSec_${vehicleId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* ── Icon helpers ────────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default function AlertsPage() {
  const isMobile = useIsMobile();
  const { user }     = useAuthStore();
  const searchParams = useSearchParams();
  const vehicles     = useVehiclesStore(s => s.vehicles);
  const customers    = useCustomersStore(s => s.customers);

  const role         = user?.role ?? 'viewer';
  const isSuperAdmin = role === 'super_admin' || role === 'platform_admin';

  const allowedPlates = useMemo(() => {
    if (isSuperAdmin) return null;
    const userVehicleIds = [
      ...(user?.restrictedVehicleIds ?? []),
      ...((user?.restrictedVehicleIds?.length ?? 0) === 0 ? (user?.vehicleIds ?? []) : []),
    ];
    if (userVehicleIds.length > 0)
      return new Set(vehicles.filter(v => userVehicleIds.includes(v.id)).map(v => v.plate));
    const tid = user?.tenantId;
    if (!tid) return new Set<string>();
    return new Set(vehicles.filter(v => v.tenantId === tid).map(v => v.plate));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, isSuperAdmin, user]);

  function customerFromPlate(plate: string): Customer | null {
    const v = vehicles.find(x => x.plate === plate);
    if (!v?.customerId) return null;
    return customers.find(c => c.id === v.customerId) ?? null;
  }

  function pinFromPlate(plate: string): VehiclePin | null {
    const v = vehicles.find(x => x.plate === plate);
    if (!v || v.latitude === null || v.longitude === null) return null;
    const status: 'active' | 'idle' | 'offline' =
      v.status === 'active' ? 'active' : v.status === 'idle' ? 'idle' : 'offline';
    return {
      id: v.plate, driver: v.driverName ?? 'No driver', status,
      speed: v.speedKmh ?? 0, lat: v.latitude, lng: v.longitude,
      fuel: v.fuelLevel, tenantId: v.tenantId,
      make: v.make, model: v.model, year: v.year, category: v.category,
      customerName: v.customerName ?? undefined, odometer: v.odometer,
      tenantName: TENANTS_META[v.tenantId]?.name,
    };
  }

  /* ── State ─────────────────────────────────────────────────────────── */
  const [filter, setFilter]         = useState('All');
  const [search, setSearch]         = useState('');
  const [rows, setRows]             = useState<Alert[]>([]);
  const [loading, setLoading]       = useState(true);
  const [mapAlert, setMapAlert]     = useState<Alert | null>(null);
  const [draft, setDraft]           = useState('');
  const [livePin, setLivePin]       = useState<VehiclePin | null>(null);
  const [trail, setTrail]           = useState<[number, number][]>([]);
  const headingRef                  = useRef<number>(0);
  const [cmdLog, setCmdLog]         = useState<CmdEntry[]>([]);
  const [customCmd, setCustomCmd]   = useState('');
  const [cutConfirm, setCutConfirm] = useState(false);
  const [secInfo, setSecInfo]       = useState<SecurityConfig | null>(null);
  const [showPin, setShowPin]       = useState(false);
  const [showAns, setShowAns]       = useState(false);

  /* ── Scoped & filtered rows ─────────────────────────────────────────── */
  const scopedRows = useMemo(
    () => allowedPlates === null ? rows : rows.filter(r => allowedPlates.has(r.vehicle)),
    [rows, allowedPlates],
  );

  const shown = useMemo(() => {
    let base = filter === 'All'
      ? scopedRows
      : scopedRows.filter(r => r.status === filter || r.severity === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(r =>
        r.type.toLowerCase().includes(q) ||
        r.vehicle.toLowerCase().includes(q) ||
        r.driver.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q),
      );
    }
    return base;
  }, [scopedRows, filter, search]);

  function tabCount(id: string) {
    if (id === 'All') return scopedRows.length;
    return scopedRows.filter(r => r.status === id || r.severity === id).length;
  }

  /* ── KPI counts ─────────────────────────────────────────────────────── */
  const totalActive    = scopedRows.filter(r => r.status === 'Active').length;
  const criticalActive = scopedRows.filter(r => r.severity === 'Critical' && r.status === 'Active').length;
  const warningActive  = scopedRows.filter(r => r.severity === 'Warning'  && r.status === 'Active').length;
  const ackCount       = scopedRows.filter(r => r.status === 'Acknowledged').length;

  /* ── Actions ────────────────────────────────────────────────────────── */
  function ack(id: string) {
    setRows(p => p.map(r => r.id === id ? { ...r, status: 'Acknowledged' } : r));
    api.alerts.updateStatus(id, 'Acknowledged').catch(() => {
      // Revert optimistic update on failure
      setRows(p => p.map(r => r.id === id ? { ...r, status: 'Active' } : r));
    });
  }

  function openModal(alert: Alert) {
    const pin = pinFromPlate(alert.vehicle);
    const v   = vehicles.find(x => x.plate === alert.vehicle);
    setMapAlert(alert);
    setLivePin(pin);
    setTrail(pin ? [[pin.lat, pin.lng]] : []);
    headingRef.current = Math.random() * Math.PI * 2;
    setDraft(alert.response?.text ?? '');
    setSecInfo(v ? loadSecurity(v.id) : null);
    setShowPin(false);
    setShowAns(false);
  }

  function closeModal() {
    setMapAlert(null); setLivePin(null); setTrail([]);
    setDraft(''); setCmdLog([]); setCustomCmd(''); setCutConfirm(false);
    setSecInfo(null); setShowPin(false); setShowAns(false);
  }

  function dispatchCommand(text: string) {
    const entry: CmdEntry = {
      id: Date.now().toString(), text,
      sentAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'sending',
    };
    setCmdLog(prev => [entry, ...prev.slice(0, 14)]);
    setCutConfirm(false);
    const ok = Math.random() > 0.12;
    setTimeout(() => {
      setCmdLog(prev => prev.map(c => c.id === entry.id ? { ...c, status: ok ? 'ack' : 'failed' } : c));
    }, 700 + Math.random() * 1100);
  }

  function handlePreset(cmd: typeof PRESET_CMDS[number]) {
    if (cmd.danger && !cutConfirm) { setCutConfirm(true); return; }
    dispatchCommand(cmd.label);
  }

  function handleCustomSend() {
    if (!customCmd.trim()) return;
    dispatchCommand(customCmd.trim());
    setCustomCmd('');
  }

  /* ── Load alerts from DB ─────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const tid = user.tenantId ?? undefined;
    setLoading(true);
    api.alerts.list(tid ? { tenantId: tid } : undefined)
      .then(data => setRows((data as Record<string, unknown>[]).map(rowToAlert)))
      .catch(() => { /* DB unavailable — keep empty list */ })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenantId]);

  useEffect(() => {
    if (loading) return;
    const plate = searchParams.get('vehicle');
    if (!plate || mapAlert) return;
    const alert = rows.find(r => r.vehicle === plate && r.status !== 'Closed');
    if (alert && pinFromPlate(alert.vehicle)) openModal(alert);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (!mapAlert) return;
    const id = setInterval(() => {
      headingRef.current += (Math.random() - 0.5) * 0.55;
      const step = 0.00020 + Math.random() * 0.00015;
      setLivePin(prev => {
        if (!prev) return prev;
        const newLat = prev.lat + Math.cos(headingRef.current) * step;
        const newLng = prev.lng + Math.sin(headingRef.current) * step;
        setTrail(t => [...t.slice(-49), [newLat, newLng] as [number, number]]);
        return { ...prev, lat: newLat, lng: newLng, speed: Math.round(18 + Math.random() * 62) };
      });
    }, 2500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapAlert?.id]);

  function recordResponse() {
    if (!mapAlert || !draft.trim()) return;
    const operatorName = user?.fullName ?? 'Operator';
    const response: OperatorResponse = {
      text: draft.trim(),
      operator: operatorName,
      recordedAt: new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }),
    };
    const updated = { ...mapAlert, status: 'Closed', response };
    setRows(p => p.map(r => r.id === mapAlert.id ? updated : r));
    setMapAlert(updated);
    api.alerts.updateStatus(mapAlert.id, 'Closed', draft.trim(), operatorName).catch(() => {
      // Non-fatal — local state already reflects the change; warn in console
      console.warn('[alerts] Failed to persist response to DB for alert', mapAlert.id);
    });
  }

  /* ── Modal derived data ──────────────────────────────────────────────── */
  const mapCustomer    = mapAlert ? customerFromPlate(mapAlert.vehicle) : null;
  const primaryContact = mapCustomer?.contacts?.find(c => c.primary) ?? mapCustomer?.contacts?.[0] ?? null;
  const alertVehicle   = mapAlert ? vehicles.find(v => v.plate === mapAlert.vehicle) : null;
  const alertSub       = alertVehicle ? getSubscription(alertVehicle.id) : null;
  const alertSubStatus = alertSub ? computeSubStatus(alertSub) : null;
  const mapIsLocked    = alertSubStatus === 'Expired' || alertSubStatus === 'Suspended';

  /* ── Badge helpers ───────────────────────────────────────────────────── */
  function SevChip({ sev }: { sev: string }) {
    const s = SEV_STYLE[sev] ?? { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', dot: '#94a3b8' };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700,
        padding: '3px 8px', borderRadius: 4, background: s.bg, color: s.color,
        border: `1px solid ${s.border}`, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
        {sev}
      </span>
    );
  }

  function StaChip({ sta }: { sta: string }) {
    const s = STA_STYLE[sta] ?? { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700,
        padding: '3px 8px', borderRadius: 4, background: s.bg, color: s.color,
        border: `1px solid ${s.border}`, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {sta}
      </span>
    );
  }

  const scopeChip = !isSuperAdmin ? (() => {
    const isUserScoped = (user?.restrictedVehicleIds?.length ?? 0) > 0 || (user?.vehicleIds?.length ?? 0) > 0;
    return (
      <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 11px', borderRadius: 4,
        background: 'rgba(196,145,42,0.12)', color: '#c4912a', border: '1px solid #c4912a' }}>
        {isUserScoped
          ? `${allowedPlates?.size ?? 0} vehicle${(allowedPlates?.size ?? 0) !== 1 ? 's' : ''} scoped`
          : (user?.tenantName ?? 'Your tenant') + ' only'}
      </span>
    );
  })() : null;

  return (
    <div style={{ padding: '14px 18px' }}>
      <style>{`
        @keyframes _livepulse{0%,100%{opacity:1}50%{opacity:0.15}}
        ._livepulse{animation:_livepulse 1.4s ease-in-out infinite;}
        ._tab:hover:not(._tabactive){background:var(--cream)!important;color:var(--ink)!important;}
        ._alert-row:hover td { background: #f8fafc !important; }
        ._alert-row.clickable { cursor: pointer; }
        ._ackbtn:hover { background: #c4912a !important; color: #fff !important; border-color: #c4912a !important; }
        ._viewbtn:hover { background: #0f172a !important; color: #fff !important; }
        ._cmdbtn:hover:not([disabled]){filter:brightness(0.94);}
        ._closebtn:hover{background:var(--cream2)!important;}
        .alert-search:focus { border-color: #c4912a !important; box-shadow: 0 0 0 3px rgba(196,145,42,0.12); outline: none; }
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 14,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-bell-ringing" style={{ fontSize: 19, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Real-time Ops</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Alerts</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: 'Total Active', value: totalActive,    icon: 'ti-bell' },
            { label: 'Critical',     value: criticalActive, icon: 'ti-alert-triangle' },
            { label: 'Warning',      value: warningActive,  icon: 'ti-alert-circle' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '0 14px', borderLeft: '1px solid rgba(196,145,42,0.20)' }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 12, color: 'rgba(245,208,122,0.55)', display: 'block', marginBottom: 2 }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
          {scopeChip && <div style={{ paddingLeft: 14, borderLeft: '1px solid rgba(196,145,42,0.20)', display: 'flex', alignItems: 'center' }}>{scopeChip}</div>}
        </div>
      </div>

      {/* ── KPI summary bar ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 12, marginBottom: 24 }}>
        {[
          {
            label: 'Active alerts', count: totalActive,
            barColor: '#ef4444', numColor: '#b91c1c',
            bg: totalActive > 0 ? '#fef2f2' : '#fff',
            icon: (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            ),
          },
          {
            label: 'Critical', count: criticalActive,
            barColor: '#ef4444', numColor: '#b91c1c',
            bg: criticalActive > 0 ? '#fef2f2' : '#fff',
            icon: (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            ),
          },
          {
            label: 'Warning', count: warningActive,
            barColor: '#f59e0b', numColor: '#b45309',
            bg: warningActive > 0 ? '#fffbeb' : '#fff',
            icon: (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            ),
          },
          {
            label: 'Acknowledged', count: ackCount,
            barColor: '#94a3b8', numColor: '#475569',
            bg: '#fff',
            icon: (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            ),
          },
        ].map(({ label, count, barColor, numColor, bg, icon }) => (
          <div key={label} style={{
            background: bg, borderRadius: 10, padding: '16px 20px',
            border: '1px solid var(--border)', borderLeft: `4px solid ${barColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'box-shadow 0.12s',
          }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: numColor, letterSpacing: -1.5, lineHeight: 1 }}>
                {count}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 600, marginTop: 5,
                textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                {label}
              </div>
            </div>
            <div style={{ opacity: 0.7 }}>{icon}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar: tabs + search ────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#fff', border: '1px solid var(--border)', borderBottom: '2px solid var(--border)',
        borderRadius: '10px 10px 0 0', padding: '0 12px 0 4px',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
          {TABS.map(tab => {
            const count  = tabCount(tab.id);
            const active = filter === tab.id;
            const isSev  = tab.id === 'Critical' || tab.id === 'Warning' || tab.id === 'Info';
            const accentColor    = isSev ? (SEV_STYLE[tab.id]?.color ?? '#c4912a') : '#c4912a';
            const underlineColor = isSev ? (SEV_BAR[tab.id] ?? '#c4912a') : '#c4912a';
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`_tab${active ? ' _tabactive' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '11px 14px', fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? accentColor : 'var(--ink3)',
                  background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${active ? underlineColor : 'transparent'}`,
                  marginBottom: -2, cursor: 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                  transition: 'color 0.12s, background 0.12s',
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, minWidth: 18, height: 17,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 5px', borderRadius: 8, lineHeight: 1,
                    background: active
                      ? (isSev ? SEV_BAR[tab.id] ?? '#c4912a' : '#c4912a')
                      : 'var(--cream3)',
                    color: active ? '#fff' : 'var(--ink3)',
                    transition: 'background 0.12s',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 0',
          borderLeft: '1px solid var(--border)', paddingLeft: 12, flexShrink: 0 }}>
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}><SearchIcon /></span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search alerts…"
            className="alert-search"
            style={{
              border: '1.5px solid var(--border)', borderRadius: 6,
              padding: '5px 10px', fontSize: 12, width: 180,
              fontFamily: 'inherit', color: 'var(--ink)', background: '#fff',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink3)', fontSize: 14, lineHeight: 1, padding: '0 2px',
            }}>×</button>
          )}
        </div>
      </div>

      {/* ── Alert table ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderTop: 'none',
        borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--cream)' }}>
              {/* severity bar */}
              <th style={{ width: 4, padding: 0 }} />
              {[
                { label: 'Severity & alert', w: '22%' },
                { label: 'Vehicle & driver', w: '18%' },
                { label: 'Location & time',  w: '18%' },
                { label: 'Status',           w: '14%' },
                { label: 'Operator note',    w: '18%' },
                { label: '',                 w: '10%' },
              ].map(({ label, w }) => (
                <th key={label} style={{
                  padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
                  color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1.1,
                  borderBottom: '1px solid var(--border)', width: w,
                }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '48px 24px', gap: 10, color: 'var(--ink3)', fontSize: 13 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth={2} strokeLinecap="round" style={{ animation: 'spin 0.9s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Loading alerts…
                  </div>
                </td>
              </tr>
            )}
            {!loading && shown.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '56px 24px', gap: 12, color: 'var(--ink3)' }}>
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink2)' }}>
                      {search ? 'No alerts match your search' : 'No alerts in this view'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                      {search
                        ? 'Try different keywords or clear the search filter.'
                        : rows.length === 0
                          ? 'No alerts found in the database.'
                          : 'All clear — no alerts match this filter.'}
                    </div>
                    {search && (
                      <button onClick={() => setSearch('')} style={{ marginTop: 4, fontSize: 12, fontWeight: 600,
                        color: '#c4912a', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {shown.map((r, i) => {
              const hasGps = !!pinFromPlate(r.vehicle);
              const isLast = i === shown.length - 1;
              const rowBorder = isLast ? 'none' : '1px solid var(--border)';

              return (
                <tr
                  key={r.id}
                  className={`_alert-row${hasGps ? ' clickable' : ''}`}
                  onClick={() => hasGps && openModal(r)}
                >
                  {/* Severity bar */}
                  <td style={{ padding: 0, width: 4, borderBottom: rowBorder,
                    background: SEV_BAR[r.severity] ?? 'transparent' }} />

                  {/* Severity chip + Alert type */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', borderBottom: rowBorder }}>
                    <div style={{ marginBottom: 7 }}>
                      <SevChip sev={r.severity} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', lineHeight: 1.3 }}>
                      {r.type}
                    </div>
                  </td>

                  {/* Vehicle + Driver */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', borderBottom: rowBorder }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#c4912a', letterSpacing: 0.3 }}>
                        {r.vehicle}
                      </span>
                      {hasGps && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#059669',
                          background: '#ecfdf5', padding: '1px 5px', borderRadius: 3,
                          border: '1px solid #6ee7b7', flexShrink: 0 }}>
                          GPS
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{r.driver}</div>
                  </td>

                  {/* Location + Time */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', borderBottom: rowBorder }}>
                    <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 6, fontWeight: 500 }}>
                      {r.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{r.time}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', borderBottom: rowBorder }}>
                    <StaChip sta={r.status} />
                    {hasGps && r.status !== 'Closed' && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={e => { e.stopPropagation(); openModal(r); }}
                          className="_viewbtn"
                          style={{
                            padding: '4px 10px', fontSize: 10, fontWeight: 600, borderRadius: 5,
                            cursor: 'pointer', fontFamily: 'inherit',
                            border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0',
                            whiteSpace: 'nowrap', transition: 'all 0.12s',
                          }}
                        >
                          View on map
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Operator note */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', borderBottom: rowBorder }}>
                    {r.response ? (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          "{r.response.text}"
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 4 }}>
                          {r.response.operator} · {r.response.recordedAt}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--border2)' }}>—</span>
                    )}
                  </td>

                  {/* Acknowledge action */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', borderBottom: rowBorder }}
                    onClick={e => e.stopPropagation()}>
                    {r.status === 'Active' && (
                      <button
                        onClick={() => ack(r.id)}
                        className="_ackbtn"
                        style={{
                          padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 6,
                          cursor: 'pointer', border: '1.5px solid #c4912a',
                          background: 'rgba(196,145,42,0.12)', color: '#c4912a',
                          fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.14s',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <svg width="11" height="11" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Table footer */}
        {shown.length > 0 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--cream)', borderRadius: '0 0 10px 10px' }}>
            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
              Showing {shown.length} of {scopedRows.length} alert{scopedRows.length !== 1 ? 's' : ''}
              {search && ` · filtered by "${search}"`}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
              Last updated: just now
            </span>
          </div>
        )}
      </div>

      {/* ── Alert detail modal ────────────────────────────────────────── */}
      {mapAlert && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12,
              width: 'min(1100px, 96vw)', height: 'min(700px, 92vh)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.24), 0 0 0 1px rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              borderTop: `3px solid ${SEV_BAR[mapAlert.severity] ?? '#c4912a'}`,
              padding: '13px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0, background: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <SevChip sev={mapAlert.severity} />
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', letterSpacing: -0.2 }}>{mapAlert.type}</span>
                <span style={{ fontSize: 13, color: 'var(--ink3)', fontWeight: 500 }}>{mapAlert.vehicle}</span>
                <StaChip sta={mapAlert.status} />
                {livePin && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700,
                    color: '#059669', background: '#ecfdf5', padding: '3px 9px', borderRadius: 4, border: '1px solid #6ee7b7' }}>
                    <span className="_livepulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    LIVE
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{mapAlert.location} · {mapAlert.time}</span>
                <button onClick={closeModal} className="_closebtn"
                  style={{ padding: '5px 13px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                    border: '1px solid var(--border)', background: '#fff', color: 'var(--ink2)',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}>
                  Close
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

              {/* Left panel */}
              <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* Vehicle telemetry */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                  <SectionLabel>Vehicle telemetry</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    <Row label="Driver" value={<strong style={{ color: 'var(--ink)' }}>{mapAlert.driver}</strong>} />
                    {livePin && <>
                      <Row label="Speed" value={
                        <strong style={{ color: livePin.speed > 0 ? '#c4912a' : 'var(--ink3)' }}>
                          {livePin.speed > 0 ? `${livePin.speed} km/h` : 'Stopped'}
                        </strong>
                      } />
                      <Row label="Fuel" value={
                        <strong style={{ color: livePin.fuel > 50 ? '#c4912a' : livePin.fuel > 20 ? 'var(--amber)' : 'var(--red)' }}>
                          {livePin.fuel}%
                        </strong>
                      } />
                      <Row label="Status" value={
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[livePin.status] }} />
                          <strong style={{ textTransform: 'capitalize', color: 'var(--ink)' }}>{livePin.status}</strong>
                        </span>
                      } />
                      <Row label="Coords" value={
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--ink3)' }}>
                          {livePin.lat.toFixed(4)}, {livePin.lng.toFixed(4)}
                        </span>
                      } />
                    </>}
                  </div>
                </div>

                {/* Customer */}
                {mapCustomer && (
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                    <SectionLabel>Customer</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                      <strong style={{ color: 'var(--ink)', fontSize: 13 }}>{mapCustomer.name}</strong>
                      {mapCustomer.phone && (
                        <a href={`tel:${mapCustomer.phone}`} style={{ color: '#c4912a', textDecoration: 'none' }}>
                          {mapCustomer.phone}
                        </a>
                      )}
                      {mapCustomer.email && (
                        <a href={`mailto:${mapCustomer.email}`} style={{ color: '#c4912a', textDecoration: 'none',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {mapCustomer.email}
                        </a>
                      )}
                      {primaryContact && (
                        <div style={{ paddingTop: 6, borderTop: '1px solid var(--border)', marginTop: 2 }}>
                          <div style={{ color: 'var(--ink2)', marginBottom: 3 }}>
                            {primaryContact.name}{primaryContact.title ? ` · ${primaryContact.title}` : ''}
                          </div>
                          {primaryContact.phone && (
                            <a href={`tel:${primaryContact.phone}`} style={{ color: '#c4912a', textDecoration: 'none' }}>
                              {primaryContact.phone}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Device commands */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                  <SectionLabel>Device commands</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    {PRESET_CMDS.map(cmd => {
                      const awaiting = cmd.danger && cutConfirm;
                      return (
                        <button key={cmd.key} onClick={() => handlePreset(cmd)} className="_cmdbtn"
                          style={{ padding: '4px 10px', fontSize: 11, borderRadius: 5, cursor: 'pointer',
                            fontFamily: 'inherit', fontWeight: awaiting ? 700 : 500,
                            border: cmd.danger ? `1.5px solid ${awaiting ? '#dc2626' : '#fca5a5'}` : '1px solid var(--border)',
                            background: awaiting ? '#fef2f2' : cmd.danger ? '#fff5f5' : '#fff',
                            color: cmd.danger ? '#b91c1c' : 'var(--ink2)', transition: 'all 0.12s' }}>
                          {awaiting ? 'Confirm?' : cmd.label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginBottom: cmdLog.length > 0 ? 8 : 0 }}>
                    <input value={customCmd} onChange={e => setCustomCmd(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCustomSend()} placeholder="Custom command…"
                      style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 5,
                        fontSize: 11, fontFamily: 'monospace', outline: 'none', background: '#fff', minWidth: 0 }} />
                    <button onClick={handleCustomSend} disabled={!customCmd.trim()}
                      style={{ padding: '5px 11px', fontSize: 11, fontWeight: 600, borderRadius: 5, border: 'none',
                        background: customCmd.trim() ? '#c4912a' : 'var(--border)',
                        color: customCmd.trim() ? '#fff' : 'var(--ink3)',
                        cursor: customCmd.trim() ? 'pointer' : 'default',
                        fontFamily: 'inherit', flexShrink: 0 }}>
                      Send
                    </button>
                  </div>
                  {cmdLog.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderTop: '1px solid var(--border)', paddingTop: 7 }}>
                      {cmdLog.map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, transition: 'background 0.3s',
                            background: c.status === 'ack' ? '#10b981' : c.status === 'failed' ? '#ef4444' : '#f59e0b' }} />
                          <span style={{ color: 'var(--ink3)', fontFamily: 'monospace', flexShrink: 0 }}>{c.sentAt}</span>
                          <span style={{ fontWeight: 600, color: 'var(--ink)', flex: 1, minWidth: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</span>
                          <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700,
                            color: c.status === 'ack' ? '#10b981' : c.status === 'failed' ? '#ef4444' : '#f59e0b' }}>
                            {c.status === 'sending' ? 'SENDING' : c.status === 'ack' ? 'ACK' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Operator response */}
                <div style={{ padding: '12px 16px', flexShrink: 0 }}>
                  <SectionLabel>Operator response</SectionLabel>
                  {mapAlert.response && (
                    <div style={{ padding: '9px 11px', background: 'rgba(196,145,42,0.12)', borderRadius: 6,
                      marginBottom: 10, fontSize: 11, border: '1px solid rgba(13,110,94,0.2)' }}>
                      <div style={{ color: '#c4912a', fontStyle: 'italic', marginBottom: 4 }}>"{mapAlert.response.text}"</div>
                      <div style={{ color: '#c4912a', fontSize: 10, opacity: 0.75 }}>
                        {mapAlert.response.operator} · {mapAlert.response.recordedAt}
                      </div>
                    </div>
                  )}
                  <textarea placeholder="Action taken — e.g. contacted driver, issued warning…"
                    value={draft} onChange={e => setDraft(e.target.value)} rows={3}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6,
                      fontSize: 12, color: 'var(--ink)', resize: 'vertical', boxSizing: 'border-box',
                      fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 7, marginTop: 10 }}>
                    <button onClick={closeModal}
                      style={{ padding: '6px 13px', fontSize: 12, fontWeight: 500, borderRadius: 6, cursor: 'pointer',
                        border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink2)', fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                    <button onClick={recordResponse} disabled={!draft.trim()}
                      style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                        cursor: draft.trim() ? 'pointer' : 'default', border: 'none',
                        background: draft.trim() ? '#c4912a' : 'var(--border)',
                        color: draft.trim() ? '#fff' : 'var(--ink3)',
                        fontFamily: 'inherit', transition: 'all 0.12s' }}>
                      Record &amp; Close
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: map + security */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                  {mapIsLocked ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', background: '#fef2f2', gap: 12, padding: 32 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fecaca',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#b91c1c" strokeWidth={2}>
                          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>Live Tracking Suspended</div>
                        <div style={{ fontSize: 12, color: '#9f1239' }}>
                          Subscription expired on{' '}
                          {alertSub ? new Date(alertSub.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                    </div>
                  ) : livePin ? (
                    <>
                      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, display: 'flex',
                        alignItems: 'center', gap: 6, background: 'rgba(15,23,42,0.75)', borderRadius: 6,
                        padding: '5px 11px', pointerEvents: 'none' }}>
                        <span className="_livepulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 1.2 }}>LIVE TRACKING</span>
                      </div>
                      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000,
                        background: 'rgba(15,23,42,0.75)', borderRadius: 6, padding: '5px 11px', pointerEvents: 'none' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: livePin.speed > 0 ? '#34d399' : '#94a3b8' }}>
                          {livePin.speed > 0 ? `${livePin.speed} km/h` : 'Stopped'}
                        </span>
                      </div>
                      <FleetMap vehicles={[livePin]} height="100%" zoom={15}
                        center={[livePin.lat, livePin.lng]} selectedId={undefined} onSelectId={() => {}}
                        trail={trail} liveLat={livePin.lat} liveLng={livePin.lng} />
                    </>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', background: 'var(--cream)', gap: 10, color: 'var(--ink3)' }}>
                      <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                      </svg>
                      <span style={{ fontSize: 13 }}>No GPS location available</span>
                    </div>
                  )}
                </div>

                {/* Security strip */}
                <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 16px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: 1.1 }}>
                        Security verification
                      </span>
                      {secInfo?.updatedAt && (
                        <span style={{ fontSize: 9, color: '#94a3b8' }}>
                          · Updated {new Date(secInfo.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} by {secInfo.updatedBy}
                        </span>
                      )}
                    </div>
                    {!secInfo && <span style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>No security config for this vehicle</span>}
                  </div>
                  {secInfo ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', background: '#fff' }}>
                      <div style={{ padding: '10px 16px', borderRight: '1px solid var(--border)', minWidth: 168 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink3)', marginBottom: 6 }}>Verification PIN</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: 5, color: secInfo.pin ? 'var(--ink)' : 'var(--ink3)' }}>
                            {secInfo.pin ? (showPin ? secInfo.pin : '•'.repeat(secInfo.pin.length)) : <span style={{ fontSize: 11, letterSpacing: 0, fontWeight: 400 }}>Not set</span>}
                          </span>
                          {secInfo.pin && (
                            <button onClick={() => setShowPin(p => !p)}
                              style={{ padding: '3px 9px', fontSize: 10, fontWeight: 600, borderRadius: 5,
                                border: '1px solid var(--border)', background: showPin ? 'rgba(196,145,42,0.12)' : '#fff',
                                color: showPin ? '#c4912a' : 'var(--ink3)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                              {showPin ? 'Hide' : 'Reveal'}
                            </button>
                          )}
                        </div>
                        {secInfo.notes && (
                          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--ink2)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 5 }}>
                            {secInfo.notes}
                          </div>
                        )}
                      </div>
                      {secInfo.questions.length > 0 && (
                        <div style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink3)' }}>
                              Security questions ({secInfo.questions.length})
                            </div>
                            <button onClick={() => setShowAns(p => !p)}
                              style={{ padding: '2px 9px', fontSize: 9, fontWeight: 600, borderRadius: 5,
                                border: '1px solid var(--border)', background: showAns ? '#fef9c3' : '#fff',
                                color: showAns ? '#92400e' : 'var(--ink3)', cursor: 'pointer', fontFamily: 'inherit' }}>
                              {showAns ? 'Hide answers' : 'Reveal answers'}
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {secInfo.questions.map((item, idx) => (
                              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
                                alignItems: 'center', fontSize: 11, padding: '5px 9px',
                                background: 'var(--cream)', borderRadius: 5, border: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{item.q}</span>
                                <span style={{ fontFamily: showAns ? 'inherit' : 'monospace', fontSize: showAns ? 11 : 14,
                                  fontWeight: 700, color: showAns ? '#c4912a' : 'var(--ink3)',
                                  letterSpacing: showAns ? 0 : 3, flexShrink: 0 }}>
                                  {item.a ? (showAns ? item.a : '• • •')
                                    : <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: 0, color: 'var(--ink3)', fontFamily: 'inherit', fontStyle: 'italic' }}>Not set</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '10px 16px', fontSize: 11, color: 'var(--ink3)', fontStyle: 'italic', background: '#fff' }}>
                      No PIN or security questions configured. Set them up in Vehicle → Security / PIN tab.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helper components ───────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2,
      color: 'var(--ink3)', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--ink3)', fontSize: 11 }}>{label}</span>
      <span style={{ fontSize: 11 }}>{value}</span>
    </div>
  );
}
