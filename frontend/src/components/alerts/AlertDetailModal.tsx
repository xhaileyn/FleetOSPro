'use client';
import { useState } from 'react';
import { FleetMap, VehiclePin, STATUS_COLOR } from '@/components/maps/FleetMap';
import { TENANTS_META } from '@/lib/vehiclesMaster';
import { Customer } from '@/lib/customers';
import { useAuthStore } from '@/store/authStore';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useCustomersStore } from '@/store/customersStore';

interface CmdEntry {
  id:     string;
  text:   string;
  sentAt: string;
  status: 'sending' | 'ack' | 'failed';
}

const PRESET_CMDS = [
  { key: 'REQ_LOC',    label: 'Request Location', danger: false },
  { key: 'HORN',       label: 'Horn',             danger: false },
  { key: 'MSG_DRIVER', label: 'Msg Driver',       danger: false },
  { key: 'RESTART',    label: 'Restart Device',   danger: false },
  { key: 'DOOR_LOCK',  label: 'Lock Doors',       danger: false },
  { key: 'ENGINE_CUT', label: 'Cut Engine',       danger: true  },
] as const;

export interface OperatorResponse {
  text:       string;
  operator:   string;
  recordedAt: string;
}

export interface AlertDetailModalProps {
  plate:             string;
  severity:          string;
  type:              string;
  status:            string;
  driver?:           string;
  location?:         string;
  time?:             string;
  existingResponse?: OperatorResponse;
  onClose:           () => void;
  onSave?:           (response: OperatorResponse, newStatus: string) => void;
}

const SEV_STYLE: Record<string, { bg: string; color: string; border: string; dot: string; accent: string }> = {
  Critical: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#ef4444', accent: '#ef4444' },
  Warning:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b', accent: '#f59e0b' },
  Info:     { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6', accent: '#3b82f6' },
  critical: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#ef4444', accent: '#ef4444' },
  warning:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b', accent: '#f59e0b' },
  info:     { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6', accent: '#3b82f6' },
};

const STA_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Active:       { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  Acknowledged: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  Closed:       { bg: '#ccfbf1', color: '#065f46', border: '#6ee7b7' },
};

function SevBadge({ sev }: { sev: string }) {
  const s = SEV_STYLE[sev] ?? { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', dot: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
      padding: '3px 8px', borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {sev}
    </span>
  );
}

function StaBadge({ sta }: { sta: string }) {
  const s = STA_STYLE[sta] ?? { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600,
      padding: '3px 8px', borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {sta}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2,
      color: 'var(--ink3)', marginBottom: 8, paddingBottom: 5, borderBottom: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

export function AlertDetailModal({
  plate, severity, type, status, driver, location, time,
  existingResponse, onClose, onSave,
}: AlertDetailModalProps) {
  const { user }  = useAuthStore();
  const vehicles  = useVehiclesStore(s => s.vehicles);
  const customers = useCustomersStore(s => s.customers);

  const [draft,      setDraft]      = useState(existingResponse?.text ?? '');
  const [saved,      setSaved]      = useState<OperatorResponse | undefined>(existingResponse);
  const [cmdLog,     setCmdLog]     = useState<CmdEntry[]>([]);
  const [customCmd,  setCustomCmd]  = useState('');
  const [cutConfirm, setCutConfirm] = useState(false);

  function pinFromPlate(p: string): VehiclePin | null {
    const v = vehicles.find(x => x.plate === p);
    if (!v || v.latitude === null || v.longitude === null) return null;
    const st: 'active' | 'idle' | 'offline' =
      v.status === 'active' ? 'active' : v.status === 'idle' ? 'idle' : 'offline';
    return {
      id: v.plate, driver: v.driverName ?? 'No driver', status: st,
      speed: v.speedKmh ?? 0, lat: v.latitude, lng: v.longitude,
      fuel: v.fuelLevel, tenantId: v.tenantId,
      make: v.make, model: v.model, year: v.year, category: v.category,
      customerName: v.customerName ?? undefined, odometer: v.odometer,
      tenantName: TENANTS_META[v.tenantId]?.name,
    };
  }

  function customerFromPlate(p: string): Customer | null {
    const v = vehicles.find(x => x.plate === p);
    if (!v?.customerId) return null;
    return customers.find(c => c.id === v.customerId) ?? null;
  }

  const mapPin      = plate ? pinFromPlate(plate) : null;
  const mapCustomer = plate ? customerFromPlate(plate) : null;
  const primary     = mapCustomer?.contacts?.find(c => c.primary) ?? mapCustomer?.contacts?.[0] ?? null;
  const sevAccent   = SEV_STYLE[severity]?.accent ?? '#c4912a';

  function dispatchCommand(text: string) {
    const entry: CmdEntry = {
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

  function handlePreset(cmd: typeof PRESET_CMDS[number]) {
    if (cmd.danger && !cutConfirm) { setCutConfirm(true); return; }
    dispatchCommand(cmd.label);
  }

  function handleCustomSend() {
    if (!customCmd.trim()) return;
    dispatchCommand(customCmd.trim());
    setCustomCmd('');
  }

  function handleSave() {
    if (!draft.trim()) return;
    const response: OperatorResponse = {
      text:       draft.trim(),
      operator:   user?.fullName ?? 'Operator',
      recordedAt: new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }),
    };
    setSaved(response);
    onSave?.(response, 'Closed');
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 12,
          width: 'min(1020px, 96vw)', height: 'min(680px, 92vh)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          borderTop: `3px solid ${sevAccent}`,
          padding: '13px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SevBadge sev={severity} />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', letterSpacing: -0.2 }}>{type}</span>
            {plate && <span style={{ fontSize: 13, color: 'var(--ink3)', fontWeight: 500 }}>{plate}</span>}
            <StaBadge sta={status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {(location || time) && (
              <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
                {location}{location && time ? ' · ' : ''}{time}
              </span>
            )}
            <button
              onClick={onClose}
              style={{ padding: '5px 13px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                border: '1px solid var(--border)', background: '#fff', color: 'var(--ink2)',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--cream2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
            >
              Close
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* ── Left panel ────────────────────────────────────────── */}
          <div style={{ width: 292, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* Vehicle strip */}
            {(driver || mapPin) && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <SectionLabel>Vehicle</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                  {driver && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ink3)' }}>Driver</span>
                      <strong style={{ color: 'var(--ink)' }}>{driver}</strong>
                    </div>
                  )}
                  {mapPin && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink3)' }}>Speed</span>
                        <strong style={{ color: mapPin.speed > 0 ? '#c4912a' : 'var(--ink3)' }}>
                          {mapPin.speed > 0 ? `${mapPin.speed} km/h` : 'Stopped'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink3)' }}>Fuel</span>
                        <strong style={{ color: mapPin.fuel > 50 ? '#c4912a' : mapPin.fuel > 20 ? 'var(--amber)' : 'var(--red)' }}>
                          {mapPin.fuel}%
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--ink3)' }}>Status</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[mapPin.status] }} />
                          <strong style={{ textTransform: 'capitalize', color: 'var(--ink)' }}>{mapPin.status}</strong>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

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
                  {primary && (
                    <div style={{ paddingTop: 5, borderTop: '1px solid var(--border)', marginTop: 2 }}>
                      <div style={{ color: 'var(--ink2)', marginBottom: 3 }}>
                        {primary.name}{primary.title ? ` · ${primary.title}` : ''}
                      </div>
                      {primary.phone && (
                        <a href={`tel:${primary.phone}`} style={{ color: '#c4912a', textDecoration: 'none' }}>
                          {primary.phone}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Device commands */}
            {plate && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <SectionLabel>Device commands</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {PRESET_CMDS.map(cmd => {
                    const awaiting = cmd.danger && cutConfirm;
                    return (
                      <button
                        key={cmd.key}
                        onClick={() => handlePreset(cmd)}
                        style={{
                          padding: '4px 10px', fontSize: 11, borderRadius: 5, cursor: 'pointer',
                          fontFamily: 'inherit', fontWeight: awaiting ? 700 : 500,
                          border: cmd.danger
                            ? `1.5px solid ${awaiting ? '#dc2626' : '#fca5a5'}`
                            : '1px solid var(--border)',
                          background: awaiting ? '#fef2f2' : cmd.danger ? '#fff5f5' : '#fff',
                          color: cmd.danger ? '#b91c1c' : 'var(--ink2)',
                          transition: 'all 0.12s',
                        }}
                      >
                        {awaiting ? 'Confirm?' : cmd.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 5, marginBottom: cmdLog.length > 0 ? 8 : 0 }}>
                  <input
                    value={customCmd}
                    onChange={e => setCustomCmd(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCustomSend()}
                    placeholder="Custom command…"
                    style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 5,
                      fontSize: 11, fontFamily: 'monospace', outline: 'none', background: '#fff', minWidth: 0 }}
                  />
                  <button
                    onClick={handleCustomSend}
                    disabled={!customCmd.trim()}
                    style={{ padding: '5px 11px', fontSize: 11, fontWeight: 600, borderRadius: 5, border: 'none',
                      background: customCmd.trim() ? '#c4912a' : 'var(--border)',
                      color: customCmd.trim() ? '#fff' : 'var(--ink3)',
                      cursor: customCmd.trim() ? 'pointer' : 'default',
                      fontFamily: 'inherit', flexShrink: 0, transition: 'background 0.12s' }}
                  >
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
            )}

            {/* Operator response */}
            <div style={{ padding: '12px 16px', flexShrink: 0 }}>
              <SectionLabel>Operator response</SectionLabel>
              {saved && (
                <div style={{ padding: '9px 11px', background: 'rgba(196,145,42,0.12)', borderRadius: 6,
                  marginBottom: 10, fontSize: 11, border: '1px solid rgba(13,110,94,0.2)' }}>
                  <div style={{ color: '#c4912a', fontStyle: 'italic', marginBottom: 4 }}>"{saved.text}"</div>
                  <div style={{ color: '#c4912a', fontSize: 10, opacity: 0.75 }}>
                    {saved.operator} · {saved.recordedAt}
                  </div>
                </div>
              )}
              <textarea
                placeholder="Action taken — e.g. contacted driver, issued warning…"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6,
                  fontSize: 12, color: 'var(--ink)', resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 7, marginTop: 10 }}>
                <button
                  onClick={onClose}
                  style={{ padding: '6px 13px', fontSize: 12, fontWeight: 500, borderRadius: 6,
                    cursor: 'pointer', border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--ink2)', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!draft.trim()}
                  style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                    cursor: draft.trim() ? 'pointer' : 'default', border: 'none',
                    background: draft.trim() ? '#c4912a' : 'var(--border)',
                    color: draft.trim() ? '#fff' : 'var(--ink3)',
                    fontFamily: 'inherit', transition: 'all 0.12s', opacity: draft.trim() ? 1 : 0.6 }}
                >
                  Record &amp; Close
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: map ────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {mapPin ? (
              <FleetMap
                vehicles={[mapPin]}
                height="100%"
                zoom={14}
                center={[mapPin.lat, mapPin.lng]}
                selectedId={mapPin.id}
                onSelectId={() => {}}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', background: 'var(--cream)', gap: 10, color: 'var(--ink3)' }}>
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span style={{ fontSize: 13 }}>No GPS location available for this vehicle.</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
