'use client';
import { useState, useEffect, useRef } from 'react';
import { FleetMap, VehiclePin, STATUS_COLOR } from '@/components/maps/FleetMap';
import { VehicleMaster, getDeviceForVehicle } from '@/lib/vehiclesMaster';
import { useCustomersStore } from '@/store/customersStore';
import { getSubscription, computeSubStatus, PLANS, daysUntilSubExpiry } from '@/lib/subscriptions';
import type { UserRole } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';

/* ── Compass helpers ──────────────────────────────────────────────── */
function compassDir(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360 + 360) % 360) / 45) % 8];
}
function compassArrow(deg: number) {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  return arrows[Math.round(((deg % 360 + 360) % 360) / 45) % 8];
}

/* ── Types ────────────────────────────────────────────────────────── */
interface CommandEntry {
  id:     string;
  text:   string;
  sentAt: string;
  status: 'sending' | 'ack' | 'failed';
}

/**
 * ── Device command permission catalogue ─────────────────────────────────────
 * This is the single configuration point for command-level access control.
 * Edit `allowedRoles` on any entry to grant or revoke access per command.
 *
 * Role hierarchy (most → least privileged):
 *   super_admin → platform_admin → fleet_admin → fleet_manager
 *   → dispatcher / vehicle_owner → billing_admin → viewer
 */
interface PresetCmd {
  readonly key:          string;
  readonly icon:         string;
  readonly label:        string;
  readonly danger:       boolean;
  /** Roles that may execute this command. Adjust per command to configure access. */
  readonly allowedRoles: readonly UserRole[];
}

const PRESET_CMDS: PresetCmd[] = [
  {
    key: 'REQ_LOC',    icon: '📍', label: 'Request Location', danger: false,
    // Low-risk read command — dispatchers and owners included
    allowedRoles: ['super_admin', 'platform_admin', 'fleet_admin', 'fleet_manager', 'dispatcher', 'vehicle_owner'],
  },
  {
    key: 'HORN',       icon: '📢', label: 'Horn',             danger: false,
    // Operational — dispatchers can trigger; owners cannot (operational staff only)
    allowedRoles: ['super_admin', 'platform_admin', 'fleet_admin', 'fleet_manager', 'dispatcher'],
  },
  {
    key: 'MSG_DRIVER', icon: '💬', label: 'Msg Driver',       danger: false,
    // Communication — dispatchers and owners allowed
    allowedRoles: ['super_admin', 'platform_admin', 'fleet_admin', 'fleet_manager', 'dispatcher', 'vehicle_owner'],
  },
  {
    key: 'RESTART',    icon: '🔄', label: 'Restart Device',   danger: false,
    // Technical — management level and above only
    allowedRoles: ['super_admin', 'platform_admin', 'fleet_admin', 'fleet_manager'],
  },
  {
    key: 'DOOR_LOCK',  icon: '🔒', label: 'Lock Doors',       danger: false,
    // Security action — managers and owners allowed; dispatchers excluded
    allowedRoles: ['super_admin', 'platform_admin', 'fleet_admin', 'fleet_manager', 'vehicle_owner'],
  },
  {
    key: 'ENGINE_CUT', icon: '⚡', label: 'Cut Engine',       danger: true,
    // Critical / irreversible — fleet admin and above only
    allowedRoles: ['super_admin', 'platform_admin', 'fleet_admin'],
  },
];

/** Roles authorised to send free-form (custom) device commands */
const CUSTOM_CMD_ROLES: readonly UserRole[] = ['super_admin', 'platform_admin', 'fleet_admin'];

/* ── Sub-components ───────────────────────────────────────────────── */
function Sect({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink3)', paddingBottom: 5, borderBottom: '1px solid var(--border)', marginBottom: 7 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, color, mono }: { label: string; value: React.ReactNode; color?: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 4 }}>
      <span style={{ color: 'var(--ink3)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: color ?? 'var(--ink)', textAlign: 'right', marginLeft: 8, fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? 10 : 11 }}>
        {value}
      </span>
    </div>
  );
}

function SignalBars({ bars }: { bars: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(b => (
        <span key={b} style={{ display: 'inline-block', width: 5, height: 3 + b * 3, borderRadius: 1, background: b <= bars ? '#c4912a' : '#d1d5db', transition: 'background 0.4s' }} />
      ))}
      <span style={{ fontSize: 10, marginLeft: 4, color: bars >= 4 ? '#c4912a' : bars >= 2 ? 'var(--amber)' : 'var(--red)' }}>{bars}/5</span>
    </span>
  );
}

function BatteryBar({ pct }: { pct: number }) {
  const color = pct > 50 ? '#c4912a' : pct > 20 ? '#d97706' : '#dc2626';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        <span style={{ width: 48, height: 11, borderRadius: 3, border: `1.5px solid ${color}`, overflow: 'hidden', display: 'inline-block' }}>
          <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: color, transition: 'width 0.7s ease' }} />
        </span>
        <span style={{ width: 3, height: 6, borderRadius: '0 2px 2px 0', background: color, marginLeft: -1 }} />
      </span>
      <span style={{ fontWeight: 700, fontSize: 11, color }}>{Math.round(pct)}%</span>
    </span>
  );
}

const STATUS_CHIP: Record<string, React.CSSProperties> = {
  active:      { background: '#ccfbf1', color: '#065f46' },
  idle:        { background: '#fef3c7', color: '#92400e' },
  offline:     { background: '#f3f4f6', color: '#6b7280' },
  maintenance: { background: '#eff6ff', color: '#1d4ed8' },
  disposed:    { background: '#fef2f2', color: '#dc2626' },
};

/* ── Main modal ───────────────────────────────────────────────────── */
interface Props {
  vehicle:    VehicleMaster;
  initialPin: VehiclePin | null;
  onClose:    () => void;
  /** Render as an inline tab panel instead of a floating modal */
  inline?:    boolean;
}

export function VehicleTrackingModal({ vehicle, initialPin, onClose, inline }: Props) {
  const device = getDeviceForVehicle(vehicle);
  const allCustomers = useCustomersStore(s => s.customers);

  /* ── subscription gate ────────────────────────────────────────── */
  const sub       = getSubscription(vehicle.id);
  const subStatus = sub ? computeSubStatus(sub) : 'Expired';
  const isLocked  = subStatus === 'Expired' || subStatus === 'Suspended';

  /* ── live telemetry ───────────────────────────────────────────── */
  const [livePin,    setLivePin]    = useState<VehiclePin | null>(initialPin);
  const [trail,      setTrail]      = useState<[number, number][]>(
    initialPin ? [[initialPin.lat, initialPin.lng]] : [],
  );
  const [headingDeg, setHeadingDeg] = useState(() => Math.random() * 360);
  const [battery,    setBattery]    = useState(device.batteryPct);
  const [signal,     setSignal]     = useState(device.signalBars);
  const [altitude,   setAltitude]   = useState(() => 1575 + Math.random() * 250);
  const [lastUpdate, setLastUpdate] = useState(() => new Date());
  const headingRef                  = useRef<number>(Math.random() * Math.PI * 2);

  /* ── customer + operator notes ───────────────────────────────── */
  const customer       = vehicle.customerId ? allCustomers.find(c => c.id === vehicle.customerId) ?? null : null;
  const primaryContact = customer?.contacts?.find(c => c.primary) ?? customer?.contacts?.[0] ?? null;
  const [note,      setNote]      = useState('');
  const [savedNote, setSavedNote] = useState('');

  /* ── map fullscreen ──────────────────────────────────────────── */
  const [mapFull, setMapFull] = useState(false);

  /* ── commands ─────────────────────────────────────────────────── */
  const [cmdLog,     setCmdLog]     = useState<CommandEntry[]>([]);
  const [customCmd,  setCustomCmd]  = useState('');
  const [cutConfirm, setCutConfirm] = useState(false);

  /* ── command access control ───────────────────────────────────── */
  const { user }                         = useAuthStore();
  const { commandRights, setCommandRights } = useConfigStore();
  const userRole                         = user?.role ?? 'viewer';
  const isSuperLevel                     = userRole === 'super_admin' || userRole === 'platform_admin';
  const isAdmin                          = isSuperLevel || userRole === 'tenant_admin' || userRole === 'fleet_admin';

  /** Effective allowed roles: stored override wins, else use component default */
  function effectiveCmdRoles(cmd: PresetCmd): string[] {
    return commandRights[cmd.key] ?? [...cmd.allowedRoles];
  }
  /** Returns true when the current user's role may execute this command */
  const canUseCmd    = (cmd: PresetCmd) => isSuperLevel || effectiveCmdRoles(cmd).includes(userRole);
  /** Effective custom-command roles */
  const effectiveCustomRoles: string[] = commandRights['_CUSTOM'] ?? [...CUSTOM_CMD_ROLES];
  /** True when the current user may send free-form custom commands */
  const canCustomCmd = isSuperLevel || effectiveCustomRoles.includes(userRole);
  /** Transient denial notice — stores the blocked command label for 2.5 s */
  const [deniedCmd,  setDeniedCmd]  = useState<string | null>(null);
  /** Admin rights panel open/close */
  const [rightsOpen, setRightsOpen] = useState(false);

  /* ── simulation interval ──────────────────────────────────────── */
  useEffect(() => {
    const isActive = vehicle.status === 'active';
    const isIdle   = vehicle.status === 'idle';
    if (!isActive && !isIdle) return;

    const ms = isActive ? 2500 : 7000;

    const id = setInterval(() => {
      if (isActive) {
        headingRef.current += (Math.random() - 0.5) * 0.5;
        const h    = headingRef.current;
        const step = 0.00018 + Math.random() * 0.00012;

        setLivePin(prev => {
          if (!prev) return prev;
          const newLat = prev.lat + Math.cos(h) * step;
          const newLng = prev.lng + Math.sin(h) * step;
          setTrail(t => [...t.slice(-49), [newLat, newLng] as [number, number]]);
          return { ...prev, lat: newLat, lng: newLng, speed: Math.round(20 + Math.random() * 65) };
        });

        setHeadingDeg(((h * 180 / Math.PI) + 360) % 360);
        setAltitude(a => a + (Math.random() - 0.5) * 4);
      }

      /* battery + signal update regardless of active/idle */
      setBattery(b  => Math.max(8,  Math.min(100, b  + (Math.random() - 0.52) * 0.7)));
      setSignal(Math.max(1, Math.min(5, Math.round(device.signalBars + (Math.random() - 0.5) * 1.5))));
      setLastUpdate(new Date());
    }, ms);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── command dispatch ─────────────────────────────────────────── */
  function dispatchCommand(text: string) {
    const entry: CommandEntry = {
      id:     Date.now().toString(),
      text,
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

  function handlePreset(cmd: PresetCmd) {
    if (!canUseCmd(cmd)) {
      setDeniedCmd(cmd.label);
      setTimeout(() => setDeniedCmd(null), 2500);
      return;
    }
    if (cmd.danger && !cutConfirm) { setCutConfirm(true); return; }
    dispatchCommand(`${cmd.icon} ${cmd.label}`);
  }

  function handleCustomSend() {
    if (!customCmd.trim()) return;
    dispatchCommand(customCmd.trim());
    setCustomCmd('');
  }

  /* ── derived ──────────────────────────────────────────────────── */
  const isActive = vehicle.status === 'active';
  const hasGps   = !!livePin;

  const cardContent = (
    <div
      style={inline
        ? { background: '#fff', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }
        : { background: '#fff', borderRadius: 14, width: 'min(1120px, 96vw)', maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.30)', overflow: 'hidden', position: 'relative' }}
      onClick={inline ? undefined : e => e.stopPropagation()}
    >
      <style>{`
        @keyframes _tpulse { 0%,100%{opacity:1} 50%{opacity:0.15} }
        ._tpulse { animation:_tpulse 1.2s ease-in-out infinite; }
      `}</style>

        {/* ── Subscription locked screen ────────────────────────── */}
        {isLocked && sub && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', gap: 18, textAlign: 'center', minHeight: 360 }}>
            <div style={{ fontSize: 52 }}>🔒</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Live Tracking Suspended</div>
              <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 4 }}>
                Subscription for <strong style={{ color: 'var(--ink)' }}>{vehicle.plate}</strong> expired on{' '}
                <strong style={{ color: '#dc2626' }}>{new Date(sub.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>{' '}
                ({Math.abs(daysUntilSubExpiry(sub.expiryDate))} days ago).
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                All gated services (Live Tracking, Alerts, Device Commands) are suspended until the subscription is renewed.
              </div>
            </div>
            <div style={{ padding: '12px 20px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 12, maxWidth: 380 }}>
              <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>Current plan: {sub.plan} ({PLANS[sub.plan].price} USD/mo)</div>
              <div style={{ color: '#991b1b' }}>Contact your account manager or renew at billing portal to restore services.</div>
              {sub.contactEmail && <div style={{ marginTop: 6, color: '#991b1b' }}>📧 {sub.contactEmail}</div>}
            </div>
            {!inline && (
              <button onClick={onClose} style={{ padding: '10px 28px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Close
              </button>
            )}
          </div>
        )}

        {/* ── Full modal (subscription active) ─────────────────── */}
        {!isLocked && <>

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fafafa', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 17, fontFamily: 'monospace', color: 'var(--ink)', letterSpacing: 1 }}>{vehicle.plate}</span>
            <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{vehicle.year} {vehicle.make} {vehicle.model}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, ...(STATUS_CHIP[vehicle.status] ?? {}) }}>
              {vehicle.status}
            </span>
            {hasGps && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 10px', borderRadius: 12 }}>
                <span className="_tpulse">●</span> LIVE TRACKING
              </span>
            )}
            {vehicle.driverName && (
              <span style={{ fontSize: 11, color: 'var(--ink3)' }}>· {vehicle.driverName}</span>
            )}
          </div>
          {!inline && (
            <button onClick={onClose} style={{ padding: '5px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              ✕ Close
            </button>
          )}
        </div>

        {/* ── Body: left panel + right area ─────────────────────── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, height: inline ? 620 : undefined, overflow: 'hidden' }}>

          {/* ── Left panel ──────────────────────────────────────── */}
          <div style={{ width: 248, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '12px 10px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Live Telemetry */}
            <Sect title="Live Telemetry">
              {/* Speed + direction */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 10px', background: '#fff', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-2px', color: isActive && (livePin?.speed ?? 0) > 0 ? '#c4912a' : 'var(--ink3)', transition: 'color 0.4s', lineHeight: 1 }}>
                    {isActive ? (livePin?.speed ?? 0) : 0}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 4 }}>km/h</span>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, lineHeight: 1, transition: 'transform 0.8s ease', display: 'inline-block', transform: `rotate(${headingDeg}deg)` }}>
                    {compassArrow(headingDeg)}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#c4912a' }}>{compassDir(headingDeg)}</div>
                </div>
                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 10, textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{headingDeg.toFixed(0)}°</div>
                  <div style={{ fontSize: 9, color: 'var(--ink3)' }}>heading</div>
                </div>
              </div>

              {livePin && (
                <>
                  <Row label="Latitude"    value={livePin.lat.toFixed(6)} mono />
                  <Row label="Longitude"   value={livePin.lng.toFixed(6)} mono />
                </>
              )}
              <Row label="Altitude"    value={`${altitude.toFixed(0)} m ASL`} />
              <Row label="Fuel"        value={`${vehicle.fuelLevel}%`}
                color={vehicle.fuelLevel > 50 ? '#c4912a' : vehicle.fuelLevel > 20 ? 'var(--amber)' : 'var(--red)'} />
              <Row label="Last update" value={lastUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} color="var(--ink3)" />
              {!isActive && (
                <div style={{ marginTop: 6, padding: '5px 8px', background: vehicle.status === 'offline' ? '#f3f4f6' : '#fffbeb', borderRadius: 5, fontSize: 10, color: vehicle.status === 'offline' ? '#6b7280' : '#d97706', fontWeight: 600 }}>
                  {vehicle.status === 'offline' ? '📡 Offline — showing last known position' : '⏸ Vehicle is idle'}
                </div>
              )}
            </Sect>

            {/* Vehicle */}
            <Sect title="Vehicle">
              <Row label="Plate"       value={vehicle.plate}       mono />
              <Row label="VIN"         value={vehicle.vin}         mono />
              <Row label="Make/Model"  value={`${vehicle.make} ${vehicle.model}`} />
              <Row label="Year/Color"  value={`${vehicle.year} · ${vehicle.color}`} />
              <Row label="Category"    value={vehicle.category} />
              <Row label="Fuel type"   value={vehicle.fuelType} />
              <Row label="Driver"      value={vehicle.driverName ?? '—'} />
              <Row label="Customer"    value={vehicle.customerName ?? '—'} />
              <Row label="Odometer"    value={`${vehicle.odometer.toLocaleString()} km`} />
            </Sect>

            {/* GPS Device */}
            <Sect title="GPS Device">
              <Row label="Device ID"   value={device.deviceId}  mono />
              <Row label="Model"       value={device.model} />
              <Row label="IMEI"        value={device.imei}      mono />
              <Row label="Serial No"   value={device.serialNo}  mono />
              <Row label="Firmware"    value={device.firmware} />
              <Row label="Installed"   value={device.installedDate} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 5 }}>
                <span style={{ color: 'var(--ink3)' }}>Battery</span>
                <BatteryBar pct={battery} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--ink3)' }}>Signal</span>
                <SignalBars bars={signal} />
              </div>
            </Sect>

            {/* SIM */}
            <Sect title="SIM Card">
              <Row label="ICCID"    value={device.iccid}    mono />
              <Row label="MSISDN"   value={device.msisdn}   mono />
              <Row label="Operator" value={device.operator} />
              <Row label="Network"  value={
                <span style={{ fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                  background: device.dataNetwork === '5G' ? '#ede9fe' : device.dataNetwork === '4G' ? '#ccfbf1' : '#fef3c7',
                  color:      device.dataNetwork === '5G' ? '#7c3aed' : device.dataNetwork === '4G' ? '#065f46' : '#92400e',
                }}>
                  {device.dataNetwork}
                </span>
              } />
            </Sect>

            {/* Customer coordination */}
            {customer && (
              <Sect title="Customer — Coordination">
                <Row label="Company" value={customer.name} />
                {customer.phone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--ink3)' }}>Phone</span>
                    <a href={`tel:${customer.phone}`} style={{ fontWeight: 600, color: '#c4912a', textDecoration: 'none' }}>{customer.phone}</a>
                  </div>
                )}
                {customer.email && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--ink3)' }}>Email</span>
                    <a href={`mailto:${customer.email}`} style={{ fontWeight: 600, color: '#c4912a', textDecoration: 'none', maxWidth: 155, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.email}</a>
                  </div>
                )}
                {(customer.city || customer.country) && (
                  <Row label="Location" value={[customer.city, customer.country].filter(Boolean).join(', ')} />
                )}
                {primaryContact && (
                  <>
                    <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                    <Row label="Contact" value={`${primaryContact.name}${primaryContact.title ? ` · ${primaryContact.title}` : ''}`} />
                    {primaryContact.phone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: 'var(--ink3)' }}>Direct</span>
                        <a href={`tel:${primaryContact.phone}`} style={{ fontWeight: 600, color: '#c4912a', textDecoration: 'none' }}>{primaryContact.phone}</a>
                      </div>
                    )}
                    {primaryContact.email && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: 'var(--ink3)' }}>Contact email</span>
                        <a href={`mailto:${primaryContact.email}`} style={{ fontWeight: 600, color: '#c4912a', textDecoration: 'none', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primaryContact.email}</a>
                      </div>
                    )}
                  </>
                )}
              </Sect>
            )}

            {/* Operator notes */}
            <Sect title="Operator Notes">
              {savedNote && (
                <div style={{ padding: '7px 9px', background: 'rgba(196,145,42,0.12)', borderRadius: 6, marginBottom: 8, fontSize: 11 }}>
                  <div style={{ color: '#c4912a', fontStyle: 'italic', marginBottom: 2 }}>"{savedNote}"</div>
                  <div style={{ fontSize: 9, color: '#c4912a', opacity: 0.7 }}>Saved · {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              )}
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Log action taken or notes for handover…"
                rows={3}
                style={{ width: '100%', padding: '7px 9px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
              />
              <button
                onClick={() => { if (note.trim()) { setSavedNote(note.trim()); setNote(''); } }}
                disabled={!note.trim()}
                style={{ width: '100%', marginTop: 5, padding: '6px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', background: note.trim() ? '#c4912a' : 'var(--border)', color: note.trim() ? '#fff' : 'var(--ink3)', cursor: note.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}
              >
                ✓ Save note
              </button>
            </Sect>

          </div>

          {/* ── Right area: map + commands ───────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

            {/* Map */}
            <div style={mapFull
              ? { position: 'absolute', inset: 0, zIndex: 50, background: '#000' }
              : { flex: 1, minHeight: 280, position: 'relative' }
            }>
              {hasGps ? (
                <>
                  <FleetMap
                    vehicles={[livePin!]}
                    height="100%"
                    zoom={mapFull ? 14 : 12}
                    center={[livePin!.lat, livePin!.lng]}
                    selectedId={livePin!.id}
                    onSelectId={() => {}}
                    trail={trail}
                    liveLat={livePin!.lat}
                    liveLng={livePin!.lng}
                  />
                  {/* live coords overlay */}
                  <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 999, background: 'rgba(15,23,42,0.68)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="_tpulse" style={{ color: '#10b981', fontSize: 8 }}>●</span>
                    {livePin!.lat.toFixed(5)}, {livePin!.lng.toFixed(5)}
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span style={{ color: STATUS_COLOR[livePin!.status] }}>●</span> {livePin!.status}
                  </div>
                  {/* fullscreen toggle */}
                  <button
                    onClick={() => setMapFull(f => !f)}
                    title={mapFull ? 'Exit full screen' : 'Full screen map'}
                    style={{
                      position: 'absolute', top: 10, right: 10, zIndex: 999,
                      width: 32, height: 32, borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: 'rgba(15,23,42,0.68)', backdropFilter: 'blur(4px)',
                      color: '#fff', fontSize: 15, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {mapFull ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/>
                        <polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                        <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                      </svg>
                    )}
                  </button>
                  {/* fullscreen vehicle label */}
                  {mapFull && (
                    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'rgba(15,23,42,0.80)', backdropFilter: 'blur(4px)', color: '#fff', padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="_tpulse" style={{ color: '#10b981' }}>●</span>
                      {vehicle.plate}
                      <span style={{ opacity: 0.55, fontWeight: 400, fontSize: 11, fontFamily: 'system-ui' }}>{livePin!.speed} km/h</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 8 }}>
                  <div style={{ fontSize: 32 }}>📡</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>No GPS signal</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Last seen: {vehicle.lastSeenAt ?? 'unknown'}</div>
                </div>
              )}
            </div>

            {/* ── Command console ─────────────────────────────── */}
            <div style={{ flexShrink: 0, borderTop: '2px solid var(--border)', background: '#f8fafc', overflowY: 'auto', maxHeight: rightsOpen ? 380 : 260 }}>

              {/* Console header */}
              <div style={{ padding: '9px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-terminal" style={{ fontSize: 12 }} /> Device Commands
                  <span style={{ fontWeight: 500, fontSize: 9, color: 'var(--ink3)', textTransform: 'none', letterSpacing: 0 }}>
                    — {PRESET_CMDS.filter(c => canUseCmd(c)).length}/{PRESET_CMDS.length} available to you
                  </span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setRightsOpen(p => !p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', fontSize: 10, fontWeight: 600, borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${rightsOpen ? 'rgba(99,102,241,0.45)' : 'var(--border)'}`, background: rightsOpen ? 'rgba(99,102,241,0.10)' : '#fff', color: rightsOpen ? '#6366f1' : 'var(--ink3)', transition: 'all 0.12s' }}
                  >
                    <i className="ti ti-lock-access" style={{ fontSize: 10 }} />
                    {rightsOpen ? 'Hide rights' : 'Manage Access'}
                  </button>
                )}
              </div>

              {/* Admin: inline rights matrix */}
              {rightsOpen && isAdmin && (() => {
                const ROLES: { value: UserRole; label: string; color: string }[] = [
                  { value: 'tenant_admin',  label: 'T. Admin',   color: '#6366f1' },
                  { value: 'fleet_admin',   label: 'Fleet Adm',  color: '#0891b2' },
                  { value: 'fleet_manager', label: 'F. Mgr',     color: '#c4912a' },
                  { value: 'dispatcher',    label: 'Dispatcher', color: '#7c3aed' },
                  { value: 'billing_admin', label: 'Billing',    color: '#d97706' },
                  { value: 'vehicle_owner', label: 'V. Owner',   color: '#16a34a' },
                  { value: 'viewer',        label: 'Viewer',     color: '#6b7280' },
                ];
                const allCmds = [
                  ...PRESET_CMDS.map(c => ({ key: c.key, icon: c.icon, label: c.label, danger: c.danger, defaultRoles: [...c.allowedRoles] as string[] })),
                  { key: '_CUSTOM', icon: '⌨', label: 'Custom Command', danger: false, defaultRoles: [...CUSTOM_CMD_ROLES] as string[] },
                ];
                return (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: '#fff' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="ti ti-shield-check" style={{ fontSize: 12, color: '#6366f1' }} />
                      Configure which roles can execute each command — changes apply immediately
                      <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--ink3)' }}>super_admin / platform_admin always have access</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                        <thead>
                          <tr style={{ background: 'var(--cream)' }}>
                            <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 700, color: 'var(--ink3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Command</th>
                            {ROLES.map(r => (
                              <th key={r.value} style={{ textAlign: 'center', padding: '5px 4px', fontSize: 9, fontWeight: 700, color: r.color, whiteSpace: 'nowrap', minWidth: 54 }}>{r.label}</th>
                            ))}
                            <th style={{ padding: '5px 4px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {allCmds.map((cmd, idx) => {
                            const cur: string[] = commandRights[cmd.key] ?? cmd.defaultRoles;
                            const isDefault = JSON.stringify([...cur].sort()) === JSON.stringify([...cmd.defaultRoles].sort());
                            return (
                              <tr key={cmd.key} style={{ background: idx % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '5px 8px', fontWeight: 600, color: cmd.danger ? '#dc2626' : 'var(--ink)', whiteSpace: 'nowrap' }}>
                                  <span style={{ marginRight: 5 }}>{cmd.icon}</span>{cmd.label}
                                  {cmd.danger && <i className="ti ti-alert-triangle" style={{ fontSize: 9, color: '#dc2626', marginLeft: 4 }} />}
                                </td>
                                {ROLES.map(r => {
                                  const checked = cur.includes(r.value);
                                  const wasDefault = cmd.defaultRoles.includes(r.value);
                                  return (
                                    <td key={r.value} style={{ textAlign: 'center', padding: '5px 4px' }}>
                                      <div
                                        onClick={() => {
                                          const next = checked ? cur.filter(x => x !== r.value) : [...cur, r.value];
                                          setCommandRights(cmd.key, next);
                                        }}
                                        style={{
                                          width: 22, height: 22, borderRadius: 5, margin: '0 auto', cursor: 'pointer',
                                          border: `1.5px solid ${checked ? r.color : 'var(--border)'}`,
                                          background: checked ? r.color + '18' : '#fff',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          position: 'relative', transition: 'all 0.1s',
                                        }}
                                      >
                                        {checked
                                          ? <i className="ti ti-check" style={{ fontSize: 11, color: r.color }} />
                                          : <span style={{ fontSize: 9, color: 'var(--border2)' }}>—</span>
                                        }
                                        {checked !== wasDefault && (
                                          <span style={{ position: 'absolute', top: -2, right: -2, width: 5, height: 5, borderRadius: '50%', background: checked ? '#16a34a' : '#dc2626', border: '1px solid #fff' }} />
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                                <td style={{ padding: '5px 4px' }}>
                                  {!isDefault && (
                                    <button
                                      onClick={() => setCommandRights(cmd.key, [...cmd.defaultRoles])}
                                      title="Reset to default"
                                      style={{ padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 9, color: 'var(--ink3)' }}
                                    >↺</button>
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
              })()}

              <div style={{ padding: '10px 14px' }}>
                {/* Preset buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {PRESET_CMDS.map(cmd => {
                    const allowed  = canUseCmd(cmd);
                    const awaiting = allowed && cmd.danger && cutConfirm;
                    const roleList = effectiveCmdRoles(cmd).map(r => r.replace(/_/g, ' ')).join(' · ');
                    return (
                      <button
                        key={cmd.key}
                        onClick={() => handlePreset(cmd)}
                        title={allowed ? `Allowed: ${roleList}` : `Requires: ${roleList}`}
                        style={{
                          padding: '5px 12px', fontSize: 11, borderRadius: 6,
                          cursor:     allowed ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit',
                          fontWeight: awaiting ? 700 : 500,
                          opacity:    allowed ? 1 : 0.45,
                          border:   !allowed  ? '1px dashed var(--border)'
                                  : cmd.danger ? `1.5px solid ${awaiting ? '#dc2626' : '#fca5a5'}`
                                  :              '1px solid var(--border)',
                          background: !allowed  ? 'var(--cream)'
                                    : awaiting  ? '#fef2f2'
                                    : cmd.danger ? '#fff5f5' : '#fff',
                          color: !allowed ? 'var(--ink3)' : cmd.danger ? '#dc2626' : 'var(--ink2)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {!allowed  ? `🔒 ${cmd.label}`
                       : awaiting  ? `⚠ Confirm ${cmd.label}?`
                       : `${cmd.icon} ${cmd.label}`}
                      </button>
                    );
                  })}
                </div>

                {/* Transient access-denied notice */}
                {deniedCmd && (
                  <div style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fca5a5', fontSize: 11, color: '#991b1b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🔒&nbsp;<strong>{deniedCmd}</strong>&nbsp;— your role&nbsp;
                    <em style={{ background: '#fee2e2', padding: '0 5px', borderRadius: 4, fontStyle: 'normal', fontWeight: 700 }}>
                      {userRole.replace(/_/g, ' ')}
                    </em>
                    &nbsp;is not authorised for this command.
                  </div>
                )}

                {/* Custom command */}
                {canCustomCmd ? (
                  <div style={{ display: 'flex', gap: 6, marginBottom: cmdLog.length > 0 ? 10 : 0 }}>
                    <input
                      value={customCmd}
                      onChange={e => setCustomCmd(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCustomSend()}
                      placeholder="Custom command  e.g. SET_INTERVAL,10"
                      style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'monospace', outline: 'none', background: '#fff' }}
                    />
                    <button
                      onClick={handleCustomSend}
                      disabled={!customCmd.trim()}
                      style={{ padding: '6px 16px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', background: customCmd.trim() ? '#c4912a' : 'var(--border)', color: customCmd.trim() ? '#fff' : 'var(--ink3)', cursor: customCmd.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}
                    >
                      Send
                    </button>
                  </div>
                ) : (
                  <div style={{ marginBottom: cmdLog.length > 0 ? 10 : 0, padding: '6px 10px', borderRadius: 6, background: 'var(--cream)', border: '1px dashed var(--border)', fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🔒 Custom commands require{' '}
                    <span style={{ fontWeight: 600 }}>
                      {effectiveCustomRoles.map(r => r.replace(/_/g, ' ')).join(', ')}
                    </span>
                  </div>
                )}

                {/* Command log */}
                {cmdLog.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 4 }}>Command Log</div>
                    {cmdLog.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, padding: '2px 0' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, transition: 'background 0.3s', background: c.status === 'ack' ? '#10b981' : c.status === 'failed' ? '#ef4444' : '#f59e0b' }} />
                        <span style={{ color: 'var(--ink3)', fontFamily: 'monospace', flexShrink: 0 }}>{c.sentAt}</span>
                        <span style={{ fontWeight: 600, color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</span>
                        <span style={{ flexShrink: 0, color: c.status === 'ack' ? '#10b981' : c.status === 'failed' ? '#ef4444' : '#f59e0b' }}>
                          {c.status === 'sending' ? '⏳ sending' : c.status === 'ack' ? '✓ ack' : '✗ failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        </> /* end !isLocked */}
      </div>
  );

  if (inline) return cardContent;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      {cardContent}
    </div>
  );
}
