'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  VehicleCategory, OwnerType, VehicleMaster,
} from '@/lib/vehiclesMaster';
import { Customer } from '@/lib/customers';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useDevicesStore } from '@/store/devicesStore';
import { useSimsStore } from '@/store/simsStore';
import {
  PLANS, PLAN_ORDER, getCustomPlans, saveSubscription,
  type PlanName,
} from '@/lib/subscriptions';
import type { GpsDevice, DeviceType } from '@/lib/devicesData';

/* ── constants ───────────────────────────────────────────────────────── */
const CATEGORIES: VehicleCategory[] = ['Truck','Van','Pickup','Car','Bus','Motorcycle','Trailer'];

const DEVICE_TYPE_ICON: Record<DeviceType, string> = {
  'GPS Tracker': '📡',
  'OBD Dongle':  '🔌',
  'Dashcam':     '📷',
  'Temp Sensor': '🌡️',
  'Fuel Sensor': '⛽',
};

const DEVICE_STATUS_S: Record<string, { bg: string; fg: string }> = {
  Online:      { bg: 'rgba(196,145,42,0.12)',  fg: '#c4912a' },
  Offline:     { bg: '#fef2f2',         fg: '#dc2626'        },
  Maintenance: { bg: '#fffbeb',         fg: '#d97706'        },
};

const SIM_STATUS_S: Record<string, { bg: string; fg: string }> = {
  Active:    { bg: 'rgba(196,145,42,0.12)', fg: '#c4912a' },
  Inactive:  { bg: '#f3f4f6',        fg: '#6b7280'        },
  Suspended: { bg: '#fffbeb',        fg: '#d97706'        },
  Expired:   { bg: '#fef2f2',        fg: '#dc2626'        },
};

type PaymentMethod = 'mpesa' | 'bank' | 'manual';
type PaymentStatus = 'idle' | 'processing' | 'confirmed';

interface WizardState {
  /* step 1 */
  plate: string; make: string; model: string; year: string;
  category: VehicleCategory; color: string;
  engineNo: string; vin: string;
  /* step 2 */
  ownerType: OwnerType; ownerIdNo: string;
  /* step 4 */
  selectedPlanId: string; autoRenew: boolean;
  paymentMethod: PaymentMethod; mpesaPhone: string;
}

const DEFAULT_WIZARD: WizardState = {
  plate: '', make: '', model: '', year: String(new Date().getFullYear()),
  category: 'Truck', color: 'White',
  engineNo: '', vin: '',
  ownerType: 'Company', ownerIdNo: '',
  selectedPlanId: '', autoRenew: true,
  paymentMethod: 'mpesa', mpesaPhone: '',
};

const OWNER_TYPE_META: Record<OwnerType, { icon: string; bg: string; fg: string }> = {
  Company:    { icon: '🏢', bg: '#dbeafe', fg: '#1d4ed8' },
  Individual: { icon: '👤', bg: '#dcfce7', fg: '#15803d' },
  Government: { icon: '🏛️', bg: '#fef3c7', fg: '#d97706' },
  Leased:     { icon: '📝', bg: '#f3e8ff', fg: '#7c3aed' },
  Finance:    { icon: '🏦', bg: '#ffedd5', fg: '#c2410c' },
};

/* ── props ───────────────────────────────────────────────────────────── */
export interface RegisterVehicleWizardProps {
  customer: Customer;
  tenantId: string;
  onClose:  () => void;
  onSaved?: () => void;
}

/* ── component ───────────────────────────────────────────────────────── */
export function RegisterVehicleWizard({ customer, tenantId, onClose, onSaved }: RegisterVehicleWizardProps) {
  const storeAddVehicle   = useVehiclesStore(s => s.addVehicle);
  const allDevices        = useDevicesStore(s => s.devices);
  const devicesLoaded     = useDevicesStore(s => s.loaded);
  const loadDevices       = useDevicesStore(s => s.loadDevices);
  const storeUpdateDevice = useDevicesStore(s => s.updateDevice);
  const allSims           = useSimsStore(s => s.sims);
  const simsLoaded        = useSimsStore(s => s.loaded);
  const loadSims          = useSimsStore(s => s.loadSims);
  const storeUpdateSim    = useSimsStore(s => s.updateSim);

  /* Ensure stock is loaded */
  useEffect(() => {
    if (!devicesLoaded) loadDevices(tenantId);
    if (!simsLoaded)    loadSims(tenantId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Tenant-scoped inventory — stock only (VehicleShortId is empty) */
  const tenantDevices = useMemo(() =>
    allDevices
      .filter(d => d.tenantId === tenantId && (!d.vehicleId || d.vehicleId === ''))
      .sort((a, b) => (a.model ?? '').localeCompare(b.model ?? '')),
  [allDevices, tenantId]);

  const tenantSims = useMemo(() =>
    allSims
      .filter(s => s.tenantId === tenantId && (!s.vehicleId || s.vehicleId === ''))
      .sort((a, b) => (a.operator ?? '').localeCompare(b.operator ?? '')),
  [allSims, tenantId]);

  /* Component state */
  const [step,            setStep]           = useState(1);
  const [form,            setForm]           = useState<WizardState>({
    ...DEFAULT_WIZARD,
    ownerType: customer.type === 'Individual' ? 'Individual' : 'Company',
  });
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedSimId,    setSelectedSimId]    = useState<string | null>(null);
  const [deviceSearch,     setDeviceSearch]     = useState('');
  const [simSearch,        setSimSearch]        = useState('');
  const [payStatus,        setPayStatus]        = useState<PaymentStatus>('idle');
  const [saving,           setSaving]           = useState(false);
  const [saveError,        setSaveError]        = useState('');

  const customPlans = getCustomPlans(tenantId).filter(p => p.status === 'active');
  const set = (k: keyof WizardState, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  /* Plan meta */
  const isPlatformPlan   = PLAN_ORDER.includes(form.selectedPlanId as PlanName);
  const platformPlanMeta = isPlatformPlan ? PLANS[form.selectedPlanId as PlanName] : null;
  const customPlanMeta   = !isPlatformPlan ? customPlans.find(p => p.id === form.selectedPlanId) : null;
  const planLabel  = platformPlanMeta?.name  ?? customPlanMeta?.name  ?? '—';
  const planPrice  = platformPlanMeta?.price ?? customPlanMeta?.price ?? 0;
  const planColor  = platformPlanMeta?.color ?? customPlanMeta?.color ?? '#c4912a';
  const annualTotal = planPrice * 12;

  /* Filtered lists for picker search */
  const filteredDevices = useMemo(() => {
    const q = deviceSearch.toLowerCase();
    return q
      ? tenantDevices.filter(d =>
          d.model?.toLowerCase().includes(q) ||
          d.imei?.toLowerCase().includes(q) ||
          d.type?.toLowerCase().includes(q) ||
          d.vehiclePlate?.toLowerCase().includes(q))
      : tenantDevices;
  }, [tenantDevices, deviceSearch]);

  const filteredSims = useMemo(() => {
    const q = simSearch.toLowerCase();
    return q
      ? tenantSims.filter(s =>
          s.iccid?.toLowerCase().includes(q) ||
          s.operator?.toLowerCase().includes(q) ||
          s.msisdn?.toLowerCase().includes(q) ||
          s.vehiclePlate?.toLowerCase().includes(q))
      : tenantSims;
  }, [tenantSims, simSearch]);

  /* Step validation */
  const canNext =
    step === 1 ? !!(form.plate && form.make && form.model) :
    step === 2 ? true :
    step === 3 ? true :   // device & SIM are optional
    false;

  const canRegister = !!(form.selectedPlanId && (payStatus === 'confirmed' || form.paymentMethod === 'manual'));

  const selectedDevice = selectedDeviceId ? tenantDevices.find(d => d.id === selectedDeviceId) : null;
  const selectedSim    = selectedSimId    ? tenantSims.find(s => s.id === selectedSimId)        : null;

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    border: '1px solid var(--border2)', borderRadius: 6,
    fontSize: 12, color: 'var(--ink)', background: '#fff',
    boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: 'var(--ink3)',
    letterSpacing: 0.5, marginBottom: 3, display: 'block',
  };

  function sendMpesa()           { setPayStatus('processing'); setTimeout(() => setPayStatus('confirmed'), 2200); }
  function confirmBankTransfer() { setPayStatus('confirmed'); }

  /* ── Register + assign device/SIM ──────────────────────────────── */
  async function handleRegister() {
    setSaving(true);
    setSaveError('');
    try {
      /* 1. Create vehicle */
      const res = await fetch('/api/v1/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          plate:        form.plate.trim().toUpperCase(),
          make:         form.make.trim(),
          model:        form.model.trim(),
          year:         form.year,
          category:     form.category,
          color:        form.color.trim() || 'White',
          engineNo:     form.engineNo.trim(),
          vin:          form.vin.trim().toUpperCase(),
          customerId:   customer.id,
          customerName: customer.name,
          department:   customer.industry ?? null,
          ownerType:    form.ownerType,
          ownerName:    customer.name,
          ownerIdNo:    form.ownerIdNo.trim() || null,
          ownerContact: customer.phone ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError((err as { message?: string }).message ?? 'Failed to register vehicle.');
        return;
      }
      const newVehicle = await res.json() as VehicleMaster;
      storeAddVehicle(newVehicle);

      /* 2. Save subscription */
      if (form.selectedPlanId) {
        const start  = new Date();
        const expiry = new Date(start);
        expiry.setFullYear(expiry.getFullYear() + 1);
        saveSubscription({
          vehicleId:    newVehicle.id,
          plan:         (isPlatformPlan ? form.selectedPlanId : 'Basic') as PlanName,
          ...(customPlanMeta ? { customPlanId: form.selectedPlanId } : {}),
          startDate:    start.toISOString().slice(0, 10),
          expiryDate:   expiry.toISOString().slice(0, 10),
          autoRenew:    form.autoRenew,
          contactEmail: customer.email || undefined,
        });
      }

      /* 3. Link device if selected */
      if (selectedDeviceId) {
        const dr = await fetch(`/api/v1/devices/${selectedDeviceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleId: newVehicle.id, vehiclePlate: newVehicle.plate }),
        });
        if (dr.ok) storeUpdateDevice(await dr.json());
      }

      /* 4. Link SIM if selected */
      if (selectedSimId) {
        const sr = await fetch(`/api/v1/sims/${selectedSimId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleId: newVehicle.id, vehiclePlate: newVehicle.plate }),
        });
        if (sr.ok) storeUpdateSim(await sr.json());
      }

      onSaved?.();
      onClose();
    } catch {
      setSaveError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }

  const STEPS = ['Vehicle info', 'Ownership', 'Device & SIM', 'Plan & Payment'];

  /* ── helpers ─────────────────────────────────────────────────────── */
  /* All items shown are stock — badge is always "In stock" */
  function StockBadge() {
    return <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: '#dcfce7', color: '#15803d' }}>● In stock</span>;
  }

  return (
    <div style={{ padding: 24, width: '100%' }}>

      {/* ── Step indicator ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > i + 1 ? '#c4912a' : step === i + 1 ? '#c4912a' : 'var(--cream3)',
                color: step >= i + 1 ? '#fff' : 'var(--ink3)', transition: '0.2s',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 9, color: step === i + 1 ? '#c4912a' : 'var(--ink3)', fontWeight: step === i + 1 ? 700 : 400, whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: step > i + 1 ? '#c4912a' : 'var(--cream3)', margin: '0 8px', marginBottom: 18, borderRadius: 1, transition: '0.3s' }} />
            )}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          STEP 1 — Vehicle info
      ════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Plate number *</label>
              <input style={inp} value={form.plate} onChange={e => set('plate', e.target.value)} placeholder="e.g. ABC-1234" autoFocus />
            </div>
            <div>
              <label style={lbl}>Color</label>
              <input style={inp} value={form.color} onChange={e => set('color', e.target.value)} placeholder="White" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Make *</label>
              <input style={inp} value={form.make} onChange={e => set('make', e.target.value)} placeholder="Toyota" />
            </div>
            <div>
              <label style={lbl}>Model *</label>
              <input style={inp} value={form.model} onChange={e => set('model', e.target.value)} placeholder="Land Cruiser 200" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Year</label>
              <input style={inp} type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1990" max="2030" />
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select style={inp} value={form.category} onChange={e => set('category', e.target.value as VehicleCategory)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Engine number</label>
              <input style={inp} value={form.engineNo} onChange={e => set('engineNo', e.target.value)} placeholder="e.g. 1GR-FE-0012345" />
            </div>
            <div>
              <label style={lbl}>Chassis / VIN</label>
              <input style={inp} value={form.vin} onChange={e => set('vin', e.target.value)} placeholder="e.g. WDB9634031L123456" />
            </div>
          </div>
          {!form.plate && <p style={{ fontSize: 11, color: 'var(--ink3)', margin: 0 }}>Enter the vehicle plate number to continue.</p>}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          STEP 2 — Ownership
      ════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Read-only customer card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, border: '1.5px solid #c4912a', background: 'rgba(13,148,136,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#c4912a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
              {customer.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{customer.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{customer.industry} · {customer.city}, {customer.country}</div>
              {(customer.phone || customer.email) && (
                <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{customer.phone}{customer.phone && customer.email ? ' · ' : ''}{customer.email}</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: OWNER_TYPE_META[customer.type === 'Individual' ? 'Individual' : 'Company'].bg, color: OWNER_TYPE_META[customer.type === 'Individual' ? 'Individual' : 'Company'].fg }}>
                {OWNER_TYPE_META[customer.type === 'Individual' ? 'Individual' : 'Company'].icon} {customer.type}
              </span>
              <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: 'rgba(196,145,42,0.12)', color: '#c4912a' }}>✓ Pre-linked</span>
            </div>
          </div>

          {/* Ownership type */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5, marginBottom: 6 }}>OWNERSHIP TYPE</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {(Object.entries(OWNER_TYPE_META) as [OwnerType, { icon: string; bg: string; fg: string }][]).map(([type, meta]) => {
                const active = form.ownerType === type;
                return (
                  <button key={type} onClick={() => set('ownerType', type)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? meta.fg : 'var(--border2)'}`, background: active ? meta.bg : '#fff', color: active ? meta.fg : 'var(--ink3)', fontSize: 10, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: '0.15s' }}>
                    {meta.icon} {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference / ID */}
          <div>
            <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>
              {form.ownerType === 'Company' ? 'Company Reg No' : form.ownerType === 'Individual' ? 'National ID / Passport' : form.ownerType === 'Government' ? 'Gov Entity Ref' : form.ownerType === 'Leased' ? 'Lease Reference' : 'Finance Agreement Ref'}{' '}
              <span style={{ fontWeight: 400 }}>(optional)</span>
            </label>
            <input style={inp} value={form.ownerIdNo} onChange={e => set('ownerIdNo', e.target.value)}
              placeholder={form.ownerType === 'Company' ? 'e.g. CPR/2020/001234' : form.ownerType === 'Individual' ? 'e.g. 12345678' : 'Reference number'} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          STEP 3 — Device & SIM picker
      ════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* ── GPS Device picker ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>📡 GPS Device</div>
              {selectedDeviceId && (
                <button onClick={() => setSelectedDeviceId(null)}
                  style={{ fontSize: 10, color: '#c4912a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Clear ×
                </button>
              )}
            </div>
            <input style={{ ...inp, fontSize: 11 }} placeholder="Search model, IMEI…"
              value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 280, overflowY: 'auto', paddingRight: 2 }}>
              {/* None option */}
              <div onClick={() => setSelectedDeviceId(null)}
                style={{ padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${!selectedDeviceId ? '#c4912a' : 'var(--border)'}`, background: !selectedDeviceId ? 'rgba(13,148,136,0.05)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${!selectedDeviceId ? '#c4912a' : 'var(--border2)'}`, background: !selectedDeviceId ? '#c4912a' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!selectedDeviceId && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 11, color: 'var(--ink3)' }}>None — skip for now</span>
              </div>
              {/* Device rows */}
              {filteredDevices.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 11, color: 'var(--ink3)' }}>
                  {deviceSearch ? `No devices match "${deviceSearch}"` : 'No GPS devices available in stock for this tenant.'}
                </div>
              )}
              {filteredDevices.map(d => {
                const sel = selectedDeviceId === d.id;
                const ss  = DEVICE_STATUS_S[d.status] ?? DEVICE_STATUS_S.Offline;
                return (
                  <div key={d.id} onClick={() => setSelectedDeviceId(d.id)}
                    style={{ padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${sel ? '#c4912a' : 'var(--border)'}`, background: sel ? 'rgba(13,148,136,0.05)' : '#fff', cursor: 'pointer', transition: '0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${sel ? '#c4912a' : 'var(--border2)'}`, background: sel ? '#c4912a' : '#fff', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13 }}>{DEVICE_TYPE_ICON[d.type as DeviceType] ?? '📟'}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{d.model}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: ss.bg, color: ss.fg }}>{d.status}</span>
                          <StockBadge />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 3, fontFamily: 'monospace' }}>
                          IMEI: {d.imei}
                        </div>
                        {d.serialNo && <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 1 }}>S/N: {d.serialNo}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Selection summary */}
            {selectedDevice && (
              <div style={{ padding: '8px 10px', background: 'rgba(13,148,136,0.06)', border: '1px solid #c4912a', borderRadius: 7, fontSize: 10 }}>
                ✓ <strong>{selectedDevice.model}</strong> — {selectedDevice.imei}
              </div>
            )}
          </div>

          {/* ── SIM Card picker ───────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>📶 SIM Card</div>
              {selectedSimId && (
                <button onClick={() => setSelectedSimId(null)}
                  style={{ fontSize: 10, color: '#c4912a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Clear ×
                </button>
              )}
            </div>
            <input style={{ ...inp, fontSize: 11 }} placeholder="Search ICCID, operator…"
              value={simSearch} onChange={e => setSimSearch(e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 280, overflowY: 'auto', paddingRight: 2 }}>
              {/* None option */}
              <div onClick={() => setSelectedSimId(null)}
                style={{ padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${!selectedSimId ? '#c4912a' : 'var(--border)'}`, background: !selectedSimId ? 'rgba(13,148,136,0.05)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${!selectedSimId ? '#c4912a' : 'var(--border2)'}`, background: !selectedSimId ? '#c4912a' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!selectedSimId && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 11, color: 'var(--ink3)' }}>None — skip for now</span>
              </div>
              {/* SIM rows */}
              {filteredSims.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 11, color: 'var(--ink3)' }}>
                  {simSearch ? `No SIMs match "${simSearch}"` : 'No SIM cards available in stock for this tenant.'}
                </div>
              )}
              {filteredSims.map(s => {
                const sel = selectedSimId === s.id;
                const ss  = SIM_STATUS_S[s.status] ?? SIM_STATUS_S.Inactive;
                return (
                  <div key={s.id} onClick={() => setSelectedSimId(s.id)}
                    style={{ padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${sel ? '#c4912a' : 'var(--border)'}`, background: sel ? 'rgba(13,148,136,0.05)' : '#fff', cursor: 'pointer', transition: '0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${sel ? '#c4912a' : 'var(--border2)'}`, background: sel ? '#c4912a' : '#fff', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{s.operator}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: ss.bg, color: ss.fg }}>{s.status}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: '#ede9fe', color: '#7c3aed' }}>{s.type}</span>
                          <StockBadge />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 3, fontFamily: 'monospace' }}>
                          {s.iccid}
                        </div>
                        {s.msisdn && <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 1 }}>{s.msisdn}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Selection summary */}
            {selectedSim && (
              <div style={{ padding: '8px 10px', background: 'rgba(13,148,136,0.06)', border: '1px solid #c4912a', borderRadius: 7, fontSize: 10 }}>
                ✓ <strong>{selectedSim.operator}</strong> — {selectedSim.iccid}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          STEP 4 — Plan & Payment
      ════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div style={{ display: 'flex', gap: 20 }}>

          {/* Left: Plan selection */}
          <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Device / SIM summary strip */}
            {(selectedDevice || selectedSim) && (
              <div style={{ padding: '8px 10px', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedDevice && (
                  <span style={{ fontSize: 10, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {DEVICE_TYPE_ICON[selectedDevice.type as DeviceType] ?? '📟'} {selectedDevice.model}
                  </span>
                )}
                {selectedDevice && selectedSim && <span style={{ fontSize: 10, color: 'var(--ink3)' }}>·</span>}
                {selectedSim && (
                  <span style={{ fontSize: 10, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    📶 {selectedSim.operator}
                  </span>
                )}
              </div>
            )}

            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5 }}>PLATFORM PLANS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {PLAN_ORDER.map(pn => {
                const p   = PLANS[pn];
                const sel = form.selectedPlanId === pn;
                return (
                  <div key={pn} onClick={() => { set('selectedPlanId', pn); setPayStatus('idle'); }}
                    style={{ padding: '9px 10px', borderRadius: 8, border: `2px solid ${sel ? p.color : 'var(--border)'}`, background: sel ? p.color + '10' : '#fff', cursor: 'pointer', transition: '0.15s', position: 'relative' }}>
                    {p.highlight && <span style={{ position: 'absolute', top: -1, right: 4, fontSize: 6, fontWeight: 700, padding: '1px 4px', borderRadius: 10, background: p.color, color: '#fff' }}>POPULAR</span>}
                    <div style={{ fontSize: 11, fontWeight: 700, color: sel ? p.color : 'var(--ink)' }}>{p.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: sel ? p.color : 'var(--ink)', marginTop: 3 }}>${p.price}<span style={{ fontSize: 8, fontWeight: 400, color: 'var(--ink3)' }}>/mo</span></div>
                    <div style={{ fontSize: 8, color: 'var(--ink3)', marginTop: 2 }}>{p.services.length} services</div>
                    {sel && <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 12, color: p.color }}>✓</div>}
                  </div>
                );
              })}
            </div>
            {customPlans.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5, marginTop: 4 }}>YOUR CUSTOM PLANS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {customPlans.map(cp => {
                    const sel = form.selectedPlanId === cp.id;
                    return (
                      <div key={cp.id} onClick={() => { set('selectedPlanId', cp.id); setPayStatus('idle'); }}
                        style={{ padding: '9px 10px', borderRadius: 8, border: `2px solid ${sel ? cp.color : 'var(--border)'}`, background: sel ? cp.color + '10' : '#fff', cursor: 'pointer', transition: '0.15s', position: 'relative', borderTop: `3px solid ${cp.color}` }}>
                        {cp.highlight && <span style={{ position: 'absolute', top: -1, right: 4, fontSize: 6, fontWeight: 700, padding: '1px 4px', borderRadius: 10, background: cp.color, color: '#fff' }}>POPULAR</span>}
                        {cp.isDefault  && <span style={{ position: 'absolute', top: -1, right: cp.highlight ? 46 : 4, fontSize: 6, fontWeight: 700, padding: '1px 4px', borderRadius: 10, background: '#d97706', color: '#fff' }}>DEFAULT</span>}
                        <div style={{ fontSize: 11, fontWeight: 700, color: sel ? cp.color : 'var(--ink)' }}>{cp.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: sel ? cp.color : 'var(--ink)', marginTop: 3 }}>${cp.price}<span style={{ fontSize: 8, fontWeight: 400, color: 'var(--ink3)' }}>/mo</span></div>
                        <div style={{ fontSize: 8, color: 'var(--ink3)', marginTop: 2 }}>{cp.services.length} services</div>
                        {sel && <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 12, color: cp.color }}>✓</div>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {/* Auto-renew */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)', marginTop: 4 }}>
              <label style={{ position: 'relative', display: 'inline-block', width: 28, height: 16, flexShrink: 0 }}>
                <input type="checkbox" checked={form.autoRenew} onChange={e => set('autoRenew', e.target.checked)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: form.autoRenew ? '#c4912a' : '#d1d5db', borderRadius: 16, transition: '0.2s' }}>
                  <span style={{ position: 'absolute', height: 12, width: 12, left: form.autoRenew ? 14 : 2, bottom: 2, background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
                </span>
              </label>
              <span style={{ fontSize: 10, color: 'var(--ink2)' }}>Auto-renew annually</span>
            </div>
          </div>

          {/* Right: Payment */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '12px 14px', background: form.selectedPlanId ? planColor + '08' : 'var(--cream)', borderRadius: 10, border: `1px solid ${form.selectedPlanId ? planColor + '30' : 'var(--border)'}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5, marginBottom: 8 }}>BILLING SUMMARY</div>
              {form.selectedPlanId ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: planColor }}>{planLabel}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>${planPrice}<span style={{ fontSize: 9, color: 'var(--ink3)' }}>/mo</span></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink3)', marginBottom: 2 }}>
                    <span>Billing period</span><span>Annual (12 months)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink3)', marginBottom: 8 }}>
                    <span>Vehicle</span><span style={{ fontWeight: 600, color: 'var(--ink)' }}>{form.plate || '—'}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>Total due today</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: planColor }}>${annualTotal}</span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--ink3)', textAlign: 'center', padding: '8px 0' }}>← Select a plan to see billing details</div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5, marginBottom: 6 }}>PAYMENT METHOD</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {([
                  { id: 'mpesa',  icon: '📱', label: 'M-Pesa'  },
                  { id: 'bank',   icon: '🏦', label: 'Bank'    },
                  { id: 'manual', icon: '📄', label: 'Invoice' },
                ] as { id: PaymentMethod; icon: string; label: string }[]).map(pm => (
                  <button key={pm.id} onClick={() => { set('paymentMethod', pm.id); setPayStatus('idle'); }}
                    style={{ flex: 1, padding: '7px 4px', borderRadius: 7, border: `2px solid ${form.paymentMethod === pm.id ? '#c4912a' : 'var(--border)'}`, background: form.paymentMethod === pm.id ? 'rgba(13,148,136,0.07)' : '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: form.paymentMethod === pm.id ? '#c4912a' : 'var(--ink3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 16 }}>{pm.icon}</span>{pm.label}
                  </button>
                ))}
              </div>
              {form.paymentMethod === 'mpesa' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={lbl}>M-Pesa phone number</label>
                    <input style={inp} value={form.mpesaPhone || customer.phone || ''} onChange={e => set('mpesaPhone', e.target.value)} placeholder="+254 7XX XXX XXX" />
                  </div>
                  {payStatus === 'idle' && (
                    <button onClick={sendMpesa} disabled={!form.selectedPlanId}
                      style={{ padding: '9px', borderRadius: 7, border: 'none', background: form.selectedPlanId ? '#16a34a' : 'var(--cream3)', color: form.selectedPlanId ? '#fff' : 'var(--ink3)', fontSize: 11, fontWeight: 700, cursor: form.selectedPlanId ? 'pointer' : 'not-allowed' }}>
                      📱 Send STK Push · ${annualTotal}
                    </button>
                  )}
                  {payStatus === 'processing' && (
                    <div style={{ padding: '10px', borderRadius: 7, background: '#fefce8', border: '1px solid #fde68a', textAlign: 'center', fontSize: 11, color: '#92400e' }}>
                      ⏳ Awaiting M-Pesa confirmation on {form.mpesaPhone || customer.phone || 'your phone'}…
                    </div>
                  )}
                  {payStatus === 'confirmed' && (
                    <div style={{ padding: '10px', borderRadius: 7, background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center', fontSize: 11, color: '#15803d', fontWeight: 600 }}>
                      ✅ Payment confirmed · ${annualTotal} received
                    </div>
                  )}
                </div>
              )}
              {form.paymentMethod === 'bank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '10px 12px', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 10, lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Transfer to:</div>
                    <div><span style={{ color: 'var(--ink3)' }}>Bank:</span> <strong>Chase Bank USA</strong></div>
                    <div><span style={{ color: 'var(--ink3)' }}>Account:</span> <span style={{ fontFamily: 'monospace' }}>1234 5678 90</span></div>
                    <div><span style={{ color: 'var(--ink3)' }}>Branch:</span> Midtown, New York, NY</div>
                    <div style={{ marginTop: 4 }}><span style={{ color: 'var(--ink3)' }}>Reference:</span> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c4912a' }}>FOS-{form.plate.replace(/\s/g, '')}</span></div>
                  </div>
                  {payStatus !== 'confirmed'
                    ? <button onClick={confirmBankTransfer} disabled={!form.selectedPlanId}
                        style={{ padding: '9px', borderRadius: 7, border: 'none', background: form.selectedPlanId ? '#c4912a' : 'var(--cream3)', color: form.selectedPlanId ? '#fff' : 'var(--ink3)', fontSize: 11, fontWeight: 700, cursor: form.selectedPlanId ? 'pointer' : 'not-allowed' }}>
                        ✓ I have made the transfer
                      </button>
                    : <div style={{ padding: '10px', borderRadius: 7, background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center', fontSize: 11, color: '#15803d', fontWeight: 600 }}>
                        ✅ Transfer confirmed — pending clearance
                      </div>
                  }
                </div>
              )}
              {form.paymentMethod === 'manual' && (
                <div style={{ padding: '10px 12px', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 10, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>📄 Invoice on registration</div>
                  <div style={{ color: 'var(--ink3)' }}>An invoice for <strong style={{ color: 'var(--ink)' }}>${annualTotal || '—'}</strong> will be generated and emailed to <strong style={{ color: 'var(--ink)' }}>{customer.email || 'the owner'}</strong> upon registration.</div>
                  <div style={{ marginTop: 6, color: 'var(--ink3)' }}>Payment due within <strong>30 days</strong> of invoice date. Vehicle is active immediately.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        {saveError && (
          <div style={{ padding: '7px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, color: '#dc2626', marginBottom: 10 }}>
            ⚠ {saveError}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} disabled={saving}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border2)', background: '#fff', fontSize: 12, cursor: 'pointer', color: 'var(--ink2)' }}>
                ← Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginRight: 8 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ width: i + 1 === step ? 18 : 6, height: 6, borderRadius: 3, background: i + 1 <= step ? '#c4912a' : 'var(--cream3)', transition: '0.2s' }} />
              ))}
            </div>
            {step < 4 && (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext || saving}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: canNext ? '#c4912a' : 'var(--cream3)', color: canNext ? '#fff' : 'var(--ink3)', fontSize: 12, cursor: canNext ? 'pointer' : 'not-allowed', fontWeight: 600, transition: '0.15s' }}>
                Next →
              </button>
            )}
            {step === 4 && (
              <button onClick={handleRegister} disabled={saving || !canRegister}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: canRegister && !saving ? '#c4912a' : 'var(--cream3)', color: canRegister && !saving ? '#fff' : 'var(--ink3)', fontSize: 12, cursor: canRegister && !saving ? 'pointer' : 'not-allowed', fontWeight: 700, transition: '0.15s' }}>
                {saving ? 'Registering…' : '✓ Register vehicle'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
