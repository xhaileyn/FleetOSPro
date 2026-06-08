'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import {
  VehicleMaster, VehicleCategory, FuelType, OwnerType,
  TENANTS_META, getExpiringDocuments,
  getOverdueMaintenance, daysUntilExpiry, addVehicle,
} from '@/lib/vehiclesMaster';
import { VehiclePin } from '@/components/maps/FleetMap';
import { VehicleTrackingModal } from '@/components/tracking/VehicleTrackingModal';
import { SubscriptionModal } from '@/components/vehicles/SubscriptionModal';
import { Customer } from '@/lib/customers';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useCustomersStore } from '@/store/customersStore';
import { useRefDataStore } from '@/store/refDataStore';
import {
  getSubscription, computeSubStatus, daysUntilSubExpiry,
  isServiceEnabled, getExpiryReport, PLANS, PLAN_ORDER, getCustomPlans, saveSubscription, genPlanId,
  type SubStatus, type PlanName, type CustomPlanDef,
} from '@/lib/subscriptions';

/* ── build a VehiclePin from master data ───────────────────────────── */
function pinFromVehicle(v: VehicleMaster): VehiclePin | null {
  if (v.latitude === null || v.longitude === null) return null;
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

/* ── helpers ───────────────────────────────────────────────────────── */
const STATUS_DOT: Record<string, string> = {
  active: '#c4912a', idle: 'var(--amber)',
  offline: 'var(--ink3)', maintenance: 'var(--red)', disposed: '#999',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Active', idle: 'Idle', offline: 'Offline',
  maintenance: 'Maintenance', disposed: 'Disposed',
};

/* ── Shared UI primitives (matching Live Dashboard style) ────────── */
function KpiCard({ icon, iconColor, label, value, unit, sub, subColor, stripe, onClick, trend }: {
  icon: string; iconColor?: string; label: string; value: string | number; unit?: string;
  sub?: string; subColor?: string; stripe?: string; onClick?: () => void; trend?: 'up' | 'down' | 'flat';
}) {
  const chipBg = (iconColor ?? '#c4912a') + '15';
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid var(--border)', borderRadius: 7,
        padding: '8px 10px', cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, border-color 0.15s', position: 'relative',
        overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: 10,
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
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1, color: 'var(--ink)' }}>
          {value}{unit && <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: 0, marginLeft: 2 }}>{unit}</span>}
        </div>
        {sub && <div style={{ fontSize: 9, marginTop: 2, color: subColor ?? 'var(--ink3)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
      {trend && (
        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 10, flexShrink: 0,
          background: trend === 'up' ? 'var(--red-lt)' : trend === 'down' ? 'var(--green-lt)' : 'var(--cream2)',
          color: trend === 'up' ? 'var(--red)' : trend === 'down' ? 'var(--green)' : 'var(--ink3)' }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      )}
    </div>
  );
}

function SectionHeader({ title, icon, action }: { title: string; icon?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 12, color: 'var(--ink3)' }} />}
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{title}</span>
      </div>
      {action}
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
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        padding: pad[size], fontSize: fs[size], borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit', fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 5,
        transition: 'opacity 0.15s', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = disabled ? '0.5' : '1'}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const PILL: Record<string, React.CSSProperties> = {
    active:      { background: 'rgba(196,145,42,0.12)',  color: '#c4912a', border: '1px solid #6ee7b7' },
    idle:        { background: '#fffbeb',          color: '#d97706',        border: '1px solid #fde68a' },
    offline:     { background: 'var(--cream2)',    color: 'var(--ink3)',    border: '1px solid var(--border2)' },
    maintenance: { background: 'var(--blue-lt)',   color: 'var(--blue)',    border: '1px solid #bfdbfe' },
    disposed:    { background: 'var(--red-lt)',    color: 'var(--red)',     border: '1px solid #fecaca' },
  };
  const ICON: Record<string, string> = {
    active: 'ti-player-play', idle: 'ti-player-pause',
    offline: 'ti-wifi-off', maintenance: 'ti-tool', disposed: 'ti-trash',
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, ...(PILL[status] ?? PILL.offline) }}>
      <i className={`ti ${ICON[status] ?? 'ti-circle'}`} style={{ fontSize: 9 }} />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function DocAlertBadge({ count, label }: { count: number; label: string }) {
  if (!count) return null;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--red-lt)', color: 'var(--red)', border: '1px solid #fca5a580', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 8 }} /> {count} {label}
    </span>
  );
}

function TenantChip({ tenantId }: { tenantId: string }) {
  const meta = TENANTS_META[tenantId];
  if (!meta) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: meta.color + '18', color: meta.color, border: `1px solid ${meta.color}40` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color }} />
      {meta.name}
    </span>
  );
}

/* ── Subscription badge ─────────────────────────────────────────────── */
const SUB_STATUS_STYLE: Record<SubStatus, React.CSSProperties> = {
  Active:          { background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7' },
  'Expiring Soon': { background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' },
  Expired:         { background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' },
  Suspended:       { background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' },
};

function SubBadge({ vehicleId }: { vehicleId: string }) {
  const sub = getSubscription(vehicleId);
  if (!sub) return <span style={{ fontSize: 10, color: 'var(--ink3)' }}>—</span>;
  const status   = computeSubStatus(sub);
  const daysLeft = daysUntilSubExpiry(sub.expiryDate);
  const plan     = PLANS[sub.plan];
  const customPlan = sub.customPlanId ? getCustomPlans('1').find(p => p.id === sub.customPlanId) : null;
  const badgeLabel = customPlan ? customPlan.name : sub.plan;
  const badgeColor = customPlan ? customPlan.color : plan.color;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, display: 'inline-block', background: badgeColor + '18', color: badgeColor, border: `1px solid ${badgeColor}40` }}>
        {badgeLabel}
      </span>
      <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3, display: 'inline-block', ...SUB_STATUS_STYLE[status] }}>
        {status === 'Expired'
          ? `Expired ${Math.abs(daysLeft)}d ago`
          : status === 'Expiring Soon'
          ? `Expires in ${daysLeft}d`
          : `Valid · ${new Date(sub.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}`}
      </span>
    </div>
  );
}

/* ── Registration Wizard ──────────────────────────────────────────── */
type PaymentMethod = 'mpesa' | 'bank' | 'manual';
type PaymentStatus = 'idle' | 'processing' | 'confirmed';

interface WizardState {
  plate: string; make: string; model: string; year: string;
  category: VehicleCategory; color: string;
  engineNo: string; vin: string;
  ownerId: string; ownerType: OwnerType; ownerIdNo: string;
  selectedPlanId: string; autoRenew: boolean;
  paymentMethod: PaymentMethod; mpesaPhone: string;
}
const DEFAULT_WIZARD: WizardState = {
  plate: '', make: '', model: '', year: String(new Date().getFullYear()),
  category: 'Truck', color: 'White', engineNo: '', vin: '',
  ownerId: '', ownerType: 'Company', ownerIdNo: '',
  selectedPlanId: '', autoRenew: true, paymentMethod: 'mpesa', mpesaPhone: '',
};

const OWNER_TYPE_META: Record<OwnerType, { icon: string; bg: string; fg: string }> = {
  Company:    { icon: '🏢', bg: '#dbeafe', fg: '#1d4ed8' },
  Individual: { icon: '👤', bg: '#dcfce7', fg: '#15803d' },
  Government: { icon: '🏛️', bg: '#fef3c7', fg: '#d97706' },
  Leased:     { icon: '📝', bg: '#f3e8ff', fg: '#7c3aed' },
  Finance:    { icon: '🏦', bg: '#ffedd5', fg: '#c2410c' },
};

function RegisterWizard({ onClose, onSaved, tenantCustomers, preCustomerId, tenantId }: {
  onClose: () => void; onSaved?: () => void;
  tenantCustomers: Customer[]; preCustomerId?: string; tenantId: string;
}) {
  const storeAddVehicle     = useVehiclesStore(s => s.addVehicle);
  const refVehicleCategories = useRefDataStore(s => s.vehicleCategories);
  const [step, setStep]             = useState(1);
  const [form, setForm]             = useState<WizardState>(() => ({
    ...DEFAULT_WIZARD, ownerId: preCustomerId ?? '',
    ownerType: preCustomerId
      ? (tenantCustomers.find(c => c.id === preCustomerId)?.type === 'Individual' ? 'Individual' : 'Company')
      : 'Company',
  }));
  const [payStatus, setPayStatus]   = useState<PaymentStatus>('idle');
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');

  const customPlans = getCustomPlans('1').filter(p => p.status === 'active');
  const set = (k: keyof WizardState, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const selectedOwner = tenantCustomers.find(c => c.id === form.ownerId);

  const isPlatformPlan   = PLAN_ORDER.includes(form.selectedPlanId as PlanName);
  const platformPlanMeta = isPlatformPlan ? PLANS[form.selectedPlanId as PlanName] : null;
  const customPlanMeta   = !isPlatformPlan ? customPlans.find(p => p.id === form.selectedPlanId) : null;
  const planLabel        = platformPlanMeta?.name ?? customPlanMeta?.name ?? '—';
  const planPrice        = platformPlanMeta?.price ?? customPlanMeta?.price ?? 0;
  const planColor        = platformPlanMeta?.color ?? customPlanMeta?.color ?? '#c4912a';
  const annualTotal      = planPrice * 12;

  const canNext = step === 1
    ? !!(form.plate && form.make && form.model)
    : step === 2 ? !!form.ownerId : false;
  const canRegister = !!(form.selectedPlanId && (payStatus === 'confirmed' || form.paymentMethod === 'manual'));

  const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid var(--border2)', borderRadius: 6, fontSize: 12, color: 'var(--ink)', background: '#fff', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: 'var(--ink3)', letterSpacing: 0.5, marginBottom: 3, display: 'block' };

  function sendMpesa() { setPayStatus('processing'); setTimeout(() => setPayStatus('confirmed'), 2200); }
  function confirmBankTransfer() { setPayStatus('confirmed'); }

  async function handleRegister() {
    setSaving(true); setSaveError('');
    try {
      const res = await fetch('/api/v1/vehicles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId, plate: form.plate.trim().toUpperCase(), make: form.make.trim(),
          model: form.model.trim(), year: form.year, category: form.category,
          color: form.color.trim() || 'White', engineNo: form.engineNo.trim(),
          vin: form.vin.trim().toUpperCase(),
          customerId: selectedOwner?.id ?? null, customerName: selectedOwner?.name ?? null,
          department: selectedOwner?.industry ?? null, ownerType: form.ownerType,
          ownerName: selectedOwner?.name ?? null, ownerIdNo: form.ownerIdNo.trim() || null,
          ownerContact: selectedOwner?.phone ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError((err as { message?: string }).message ?? 'Failed to register vehicle.');
        setSaving(false); return;
      }
      const newVehicle = await res.json();
      storeAddVehicle(newVehicle);
      if (form.selectedPlanId) {
        const today = new Date(), expiry = new Date(today);
        expiry.setFullYear(expiry.getFullYear() + 1);
        saveSubscription({
          vehicleId: newVehicle.id,
          plan: (isPlatformPlan ? form.selectedPlanId : 'Basic') as PlanName,
          ...(customPlanMeta ? { customPlanId: form.selectedPlanId } : {}),
          startDate: today.toISOString().slice(0, 10),
          expiryDate: expiry.toISOString().slice(0, 10),
          autoRenew: form.autoRenew,
          ...(selectedOwner ? { contactEmail: selectedOwner.email } : {}),
        });
      }
      onSaved?.(); onClose();
    } catch { setSaveError('Network error — please try again.'); }
    finally { setSaving(false); }
  }

  const STEPS = ['Vehicle info', 'Ownership', 'Plan & Payment'];

  return (
    <div style={{ padding: 24, width: '100%' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= i + 1 ? '#c4912a' : 'var(--cream3)', color: step >= i + 1 ? '#fff' : 'var(--ink3)', transition: '0.2s' }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 9, color: step === i + 1 ? '#c4912a' : 'var(--ink3)', fontWeight: step === i + 1 ? 700 : 400, whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? '#c4912a' : 'var(--cream3)', margin: '0 8px', marginBottom: 18, borderRadius: 1, transition: '0.3s' }} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Vehicle info */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Plate number *</label><input style={inputStyle} value={form.plate} onChange={e => set('plate', e.target.value)} placeholder="e.g. ABC-1234" autoFocus /></div>
            <div><label style={labelStyle}>Color</label><input style={inputStyle} value={form.color} onChange={e => set('color', e.target.value)} placeholder="White" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Make *</label><input style={inputStyle} value={form.make} onChange={e => set('make', e.target.value)} placeholder="Toyota" /></div>
            <div><label style={labelStyle}>Model *</label><input style={inputStyle} value={form.model} onChange={e => set('model', e.target.value)} placeholder="Land Cruiser 200" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Year</label><input style={inputStyle} type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1990" max="2030" /></div>
            <div><label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value as VehicleCategory)}>
                {refVehicleCategories.map(c => <option key={c.value}>{c.value}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Engine number</label><input style={inputStyle} value={form.engineNo} onChange={e => set('engineNo', e.target.value)} placeholder="e.g. 1GR-FE-0012345" /></div>
            <div><label style={labelStyle}>Chassis / VIN</label><input style={inputStyle} value={form.vin} onChange={e => set('vin', e.target.value)} placeholder="e.g. WDB9634031L123456" /></div>
          </div>
          {!form.plate && <p style={{ fontSize: 11, color: 'var(--ink3)', margin: 0 }}>Enter the vehicle plate number to continue.</p>}
        </div>
      )}

      {/* Step 2 — Ownership */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {selectedOwner ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, border: '1.5px solid #c4912a', background: 'rgba(13,148,136,0.04)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#c4912a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                  {selectedOwner.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{selectedOwner.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{selectedOwner.industry} · {selectedOwner.city}, {selectedOwner.country}</div>
                  {(selectedOwner.phone || selectedOwner.email) && (
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>
                      {selectedOwner.phone}{selectedOwner.phone && selectedOwner.email ? ' · ' : ''}{selectedOwner.email}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: OWNER_TYPE_META[selectedOwner.type === 'Individual' ? 'Individual' : 'Company'].bg, color: OWNER_TYPE_META[selectedOwner.type === 'Individual' ? 'Individual' : 'Company'].fg }}>
                    {OWNER_TYPE_META[selectedOwner.type === 'Individual' ? 'Individual' : 'Company'].icon} {selectedOwner.type}
                  </span>
                  {selectedOwner.vehiclesAssigned > 0 && (
                    <span style={{ fontSize: 9, color: 'var(--ink3)' }}>🚛 {selectedOwner.vehiclesAssigned} existing vehicle{selectedOwner.vehiclesAssigned !== 1 ? 's' : ''}</span>
                  )}
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: 'rgba(196,145,42,0.12)', color: '#c4912a' }}>✓ Pre-linked</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5, marginBottom: 6 }}>OWNERSHIP TYPE</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {(Object.entries(OWNER_TYPE_META) as [OwnerType, { icon: string; bg: string; fg: string }][]).map(([type, meta]) => {
                    const active = form.ownerType === type;
                    return (
                      <button key={type} onClick={() => set('ownerType', type)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? meta.fg : 'var(--border2)'}`, background: active ? meta.bg : '#fff', color: active ? meta.fg : 'var(--ink3)', fontSize: 10, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: '0.15s' }}>
                        <span>{meta.icon}</span>{type}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>
                  {form.ownerType === 'Company' ? 'Company Reg No' : form.ownerType === 'Individual' ? 'National ID / Passport' : form.ownerType === 'Government' ? 'Gov Entity Ref' : form.ownerType === 'Leased' ? 'Lease Reference' : 'Finance Agreement Ref'} <span style={{ fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border2)', borderRadius: 6, fontSize: 12, color: 'var(--ink)', background: '#fff', boxSizing: 'border-box' as const }}
                  value={form.ownerIdNo} onChange={e => set('ownerIdNo', e.target.value)}
                  placeholder={form.ownerType === 'Company' ? 'e.g. CPR/2020/001234' : form.ownerType === 'Individual' ? 'e.g. 12345678' : 'Reference number'}
                />
              </div>
            </>
          ) : (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink3)', fontSize: 12 }}>
              No customer linked. Please open this wizard from a customer&apos;s profile page.
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Plan & Payment */}
      {step === 3 && (
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5 }}>PLATFORM PLANS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {PLAN_ORDER.map(pn => {
                const p = PLANS[pn]; const sel = form.selectedPlanId === pn;
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
            {customPlans.length > 0 && <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5, marginTop: 4 }}>YOUR CUSTOM PLANS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {customPlans.map(cp => {
                  const sel = form.selectedPlanId === cp.id;
                  return (
                    <div key={cp.id} onClick={() => { set('selectedPlanId', cp.id); setPayStatus('idle'); }}
                      style={{ padding: '9px 10px', borderRadius: 8, border: `2px solid ${sel ? cp.color : 'var(--border)'}`, background: sel ? cp.color + '10' : '#fff', cursor: 'pointer', transition: '0.15s', position: 'relative', borderTop: `3px solid ${cp.color}` }}>
                      {cp.highlight && <span style={{ position: 'absolute', top: -1, right: 4, fontSize: 6, fontWeight: 700, padding: '1px 4px', borderRadius: 10, background: cp.color, color: '#fff' }}>POPULAR</span>}
                      {cp.isDefault && <span style={{ position: 'absolute', top: -1, right: cp.highlight ? 46 : 4, fontSize: 6, fontWeight: 700, padding: '1px 4px', borderRadius: 10, background: '#d97706', color: '#fff' }}>DEFAULT</span>}
                      <div style={{ fontSize: 11, fontWeight: 700, color: sel ? cp.color : 'var(--ink)' }}>{cp.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: sel ? cp.color : 'var(--ink)', marginTop: 3 }}>${cp.price}<span style={{ fontSize: 8, fontWeight: 400, color: 'var(--ink3)' }}>/mo</span></div>
                      <div style={{ fontSize: 8, color: 'var(--ink3)', marginTop: 2 }}>{cp.services.length} services</div>
                      {sel && <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 12, color: cp.color }}>✓</div>}
                    </div>
                  );
                })}
              </div>
            </>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)', marginTop: 4 }}>
              <label style={{ position: 'relative', display: 'inline-block', width: 28, height: 16, flexShrink: 0 }}>
                <input type="checkbox" checked={form.autoRenew} onChange={e => set('autoRenew', e.target.checked)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: form.autoRenew ? '#c4912a' : '#d1d5db', borderRadius: 16, transition: '0.2s' }}><span style={{ position: 'absolute', height: 12, width: 12, left: form.autoRenew ? 14 : 2, bottom: 2, background: '#fff', borderRadius: '50%', transition: '0.2s' }} /></span>
              </label>
              <span style={{ fontSize: 10, color: 'var(--ink2)' }}>Auto-renew annually</span>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '12px 14px', background: form.selectedPlanId ? planColor + '08' : 'var(--cream)', borderRadius: 10, border: `1px solid ${form.selectedPlanId ? planColor + '30' : 'var(--border)'}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5, marginBottom: 8 }}>BILLING SUMMARY</div>
              {form.selectedPlanId ? <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: planColor }}>{planLabel}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>${planPrice}<span style={{ fontSize: 9, color: 'var(--ink3)' }}>/mo</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink3)', marginBottom: 2 }}><span>Billing period</span><span>Annual (12 months)</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink3)', marginBottom: 8 }}><span>Vehicle</span><span style={{ fontWeight: 600, color: 'var(--ink)' }}>{form.plate || '—'}</span></div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Total due today</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: planColor }}>${annualTotal}</span>
                </div>
              </> : (
                <div style={{ fontSize: 11, color: 'var(--ink3)', textAlign: 'center', padding: '8px 0' }}>← Select a plan to see billing details</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.5, marginBottom: 6 }}>PAYMENT METHOD</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {([
                  { id: 'mpesa', icon: '📱', label: 'M-Pesa' },
                  { id: 'bank', icon: '🏦', label: 'Bank' },
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
                  <div><label style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink3)', letterSpacing: 0.5, marginBottom: 3, display: 'block' }}>M-Pesa phone number</label><input style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border2)', borderRadius: 6, fontSize: 12, color: 'var(--ink)', background: '#fff', boxSizing: 'border-box' as const }} value={form.mpesaPhone || selectedOwner?.phone || ''} onChange={e => set('mpesaPhone', e.target.value)} placeholder="+254 7XX XXX XXX" /></div>
                  {payStatus === 'idle' && <button onClick={sendMpesa} disabled={!form.selectedPlanId} style={{ padding: '9px', borderRadius: 7, border: 'none', background: form.selectedPlanId ? '#16a34a' : 'var(--cream3)', color: form.selectedPlanId ? '#fff' : 'var(--ink3)', fontSize: 11, fontWeight: 700, cursor: form.selectedPlanId ? 'pointer' : 'not-allowed' }}>📱 Send STK Push · ${annualTotal}</button>}
                  {payStatus === 'processing' && <div style={{ padding: '10px', borderRadius: 7, background: '#fefce8', border: '1px solid #fde68a', textAlign: 'center', fontSize: 11, color: '#92400e' }}>⏳ Awaiting M-Pesa confirmation on {form.mpesaPhone || selectedOwner?.phone || 'your phone'}…</div>}
                  {payStatus === 'confirmed' && <div style={{ padding: '10px', borderRadius: 7, background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center', fontSize: 11, color: '#15803d', fontWeight: 600 }}>✅ Payment confirmed · ${annualTotal} received</div>}
                </div>
              )}
              {form.paymentMethod === 'bank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '10px 12px', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 10, lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Transfer to:</div>
                    <div><span style={{ color: 'var(--ink3)' }}>Bank:</span> <strong>Chase Bank USA</strong></div>
                    <div><span style={{ color: 'var(--ink3)' }}>Account:</span> <span style={{ fontFamily: 'monospace' }}>1234 5678 90</span></div>
                    <div><span style={{ color: 'var(--ink3)' }}>Branch:</span> Midtown, New York, NY</div>
                    <div style={{ marginTop: 4 }}><span style={{ color: 'var(--ink3)' }}>Reference:</span> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c4912a' }}>FOS-{form.plate.replace(/\s/g, '')}</span></div>
                  </div>
                  {payStatus !== 'confirmed'
                    ? <button onClick={confirmBankTransfer} disabled={!form.selectedPlanId} style={{ padding: '9px', borderRadius: 7, border: 'none', background: form.selectedPlanId ? '#c4912a' : 'var(--cream3)', color: form.selectedPlanId ? '#fff' : 'var(--ink3)', fontSize: 11, fontWeight: 700, cursor: form.selectedPlanId ? 'pointer' : 'not-allowed' }}>✓ I have made the transfer</button>
                    : <div style={{ padding: '10px', borderRadius: 7, background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center', fontSize: 11, color: '#15803d', fontWeight: 600 }}>✅ Transfer confirmed — pending clearance</div>}
                </div>
              )}
              {form.paymentMethod === 'manual' && (
                <div style={{ padding: '10px 12px', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 10, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>📄 Invoice on registration</div>
                  <div style={{ color: 'var(--ink3)' }}>An invoice for <strong style={{ color: 'var(--ink)' }}>${annualTotal || '—'}</strong> will be generated and emailed to <strong style={{ color: 'var(--ink)' }}>{selectedOwner?.email || 'the owner'}</strong> upon registration.</div>
                  <div style={{ marginTop: 6, color: 'var(--ink3)' }}>Payment due within <strong>30 days</strong> of invoice date. Vehicle is active immediately.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        {saveError && (
          <div style={{ padding: '7px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, color: '#dc2626', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 13 }} /> {saveError}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>{step > 1 && <Btn onClick={() => setStep(s => s - 1)} disabled={saving} variant="default" size="sm"><i className="ti ti-arrow-left" style={{ fontSize: 12 }} /> Back</Btn>}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginRight: 8 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ width: i + 1 === step ? 18 : 6, height: 6, borderRadius: 3, background: i + 1 <= step ? '#c4912a' : 'var(--cream3)', transition: '0.2s' }} />
              ))}
            </div>
            {step < 3 && <Btn onClick={() => setStep(s => s + 1)} disabled={!canNext || saving} variant="primary" size="sm">Next <i className="ti ti-arrow-right" style={{ fontSize: 12 }} /></Btn>}
            {step === 3 && <Btn onClick={handleRegister} disabled={saving || !canRegister} variant="primary" size="md"><i className="ti ti-check" style={{ fontSize: 13 }} /> {saving ? 'Registering…' : 'Register vehicle'}</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Vehicle table row ──────────────────────────────────────────────── */
function VehicleRow({ v, showTenant, i, onTrack, onManageSub }: {
  v: VehicleMaster; showTenant: boolean; i: number;
  onTrack: (v: VehicleMaster) => void; onManageSub: (v: VehicleMaster) => void;
}) {
  const router             = useRouter();
  const setSelectedVehicleId = useUIStore(s => s.setSelectedVehicleId);
  const expiredDocs  = v.documents.filter(d => d.status === 'Expired');
  const expiringSoon = v.documents.filter(d => d.status === 'Expiring Soon');
  const overdueM     = v.maintenance.filter(m => m.status === 'Overdue');
  return (
    <tr
      onClick={() => { setSelectedVehicleId(v.id); router.push(`/vehicles/${v.id}`); }}
      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(13,148,136,0.04)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : 'var(--cream)'; }}
      style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--cream)', cursor: 'pointer', transition: 'background 0.12s' }}
    >
      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
        {v.vid
          ? <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#c4912a', background:'rgba(196,145,42,0.10)', padding:'2px 6px', borderRadius:4, border:'1px solid rgba(196,145,42,0.22)' }}>#{v.vid}</span>
          : <span style={{ color:'var(--ink3)', fontSize:11 }}>—</span>}
      </td>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ fontWeight: 700, color: 'var(--ink)', letterSpacing: 0.5, fontSize: 13 }}>{v.plate}</div>
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>{v.year} {v.make} {v.model}</div>
      </td>
      <td style={{ padding: '10px 14px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink2)', padding: '2px 7px', borderRadius: 4, background: 'var(--cream2)', border: '1px solid var(--border)' }}>{v.category}</span>
      </td>
      {showTenant && <td style={{ padding: '10px 14px' }}><TenantChip tenantId={v.tenantId} /></td>}
      <td style={{ padding: '10px 14px' }}>
        {v.customerName
          ? <>
              <div style={{ color: 'var(--ink)', fontWeight: 500, fontSize: 12 }}>{v.customerName}</div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 1, display:'flex', alignItems:'center', gap:4 }}>
                {v.cid
                  ? <span style={{ fontFamily:'monospace', fontWeight:700, color:'#c4912a' }}>CID #{v.cid}</span>
                  : null}
                {v.department ? <span>{v.cid ? ' · ' : ''}{v.department}</span> : null}
              </div>
            </>
          : <span style={{ fontSize: 11, color: 'var(--ink3)', fontStyle: 'italic' }}>Unassigned</span>}
      </td>
      <td style={{ padding: '10px 14px', color: 'var(--ink2)', fontSize: 12, whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-road" style={{ fontSize: 11, color: 'var(--ink3)' }} />
          {v.odometer.toLocaleString()} km
        </div>
      </td>
      <td style={{ padding: '10px 14px', minWidth: 90 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 52, height: 5, background: 'var(--cream3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${v.fuelLevel}%`, height: '100%', background: v.fuelLevel > 50 ? '#c4912a' : v.fuelLevel > 25 ? 'var(--amber)' : 'var(--red)', borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: v.fuelLevel > 50 ? '#c4912a' : v.fuelLevel > 25 ? '#d97706' : 'var(--red)' }}>{v.fuelLevel}%</span>
        </div>
      </td>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <DocAlertBadge count={expiredDocs.length} label="expired" />
          <DocAlertBadge count={expiringSoon.length} label="expiring" />
          <DocAlertBadge count={overdueM.length} label="overdue" />
          {!expiredDocs.length && !expiringSoon.length && !overdueM.length && (
            <span style={{ fontSize: 10, color: '#c4912a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-circle-check" style={{ fontSize: 11 }} /> OK
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: '10px 14px' }}><StatusBadge status={v.status} /></td>
      <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
        <Link href={`/vehicles/${v.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#c4912a', textDecoration: 'none', fontWeight: 600, padding: '4px 8px', borderRadius: 5, background: 'rgba(196,145,42,0.12)', border: '1px solid #6ee7b740', transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
          Details <i className="ti ti-chevron-right" style={{ fontSize: 10 }} />
        </Link>
      </td>
    </tr>
  );
}

const PAGE_SIZE = 25;

/* ── Main page ──────────────────────────────────────────────────────── */
export default function VehiclesPage() {
  const { user }       = useAuthStore();
  const role           = user?.role ?? 'viewer';
  const isSuperAdmin   = role === 'super_admin' || role === 'platform_admin';
  const isVehicleOwner = role === 'vehicle_owner';
  const tenantId       = user?.tenantId ?? '1';

  const [refreshKey, setRefreshKey] = useState(0);

  const storeVehicles        = useVehiclesStore(s => s.vehicles);
  const storeCustomers       = useCustomersStore(s => s.customers);
  const refVehicleCategories = useRefDataStore(s => s.vehicleCategories);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allVehicles = useMemo(() => {
    if (isSuperAdmin) return [...storeVehicles];
    if (isVehicleOwner) {
      const ids = user?.vehicleIds?.length ? user.vehicleIds : user?.vehicleId ? [user.vehicleId] : [];
      return storeVehicles.filter(v => ids.includes(v.id));
    }
    return storeVehicles.filter(v => v.tenantId === tenantId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, isVehicleOwner, storeVehicles, tenantId, refreshKey, user?.vehicleId, user?.vehicleIds]);

  const tenantCustomers = useMemo(() => storeCustomers.filter(c => c.tenantId === tenantId), [storeCustomers, tenantId]);
  const expiringDocs    = useMemo(() => getExpiringDocuments(allVehicles, 60), [allVehicles]);
  const overdueAll      = useMemo(() => getOverdueMaintenance(allVehicles), [allVehicles]);
  const subReport       = useMemo(() => getExpiryReport(allVehicles.map(v => ({ id: v.id, plate: v.plate }))), [allVehicles, refreshKey]);

  const searchParams    = useSearchParams();
  const [showWizard, setWizard]          = useState(() => searchParams.get('openWizard') === '1');
  const [preCustomerId, setPreCustomerId] = useState(() => searchParams.get('customerId') ?? '');

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('all');
  const [catFilter, setCat]           = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [page, setPage]               = useState(1);
  const [groupByTenant, setGroupBy]   = useState(true);
  const [trackVehicle, setTrackVehicle] = useState<VehicleMaster | null>(null);
  const [subModal, setSubModal]        = useState<VehicleMaster | null>(null);
  const subReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get('openWizard')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('openWizard');
      url.searchParams.delete('customerId');
      window.history.replaceState({}, '', url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => allVehicles.filter(v => {
    const q = search.toLowerCase();
    const matchQ  = !q || v.plate.toLowerCase().includes(q) || v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || (v.customerName ?? '').toLowerCase().includes(q) || (v.department ?? '').toLowerCase().includes(q) || (TENANTS_META[v.tenantId]?.name ?? '').toLowerCase().includes(q);
    const matchSt = statusFilter === 'all' || v.status === statusFilter;
    const matchCa = catFilter === 'all'    || v.category === catFilter;
    const matchTn = !isSuperAdmin || tenantFilter === 'all' || v.tenantId === tenantFilter;
    return matchQ && matchSt && matchCa && matchTn;
  }), [allVehicles, search, statusFilter, catFilter, tenantFilter, isSuperAdmin]);

  const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedFiltered = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, catFilter, tenantFilter]);

  /* Fleet statistics */
  const activeCount = allVehicles.filter(v => v.status === 'active').length;
  const idleCount   = allVehicles.filter(v => v.status === 'idle').length;
  const maintCount  = allVehicles.filter(v => v.status === 'maintenance').length;
  const utilRate    = allVehicles.length ? Math.round((activeCount / allVehicles.length) * 100) : 0;

  const kpis = [
    {
      label: isSuperAdmin ? 'Total Fleet' : 'Total Vehicles', value: allVehicles.length,
      icon: 'ti-truck', iconColor: '#c4912a', stripe: '#c4912a',
      sub: `${utilRate}% utilisation`, subColor: utilRate > 50 ? '#c4912a' : 'var(--amber)',
      onClick: () => { setStatus('all'); setCat('all'); setSearch(''); },
    },
    {
      label: 'Active', value: activeCount, icon: 'ti-player-play', iconColor: '#16a34a', stripe: '#16a34a',
      sub: `${idleCount} idle`, subColor: idleCount > 0 ? '#d97706' : '#16a34a',
      onClick: () => setStatus('active'),
    },
    {
      label: 'In Maintenance', value: maintCount, icon: 'ti-tool', iconColor: 'var(--blue)', stripe: 'var(--blue)',
      sub: maintCount > 0 ? 'In service bay' : 'All clear',
      subColor: maintCount > 0 ? 'var(--blue)' : '#16a34a',
      onClick: () => setStatus('maintenance'),
    },
    {
      label: 'Docs Expiring', value: expiringDocs.length, icon: 'ti-file-description',
      iconColor: expiringDocs.length ? 'var(--red)' : '#16a34a',
      stripe: expiringDocs.length ? 'var(--red)' : '#16a34a',
      sub: expiringDocs.length ? 'Action required' : 'All documents OK',
      subColor: expiringDocs.length ? 'var(--red)' : '#16a34a',
      trend: expiringDocs.length > 0 ? 'up' as const : undefined,
      onClick: () => { setStatus('all'); setCat('all'); setSearch(''); },
    },
    {
      label: 'Overdue Maint.', value: overdueAll.length, icon: 'ti-alert-triangle',
      iconColor: overdueAll.length ? 'var(--amber)' : '#16a34a',
      stripe: overdueAll.length ? 'var(--amber)' : '#16a34a',
      sub: overdueAll.length ? 'Schedule service' : 'All clear',
      subColor: overdueAll.length ? '#d97706' : '#16a34a',
      trend: overdueAll.length > 0 ? 'up' as const : undefined,
      onClick: () => setStatus('maintenance'),
    },
    {
      label: 'Subs Expired', value: subReport.expired.length, icon: 'ti-lock',
      iconColor: subReport.expired.length ? 'var(--red)' : '#16a34a',
      stripe: subReport.expired.length ? 'var(--red)' : '#16a34a',
      sub: subReport.expired.length ? 'Services suspended' : 'All subscriptions active',
      subColor: subReport.expired.length ? 'var(--red)' : '#16a34a',
      trend: subReport.expired.length > 0 ? 'up' as const : undefined,
      onClick: () => subReportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    },
    {
      label: 'Subs Expiring', value: subReport.expiring.length, icon: 'ti-clock',
      iconColor: subReport.expiring.length ? 'var(--amber)' : '#16a34a',
      stripe: subReport.expiring.length ? 'var(--amber)' : '#16a34a',
      sub: subReport.expiring.length ? 'Renew soon' : 'No renewals due',
      subColor: subReport.expiring.length ? '#d97706' : '#16a34a',
      onClick: () => subReportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    },
    ...(isSuperAdmin ? [{
      label: 'Tenants', value: Object.keys(TENANTS_META).length, icon: 'ti-building',
      iconColor: 'var(--purple)', stripe: 'var(--purple)',
      sub: 'Cross-tenant view', subColor: 'var(--ink3)',
      onClick: () => { setStatus('all'); setCat('all'); setSearch(''); },
    }] : []),
  ];

  const tenantGroups = useMemo(() => {
    if (!isSuperAdmin || !groupByTenant) return null;
    const groups: Record<string, VehicleMaster[]> = {};
    for (const v of filtered) {
      if (!groups[v.tenantId]) groups[v.tenantId] = [];
      groups[v.tenantId].push(v);
    }
    return groups;
  }, [isSuperAdmin, groupByTenant, filtered]);

  const TABLE_HEADERS = ['VID', 'Plate / Vehicle', 'Category', ...(isSuperAdmin ? ['Tenant'] : []), 'Customer / CID', 'Odometer', 'Fuel', 'Documents', 'Status', ''];

  const isFleetOps = role === 'fleet_admin' || role === 'fleet_manager';
  const myVehicle  = isFleetOps ? (allVehicles.find(v => v.status === 'active') ?? allVehicles[0] ?? null) : null;

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {/* ══ HEADER BANNER ══════════════════════════════════════════════ */}
      <div style={{
        marginBottom: 14,
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius: 10, padding: '12px 16px', color: '#fff',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <i className="ti ti-truck" style={{ fontSize: 20, color: '#f5d07a' }} />
            <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.5px' }}>
              {isSuperAdmin ? 'All Tenant Vehicles' : isVehicleOwner ? 'My Vehicles' : 'Fleet Management'}
            </span>
            {isSuperAdmin && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.28)', color: '#f5d07a', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-eye" style={{ fontSize: 10 }} /> READ-ONLY
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            {isSuperAdmin
              ? `${allVehicles.length} vehicles across ${Object.keys(TENANTS_META).length} tenants`
              : isVehicleOwner
              ? `${allVehicles.length} vehicle${allVehicles.length !== 1 ? 's' : ''} assigned to your account`
              : `${allVehicles.length} vehicles · ${user?.tenantName ?? 'your tenant'} · ${utilRate}% utilisation`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Fleet pulse stats */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Active', count: activeCount, color: '#4ade80' },
              { label: 'Idle',   count: idleCount,   color: '#f5d07a' },
              { label: 'Maint',  count: maintCount,   color: '#93c5fd' },
            ].map(s => (
              <div key={s.label} style={{ padding: '4px 10px', background: 'rgba(196,145,42,0.10)', border: '1px solid rgba(196,145,42,0.15)', borderRadius: 7, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color, letterSpacing: '-0.5px' }}>{s.count}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
              </div>
            ))}
          </div>
          {isSuperAdmin && (
            <button onClick={() => setGroupBy(g => !g)}
              style={{ padding: '5px 12px', fontSize: 10, fontWeight: 700, borderRadius: 20, border: '1px solid rgba(196,145,42,0.35)', background: 'rgba(196,145,42,0.15)', color: '#f5d07a', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className={`ti ${groupByTenant ? 'ti-list' : 'ti-building'}`} style={{ fontSize: 11 }} />
              {groupByTenant ? 'Flat list' : 'Group by tenant'}
            </button>
          )}
          {!isSuperAdmin && !isVehicleOwner && (
            <button onClick={() => setWizard(true)}
              style={{ padding: '7px 14px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid rgba(196,145,42,0.35)', background: 'rgba(196,145,42,0.15)', color: '#f5d07a', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> Register Vehicle
            </button>
          )}
        </div>
      </div>

      {/* ══ My Vehicle panel (fleet ops) ═══════════════════════════════ */}
      {myVehicle && (() => {
        const sColor = myVehicle.status === 'active' ? '#16a34a' : myVehicle.status === 'idle' ? '#d97706' : 'var(--ink3)';
        const sBg    = myVehicle.status === 'active' ? '#dcfce7' : myVehicle.status === 'idle' ? '#fef9c3' : 'var(--cream3)';
        return (
          <div style={{ background: '#fff', border: '2px solid #c4912a', borderRadius: 10, padding: '12px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(13,148,136,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: 'rgba(196,145,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4912a', fontSize: 20 }}>
                <i className="ti ti-truck" />
              </div>
              <div>
                <div style={{ fontSize: 9, color: '#c4912a', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: 1 }}>My Vehicle</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px' }}>{myVehicle.plate}</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{myVehicle.year} {myVehicle.make} {myVehicle.model}</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sBg, color: sColor, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className={`ti ${myVehicle.status === 'active' ? 'ti-player-play' : myVehicle.status === 'idle' ? 'ti-player-pause' : 'ti-wifi-off'}`} style={{ fontSize: 10 }} />
              {myVehicle.status === 'active' ? 'Active' : myVehicle.status === 'idle' ? 'Idle' : 'Offline'}
            </span>
            {([
              { label: 'Speed', value: myVehicle.status === 'active' && (myVehicle.speedKmh ?? 0) > 0 ? `${myVehicle.speedKmh} km/h` : '—', icon: 'ti-gauge' },
              { label: 'Fuel', value: `${myVehicle.fuelLevel}%`, icon: 'ti-gas-station' },
              { label: 'Odometer', value: `${myVehicle.odometer.toLocaleString()} km`, icon: 'ti-road' },
              { label: 'Driver', value: myVehicle.driverName ?? 'Unassigned', icon: 'ti-user' },
            ] as { label: string; value: string; icon: string }[]).map(({ label, value, icon }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--ink3)', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <i className={`ti ${icon}`} style={{ fontSize: 10 }} />{label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{value}</div>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Link href="/my-vehicle" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: '#c4912a', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                Full dashboard <i className="ti ti-arrow-right" style={{ fontSize: 11 }} />
              </Link>
              <Link href={`/vehicles/${myVehicle.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1px solid #c4912a', background: 'rgba(196,145,42,0.12)', color: '#c4912a', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                Details
              </Link>
            </div>
          </div>
        );
      })()}

      {/* ══ KPI Strip ══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 7, marginBottom: 14 }}>
        {kpis.map(k => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* ══ Super-admin tenant filter pills ════════════════════════════ */}
      {isSuperAdmin && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14, padding: '10px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', alignSelf: 'center', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Filter tenant:</span>
          {Object.entries(TENANTS_META).map(([tid, meta]) => {
            const count  = allVehicles.filter(v => v.tenantId === tid).length;
            const active = tenantFilter === tid;
            return (
              <button key={tid} onClick={() => setTenantFilter(active ? 'all' : tid)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, border: `1px solid ${active ? meta.color : meta.color + '50'}`, background: active ? meta.color : '#fff', color: active ? '#fff' : meta.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#fff' : meta.color }} />
                {meta.name}
                <span style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', borderRadius: 10, padding: '1px 6px', fontSize: 9 }}>{count}</span>
              </button>
            );
          })}
          {tenantFilter !== 'all' && (
            <button onClick={() => setTenantFilter('all')}
              style={{ padding: '4px 12px', borderRadius: 20, border: '1px dashed var(--border2)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-x" style={{ fontSize: 10 }} /> Clear
            </button>
          )}
        </div>
      )}

      {/* ══ Alert banners ══════════════════════════════════════════════ */}
      {expiringDocs.filter(e => daysUntilExpiry(e.doc.expiryDate) < 0).length > 0 && (
        <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 12, color: 'var(--red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0 }} />
          {expiringDocs.filter(e => daysUntilExpiry(e.doc.expiryDate) < 0).length} document(s) are EXPIRED across {isSuperAdmin ? 'all tenants' : 'your fleet'}
        </div>
      )}
      {overdueAll.length > 0 && (
        <div style={{ background: 'var(--amber-lt)', border: '1px solid var(--amber)', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 12, color: '#92600a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-tool" style={{ fontSize: 16, flexShrink: 0 }} />
          {overdueAll.length} vehicle(s) have overdue maintenance
        </div>
      )}

      {/* ══ Subscription expiry report ═════════════════════════════════ */}
      {(subReport.expired.length > 0 || subReport.expiring.length > 0) && (
        <div ref={subReportRef} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--cream)' }}>
            <i className="ti ti-credit-card" style={{ fontSize: 14, color: 'var(--ink3)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Subscription Expiry Report</span>
            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>· Services are suspended immediately on expiry</span>
          </div>
          {subReport.expired.length > 0 && (
            <div style={{ padding: '10px 16px', borderBottom: subReport.expiring.length > 0 ? '1px solid var(--border)' : 'none' }}>
              <SectionHeader title={`Expired — Services Suspended (${subReport.expired.length})`} icon="ti-lock" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {subReport.expired.map(e => (
                  <div key={e.vehicleId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, minWidth: 220 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink)' }}>{e.plate}</div>
                      <div style={{ fontSize: 10, color: '#991b1b' }}>{PLANS[e.plan].name} · Expired {Math.abs(e.daysLeft)}d ago ({new Date(e.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 3, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', whiteSpace: 'nowrap' }}>
                      {e.autoRenew ? '🔄 Auto-renew set' : '⚠ Manual renewal'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {subReport.expiring.length > 0 && (
            <div style={{ padding: '10px 16px' }}>
              <SectionHeader title={`Expiring Soon (${subReport.expiring.length})`} icon="ti-clock" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {subReport.expiring.map(e => (
                  <div key={e.vehicleId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, minWidth: 220 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink)' }}>{e.plate}</div>
                      <div style={{ fontSize: 10, color: '#92400e' }}>{PLANS[e.plan].name} · Expires in {e.daysLeft}d ({new Date(e.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 3, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', whiteSpace: 'nowrap' }}>
                      {e.autoRenew ? '🔄 Auto-renew set' : '⚠ Manual renewal'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Filter bar ═════════════════════════════════════════════════ */}
      {!isVehicleOwner && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--ink3)' }} />
            <input
              placeholder={isSuperAdmin ? 'Search plate, tenant, make, model…' : 'Search plate, make, model, customer…'}
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid var(--border2)', borderRadius: 6, fontSize: 12, color: 'var(--ink)', boxSizing: 'border-box' as const }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid var(--border2)', borderRadius: 6, fontSize: 12, color: 'var(--ink)', background: '#fff' }}>
            <option value="all">All statuses</option>
            {['active', 'idle', 'offline', 'maintenance', 'disposed'].map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select value={catFilter} onChange={e => setCat(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid var(--border2)', borderRadius: 6, fontSize: 12, color: 'var(--ink)', background: '#fff' }}>
            <option value="all">All categories</option>
            {refVehicleCategories.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
          </select>
          {(search || statusFilter !== 'all' || catFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setStatus('all'); setCat('all'); }}
              style={{ padding: '7px 10px', border: '1px dashed var(--border2)', borderRadius: 6, fontSize: 11, color: 'var(--ink3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-x" style={{ fontSize: 11 }} /> Clear
            </button>
          )}
          <span style={{ fontSize: 11, color: 'var(--ink3)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            {filtered.length === 0 ? '0 results'
              : totalPages > 1
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`
              : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {/* ══ Grouped view (super-admin) ══════════════════════════════════ */}
      {isSuperAdmin && groupByTenant && tenantGroups ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Object.keys(tenantGroups).length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)', fontSize: 13, background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
              <i className="ti ti-search-off" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.4 }} />
              No vehicles match your filters
            </div>
          )}
          {Object.entries(tenantGroups).map(([tid, tvehicles]) => {
            const meta        = TENANTS_META[tid];
            const tExpiredDocs = getExpiringDocuments(tvehicles, 0).filter(e => daysUntilExpiry(e.doc.expiryDate) < 0);
            const tOverdue    = getOverdueMaintenance(tvehicles);
            const tActive     = tvehicles.filter(v => v.status === 'active').length;
            return (
              <div key={tid} style={{ background: '#fff', border: `1.5px solid ${meta?.color ?? 'var(--border)'}30`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: `${meta?.color ?? '#000'}08` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: (meta?.color ?? '#000') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: meta?.color ?? 'var(--ink3)', display: 'inline-block' }} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{meta?.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--ink3)', marginLeft: 8 }}>{meta?.plan} · {meta?.country}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {tExpiredDocs.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--red-lt)', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-alert-circle" style={{ fontSize: 10 }} /> {tExpiredDocs.length} expired</span>}
                    {tOverdue.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--amber-lt)', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-tool" style={{ fontSize: 10 }} /> {tOverdue.length} overdue</span>}
                    <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>{tActive} active</span>
                    <span style={{ fontSize: 11, color: 'var(--ink3)' }}>· {tvehicles.length} vehicle{tvehicles.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                      {['VID', 'Plate / Vehicle', 'Category', 'Customer / CID', 'Odometer', 'Fuel', 'Documents', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.7px', color: 'var(--ink3)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tvehicles.map((v, i) => <VehicleRow key={v.id} v={v} showTenant={false} i={i} onTrack={setTrackVehicle} onManageSub={setSubModal} />)}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ) : (
        /* ══ Flat table ══════════════════════════════════════════════== */
        <>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                  {TABLE_HEADERS.map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.7px', color: 'var(--ink3)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={TABLE_HEADERS.length} style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
                    <i className="ti ti-search-off" style={{ fontSize: 28, display: 'block', marginBottom: 8, opacity: 0.4 }} />
                    No vehicles match your filters
                  </td></tr>
                )}
                {pagedFiltered.map((v, i) => <VehicleRow key={v.id} v={v} showTenant={isSuperAdmin} i={i + (page - 1) * PAGE_SIZE} onTrack={setTrackVehicle} onManageSub={setSubModal} />)}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, paddingTop: 14 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border2)', background: page === 1 ? 'var(--cream)' : '#fff', color: page === 1 ? 'var(--ink3)' : 'var(--ink)', fontSize: 12, cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-chevron-left" style={{ fontSize: 11 }} /> Prev
              </button>
              {(() => {
                const pages: (number | null)[] = [];
                for (let p = 1; p <= totalPages; p++) {
                  if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) pages.push(p);
                  else if (pages[pages.length - 1] !== null) pages.push(null);
                }
                return pages.map((p, idx) =>
                  p === null
                    ? <span key={`e${idx}`} style={{ padding: '5px 2px', color: 'var(--ink3)', fontSize: 12 }}>…</span>
                    : <button key={p} onClick={() => setPage(p)}
                        style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${page === p ? '#c4912a' : 'var(--border2)'}`, background: page === p ? '#c4912a' : '#fff', color: page === p ? '#fff' : 'var(--ink)', fontSize: 12, cursor: 'pointer', fontWeight: page === p ? 700 : 400, minWidth: 32 }}>{p}</button>
                );
              })()}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border2)', background: page === totalPages ? 'var(--cream)' : '#fff', color: page === totalPages ? 'var(--ink3)' : 'var(--ink)', fontSize: 12, cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                Next <i className="ti ti-chevron-right" style={{ fontSize: 11 }} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Live tracking modal */}
      {trackVehicle && (
        <VehicleTrackingModal vehicle={trackVehicle} initialPin={pinFromVehicle(trackVehicle)} onClose={() => setTrackVehicle(null)} />
      )}

      {/* Subscription management modal */}
      {subModal && (
        <SubscriptionModal vehicle={subModal} onClose={() => setSubModal(null)} onSaved={() => setRefreshKey(k => k + 1)} />
      )}

      {/* Registration wizard modal */}
      {showWizard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={e => { if (e.target === e.currentTarget) { setWizard(false); setPreCustomerId(''); } }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden', width: '100%', maxWidth: 680 }}>
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #0d1b2a, #1c2b44)', color: '#fff', borderBottom: '1px solid rgba(196,145,42,0.20)' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-truck" style={{ fontSize: 16 }} /> Register New Vehicle
                </div>
                {preCustomerId && tenantCustomers.find(c => c.id === preCustomerId) && (
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                    Pre-linked to: {tenantCustomers.find(c => c.id === preCustomerId)?.name}
                  </div>
                )}
                {!preCustomerId && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Complete all steps to add vehicle master data</div>}
              </div>
              <button onClick={() => { setWizard(false); setPreCustomerId(''); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, color: '#fff', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>
                <i className="ti ti-x" />
              </button>
            </div>
            <RegisterWizard
              onClose={() => { setWizard(false); setPreCustomerId(''); }}
              onSaved={() => setRefreshKey(k => k + 1)}
              tenantCustomers={tenantCustomers}
              tenantId={tenantId}
              preCustomerId={preCustomerId || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
