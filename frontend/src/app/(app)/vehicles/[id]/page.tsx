'use client';

import { useState, useMemo, use, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { hasMinRole } from '@/lib/auth';
import {
  VehicleMaster, VehicleDocument, VehicleHistoryEvent,
  MaintenanceRecord, daysUntilExpiry, docStatus,
  DocType, MaintType, MaintStatus, HistType, TENANTS_META, OwnerType,
} from '@/lib/vehiclesMaster';
import { useDevicesStore } from '@/store/devicesStore';
import type { GpsDevice, DeviceType, DeviceStatus } from '@/lib/devicesData';
import { useSimsStore } from '@/store/simsStore';
import type { SimCard, SimType, SimStatus } from '@/lib/sims';
import { DriverRecord, STATUS_LABEL, STATUS_COLOR, driverAvatarColor } from '@/lib/driversData';
import { Customer, getCustomerById } from '@/lib/customers';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useDriversStore } from '@/store/driversStore';
import { useCustomersStore } from '@/store/customersStore';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import {
  getSubscription, computeSubStatus, daysUntilSubExpiry,
  PLANS, PLAN_ORDER, SERVICES, getCustomPlans, currencySymbol, type PlanName, type SubStatus, type CustomPlanDef,
  saveSubscription,
} from '@/lib/subscriptions';
import { SubscriptionModal } from '@/components/vehicles/SubscriptionModal';
import { VehicleTrackingModal } from '@/components/tracking/VehicleTrackingModal';
import { VehiclePin } from '@/components/maps/FleetMap';
import { isServiceEnabled } from '@/lib/subscriptions';

/* ── vehicle history writer ────────────────────────────────────────── */
async function writeVehicleHistory(p: {
  tenantId: string; vehicleId: string; eventType: string;
  title: string; description: string; by?: string; meta?: string;
}) {
  try {
    const res = await fetch('/api/v1/audit-events', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tenantId: p.tenantId, vehicleId: p.vehicleId, eventType: p.eventType, title: p.title, description: p.description, by: p.by ?? 'Fleet Manager', meta: p.meta }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      console.error('[writeVehicleHistory] POST failed', res.status, detail);
    }
  } catch (e) {
    console.error('[writeVehicleHistory] network error', e);
  }
}

/* ── colour helpers ────────────────────────────────────────────────── */
const STATUS_DOT: Record<string, string> = {
  active: '#c4912a', idle: 'var(--amber)',
  offline: 'var(--ink3)', maintenance: 'var(--red)', disposed: '#999',
};
const DOC_STATUS_COLOR: Record<string, string> = {
  'Valid':          '#c4912a',
  'Expiring Soon':  'var(--amber)',
  'Expired':        'var(--red)',
};
const DOC_STATUS_BG: Record<string, string> = {
  'Valid':          'rgba(196,145,42,0.12)',
  'Expiring Soon':  'var(--amber-lt)',
  'Expired':        'var(--red-lt)',
};
const MAINT_COLOR: Record<string, string> = {
  Completed: '#c4912a', Upcoming: 'var(--amber)', Overdue: 'var(--red)',
};
const MAINT_BG: Record<string, string> = {
  Completed: 'rgba(196,145,42,0.12)', Upcoming: 'var(--amber-lt)', Overdue: 'var(--red-lt)',
};
const HIST_ICON: Record<string, string> = {
  Onboarding: '🚛', Transfer: '🔄', Assignment: '👤', Unassignment: '👤',
  'Status Change': '🔄', Disposal: '🗑️', Maintenance: '🔧', 'Document Update': '📄',
  'Device Link': '📡', 'Device Unlink': '📡', 'SIM Link': '📶', 'SIM Unlink': '📶',
};

/* ── small reusable components ─────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
      background: status === 'active' ? 'rgba(196,145,42,0.12)' : status === 'idle' ? 'var(--amber-lt)' : status === 'maintenance' ? 'var(--red-lt)' : 'var(--cream3)',
      color: STATUS_DOT[status] ?? 'var(--ink3)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[status] ?? 'var(--ink3)' }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500, fontFamily: mono ? 'monospace' : undefined }}>{value || '—'}</span>
    </div>
  );
}

function SectionCard({ title, children, onAction, actionLabel }: { title: string; children: React.ReactNode; onAction?: () => void; actionLabel?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '10px 16px', background: 'var(--cream)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</span>
        {onAction && (
          <button onClick={onAction} style={{ fontSize: 10, fontWeight: 600, color: '#c4912a', background: 'none', border: '1px solid #c4912a', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {actionLabel ?? 'Edit ✎'}
          </button>
        )}
      </div>
      <div style={{ padding: '4px 16px 12px' }}>{children}</div>
    </div>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────── */
type Tab = 'master' | 'history' | 'documents' | 'assignment' | 'device' | 'maintenance' | 'subscription' | 'livetrack' | 'security';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'master',       label: 'Master data',    icon: '📋' },
  { id: 'history',      label: 'History',         icon: '🕐' },
  { id: 'documents',    label: 'Documents',       icon: '📄' },
  { id: 'assignment',   label: 'Assignment',      icon: '👤' },
  { id: 'device',       label: 'Device & IoT',    icon: '📡' },
  { id: 'maintenance',  label: 'Maintenance',     icon: '🔧' },
  { id: 'subscription', label: 'Subscription',    icon: '💳' },
  { id: 'security',     label: 'Security / PIN',  icon: '🔐' },
  { id: 'livetrack',    label: 'Live Track',      icon: '📍' },
];

/* ── Master data tab ────────────────────────────────────────────────── */
function MasterDataTab({ v }: { v: VehicleMaster }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Identity */}
      <SectionCard title="Identity">
        <InfoRow label="Plate number"  value={<span style={{ fontWeight: 700, letterSpacing: 1 }}>{v.plate}</span>} />
        <InfoRow label="VIN / Chassis" value={v.vin} mono />
        <InfoRow label="Make"          value={v.make} />
        <InfoRow label="Model"         value={v.model} />
        <InfoRow label="Year"          value={v.year} />
        <InfoRow label="Category"      value={v.category} />
        <InfoRow label="Body type"     value={v.bodyType} />
        <InfoRow label="Color"         value={v.color} />
      </SectionCard>

      {/* Engine & technical */}
      <SectionCard title="Engine & Technical">
        <InfoRow label="Engine number"    value={v.engineNo} mono />
        <InfoRow label="Engine capacity"  value={v.engineCapacity} />
        <InfoRow label="Fuel type"        value={v.fuelType} />
        <InfoRow label="Transmission"     value={v.transmission} />
        <InfoRow label="Axles"            value={v.axles} />
        <InfoRow label="Gross weight"     value={`${v.grossWeightKg.toLocaleString()} kg`} />
        <InfoRow label="Payload capacity" value={`${v.payloadKg.toLocaleString()} kg`} />
        <InfoRow label="Seating capacity" value={v.seatingCapacity} />
      </SectionCard>

      {/* Registration */}
      <SectionCard title="Registration">
        <InfoRow label="Country"           value={v.registrationCountry} />
        <InfoRow label="Registration date" value={new Date(v.registrationDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} />
        <InfoRow label="Purchase date"     value={new Date(v.purchaseDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} />
        <InfoRow label="Purchase price"    value={`KES ${v.purchasePrice.toLocaleString()}`} />
        <InfoRow label="Supplier"          value={v.supplier} />
      </SectionCard>

      {/* Ownership */}
      <SectionCard title="Ownership">
        <InfoRow
          label="Owner type"
          value={
            v.ownerType ? (
              <span style={{ display:'inline-flex',alignItems:'center',gap:5 }}>
                <span style={{ fontSize:13 }}>
                  { v.ownerType==='Company'?'🏢': v.ownerType==='Individual'?'👤': v.ownerType==='Government'?'🏛️': v.ownerType==='Leased'?'📝':'🏦' }
                </span>
                <span style={{ fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,
                  background: v.ownerType==='Company'?'#dbeafe': v.ownerType==='Individual'?'#dcfce7': v.ownerType==='Government'?'#fef3c7': v.ownerType==='Leased'?'#f3e8ff':'#ffedd5',
                  color:      v.ownerType==='Company'?'#1d4ed8': v.ownerType==='Individual'?'#15803d': v.ownerType==='Government'?'#d97706': v.ownerType==='Leased'?'#7c3aed':'#c2410c',
                }}>{v.ownerType}</span>
              </span>
            ) : '—'
          }
        />
        <InfoRow label="Owner name"    value={v.ownerName    ?? '—'} />
        <InfoRow label="ID / Reg No"   value={v.ownerIdNo    ?? '—'} mono />
        <InfoRow label="Contact"       value={v.ownerContact ?? '—'} />
      </SectionCard>

      {/* Operational */}
      <SectionCard title="Operational">
        <InfoRow label="Status"    value={<StatusBadge status={v.status} />} />
        <InfoRow label="Odometer"  value={`${v.odometer.toLocaleString()} km`} />
        <InfoRow label="Fuel level"
          value={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 60, height: 5, background: 'var(--cream3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${v.fuelLevel}%`, height: '100%', background: v.fuelLevel>50?'#c4912a':v.fuelLevel>25?'var(--amber)':'var(--red)' }} />
              </div>
              <span style={{ fontSize: 11 }}>{v.fuelLevel}%</span>
            </div>
          }
        />
        <InfoRow label="Driver"   value={v.driverName} />
        <InfoRow label="Last seen" value={v.lastSeenAt ? new Date(v.lastSeenAt).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'} />
        {v.latitude && <InfoRow label="Coordinates" value={`${v.latitude.toFixed(4)}, ${v.longitude?.toFixed(4)}`} mono />}
        {v.speedKmh !== null && <InfoRow label="Speed" value={`${v.speedKmh} km/h`} />}
      </SectionCard>
    </div>
  );
}

/* ── History tab ────────────────────────────────────────────────────── */
const HIST_TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  Onboarding:       { bg: 'rgba(196,145,42,0.12)',  color: '#c4912a' },
  Transfer:         { bg: '#ede9fe',         color: '#6d28d9'        },
  Assignment:       { bg: '#dbeafe',         color: '#1d4ed8'        },
  Unassignment:     { bg: '#f3f4f6',         color: '#4b5563'        },
  'Status Change':  { bg: 'var(--amber-lt)', color: '#92600a'        },
  Disposal:         { bg: 'var(--red-lt)',   color: 'var(--red)'     },
  Maintenance:      { bg: 'var(--amber-lt)', color: '#92600a'        },
  'Document Update':{ bg: '#e0f2fe',         color: '#0369a1'        },
  'Device Link':    { bg: 'rgba(196,145,42,0.12)',  color: '#c4912a' },
  'Device Unlink':  { bg: '#fef2f2',         color: 'var(--red)'     },
  'SIM Link':       { bg: 'rgba(196,145,42,0.12)',  color: '#c4912a' },
  'SIM Unlink':     { bg: '#fef2f2',         color: 'var(--red)'     },
};

function HistoryTab({ events, vehicleId, tenantId }: { events: VehicleHistoryEvent[]; vehicleId: string; tenantId: string }) {
  const allDevices      = useDevicesStore(s => s.devices);
  const loadDevices     = useDevicesStore(s => s.loadDevices);
  const allSims         = useSimsStore(s => s.sims);
  const loadSims        = useSimsStore(s => s.loadSims);
  const allSchedules    = useMaintenanceStore(s => s.schedules);
  const loadSchedules   = useMaintenanceStore(s => s.loadSchedules);

  /* Persistent audit events for this vehicle */
  const [auditEvents, setAuditEvents] = useState<VehicleHistoryEvent[]>([]);

  /* Always reload on mount / vehicleId change so data is never stale */
  useEffect(() => {
    loadDevices(tenantId);
    loadSims(tenantId);
    loadSchedules(tenantId);
    fetch(`/api/v1/audit-events?vehicleId=${vehicleId}&tenantId=${tenantId}`)
      .then(r => r.json())
      .then((data: Array<{ id: string; timestamp: string; action: string; actor: string; details: string }>) => {
        if (!Array.isArray(data)) return;
        setAuditEvents(data.map(e => {
          let parsed: { title?: string; description?: string; meta?: string } = {};
          try { parsed = JSON.parse(e.details); } catch { /* */ }
          return {
            id:          e.id,
            date:        e.timestamp,
            type:        e.action as HistType,
            title:       parsed.title       ?? e.action,
            description: parsed.description ?? '',
            by:          e.actor,
            meta:        parsed.meta ?? undefined,
          };
        }));
      })
      .catch(() => { /* */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, tenantId]);

  const devices = useMemo(() => allDevices.filter(d => d.vehicleId === vehicleId), [allDevices, vehicleId]);
  const sims    = useMemo(() => allSims.filter(s => s.vehicleId === vehicleId),    [allSims,    vehicleId]);

  /* Deduplicate: if audit-events already has a Link event for this device/SIM
     (meta = serialNo / MSISDN), suppress the derived "current state" entry
     to avoid showing the same link twice. */
  const auditDeviceMetas = useMemo(
    () => new Set(auditEvents.filter(e => e.type === 'Device Link').map(e => e.meta).filter(Boolean)),
    [auditEvents],
  );
  const auditSimMetas = useMemo(
    () => new Set(auditEvents.filter(e => e.type === 'SIM Link').map(e => e.meta).filter(Boolean)),
    [auditEvents],
  );

  /* Derived "current state" events — only for devices/SIMs not yet in audit log */
  const deviceEvents: VehicleHistoryEvent[] = devices
    .filter(d => !auditDeviceMetas.has(d.serialNo) && !auditDeviceMetas.has(d.imei))
    .map(d => ({
      id:          `assoc-dev-${d.id}`,
      date:        d.installedAt,
      type:        'Device Link' as const,
      title:       `${d.type} installed`,
      description: `${d.model} (${d.serialNo || d.imei}) linked to this vehicle.`,
      by:          'Fleet Manager',
      meta:        d.serialNo || d.imei,
    }));

  const simEvents: VehicleHistoryEvent[] = sims
    .filter(s => !auditSimMetas.has(s.msisdn) && !auditSimMetas.has(s.iccid))
    .map(s => ({
      id:          `assoc-sim-${s.id}`,
      date:        s.activatedAt,
      type:        'SIM Link' as const,
      title:       `${s.type} SIM activated`,
      description: `${s.operator} SIM (${s.msisdn}) activated on this vehicle.`,
      by:          'Fleet Manager',
      meta:        s.msisdn,
    }));

  /* Maintenance completion fallback for schedules not yet in audit log */
  const auditMaintIds = useMemo(
    () => new Set(auditEvents.filter(e => e.type === 'Maintenance').map(e => e.id)),
    [auditEvents],
  );
  const maintEvents: VehicleHistoryEvent[] = useMemo(() =>
    allSchedules
      .filter(s => s.vehicleShortId === vehicleId && s.lastDoneAt && !auditMaintIds.has(`maint-done-${s.id}`))
      .map(s => ({
        id:          `maint-done-${s.id}`,
        date:        s.lastDoneAt!,
        type:        'Maintenance' as const,
        title:       `${s.serviceType} completed`,
        description: `${s.serviceType} carried out on ${s.vehiclePlate}.${s.notes ? ' ' + s.notes : ''}`,
        by:          'Fleet Manager',
        meta:        s.mileage ? `${parseInt(s.mileage).toLocaleString()} km` : undefined,
      })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [allSchedules, vehicleId, auditMaintIds]);

  const all = [...events, ...auditEvents, ...maintEvents, ...deviceEvents, ...simEvents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [filter, setFilter] = useState<'all' | 'device' | 'sim' | 'vehicle'>('all');

  const filtered = all.filter(ev => {
    if (filter === 'device') return ev.type === 'Device Link' || ev.type === 'Device Unlink';
    if (filter === 'sim')    return ev.type === 'SIM Link'    || ev.type === 'SIM Unlink';
    if (filter === 'vehicle') return ev.type !== 'Device Link' && ev.type !== 'Device Unlink' && ev.type !== 'SIM Link' && ev.type !== 'SIM Unlink';
    return true;
  });

  const filterBtn = (id: typeof filter, label: string) => (
    <button key={id} onClick={() => setFilter(id)} style={{
      padding: '4px 12px', fontSize: 11, fontWeight: filter === id ? 700 : 400, borderRadius: 20,
      border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
      background: filter === id ? '#c4912a' : '#fff',
      color:      filter === id ? '#fff' : 'var(--ink3)',
    }}>{label}</button>
  );

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {filterBtn('all',     `All (${all.length})`)}
        {filterBtn('vehicle', `Vehicle (${all.filter(e => !['Device Link','Device Unlink','SIM Link','SIM Unlink'].includes(e.type)).length})`)}
        {filterBtn('device',  `Devices (${all.filter(e => e.type === 'Device Link' || e.type === 'Device Unlink').length})`)}
        {filterBtn('sim',     `SIMs (${all.filter(e => e.type === 'SIM Link' || e.type === 'SIM Unlink').length})`)}
      </div>

      <div style={{ position: 'relative', padding: '8px 0' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: 17, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
        {filtered.map(ev => {
          const chip = HIST_TYPE_COLOR[ev.type] ?? { bg: 'var(--cream3)', color: 'var(--ink3)' };
          return (
            <div key={ev.id} style={{ display: 'flex', gap: 14, marginBottom: 20, position: 'relative' }}>
              {/* Icon bubble */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: chip.bg,
                border: `2px solid ${chip.color}40`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, flexShrink: 0, zIndex: 1,
              }}>
                {HIST_ICON[ev.type] ?? '📌'}
              </div>
              {/* Content */}
              <div style={{
                flex: 1, background: '#fff', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 14px',
                borderLeft: `3px solid ${chip.color}50`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{ev.title}</span>
                    <span style={{
                      marginLeft: 8, fontSize: 9, fontWeight: 600, padding: '1px 6px',
                      borderRadius: 3, background: chip.bg, color: chip.color,
                    }}>{ev.type}</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--ink3)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                    {new Date(ev.date).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>
                <p style={{ margin: '5px 0 3px', fontSize: 11, color: 'var(--ink2)', lineHeight: 1.5 }}>{ev.description}</p>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--ink3)' }}>
                  <span>👤 {ev.by}</span>
                  {ev.meta && <span style={{ fontFamily: 'monospace' }}>→ {ev.meta}</span>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
            No {filter === 'all' ? '' : filter + ' '}history events found.
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Documents tab ──────────────────────────────────────────────────── */
const DOC_TYPE_ICON: Record<DocType, string> = {
  Insurance: '🛡️', 'Token Tax': '🏷️', Fitness: '✅', Registration: '📋', Permit: '📜', Other: '📄',
};

function DocumentsTab({ docs, canWrite }: { docs: VehicleDocument[]; canWrite: boolean }) {
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState<DocType>('Insurance');
  const DOC_TYPES: DocType[] = ['Insurance','Token Tax','Fitness','Registration','Permit','Other'];

  const sorted = [...docs].sort((a,b) => daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
          {docs.filter(d=>d.status==='Expired').length > 0 && (
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>🚨 {docs.filter(d=>d.status==='Expired').length} expired · </span>
          )}
          {docs.filter(d=>d.status==='Expiring Soon').length > 0 && (
            <span style={{ color: 'var(--amber)', fontWeight: 600 }}>⚠️ {docs.filter(d=>d.status==='Expiring Soon').length} expiring soon · </span>
          )}
          {docs.filter(d=>d.status==='Valid').length} valid
        </div>
        {canWrite && (
          <button onClick={() => setShowUpload(true)} style={{
            padding: '6px 14px', background: '#c4912a', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>+ Add document</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(doc => {
          const days = daysUntilExpiry(doc.expiryDate);
          const st = docStatus(doc.expiryDate);
          return (
            <div key={doc.id} style={{
              background: '#fff', border: `1px solid ${st==='Expired'?'var(--red)':st==='Expiring Soon'?'var(--amber)':'var(--border)'}`,
              borderRadius: 10, padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              {/* Icon */}
              <div style={{ fontSize: 22, flexShrink: 0 }}>{DOC_TYPE_ICON[doc.type]}</div>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{doc.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>
                      {doc.type} · Ref: {doc.referenceNo} · Issuer: {doc.issuer}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                    background: DOC_STATUS_BG[st], color: DOC_STATUS_COLOR[st],
                    whiteSpace: 'nowrap',
                  }}>{st}</span>
                </div>

                {/* Date bar */}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--ink3)', marginBottom: 3 }}>
                      <span>Issued: {new Date(doc.issuedDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
                      <span>Expires: {new Date(doc.expiryDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--cream3)', borderRadius: 3, overflow: 'hidden' }}>
                      {(() => {
                        const totalMs = new Date(doc.expiryDate).getTime() - new Date(doc.issuedDate).getTime();
                        const usedMs  = Date.now() - new Date(doc.issuedDate).getTime();
                        const pct = Math.min(100, Math.max(0, (usedMs / totalMs) * 100));
                        return <div style={{ width: `${pct}%`, height: '100%', background: DOC_STATUS_COLOR[st], borderRadius: 3 }} />;
                      })()}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: DOC_STATUS_COLOR[st], whiteSpace: 'nowrap', minWidth: 90, textAlign: 'right' }}>
                    {days < 0 ? `${Math.abs(days)} days ago` : days === 0 ? 'Today' : `${days} days left`}
                  </div>
                </div>

                {doc.notes && <div style={{ marginTop: 7, fontSize: 10, color: 'var(--ink3)', fontStyle: 'italic' }}>{doc.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }} onClick={e => { if (e.target === e.currentTarget) setShowUpload(false); }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 440, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Add / update document</span>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink3)' }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Document type', el: <select style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12 }} value={docType} onChange={e=>setDocType(e.target.value as DocType)}>{DOC_TYPES.map(t=><option key={t}>{t}</option>)}</select> },
                { label: 'Reference number', el: <input style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} placeholder="e.g. APA/COM/2026/001234" /> },
                { label: 'Issuer', el: <input style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} placeholder="e.g. APA Insurance" /> },
                { label: 'Issued date', el: <input type="date" style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} /> },
                { label: 'Expiry date', el: <input type="date" style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} /> },
                { label: 'Upload document (PDF / image)', el: <input type="file" accept=".pdf,image/*" style={{ fontSize:11 }} /> },
              ].map(row => (
                <div key={row.label}>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>{row.label}</label>
                  {row.el}
                </div>
              ))}
              <button style={{ marginTop:4,padding:'9px 0',background:'#c4912a',color:'#fff',border:'none',borderRadius:8,fontWeight:600,fontSize:13,cursor:'pointer' }}>
                Save document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Driver avatar mini component ──────────────────────────────────── */
function DriverAvatar({ driver, size = 36 }: { driver: DriverRecord; size?: number }) {
  const initials = driver.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: driverAvatarColor(driver.id),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>{initials}</div>
  );
}

/* ── Assignment tab ─────────────────────────────────────────────────── */
function AssignmentTab({ v, tenantCustomers, tenantDrivers, user }: { v: VehicleMaster; tenantCustomers: Customer[]; tenantDrivers: DriverRecord[]; user: import('@/lib/types').AuthUser | null }) {
  const updateVehicle = useVehiclesStore(s => s.updateVehicle);
  const isOwner = user?.role === 'vehicle_owner';

  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');
  const [cId,        setCId]        = useState(v.customerId ?? '');
  const [dept,       setDept]       = useState(v.department ?? '');
  const [driverId,   setDriverId]   = useState(v.driverId   ?? '');
  const [driverName, setDriverName] = useState(v.driverName ?? '');
  const [search,     setSearch]     = useState('');

  /* vehicle_owner: manages a personal driver pool fetched by ownerId */
  const [ownerDrivers,   setOwnerDrivers]   = useState<DriverRecord[]>([]);
  const [ownerLoading,   setOwnerLoading]   = useState(false);
  const [showAddDriver,  setShowAddDriver]  = useState(false);
  const [addForm,        setAddForm]        = useState({ name:'', licenseNumber:'', licenseClass:'C', phoneNumber:'' });
  const [addSaving,      setAddSaving]      = useState(false);
  const [addError,       setAddError]       = useState('');

  useEffect(() => {
    if (!isOwner || !user?.email) return;
    setOwnerLoading(true);
    fetch(`/api/v1/drivers?ownerId=${encodeURIComponent(user.email)}&tenantId=${v.tenantId}`)
      .then(r => r.json())
      .then(data => setOwnerDrivers(Array.isArray(data) ? data : []))
      .catch(() => setOwnerDrivers([]))
      .finally(() => setOwnerLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, user?.email, v.tenantId]);

  async function handleAddDriver() {
    if (!addForm.name.trim()) { setAddError('Driver name is required.'); return; }
    setAddSaving(true); setAddError('');
    try {
      const res = await fetch('/api/v1/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, tenantId: v.tenantId, ownerId: user?.email }),
      });
      if (res.ok) {
        const d = await res.json() as DriverRecord;
        setOwnerDrivers(prev => [...prev, d]);
        /* Auto-select the newly created driver so owner can save immediately */
        setDriverId(d.id);
        setDriverName(d.name);
        setShowAddDriver(false);
        setAddForm({ name:'', licenseNumber:'', licenseClass:'C', phoneNumber:'' });
      } else {
        const err = await res.json().catch(() => ({}));
        setAddError((err as { message?: string }).message ?? 'Failed to add driver.');
      }
    } catch { setAddError('Network error.'); }
    finally { setAddSaving(false); }
  }

  /* Drivers visible in the picker: owner-scoped or full tenant list */
  const activePool = isOwner ? ownerDrivers : tenantDrivers;

  const topCustomers  = tenantCustomers.filter(c => c.parentId === null);

  const currentDriver = v.driverId ? activePool.find(d => d.id === v.driverId) : undefined;

  const filteredDrivers = activePool.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    const prevDriver = activePool.find(d => d.id === (v.driverId ?? ''));
    const newDriver  = activePool.find(d => d.id === driverId);
    try {
      const res = await fetch(`/api/v1/vehicles/${v.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ driverId: driverId || null, driverName: driverName || null }),
      });
      if (res.ok || res.status === 204) {
        /* Update store + close edit mode immediately — don't let history write block this */
        updateVehicle(v.id, { driverId: driverId || null, driverName: driverName || null });
        setEditing(false);
        setSearch('');
        /* History write is best-effort — failure doesn't affect the assignment */
        writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'Driver Assignment',
          title: driverId
            ? `Driver assigned: ${newDriver?.name ?? driverName}`
            : `Driver unassigned`,
          description: driverId
            ? `${newDriver?.name ?? driverName} assigned to ${v.plate}${prevDriver ? ` (replacing ${prevDriver.name})` : ''}.`
            : `${prevDriver?.name ?? 'Driver'} removed from ${v.plate}.`,
          meta: driverId || undefined,
        }).catch(e => console.warn('[AssignmentTab] history write failed', e));
      } else {
        const msg = await res.json().catch(() => ({}));
        setSaveError((msg as { message?: string }).message ?? `Save failed (${res.status})`);
      }
    } catch (e) {
      setSaveError('Network error — please try again.');
      console.error('[AssignmentTab] save error', e);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDriverId(v.driverId ?? '');
    setDriverName(v.driverName ?? '');
    setEditing(false);
    setSearch('');
  }

  function selectDriver(d: DriverRecord | null) {
    setDriverId(d?.id ?? '');
    setDriverName(d?.name ?? '');
  }

  const scoreColor = (s: number) => s >= 85 ? '#c4912a' : s >= 70 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

      {/* Current assignment */}
      <SectionCard title="Current assignment">
        <InfoRow
          label="Customer"
          value={v.customerId && v.customerName
            ? <Link href={`/customers/${v.customerId}`} style={{ color:'#c4912a', textDecoration:'none', fontWeight:600 }}>{v.customerName} →</Link>
            : (v.customerName ?? 'Unassigned')}
        />
        <InfoRow label="Department" value={v.department ?? '—'} />

        {/* Driver card — always visible; uses local state when editing so it reflects picker selection */}
        {(() => {
          const displayed = editing
            ? activePool.find(d => d.id === driverId)
            : currentDriver;
          return displayed ? (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(196,145,42,0.12)', borderRadius: 8, border: '1px solid #c4912a30' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>
                {editing ? 'Selected driver' : 'Assigned driver'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DriverAvatar driver={displayed} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{displayed.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 1 }}>
                    {displayed.licenseClass} · {displayed.licenseNumber}
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, ...STATUS_COLOR[displayed.status] }}>
                  {STATUS_LABEL[displayed.status]}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                <div style={{ background: '#fff', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, color: 'var(--ink3)', marginBottom: 3 }}>Safety score</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(displayed.safetyScore) }}>{displayed.safetyScore}</span>
                    <div style={{ flex: 1, height: 4, background: 'var(--cream3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${displayed.safetyScore}%`, height: '100%', background: scoreColor(displayed.safetyScore) }} />
                    </div>
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, color: 'var(--ink3)', marginBottom: 3 }}>Hours driven today</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    {displayed.hosDriven}h
                    <span style={{ fontSize: 9, color: 'var(--ink3)', fontWeight: 400 }}> / {displayed.hosDriven + displayed.hosRemaining}h max</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--cream)', borderRadius: 8, fontSize: 12, color: 'var(--ink3)', textAlign: 'center' }}>
              👤 No driver assigned
            </div>
          );
        })()}

        {!editing && (
          <button onClick={() => setEditing(true)} style={{
            marginTop: 10, padding: '7px 14px', background: '#c4912a', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>Edit assignment</button>
        )}

        {editing && (
          <div style={{ marginTop: 12 }}>
            {saveError && (
              <div style={{ marginBottom:8, padding:'6px 10px', background:'var(--red-lt)', border:'1px solid var(--red)30', borderRadius:6, fontSize:11, color:'var(--red)' }}>
                ⚠ {saveError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={saving} style={{ flex:1,padding:'7px 0',background:'#c4912a',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',opacity:saving?0.7:1 }}>{saving ? 'Saving…' : 'Save assignment'}</button>
              <button onClick={handleCancel} disabled={saving} style={{ flex:1,padding:'7px 0',background:'#fff',color:'var(--ink3)',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Driver picker panel */}
      <div>
        {editing ? (
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', background:'var(--cream)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--ink)', textTransform:'uppercase', letterSpacing:0.8 }}>
              Select driver
            </div>
            <div style={{ padding:'10px 14px' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or licence…"
                style={{ width:'100%', padding:'7px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, boxSizing:'border-box' as const, marginBottom:10 }}
              />
              {/* Unassign option */}
              <div
                onClick={() => selectDriver(null)}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:7, marginBottom:6,
                  cursor:'pointer', border: !driverId ? '2px solid #c4912a' : '2px solid transparent',
                  background: !driverId ? 'rgba(196,145,42,0.12)' : 'var(--cream)',
                }}
              >
                <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--cream3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👤</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--ink3)' }}>No driver</div>
                  <div style={{ fontSize:10, color:'var(--ink3)' }}>Unassign from vehicle</div>
                </div>
              </div>

              {ownerLoading && (
                <div style={{ padding:'20px 0', textAlign:'center', color:'var(--ink3)', fontSize:12 }}>Loading your drivers…</div>
              )}
              <div style={{ maxHeight:300, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
                {filteredDrivers.map(d => {
                  const isSelected = driverId === d.id;
                  const isBusy     = d.assignedVehicleId !== null && d.assignedVehicleId !== v.id;
                  const sc         = STATUS_COLOR[d.status];
                  return (
                    <div
                      key={d.id}
                      onClick={() => selectDriver(isSelected ? null : d)}
                      style={{
                        padding:'10px 12px', borderRadius:8, cursor:'pointer',
                        border: isSelected ? '2px solid #c4912a' : '2px solid var(--border)',
                        background: isSelected ? 'rgba(196,145,42,0.12)' : '#fff',
                        opacity: isBusy && !isSelected ? 0.65 : 1,
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <DriverAvatar driver={d} size={34} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                            <span style={{ fontSize:12, fontWeight:700, color: isSelected ? '#c4912a' : 'var(--ink)' }}>{d.name}</span>
                            <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:10, ...sc }}>{STATUS_LABEL[d.status]}</span>
                          </div>
                          <div style={{ fontSize:10, color:'var(--ink3)', marginTop:1 }}>
                            Class {d.licenseClass} · {d.licenseNumber}
                            {isBusy && <span style={{ color:'var(--amber)', fontWeight:600 }}> · On {d.assignedVehiclePlate}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color: scoreColor(d.safetyScore) }}>{d.safetyScore}</div>
                          <div style={{ fontSize:9, color:'var(--ink3)' }}>score</div>
                        </div>
                      </div>
                      {/* HOS bar */}
                      <div style={{ marginTop:7, display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ flex:1, height:3, background:'var(--cream3)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ width:`${(d.hosDriven / (d.hosDriven + d.hosRemaining)) * 100}%`, height:'100%', background: d.hosRemaining < 2 ? 'var(--red)' : d.hosRemaining < 4 ? 'var(--amber)' : '#c4912a' }} />
                        </div>
                        <span style={{ fontSize:9, color:'var(--ink3)', whiteSpace:'nowrap' }}>{d.hosDriven}h driven · {d.hosRemaining}h left</span>
                      </div>
                    </div>
                  );
                })}
                {filteredDrivers.length === 0 && !ownerLoading && (
                  <div style={{ padding:'16px 0', textAlign:'center', color:'var(--ink3)', fontSize:12 }}>
                    {isOwner ? "You haven't added any drivers yet." : `No drivers match "${search}"`}
                  </div>
                )}
              </div>

              {/* vehicle_owner: Add new driver button + inline form */}
              {isOwner && (
                <div style={{ marginTop:10, borderTop:'1px solid var(--border)', paddingTop:10 }}>
                  {!showAddDriver ? (
                    <button
                      onClick={() => { setShowAddDriver(true); setAddError(''); }}
                      style={{ width:'100%', padding:'8px', borderRadius:7, border:'1px dashed #c4912a', background:'rgba(13,148,136,0.04)', color:'#c4912a', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                    >
                      + Add new driver
                    </button>
                  ) : (
                    <div style={{ background:'var(--cream)', borderRadius:8, padding:'12px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--ink)', marginBottom:10 }}>New driver</div>
                      {addError && <div style={{ fontSize:11, color:'var(--red)', marginBottom:8 }}>⚠ {addError}</div>}
                      {[
                        { label:'Full name *', key:'name', placeholder:'e.g. Ahmed Hassan' },
                        { label:'Licence number', key:'licenseNumber', placeholder:'e.g. DL-2023-00123' },
                        { label:'Phone number', key:'phoneNumber', placeholder:'e.g. +254 7XX XXX XXX' },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom:8 }}>
                          <label style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', letterSpacing:0.5, textTransform:'uppercase', display:'block', marginBottom:3 }}>{f.label}</label>
                          <input
                            value={addForm[f.key as keyof typeof addForm]}
                            onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            style={{ width:'100%', padding:'6px 9px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, boxSizing:'border-box' as const, fontFamily:'inherit' }}
                          />
                        </div>
                      ))}
                      <div style={{ marginBottom:8 }}>
                        <label style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', letterSpacing:0.5, textTransform:'uppercase', display:'block', marginBottom:3 }}>Licence class</label>
                        <select value={addForm.licenseClass} onChange={e => setAddForm(p => ({ ...p, licenseClass: e.target.value }))}
                          style={{ width:'100%', padding:'6px 9px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, fontFamily:'inherit' }}>
                          {['A','B','C','CE'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:4 }}>
                        <button onClick={handleAddDriver} disabled={addSaving} style={{ flex:1, padding:'7px', background:'#c4912a', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:addSaving?'not-allowed':'pointer', opacity:addSaving?0.7:1, fontFamily:'inherit' }}>
                          {addSaving ? 'Adding…' : 'Add driver'}
                        </button>
                        <button onClick={() => { setShowAddDriver(false); setAddError(''); }} style={{ flex:1, padding:'7px', background:'#fff', color:'var(--ink3)', border:'1px solid var(--border)', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Right panel: view mode */
          isOwner ? (
            /* vehicle_owner: show their driver pool summary */
            <SectionCard title={`My driver pool (${ownerDrivers.length})`}>
              {ownerLoading ? (
                <div style={{ padding:'16px 0', textAlign:'center', color:'var(--ink3)', fontSize:12 }}>Loading…</div>
              ) : ownerDrivers.length === 0 ? (
                <div style={{ padding:'16px 12px', background:'var(--cream)', borderRadius:8, fontSize:12, color:'var(--ink3)', textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>👤</div>
                  No drivers added yet.<br />
                  Click <strong>Edit assignment</strong> to add your first driver.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {ownerDrivers.map(d => (
                    <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, background: v.driverId===d.id ? 'rgba(196,145,42,0.12)' : 'var(--cream)', border: v.driverId===d.id ? '1px solid #c4912a30' : '1px solid var(--border)' }}>
                      <DriverAvatar driver={d} size={32} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'var(--ink)' }}>{d.name}</div>
                        <div style={{ fontSize:10, color:'var(--ink3)' }}>Class {d.licenseClass} · {d.licenseNumber||'—'}</div>
                      </div>
                      {v.driverId===d.id && <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3, background:'#c4912a', color:'#fff' }}>Assigned</span>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ) : (
            /* Tenant scope note in view mode */
            <SectionCard title="Tenant scope">
              <div style={{ padding: '8px 0' }}>
                <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.7 }}>
                  This vehicle belongs to tenant <strong style={{ color:'#c4912a' }}>{TENANTS_META[v.tenantId]?.name ?? v.tenantId}</strong> and is visible only to users within that tenant scope.
                </div>
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--cream)', borderRadius: 8, fontSize: 11, color: 'var(--ink3)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Assignment rules</div>
                  <ul style={{ margin: 0, padding: '0 0 0 16px', lineHeight: 2 }}>
                    <li>Vehicle can be assigned to one customer at a time</li>
                    <li>Department is a sub-unit within the customer org</li>
                    <li>All transfers are recorded in the History tab</li>
                    <li>Driver pool is scoped to the same tenant</li>
                  </ul>
                </div>
              </div>
            </SectionCard>
          )
        )}
      </div>
    </div>
  );
}

/* ── Device & IoT tab ──────────────────────────────────────────────── */
function DeviceIoTTab({ v }: { v: VehicleMaster }) {
  const allDevices    = useDevicesStore(s => s.devices);
  const loadDevices   = useDevicesStore(s => s.loadDevices);
  const allSims       = useSimsStore(s => s.sims);
  const loadSims      = useSimsStore(s => s.loadSims);
  const storeUpdateSim    = useSimsStore(s => s.updateSim);
  const storeUpdateDevice = useDevicesStore(s => s.updateDevice);

  /* Always reload on mount / tenant change — never use stale cached data */
  useEffect(() => {
    loadDevices(v.tenantId);
    loadSims(v.tenantId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.tenantId]);

  const devices = useMemo(() => allDevices.filter(d => d.vehicleId === v.id), [allDevices, v.id]);
  const sims    = useMemo(() => allSims.filter(s => s.vehicleId === v.id),    [allSims,    v.id]);

  /* Stock items available to assign */
  const stockSims = useMemo(
    () => allSims.filter(s => s.tenantId === v.tenantId && (!s.vehicleId || s.vehicleId === '')),
    [allSims, v.tenantId],
  );
  const stockDevices = useMemo(
    () => allDevices.filter(d => d.tenantId === v.tenantId && (!d.vehicleId || d.vehicleId === '')),
    [allDevices, v.tenantId],
  );

  /* Inline assignment state
     assigningSimFor: null | device-id | '__none' (standalone/empty-state) */
  const [assigningSimFor,  setAssigningSimFor]  = useState<string | null>(null);
  const [simAssignBusy,    setSimAssignBusy]    = useState(false);
  const [assigningDevice,  setAssigningDevice]  = useState(false);
  const [deviceAssignBusy, setDeviceAssignBusy] = useState(false);
  const [delinkBusy,       setDelinkBusy]       = useState(false);
  const [delinkConfirm,    setDelinkConfirm]     = useState<{
    targetDeviceId?: string; targetSimId?: string; mode: 'device' | 'sim' | 'both';
  } | null>(null);

  /* ── Edit device / SIM state ── */
  const [editDevice,      setEditDevice]      = useState<GpsDevice | null>(null);
  const [editDeviceSaving, setEditDeviceSaving] = useState(false);
  const [editDevForm,     setEditDevForm]     = useState({
    type: 'GPS Tracker' as DeviceType, model: '', serialNo: '', imei: '',
    firmware: '', installedAt: '', status: 'Online' as DeviceStatus, notes: '',
  });
  const [editSim,         setEditSim]         = useState<SimCard | null>(null);
  const [editSimSaving,   setEditSimSaving]   = useState(false);
  const [editSimForm,     setEditSimForm]     = useState({
    iccid: '', msisdn: '', operator: '', country: '', type: 'Primary' as SimType,
    status: 'Active' as SimStatus, apn: '', expiresAt: '', dataPlanMB: '',
  });

  function openEditDevice(d: GpsDevice) {
    setEditDevForm({
      type:        d.type,
      model:       d.model,
      serialNo:    d.serialNo,
      imei:        d.imei,
      firmware:    d.firmware,
      installedAt: d.installedAt?.slice(0, 10) ?? '',
      status:      d.status,
      notes:       d.notes,
    });
    setEditDevice(d);
  }

  function openEditSim(s: SimCard) {
    setEditSimForm({
      iccid:      s.iccid,
      msisdn:     s.msisdn,
      operator:   s.operator,
      country:    s.country,
      type:       s.type,
      status:     s.status,
      apn:        s.apn,
      expiresAt:  s.expiresAt?.slice(0, 10) ?? '',
      dataPlanMB: s.dataPlanMB ? String(s.dataPlanMB) : '',
    });
    setEditSim(s);
  }

  async function handleEditDeviceSave() {
    if (!editDevice) return;
    setEditDeviceSaving(true);
    try {
      const res = await fetch(`/api/v1/devices/${editDevice.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editDevForm.type, model: editDevForm.model,
          serialNo: editDevForm.serialNo, imei: editDevForm.imei,
          firmware: editDevForm.firmware, installedAt: editDevForm.installedAt || null,
          status: editDevForm.status, notes: editDevForm.notes,
        }),
      });
      if (res.ok) {
        storeUpdateDevice(await res.json() as GpsDevice);
        writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'Device Update',
          title: `${editDevForm.type} updated`,
          description: `${editDevForm.model} (${editDevForm.imei || editDevForm.serialNo}) details updated.`,
        });
        setEditDevice(null);
      }
    } catch { /* network error */ } finally { setEditDeviceSaving(false); }
  }

  async function handleEditSimSave() {
    if (!editSim) return;
    setEditSimSaving(true);
    try {
      const res = await fetch(`/api/v1/sims/${editSim.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iccid: editSimForm.iccid, msisdn: editSimForm.msisdn,
          operator: editSimForm.operator, country: editSimForm.country,
          type: editSimForm.type, status: editSimForm.status,
          apn: editSimForm.apn, expiresAt: editSimForm.expiresAt || null,
          dataPlanMB: editSimForm.dataPlanMB ? Number(editSimForm.dataPlanMB) : null,
        }),
      });
      if (res.ok) {
        storeUpdateSim(await res.json() as SimCard);
        writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'SIM Update',
          title: `SIM updated: ${editSimForm.msisdn || editSimForm.iccid}`,
          description: `${editSimForm.operator} SIM (${editSimForm.msisdn || editSimForm.iccid}) details updated on ${v.plate}.`,
        });
        setEditSim(null);
      }
    } catch { /* network error */ } finally { setEditSimSaving(false); }
  }

  async function handleAssignSim(simId: string) {
    setSimAssignBusy(true);
    try {
      const sim = stockSims.find(s => s.id === simId);
      const res = await fetch(`/api/v1/sims/${simId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ vehicleId: v.id, vehiclePlate: v.plate }),
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        storeUpdateSim(await res.json() as any);
        setAssigningSimFor(null);
        writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'SIM Link',
          title: `${sim?.type ?? 'SIM'} linked`,
          description: `${sim?.operator ?? ''} SIM (${sim?.msisdn ?? simId}) linked to ${v.plate}.`,
          meta: sim?.msisdn ?? simId,
        });
      }
    } catch { /* network error — stay open */ } finally {
      setSimAssignBusy(false);
    }
  }

  async function handleAssignDevice(deviceId: string) {
    setDeviceAssignBusy(true);
    try {
      const dev = stockDevices.find(d => d.id === deviceId);
      const res = await fetch(`/api/v1/devices/${deviceId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ vehicleId: v.id, vehiclePlate: v.plate }),
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        storeUpdateDevice(await res.json() as any);
        setAssigningDevice(false);
        writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'Device Link',
          title: `${dev?.type ?? 'GPS Device'} linked`,
          description: `${dev?.model ?? ''} (${dev?.serialNo || dev?.imei || deviceId}) linked to ${v.plate}.`,
          meta: dev?.serialNo || dev?.imei || deviceId,
        });
      }
    } catch { /* network error — stay open */ } finally {
      setDeviceAssignBusy(false);
    }
  }

  async function handleDelinkDevice(deviceId: string) {
    setDelinkBusy(true);
    const dev = devices.find(d => d.id === deviceId);
    console.log('[delink-device] start', { deviceId, tenantId: v.tenantId, vehicleId: v.id, dev });
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ vehicleId: '', vehiclePlate: '' }),
      });
      console.log('[delink-device] PATCH status', res.status, res.ok);
      if (res.ok) {
        const updated = await res.json();
        await writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'Device Unlink',
          title: `${dev?.type ?? 'GPS Device'} removed`,
          description: `${dev?.model ?? ''} (${dev?.serialNo || dev?.imei || deviceId}) unlinked from ${v.plate}.`,
          meta: dev?.serialNo || dev?.imei || deviceId,
        });
        console.log('[delink-device] audit write complete');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        storeUpdateDevice(updated as any);
      }
    } catch (e) { console.error('[delink-device] error', e); } finally {
      setDelinkBusy(false);
      setDelinkConfirm(null);
    }
  }

  async function handleDelinkSim(simId: string) {
    setDelinkBusy(true);
    const sim = sims.find(s => s.id === simId);
    try {
      const res = await fetch(`/api/v1/sims/${simId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ vehicleId: '', vehiclePlate: '' }),
      });
      if (res.ok) {
        const updated = await res.json();
        await writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'SIM Unlink',
          title: `${sim?.type ?? 'SIM'} removed`,
          description: `${sim?.operator ?? ''} SIM (${sim?.msisdn ?? simId}) unlinked from ${v.plate}.`,
          meta: sim?.msisdn ?? simId,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        storeUpdateSim(updated as any);
      }
    } catch { /* network error */ } finally {
      setDelinkBusy(false);
      setDelinkConfirm(null);
    }
  }

  async function handleDelinkBoth(deviceId: string, simId: string) {
    setDelinkBusy(true);
    const dev = devices.find(d => d.id === deviceId);
    const sim = sims.find(s => s.id === simId);
    try {
      const [devRes, simRes] = await Promise.all([
        fetch(`/api/v1/devices/${deviceId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ vehicleId: '', vehiclePlate: '' }),
        }),
        fetch(`/api/v1/sims/${simId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ vehicleId: '', vehiclePlate: '' }),
        }),
      ]);
      const [updatedDev, updatedSim] = await Promise.all([
        devRes.ok ? devRes.json() : Promise.resolve(null),
        simRes.ok ? simRes.json() : Promise.resolve(null),
      ]);
      await Promise.all([
        devRes.ok ? writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'Device Unlink',
          title: `${dev?.type ?? 'GPS Device'} removed`,
          description: `${dev?.model ?? ''} (${dev?.serialNo || dev?.imei || deviceId}) unlinked from ${v.plate}.`,
          meta: dev?.serialNo || dev?.imei || deviceId,
        }) : Promise.resolve(),
        simRes.ok ? writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'SIM Unlink',
          title: `${sim?.type ?? 'SIM'} removed`,
          description: `${sim?.operator ?? ''} SIM (${sim?.msisdn ?? simId}) unlinked from ${v.plate}.`,
          meta: sim?.msisdn ?? simId,
        }) : Promise.resolve(),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (updatedDev) storeUpdateDevice(updatedDev as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (updatedSim) storeUpdateSim(updatedSim as any);
    } catch { /* network error */ } finally {
      setDelinkBusy(false);
      setDelinkConfirm(null);
    }
  }

  const hasGps = v.latitude !== null && v.longitude !== null;

  /* Signal helpers */
  const sigBars  = (sig: string) => sig === 'Strong' ? 5 : sig === 'Medium' ? 3 : sig === 'Weak' ? 1 : 0;
  const sigColor = (sig: string) =>
    sig === 'Strong' ? '#c4912a' : sig === 'Medium' ? 'var(--amber)' : 'var(--red)';

  const DEV_STATUS_S: Record<string, { bg: string; fg: string }> = {
    Online:      { bg: 'rgba(196,145,42,0.12)', fg: '#c4912a' },
    Offline:     { bg: '#fef2f2',        fg: '#dc2626'        },
    Maintenance: { bg: '#fffbeb',        fg: '#d97706'        },
  };
  const SIM_STATUS_S: Record<string, { bg: string; fg: string }> = {
    Active:    { bg: 'rgba(196,145,42,0.12)', fg: '#c4912a' },
    Inactive:  { bg: '#f3f4f6',        fg: '#6b7280'        },
    Suspended: { bg: '#fffbeb',        fg: '#d97706'        },
    Expired:   { bg: '#fef2f2',        fg: '#dc2626'        },
  };
  const DTYPE_ICON: Record<string, string> = {
    'GPS Tracker': '📡', 'OBD Dongle': '🔌',
    'Dashcam': '📷', 'Temp Sensor': '🌡️', 'Fuel Sensor': '⛽',
  };

  /* ── Inline render helpers (NOT React components — avoids remount on re-render) ── */
  const renderDeviceRows = () => stockDevices.length === 0 ? (
    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink3)', fontSize: 11 }}>
      No GPS devices in stock for this tenant.
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {stockDevices.map(d => {
        const ds = DEV_STATUS_S[d.status] ?? DEV_STATUS_S.Offline;
        return (
          <div key={d.id}
            onClick={() => !deviceAssignBusy && handleAssignDevice(d.id)}
            style={{
              padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: '#fff', cursor: deviceAssignBusy ? 'default' : 'pointer',
              opacity: deviceAssignBusy ? 0.6 : 1,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13 }}>{DTYPE_ICON[d.type] ?? '📟'}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{d.model}</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: ds.bg, color: ds.fg }}>{d.status}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'monospace', marginTop: 2 }}>
                IMEI: {d.imei}{d.serialNo ? ` · S/N ${d.serialNo}` : ''}
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#c4912a', fontWeight: 700, flexShrink: 0 }}>
              {deviceAssignBusy ? '…' : 'Link →'}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderSimRows = () => stockSims.length === 0 ? (
    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink3)', fontSize: 11 }}>
      No SIM cards in stock for this tenant.
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {stockSims.map(s => {
        const ss = SIM_STATUS_S[s.status] ?? SIM_STATUS_S.Inactive;
        return (
          <div key={s.id}
            onClick={() => !simAssignBusy && handleAssignSim(s.id)}
            style={{
              padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: '#fff', cursor: simAssignBusy ? 'default' : 'pointer',
              opacity: simAssignBusy ? 0.6 : 1,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{s.operator}</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: ss.bg, color: ss.fg }}>{s.type}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'monospace', marginTop: 2 }}>{s.msisdn || s.iccid}</div>
            </div>
            <span style={{ fontSize: 11, color: '#c4912a', fontWeight: 700, flexShrink: 0 }}>
              {simAssignBusy ? '…' : 'Link →'}
            </span>
          </div>
        );
      })}
    </div>
  );

  /* ── No hardware linked at all — show assignment panel ─────────── */
  if (devices.length === 0 && sims.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ background: '#fff', border: '1px dashed var(--border2)', borderRadius: 10, padding: '24px 24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>No hardware linked to {v.plate}</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
            Assign a GPS device and / or SIM card from your available stock.
          </div>
        </div>

        {/* Two-column assignment grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* ── Device picker ── */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--cream)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>
              📡 GPS Device
            </div>
            <div style={{ padding: 12, maxHeight: 280, overflowY: 'auto' as const }}>
              {renderDeviceRows()}
            </div>
          </div>

          {/* ── SIM picker ── */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--cream)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>
              📶 SIM Card
            </div>
            <div style={{ padding: 12, maxHeight: 280, overflowY: 'auto' as const }}>
              {renderSimRows()}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── One card per device ── */}
      {devices.map(d => {
        const bars      = sigBars(d.signal);
        const sc        = sigColor(d.signal);
        const ds        = DEV_STATUS_S[d.status] ?? DEV_STATUS_S.Offline;
        const battColor = d.battery == null ? 'var(--ink3)'
                        : d.battery >= 50 ? '#c4912a'
                        : d.battery >= 20 ? 'var(--amber)' : 'var(--red)';
        /* Find the SIM that belongs to this device (simId link) or falls back
           to any SIM on this vehicle */
        const linkedSim = d.simId
          ? (sims.find(s => s.id === d.simId) ?? sims[0] ?? null)
          : (sims[0] ?? null);

        return (
          <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Banner */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(196,145,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {DTYPE_ICON[d.type] ?? '📟'}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{d.model}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{d.type}{d.serialNo ? ` · S/N ${d.serialNo}` : ''}</div>
                </div>
                {/* Status */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: ds.bg, color: ds.fg }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: ds.fg }} />
                  {d.status}
                </span>
                {/* Signal bars */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 20, justifyContent: 'center' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ width: 5, borderRadius: 2, background: i <= bars ? sc : 'var(--border)', height: `${5 + i * 3}px` }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 3, fontWeight: 600, letterSpacing: 0.5 }}>{d.signal}</div>
                </div>
                {/* Battery */}
                {d.battery !== null ? (
                  <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 44, height: 12, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${d.battery}%`, background: battColor, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ width: 4, height: 6, background: 'var(--border)', borderRadius: '0 2px 2px 0' }} />
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 3, fontWeight: 600 }}>{d.battery}% battery</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 600 }}>⚡ Hardwired</div>
                )}
              </div>
            </div>

            {/* Delink action row */}
            {delinkConfirm?.targetDeviceId === d.id ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, flex: 1 }}>
                  {delinkConfirm.mode === 'both'   ? '⚠️ Delink device AND SIM from this vehicle?' :
                   delinkConfirm.mode === 'device' ? '⚠️ Delink GPS device from this vehicle?' :
                                                     '⚠️ Delink SIM card from this vehicle?'}
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button disabled={delinkBusy} onClick={() => setDelinkConfirm(null)}
                    style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, border: '1px solid var(--border2)', borderRadius: 6, background: '#fff', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'inherit', opacity: delinkBusy ? 0.5 : 1 }}>
                    Cancel
                  </button>
                  <button disabled={delinkBusy}
                    onClick={() => {
                      if (delinkConfirm.mode === 'both' && delinkConfirm.targetDeviceId && delinkConfirm.targetSimId)
                        handleDelinkBoth(delinkConfirm.targetDeviceId, delinkConfirm.targetSimId);
                      else if (delinkConfirm.mode === 'device' && delinkConfirm.targetDeviceId)
                        handleDelinkDevice(delinkConfirm.targetDeviceId);
                      else if (delinkConfirm.mode === 'sim' && delinkConfirm.targetSimId)
                        handleDelinkSim(delinkConfirm.targetSimId);
                    }}
                    style={{ padding: '5px 14px', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', cursor: delinkBusy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: delinkBusy ? 0.7 : 1 }}>
                    {delinkBusy ? 'Removing…' : 'Confirm Delink'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 600, marginRight: 4 }}>Delink:</span>
                <button onClick={() => setDelinkConfirm({ targetDeviceId: d.id, mode: 'device' })}
                  style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: '1px solid #fca5a5', borderRadius: 6, background: '#fff', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                  📡 Device
                </button>
                {linkedSim && (
                  <button onClick={() => setDelinkConfirm({ targetDeviceId: d.id, targetSimId: linkedSim.id, mode: 'sim' })}
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: '1px solid #fca5a5', borderRadius: 6, background: '#fff', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                    📶 SIM
                  </button>
                )}
                {linkedSim && (
                  <button onClick={() => setDelinkConfirm({ targetDeviceId: d.id, targetSimId: linkedSim.id, mode: 'both' })}
                    style={{ padding: '4px 12px', fontSize: 11, fontWeight: 700, border: '1px solid #dc2626', borderRadius: 6, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ⛔ Delink Both
                  </button>
                )}
              </div>
            )}

            {/* Identity + SIM two-column */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <SectionCard title="Identity & Hardware" onAction={() => openEditDevice(d)}>
                <InfoRow label="Device ID"      value={d.id} mono />
                <InfoRow label="Model"          value={d.model} />
                <InfoRow label="Type"           value={d.type} />
                <InfoRow label="IMEI"           value={d.imei} mono />
                <InfoRow label="Serial number"  value={d.serialNo || '—'} mono />
                <InfoRow label="Firmware"       value={d.firmware || '—'} mono />
                <InfoRow label="Installed"      value={d.installedAt
                  ? new Date(d.installedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
                  : '—'} />
                {d.notes && <InfoRow label="Notes" value={d.notes} />}
              </SectionCard>

              <SectionCard title="SIM & Connectivity" onAction={linkedSim ? () => openEditSim(linkedSim) : undefined}>
                {linkedSim ? (
                  <>
                    <InfoRow label="ICCID"         value={linkedSim.iccid} mono />
                    <InfoRow label="MSISDN"        value={linkedSim.msisdn || '—'} />
                    <InfoRow label="Operator"      value={linkedSim.operator} />
                    <InfoRow label="Country"       value={linkedSim.country} />
                    <InfoRow label="APN"           value={linkedSim.apn} mono />
                    <InfoRow label="Type"          value={linkedSim.type} />
                    <InfoRow label="Status"        value={
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 4,
                        background: (SIM_STATUS_S[linkedSim.status] ?? SIM_STATUS_S.Inactive).bg,
                        color:      (SIM_STATUS_S[linkedSim.status] ?? SIM_STATUS_S.Inactive).fg,
                      }}>{linkedSim.status}</span>
                    } />
                    <InfoRow label="Expires"       value={linkedSim.expiresAt || '—'} />
                    {linkedSim.dataPlanMB > 0 && (() => {
                      const pct = Math.min(Math.round((linkedSim.dataUsedMB / linkedSim.dataPlanMB) * 100), 100);
                      const barColor = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--amber)' : '#c4912a';
                      return (
                        <div style={{ paddingTop: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink3)', marginBottom: 4 }}>
                            <span>Data usage</span>
                            <span style={{ fontWeight: 600 }}>{(linkedSim.dataUsedMB/1024).toFixed(1)} / {(linkedSim.dataPlanMB/1024).toFixed(0)} GB</span>
                          </div>
                          <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3 }} />
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : assigningSimFor === d.id ? (
                  /* ── Inline SIM picker ── */
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.7, marginBottom: 8 }}>
                      SELECT SIM FROM STOCK
                    </div>
                    {stockSims.length === 0 ? (
                      <div style={{ fontSize: 11, color: 'var(--ink3)', padding: '12px 0', textAlign: 'center' }}>
                        No SIM cards in stock for this tenant.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
                        {stockSims.map(s => {
                          const ss = SIM_STATUS_S[s.status] ?? SIM_STATUS_S.Inactive;
                          return (
                            <div key={s.id}
                              onClick={() => !simAssignBusy && handleAssignSim(s.id)}
                              style={{
                                padding: '8px 10px', borderRadius: 7,
                                border: '1px solid var(--border)', background: '#fff',
                                cursor: simAssignBusy ? 'default' : 'pointer',
                                opacity: simAssignBusy ? 0.6 : 1,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{s.operator}</span>
                                  <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: ss.bg, color: ss.fg }}>{s.type}</span>
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'monospace', marginTop: 1 }}>{s.msisdn || s.iccid}</div>
                              </div>
                              <span style={{ fontSize: 11, color: '#c4912a', fontWeight: 700 }}>Link →</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button onClick={() => setAssigningSimFor(null)}
                      style={{ marginTop: 8, padding: '4px 12px', fontSize: 10, border: '1px solid var(--border2)', borderRadius: 4, background: '#fff', cursor: 'pointer', color: 'var(--ink3)', fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  /* ── No SIM — offer to assign one ── */
                  <div style={{ padding: '16px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 10 }}>No SIM linked to this device.</div>
                    {stockSims.length > 0 ? (
                      <button onClick={() => setAssigningSimFor(d.id)}
                        style={{ padding: '5px 14px', fontSize: 11, fontWeight: 600, border: '1px solid #c4912a', borderRadius: 6, background: 'rgba(196,145,42,0.12)', color: '#c4912a', cursor: 'pointer', fontFamily: 'inherit' }}>
                        📶 Assign SIM from stock
                      </button>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--ink3)', fontStyle: 'italic' }}>No SIMs in stock.</div>
                    )}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        );
      })}

      {/* ── No device linked but SIM(s) exist — offer to assign one ── */}
      {devices.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: 'var(--cream)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>
            📡 GPS Device
          </div>
          <div style={{ padding: 14 }}>
            {assigningDevice ? (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', letterSpacing: 0.7, marginBottom: 8 }}>SELECT DEVICE FROM STOCK</div>
                {renderDeviceRows()}
                <button onClick={() => setAssigningDevice(false)}
                  style={{ marginTop: 8, padding: '4px 12px', fontSize: 10, border: '1px solid var(--border2)', borderRadius: 4, background: '#fff', cursor: 'pointer', color: 'var(--ink3)', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 10 }}>No GPS device linked to this vehicle.</div>
                {stockDevices.length > 0 ? (
                  <button onClick={() => setAssigningDevice(true)}
                    style={{ padding: '5px 14px', fontSize: 11, fontWeight: 600, border: '1px solid #c4912a', borderRadius: 6, background: 'rgba(196,145,42,0.12)', color: '#c4912a', cursor: 'pointer', fontFamily: 'inherit' }}>
                    📡 Assign GPS Device from stock
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--ink3)', fontStyle: 'italic' }}>No GPS devices in stock.</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Standalone SIMs not shown inside any device card above ──
           A SIM is "standalone" when no device explicitly references it via simId
           AND no device rendered it via the sims[0] fallback (i.e. no devices at all,
           or every device already has its own explicit simId link).           ── */}
      {sims.filter(s => {
        if (devices.length === 0) return true;               // no devices → always show standalone
        // already rendered inside a device card via sims[0] fallback?
        const renderedAsLinked = devices.some(d => !d.simId) // device uses sims[0] fallback
          && sims[0]?.id === s.id;                           // this SIM is sims[0]
        return !renderedAsLinked && !devices.some(d => d.simId === s.id);
      }).map(s => {
        const ss  = SIM_STATUS_S[s.status] ?? SIM_STATUS_S.Inactive;
        const pct = s.dataPlanMB > 0 ? Math.min(Math.round((s.dataUsedMB / s.dataPlanMB) * 100), 100) : 0;
        const barColor = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--amber)' : '#c4912a';
        return (
          <SectionCard key={s.id} title="SIM Card" onAction={() => openEditSim(s)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <InfoRow label="ICCID"    value={s.iccid} mono />
              <InfoRow label="MSISDN"   value={s.msisdn || '—'} />
              <InfoRow label="Operator" value={s.operator} />
              <InfoRow label="Country"  value={s.country} />
              <InfoRow label="Type"     value={s.type} />
              <InfoRow label="Status"   value={
                <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 4, background: ss.bg, color: ss.fg }}>{s.status}</span>
              } />
              <InfoRow label="APN"      value={s.apn} mono />
              <InfoRow label="Expires"  value={s.expiresAt || '—'} />
            </div>
            {s.dataPlanMB > 0 && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--cream)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink3)', marginBottom: 4 }}>
                  <span>Data usage</span>
                  <span style={{ fontWeight: 600 }}>{(s.dataUsedMB/1024).toFixed(1)} / {(s.dataPlanMB/1024).toFixed(0)} GB · {pct}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3 }} />
                </div>
              </div>
            )}
            {/* Delink SIM action */}
            <div style={{ marginTop: 12 }}>
              {delinkConfirm?.targetSimId === s.id && !delinkConfirm?.targetDeviceId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                  <span style={{ flex: 1, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>⚠️ Delink this SIM from {v.plate}?</span>
                  <button disabled={delinkBusy} onClick={() => setDelinkConfirm(null)}
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: '1px solid var(--border2)', borderRadius: 5, background: '#fff', color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                  <button disabled={delinkBusy} onClick={() => handleDelinkSim(s.id)}
                    style={{ padding: '4px 12px', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 5, background: '#dc2626', color: '#fff', cursor: delinkBusy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: delinkBusy ? 0.7 : 1 }}>
                    {delinkBusy ? 'Removing…' : 'Confirm'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setDelinkConfirm({ targetSimId: s.id, mode: 'sim' })}
                    style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, border: '1px solid #fca5a5', borderRadius: 6, background: '#fff', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                    📶 Delink SIM
                  </button>
                </div>
              )}
            </div>
          </SectionCard>
        );
      })}

      {/* ── Live GPS position ── */}
      <SectionCard title="Live GPS Position">
        {hasGps ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 6 }}>
            {[
              { label: 'Latitude',    value: v.latitude?.toFixed(6) ?? '—',    mono: true  },
              { label: 'Longitude',   value: v.longitude?.toFixed(6) ?? '—',   mono: true  },
              { label: 'Speed',       value: v.speedKmh != null ? `${v.speedKmh} km/h` : '—' },
              { label: 'Altitude',    value: '—' },
              { label: 'Heading',     value: '—' },
              { label: 'Last update', value: v.lastSeenAt ? new Date(v.lastSeenAt).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—' },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ background: 'var(--cream)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 9, color: 'var(--ink3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
            📡 No GPS fix — device may be indoors or GPS antenna disconnected
          </div>
        )}
      </SectionCard>

      {/* ── Device actions ── */}
      {devices.length > 0 && (
        <SectionCard title="Device Actions">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 6 }}>
            {[
              { label: '📍 Request Location', color: '#c4912a',  bg: 'rgba(196,145,42,0.12)'  },
              { label: '📢 Horn',             color: '#7c3aed',      bg: '#ede9fe'          },
              { label: '💬 Message Driver',   color: 'var(--ink2)',  bg: 'var(--cream)'     },
              { label: '🔄 Restart Device',   color: 'var(--amber)', bg: 'var(--amber-lt)'  },
              { label: '🔒 Lock Doors',       color: 'var(--ink2)',  bg: 'var(--cream)'     },
            ].map(({ label, color, bg }) => (
              <button key={label} style={{
                padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${color}40`, background: bg, color, fontFamily: 'inherit',
              }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Custom command e.g. SET_INTERVAL,30" style={{ flex: 1, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', color: 'var(--ink)' }} />
            <button style={{ padding: '7px 16px', background: '#c4912a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Send</button>
          </div>
        </SectionCard>
      )}

      {/* ── Edit Device modal ── */}
      {editDevice && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999 }}
          onClick={e => { if (e.target===e.currentTarget) setEditDevice(null); }}>
          <div style={{ background:'#fff',borderRadius:12,width:440,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontWeight:700,fontSize:14 }}>Edit GPS Device</span>
              <button onClick={() => setEditDevice(null)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--ink3)' }}>✕</button>
            </div>
            <div style={{ padding:20,display:'flex',flexDirection:'column',gap:12 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Type</label>
                  <select value={editDevForm.type} onChange={e => setEditDevForm(f => ({ ...f, type: e.target.value as DeviceType }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12 }}>
                    {(['GPS Tracker','OBD Dongle','Dashcam','Temp Sensor','Fuel Sensor'] as DeviceType[]).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Status</label>
                  <select value={editDevForm.status} onChange={e => setEditDevForm(f => ({ ...f, status: e.target.value as DeviceStatus }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12 }}>
                    {(['Online','Offline','Maintenance'] as DeviceStatus[]).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Model</label>
                <input value={editDevForm.model} onChange={e => setEditDevForm(f => ({ ...f, model: e.target.value }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>IMEI</label>
                  <input value={editDevForm.imei} onChange={e => setEditDevForm(f => ({ ...f, imei: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,fontFamily:'monospace',boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Serial No</label>
                  <input value={editDevForm.serialNo} onChange={e => setEditDevForm(f => ({ ...f, serialNo: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,fontFamily:'monospace',boxSizing:'border-box' as const }} />
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Firmware</label>
                  <input value={editDevForm.firmware} onChange={e => setEditDevForm(f => ({ ...f, firmware: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,fontFamily:'monospace',boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Installed date</label>
                  <input type="date" value={editDevForm.installedAt} onChange={e => setEditDevForm(f => ({ ...f, installedAt: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Notes</label>
                <textarea value={editDevForm.notes} onChange={e => setEditDevForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,resize:'vertical',minHeight:56,boxSizing:'border-box' as const }} />
              </div>
              <div style={{ display:'flex',gap:8 }}>
                <button disabled={editDeviceSaving} onClick={handleEditDeviceSave}
                  style={{ flex:1,padding:'9px 0',background:'#c4912a',color:'#fff',border:'none',borderRadius:8,fontWeight:600,fontSize:13,cursor:editDeviceSaving?'not-allowed':'pointer',opacity:editDeviceSaving?0.7:1 }}>
                  {editDeviceSaving ? 'Saving…' : 'Save changes'}
                </button>
                <button onClick={() => setEditDevice(null)}
                  style={{ flex:1,padding:'9px 0',background:'#fff',color:'var(--ink3)',border:'1px solid var(--border2)',borderRadius:8,fontSize:13,cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit SIM modal ── */}
      {editSim && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999 }}
          onClick={e => { if (e.target===e.currentTarget) setEditSim(null); }}>
          <div style={{ background:'#fff',borderRadius:12,width:440,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontWeight:700,fontSize:14 }}>Edit SIM Card</span>
              <button onClick={() => setEditSim(null)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--ink3)' }}>✕</button>
            </div>
            <div style={{ padding:20,display:'flex',flexDirection:'column',gap:12 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Status</label>
                  <select value={editSimForm.status} onChange={e => setEditSimForm(f => ({ ...f, status: e.target.value as SimStatus }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12 }}>
                    {(['Active','Inactive','Suspended','Expired'] as SimStatus[]).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Type</label>
                  <select value={editSimForm.type} onChange={e => setEditSimForm(f => ({ ...f, type: e.target.value as SimType }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12 }}>
                    {(['Primary','Backup'] as SimType[]).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>MSISDN (phone no.)</label>
                  <input value={editSimForm.msisdn} onChange={e => setEditSimForm(f => ({ ...f, msisdn: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,fontFamily:'monospace',boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>ICCID</label>
                  <input value={editSimForm.iccid} onChange={e => setEditSimForm(f => ({ ...f, iccid: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,fontFamily:'monospace',boxSizing:'border-box' as const }} />
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Operator</label>
                  <input value={editSimForm.operator} onChange={e => setEditSimForm(f => ({ ...f, operator: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Country</label>
                  <input value={editSimForm.country} onChange={e => setEditSimForm(f => ({ ...f, country: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>APN</label>
                  <input value={editSimForm.apn} onChange={e => setEditSimForm(f => ({ ...f, apn: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,fontFamily:'monospace',boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Expires</label>
                  <input type="date" value={editSimForm.expiresAt} onChange={e => setEditSimForm(f => ({ ...f, expiresAt: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Data plan (MB)</label>
                <input type="number" placeholder="e.g. 10240 for 10 GB" value={editSimForm.dataPlanMB} onChange={e => setEditSimForm(f => ({ ...f, dataPlanMB: e.target.value }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
              </div>
              <div style={{ display:'flex',gap:8 }}>
                <button disabled={editSimSaving} onClick={handleEditSimSave}
                  style={{ flex:1,padding:'9px 0',background:'#c4912a',color:'#fff',border:'none',borderRadius:8,fontWeight:600,fontSize:13,cursor:editSimSaving?'not-allowed':'pointer',opacity:editSimSaving?0.7:1 }}>
                  {editSimSaving ? 'Saving…' : 'Save changes'}
                </button>
                <button onClick={() => setEditSim(null)}
                  style={{ flex:1,padding:'9px 0',background:'#fff',color:'var(--ink3)',border:'1px solid var(--border2)',borderRadius:8,fontSize:13,cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Maintenance tab ────────────────────────────────────────────────── */
function MaintenanceTab({ v }: { v: VehicleMaster }) {
  const [showAdd,      setShowAdd]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [statusFilter, setStatusFilter] = useState<MaintStatus | 'All'>('All');
  const [editRec,  setEditRec]  = useState<MaintenanceRecord | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    type:           'Oil Change' as MaintType,
    status:         'Upcoming' as MaintStatus,
    scheduledDate:  '',
    completedDate:  '',
    odometerDue:    '',
    garage:         '',
    notes:          '',
    priority:       'Medium',
  });
  const [form, setForm] = useState({
    type:          'Oil Change' as MaintType,
    scheduledDate: '',
    odometerDue:   '',
    garage:        '',
    notes:         '',
    sendReminder:  true,
  });
  const MAINT_TYPES: MaintType[] = ['Oil Change','Full Service','Tyre Rotation','Brake Inspection','Engine Overhaul','Body Repair','Other'];

  const loadSchedules   = useMaintenanceStore(s => s.loadSchedules);
  const storeSchedules  = useMaintenanceStore(s => s.schedules);
  const addSchedule     = useMaintenanceStore(s => s.addSchedule);
  const updateSchedule  = useMaintenanceStore(s => s.updateSchedule);

  useEffect(() => { loadSchedules(v.tenantId); }, [v.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Map MaintenanceSchedule rows → MaintenanceRecord for display */
  const scheduleRecords: MaintenanceRecord[] = storeSchedules
    .filter(s => s.vehicleShortId === v.id)
    .map(s => ({
      id:            s.id,
      type:          (s.serviceType as MaintType) || 'Other',
      status:        (s.status === 'Scheduled' ? 'Upcoming' : s.status) as MaintStatus,
      scheduledDate: s.dueAt ?? s.createdAt,
      odometerDue:   parseInt(s.mileage) || 0,
      garage:        '',
      notes:         s.notes,
      reminderSent:  false,
    }));

  async function handleSave() {
    if (!form.scheduledDate) return;
    setSaving(true);
    try {
      const notesPayload = [form.garage ? `Garage: ${form.garage}` : '', form.notes].filter(Boolean).join('\n');
      const res = await fetch('/api/v1/maintenance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId:       v.tenantId,
          vehicleShortId: v.id,
          vehiclePlate:   v.plate,
          vehicleMake:    `${v.make} ${v.model}`,
          serviceType:    form.type,
          dueAt:          form.scheduledDate,
          mileage:        form.odometerDue,
          status:         'Scheduled',
          priority:       'Medium',
          notes:          notesPayload,
        }),
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addSchedule(await res.json() as any);
        writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'Maintenance',
          title: `${form.type} scheduled`,
          description: `${form.type} scheduled for ${form.scheduledDate}${form.garage ? ' at ' + form.garage : ''}.`,
          meta: form.odometerDue ? `${parseInt(form.odometerDue).toLocaleString()} km` : undefined,
        });
        setShowAdd(false);
        setForm({ type: 'Oil Change', scheduledDate: '', odometerDue: '', garage: '', notes: '', sendReminder: true });
      }
    } catch { /* network error */ } finally {
      setSaving(false);
    }
  }

  async function handleMarkDone(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    const record = scheduleRecords.find(r => r.id === id);
    try {
      const res = await fetch(`/api/v1/maintenance/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'Completed', lastDoneAt: today }),
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateSchedule(await res.json() as any);
        writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'Maintenance',
          title: `${record?.type ?? 'Maintenance'} completed`,
          description: `${record?.type ?? 'Maintenance'} completed on ${v.plate} on ${today}.`,
          meta: record?.odometerDue ? `${record.odometerDue.toLocaleString()} km` : undefined,
        });
      }
    } catch { /* network error */ }
  }

  function openEdit(m: MaintenanceRecord) {
    /* parse garage back out of notes ("Garage: X\nrest" format) */
    const garageMatch = m.notes?.match(/^Garage: (.+?)(?:\n|$)/);
    const garage = garageMatch ? garageMatch[1] : '';
    const notes  = garageMatch ? m.notes.replace(/^Garage: .+?\n?/, '') : (m.notes ?? '');
    setEditForm({
      type:          m.type,
      status:        m.status,
      scheduledDate: m.scheduledDate?.slice(0, 10) ?? '',
      completedDate: m.completedDate?.slice(0, 10) ?? '',
      odometerDue:   m.odometerDue ? String(m.odometerDue) : '',
      garage,
      notes,
      priority:      'Medium',
    });
    setEditRec(m);
  }

  async function handleEditSave() {
    if (!editRec) return;
    setEditSaving(true);
    const notesPayload = [editForm.garage ? `Garage: ${editForm.garage}` : '', editForm.notes].filter(Boolean).join('\n');
    const dbStatus = editForm.status === 'Upcoming' ? 'Scheduled' : editForm.status;
    try {
      const res = await fetch(`/api/v1/maintenance/${editRec.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          serviceType: editForm.type,
          status:      dbStatus,
          dueAt:       editForm.scheduledDate || null,
          lastDoneAt:  editForm.completedDate || null,
          mileage:     editForm.odometerDue   || null,
          priority:    editForm.priority,
          notes:       notesPayload,
        }),
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateSchedule(await res.json() as any);
        writeVehicleHistory({
          tenantId: v.tenantId, vehicleId: v.id, eventType: 'Maintenance',
          title: `${editForm.type} updated`,
          description: `${editForm.type} record updated — status: ${editForm.status}${editForm.garage ? ', garage: ' + editForm.garage : ''}.`,
        });
        setEditRec(null);
      }
    } catch { /* network error */ } finally {
      setEditSaving(false);
    }
  }

  const allMaintenance = [...v.maintenance, ...scheduleRecords];

  const sorted = [...allMaintenance].sort((a,b) => {
    const order = { Overdue: 0, Upcoming: 1, Completed: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  const overdue   = sorted.filter(m => m.status === 'Overdue');
  const upcoming  = sorted.filter(m => m.status === 'Upcoming');
  const completed = sorted.filter(m => m.status === 'Completed');

  function MaintCard({ m }: { m: MaintenanceRecord }) {
    const isPast    = m.status === 'Completed';
    const isEditable = m.id.startsWith('ms-');
    return (
      <div
        onClick={isEditable ? () => openEdit(m) : undefined}
        style={{
          background: '#fff', border: `1px solid ${m.status==='Overdue'?'var(--red)':m.status==='Upcoming'?'var(--amber)':'var(--border)'}`,
          borderRadius: 10, padding: '14px 16px', marginBottom: 10,
          cursor: isEditable ? 'pointer' : 'default',
          transition: 'box-shadow 0.15s',
        }}
        onMouseEnter={e => { if (isEditable) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{m.status==='Overdue'?'🚨':m.status==='Upcoming'?'⏰':'✅'}</span>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'var(--ink)' }}>{m.type}</div>
              <div style={{ fontSize:10, color:'var(--ink3)' }}>{m.garage ? `Garage: ${m.garage}` : 'No garage specified'}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {isEditable && <span style={{ fontSize:9, color:'var(--ink3)', fontWeight:500 }}>Edit ✎</span>}
            <span style={{
              fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20,
              background: MAINT_BG[m.status], color: MAINT_COLOR[m.status],
            }}>{m.status}</span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:12 }}>
          <div style={{ background:'var(--cream)', borderRadius:6, padding:'8px 10px' }}>
            <div style={{ fontSize:9, color:'var(--ink3)', marginBottom:2 }}>Scheduled</div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--ink)' }}>
              {new Date(m.scheduledDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
            </div>
          </div>
          <div style={{ background:'var(--cream)', borderRadius:6, padding:'8px 10px' }}>
            <div style={{ fontSize:9, color:'var(--ink3)', marginBottom:2 }}>Odometer due</div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--ink)' }}>{m.odometerDue.toLocaleString()} km</div>
          </div>
          {isPast ? (
            <div style={{ background:'rgba(196,145,42,0.12)', borderRadius:6, padding:'8px 10px' }}>
              <div style={{ fontSize:9, color:'#c4912a', marginBottom:2 }}>Completed on</div>
              <div style={{ fontSize:11, fontWeight:600, color:'#c4912a' }}>
                {m.completedDate ? new Date(m.completedDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
              </div>
            </div>
          ) : (
            <div style={{ background: m.status==='Overdue'?'var(--red-lt)':'var(--amber-lt)', borderRadius:6, padding:'8px 10px' }}>
              <div style={{ fontSize:9, color:MAINT_COLOR[m.status], marginBottom:2 }}>Due in</div>
              <div style={{ fontSize:11, fontWeight:700, color:MAINT_COLOR[m.status] }}>
                {Math.ceil((new Date(m.scheduledDate).getTime() - Date.now())/86400000)} days
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:10, color:'var(--ink3)' }}>
            {m.cost ? `Cost: KES ${m.cost.toLocaleString()}` : 'Cost: TBD'}
            {m.odometerDone ? ` · Done at ${m.odometerDone.toLocaleString()} km` : ''}
          </div>
          <span style={{
            fontSize:9, padding:'2px 6px', borderRadius:3,
            background: m.reminderSent?'rgba(196,145,42,0.12)':'var(--cream3)',
            color: m.reminderSent?'#c4912a':'var(--ink3)', fontWeight:600,
          }}>
            {m.reminderSent ? '🔔 Reminder sent' : '🔕 No reminder yet'}
          </span>
        </div>
        {m.notes && <div style={{ marginTop:6, fontSize:10, color:'var(--ink3)', fontStyle:'italic' }}>{m.notes}</div>}
        {!isPast && m.id.startsWith('ms-') && (
          <div style={{ marginTop:10, textAlign:'right' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => handleMarkDone(m.id)}
              style={{ padding:'5px 14px', fontSize:11, fontWeight:600, border:'1px solid #c4912a', borderRadius:6, background:'rgba(196,145,42,0.12)', color:'#c4912a', cursor:'pointer', fontFamily:'inherit' }}>
              ✓ Mark as done
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        {([
          { label:'Overdue'   as MaintStatus, count:overdue.length,   bg:'var(--red-lt)',   color:'var(--red)'   },
          { label:'Upcoming'  as MaintStatus, count:upcoming.length,  bg:'var(--amber-lt)', color:'var(--amber)' },
          { label:'Completed' as MaintStatus, count:completed.length, bg:'rgba(196,145,42,0.12)',  color:'#c4912a'  },
        ]).map(s => {
          const isActive = statusFilter === s.label;
          return (
            <div key={s.label}
              onClick={() => setStatusFilter(isActive ? 'All' : s.label)}
              style={{ flex:1, background: isActive ? s.bg : '#fff', borderRadius:8, padding:'10px 14px', textAlign:'center', cursor:'pointer', border:`1px solid ${isActive ? s.color : 'var(--border)'}`, transition:'box-shadow 0.15s' }}
              onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)')}
              onMouseLeave={e=>(e.currentTarget.style.boxShadow='none')}
            >
              <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.count}</div>
              <div style={{ fontSize:10, color:s.color, fontWeight:500, marginTop:2 }}>{s.label}</div>
              {isActive && <div style={{ fontSize:8, color:s.color, marginTop:2, fontWeight:700, letterSpacing:0.5 }}>● FILTERED</div>}
            </div>
          );
        })}
        <button onClick={() => setShowAdd(true)} style={{
          padding:'0 16px', background:'#c4912a', color:'#fff', border:'none',
          borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer',
        }}>+ Schedule</button>
      </div>

      {(statusFilter === 'All' || statusFilter === 'Overdue') && overdue.length > 0 && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--red)', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Overdue</div>
          {overdue.map(m => <MaintCard key={m.id} m={m} />)}
        </div>
      )}
      {(statusFilter === 'All' || statusFilter === 'Upcoming') && upcoming.length > 0 && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--amber)', letterSpacing:1, textTransform:'uppercase', marginBottom:8, marginTop: (statusFilter === 'All' && overdue.length > 0) ? 12 : 0 }}>Upcoming</div>
          {upcoming.map(m => <MaintCard key={m.id} m={m} />)}
        </div>
      )}
      {(statusFilter === 'All' || statusFilter === 'Completed') && completed.length > 0 && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#c4912a', letterSpacing:1, textTransform:'uppercase', marginBottom:8, marginTop: (statusFilter === 'All' && (overdue.length + upcoming.length) > 0) ? 12 : 0 }}>Completed</div>
          {completed.map(m => <MaintCard key={m.id} m={m} />)}
        </div>
      )}
      {statusFilter !== 'All' && overdue.concat(upcoming, completed).filter(m => m.status === statusFilter).length === 0 && (
        <div style={{ padding:'32px 0', textAlign:'center', color:'var(--ink3)', fontSize:12 }}>
          No {statusFilter.toLowerCase()} records.
        </div>
      )}

      {/* Schedule modal */}
      {showAdd && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:999,
        }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background:'#fff', borderRadius:12, width:420, boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:700, fontSize:14 }}>Schedule maintenance</span>
              <button onClick={() => setShowAdd(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--ink3)' }}>✕</button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MaintType }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12 }}>
                  {MAINT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Scheduled date</label>
                <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Odometer due (km)</label>
                <input type="number" placeholder="e.g. 50000" value={form.odometerDue} onChange={e => setForm(f => ({ ...f, odometerDue: e.target.value }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Garage / service centre</label>
                <input placeholder="e.g. Mercedes-Benz New York" value={form.garage} onChange={e => setForm(f => ({ ...f, garage: e.target.value }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,resize:'vertical',minHeight:60,boxSizing:'border-box' as const }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                <input type="checkbox" id="send-reminder" checked={form.sendReminder} onChange={e => setForm(f => ({ ...f, sendReminder: e.target.checked }))} />
                <label htmlFor="send-reminder" style={{ fontSize:11, color:'var(--ink2)' }}>Send reminder 7 days before due date</label>
              </div>
              <button
                disabled={saving || !form.scheduledDate}
                onClick={handleSave}
                style={{ marginTop:4,padding:'9px 0',background:'#c4912a',color:'#fff',border:'none',borderRadius:8,fontWeight:600,fontSize:13,cursor: saving || !form.scheduledDate ? 'default' : 'pointer', opacity: saving || !form.scheduledDate ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit maintenance record modal */}
      {editRec && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:999,
        }} onClick={e => { if (e.target === e.currentTarget) setEditRec(null); }}>
          <div style={{ background:'#fff', borderRadius:12, width:440, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:14 }}>Edit maintenance record</span>
              <button onClick={() => setEditRec(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--ink3)' }}>✕</button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Service type</label>
                  <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value as MaintType }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12 }}>
                    {MAINT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as MaintStatus }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12 }}>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Scheduled date</label>
                  <input type="date" value={editForm.scheduledDate} onChange={e => setEditForm(f => ({ ...f, scheduledDate: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Completed date</label>
                  <input type="date" value={editForm.completedDate} onChange={e => setEditForm(f => ({ ...f, completedDate: e.target.value }))}
                    style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Odometer due (km)</label>
                <input type="number" placeholder="e.g. 50000" value={editForm.odometerDue} onChange={e => setEditForm(f => ({ ...f, odometerDue: e.target.value }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Garage / service centre</label>
                <input placeholder="e.g. Mercedes-Benz New York" value={editForm.garage} onChange={e => setEditForm(f => ({ ...f, garage: e.target.value }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,boxSizing:'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:3 }}>Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width:'100%',padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,resize:'vertical',minHeight:60,boxSizing:'border-box' as const }} />
              </div>
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <button
                  disabled={editSaving}
                  onClick={handleEditSave}
                  style={{ flex:1,padding:'9px 0',background:'#c4912a',color:'#fff',border:'none',borderRadius:8,fontWeight:600,fontSize:13,cursor:editSaving?'not-allowed':'pointer',opacity:editSaving?0.7:1 }}>
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
                <button onClick={() => setEditRec(null)}
                  style={{ flex:1,padding:'9px 0',background:'#fff',color:'var(--ink3)',border:'1px solid var(--border2)',borderRadius:8,fontSize:13,cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Subscription tab helpers ───────────────────────────────────────── */
const SUB_STATUS_PILL: Record<string, React.CSSProperties> = {
  Active:          { background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7' },
  'Expiring Soon': { background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' },
  Expired:         { background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' },
  Suspended:       { background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' },
};
const SUB_CATEGORY_ORDER = ['Connectivity','Tracking','Alerts','Control','Analytics','Integration'] as const;

interface Invoice {
  id: string; date: string; amount: number; currency: string;
  period: string; status: 'Paid' | 'Pending' | 'Overdue'; method: string;
}
interface SubHistoryEntry {
  id: string; plan: PlanName; startDate: string; endDate: string;
  status: 'Active' | 'Completed' | 'Expired'; note: string;
}

function genInvoices(
  vehicleId: string,
  sub: NonNullable<ReturnType<typeof getSubscription>>,
  customPlan?: CustomPlanDef | null,
): Invoice[] {
  const price    = customPlan ? customPlan.price : PLANS[sub.plan].price;
  const currency = customPlan ? customPlan.currency : 'USD';
  const msPerMo  = 30 * 86_400_000;
  const months   = Math.max(1, Math.ceil((new Date(sub.expiryDate).getTime() - new Date(sub.startDate).getTime()) / msPerMo));
  const cycles   = Math.max(1, Math.round(months / 12));
  const amount   = price * Math.min(months, 12);
  const method   = sub.smsNumbers?.[0]
    ? `M-Pesa (${sub.smsNumbers[0].replace('+2547','07').slice(0,8)}****)`
    : 'Card ending ****4455';

  const invoices: Invoice[] = [];
  for (let i = 0; i < cycles; i++) {
    const cycleStart = new Date(sub.startDate);
    cycleStart.setFullYear(cycleStart.getFullYear() + i);
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setFullYear(cycleEnd.getFullYear() + 1);
    cycleEnd.setDate(cycleEnd.getDate() - 1);
    invoices.unshift({
      id: `INV-${cycleStart.getFullYear()}-${vehicleId.toUpperCase()}`,
      date: cycleStart.toISOString().slice(0,10),
      amount,
      currency,
      period: `${cycleStart.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} – ${cycleEnd.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}`,
      status: 'Paid',
      method,
    });
  }
  return invoices;
}

function genSubHistory(vehicleId: string, sub: NonNullable<ReturnType<typeof getSubscription>>): SubHistoryEntry[] {
  const status = computeSubStatus(sub);
  const entries: SubHistoryEntry[] = [{
    id: `${vehicleId}-cur`,
    plan: sub.plan,
    startDate: sub.startDate,
    endDate: sub.expiryDate,
    status: status === 'Expired' ? 'Expired' : 'Active',
    note: status === 'Active' ? 'Currently active' : status === 'Expiring Soon' ? 'Expiring soon — renewal required' : 'Expired — services suspended',
  }];

  const prevIdx = PLAN_ORDER.indexOf(sub.plan);
  const prevEnd = new Date(sub.startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setFullYear(prevStart.getFullYear() - 1);
  const prevPlan = prevIdx > 0 ? PLAN_ORDER[prevIdx - 1] : sub.plan;
  entries.push({
    id: `${vehicleId}-prev`,
    plan: prevPlan,
    startDate: prevStart.toISOString().slice(0,10),
    endDate:   prevEnd.toISOString().slice(0,10),
    status: 'Completed',
    note: prevIdx > 0 ? `Upgraded to ${sub.plan}` : 'Renewed for another year',
  });

  if (prevIdx > 1) {
    const prev2End   = new Date(prevStart);
    prev2End.setDate(prev2End.getDate() - 1);
    const prev2Start = new Date(prev2End);
    prev2Start.setFullYear(prev2Start.getFullYear() - 1);
    entries.push({
      id: `${vehicleId}-prev2`,
      plan: PLAN_ORDER[prevIdx - 2],
      startDate: prev2Start.toISOString().slice(0,10),
      endDate:   prev2End.toISOString().slice(0,10),
      status: 'Completed',
      note: `Upgraded to ${prevPlan}`,
    });
  }
  return entries;
}

/* ── Security / PIN tab ─────────────────────────────────────────────── */
const PRESET_QUESTIONS = [
  "What is the vehicle owner's mother's maiden name?",
  'What city was the vehicle owner born in?',
  "What is the owner's date of birth?",
  "What is the last 4 digits of the owner's national ID?",
  'What is the name of the owner\'s first pet?',
  'What was the name of the owner\'s primary school?',
];

interface SecurityConfig {
  pin: string;
  questions: { q: string; a: string }[];
  notes: string;
  updatedAt: string;
  updatedBy: string;
}

function buildDefaultSecurity(): SecurityConfig {
  return {
    pin: '',
    questions: [
      { q: PRESET_QUESTIONS[0], a: '' },
      { q: PRESET_QUESTIONS[2], a: '' },
    ],
    notes: '',
    updatedAt: '',
    updatedBy: '',
  };
}

function SecurityTab({ vehicle, customer, user }: {
  vehicle: VehicleMaster;
  customer: Customer | undefined;
  user: { fullName?: string; email?: string } | null;
}) {
  const storageKey = `fleetSec_${vehicle.id}`;

  const [cfg, setCfg]         = useState<SecurityConfig>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : buildDefaultSecurity();
    } catch { return buildDefaultSecurity(); }
  });
  const [showPin,    setShowPin]    = useState(false);
  const [showAns,    setShowAns]    = useState<Record<number, boolean>>({});
  const [saved,      setSaved]      = useState(false);
  const [editing,    setEditing]    = useState(false);

  function save() {
    const next: SecurityConfig = { ...cfg, updatedAt: new Date().toISOString(), updatedBy: user?.fullName ?? user?.email ?? 'Fleet Admin' };
    localStorage.setItem(storageKey, JSON.stringify(next));
    setCfg(next);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  }

  function setQ(i: number, field: 'q' | 'a', val: string) {
    setCfg(prev => {
      const qs = [...prev.questions];
      qs[i] = { ...qs[i], [field]: val };
      return { ...prev, questions: qs };
    });
  }

  function addQuestion() {
    if (cfg.questions.length >= 5) return;
    setCfg(prev => ({ ...prev, questions: [...prev.questions, { q: PRESET_QUESTIONS[prev.questions.length % PRESET_QUESTIONS.length], a: '' }] }));
  }

  function removeQuestion(i: number) {
    setCfg(prev => ({ ...prev, questions: prev.questions.filter((_, idx) => idx !== i) }));
  }

  const hasSaved = !!cfg.updatedAt;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

      {/* ── Left: PIN + Questions ────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Customer contact strip */}
        {customer && (
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Customer contact</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(196,145,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#c4912a', flexShrink: 0 }}>
                {customer.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{customer.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
                  {customer.phone && <span style={{ marginRight: 12 }}>📞 {customer.phone}</span>}
                  {customer.email && <span>✉ {customer.email}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security PIN */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Verification PIN</div>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 10 }}>
            4–6 digit PIN used to verify the caller's identity during phone communication.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type={showPin ? 'text' : 'password'}
              value={cfg.pin}
              onChange={e => { setEditing(true); setCfg(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })); }}
              placeholder="e.g. 4821"
              maxLength={6}
              style={{ width: 120, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 18, letterSpacing: 6, fontFamily: 'monospace', color: 'var(--ink)', background: '#fafafa', textAlign: 'center' }}
            />
            <button
              onClick={() => setShowPin(s => !s)}
              style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--ink3)', fontFamily: 'inherit' }}
            >
              {showPin ? 'Hide' : 'Show'}
            </button>
            {cfg.pin.length >= 4 && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(196,145,42,0.12)', color: '#c4912a' }}>
                ✓ {cfg.pin.length}-digit PIN set
              </span>
            )}
          </div>
        </div>

        {/* Security questions */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1 }}>Security questions</div>
            {cfg.questions.length < 5 && (
              <button onClick={() => { setEditing(true); addQuestion(); }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #c4912a', background: 'rgba(196,145,42,0.12)', color: '#c4912a', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cfg.questions.map((qa, i) => (
              <div key={i} style={{ background: 'var(--cream)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <select
                    value={qa.q}
                    onChange={e => { setEditing(true); setQ(i, 'q', e.target.value); }}
                    style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--ink)', background: '#fff', fontFamily: 'inherit' }}
                  >
                    {PRESET_QUESTIONS.map(pq => <option key={pq} value={pq}>{pq}</option>)}
                  </select>
                  {cfg.questions.length > 1 && (
                    <button onClick={() => { setEditing(true); removeQuestion(i); }} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 5, border: '1px solid var(--border)', background: '#fff', color: 'var(--red)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type={showAns[i] ? 'text' : 'password'}
                    value={qa.a}
                    onChange={e => { setEditing(true); setQ(i, 'a', e.target.value); }}
                    placeholder="Answer"
                    style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--ink)', background: '#fff', fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={() => setShowAns(s => ({ ...s, [i]: !s[i] }))}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--ink3)', fontFamily: 'inherit', flexShrink: 0 }}
                  >
                    {showAns[i] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={save}
            disabled={!editing && hasSaved}
            style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: editing || !hasSaved ? '#c4912a' : 'var(--cream3)', color: editing || !hasSaved ? '#fff' : 'var(--ink3)', fontSize: 13, fontWeight: 600, cursor: editing || !hasSaved ? 'pointer' : 'default', fontFamily: 'inherit' }}
          >
            {saved ? '✓ Saved' : 'Save changes'}
          </button>
          {hasSaved && (
            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
              Last updated {new Date(cfg.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })} by {cfg.updatedBy}
            </span>
          )}
        </div>
      </div>

      {/* ── Right: call notes + usage guide ─────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Communication notes */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Communication notes</div>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8 }}>
            Internal notes visible to agents during customer calls. Not shared with the customer.
          </div>
          <textarea
            value={cfg.notes}
            onChange={e => { setEditing(true); setCfg(p => ({ ...p, notes: e.target.value })); }}
            placeholder="e.g. Customer prefers morning calls. Alternate contact: +254 712 345 678. Speaks Swahili and English."
            rows={6}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--ink)', background: '#fafafa', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
          />
        </div>

        {/* Agent verification guide */}
        <div style={{ background: 'rgba(196,145,42,0.12)', border: '1px solid #c4912a', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#c4912a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            🛡 Agent verification guide
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { step: '1', text: 'Ask the caller to confirm their full name and vehicle plate number.' },
              { step: '2', text: 'Request the 4–6 digit security PIN and compare against the stored value.' },
              { step: '3', text: 'If PIN fails, proceed to security questions — ask at least one.' },
              { step: '4', text: 'Do not share location, speed, or trip data until full verification passes.' },
              { step: '5', text: 'Log all calls in the vehicle History tab after the conversation.' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#c4912a', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{step}</span>
                <span style={{ fontSize: 12, color: '#c4912a', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status chip */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: cfg.pin.length >= 4 ? '#c4912a' : 'var(--ink3)' }}>{cfg.pin.length >= 4 ? '✓' : '—'}</div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>PIN set</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: cfg.questions.some(q => q.a) ? '#c4912a' : 'var(--ink3)' }}>{cfg.questions.filter(q => q.a).length}</div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>Questions answered</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: cfg.notes ? '#c4912a' : 'var(--ink3)' }}>{cfg.notes ? '✓' : '—'}</div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>Call notes</div>
          </div>
          <div style={{ textAlign: 'center', marginLeft: 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: (cfg.pin.length >= 4 && cfg.questions.some(q => q.a)) ? '#c4912a' : '#d97706' }}>
              {(cfg.pin.length >= 4 && cfg.questions.some(q => q.a)) ? '🔐' : '⚠'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{(cfg.pin.length >= 4 && cfg.questions.some(q => q.a)) ? 'Secure' : 'Incomplete'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Subscription tab component ─────────────────────────────────────── */
function SubscriptionTab({ vehicle, canWrite }: { vehicle: VehicleMaster; canWrite: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showModal,  setShowModal]  = useState(false);

  // refreshKey is used purely to trigger re-render after saveSubscription()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _rk  = refreshKey;
  const sub  = getSubscription(vehicle.id);

  if (!sub) {
    return (
      <div style={{ padding:'60px 24px', textAlign:'center' }}>
        <div style={{ fontSize:44, marginBottom:14 }}>📦</div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--ink)', marginBottom:6 }}>No subscription found</div>
        <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:20 }}>
          {vehicle.plate} has no active subscription. Subscribe to unlock live tracking, alerts and device control.
        </div>
        {canWrite && (
          <button onClick={() => setShowModal(true)} style={{ padding:'10px 24px', background:'#c4912a', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            📦 Subscribe now
          </button>
        )}
        {showModal && (
          <SubscriptionModal vehicle={vehicle} onClose={() => setShowModal(false)}
            onSaved={() => { setRefreshKey(k => k+1); setShowModal(false); }} />
        )}
      </div>
    );
  }

  const status      = computeSubStatus(sub);
  const daysLeft    = daysUntilSubExpiry(sub.expiryDate);
  const plan        = PLANS[sub.plan];
  const customPlan  = sub.customPlanId
    ? getCustomPlans(vehicle.tenantId).find(p => p.id === sub.customPlanId) ?? null
    : null;
  const planLabel    = customPlan ? customPlan.name    : plan.name;
  const planColor    = customPlan ? customPlan.color   : plan.color;
  const planPrice    = customPlan ? customPlan.price   : plan.price;
  const planCurrency = customPlan ? customPlan.currency : 'USD';
  const planCurrSym  = customPlan ? currencySymbol(customPlan.currency) : '$';
  const invoices    = genInvoices(vehicle.id, sub, customPlan);
  const history     = genSubHistory(vehicle.id, sub);

  /* progress bar (0-100%) for expiry — from startDate to expiryDate */
  const totalMs  = new Date(sub.expiryDate).getTime() - new Date(sub.startDate).getTime();
  const usedMs   = new Date('2026-05-28').getTime() - new Date(sub.startDate).getTime();
  const pct      = Math.min(100, Math.max(0, (usedMs / totalMs) * 100));
  const barColor = status === 'Expired' ? 'var(--red)' : status === 'Expiring Soon' ? 'var(--amber)' : '#c4912a';

  const fs = (s: number): React.CSSProperties => ({ fontSize: s });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── Row 1: Current plan + Billing ─────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16 }}>

        {/* Current plan */}
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', background:'var(--cream)', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--ink)', textTransform:'uppercase', letterSpacing:0.8 }}>Current Subscription</span>
            {canWrite && (
              <button onClick={() => setShowModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:6, border:'1px solid #7c3aed', background:'#ede9fe', color:'#7c3aed', cursor:'pointer' }}>
                📦 Manage plan
              </button>
            )}
          </div>
          <div style={{ padding:'16px' }}>

            {/* Plan name + status */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:planColor+'18', color:planColor, border:`1px solid ${planColor}40`, fontWeight:700, fontSize:14 }}>
                {customPlan && <span style={{ fontSize:9, background:planColor, color:'#fff', padding:'1px 5px', borderRadius:3 }}>CUSTOM</span>}
                {planLabel}
              </div>
              <span style={{ fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:20, ...SUB_STATUS_PILL[status] }}>
                {status}
              </span>
              <span style={{ marginLeft:'auto', fontSize:13, fontWeight:700, color:planColor }}>
                ${planPrice}<span style={{ fontSize:10, fontWeight:400, color:'var(--ink3)' }}>/mo</span>
              </span>
            </div>

            <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:14 }}>{customPlan ? customPlan.tagline : plan.tagline}</div>

            {/* Expiry progress */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', ...fs(10), color:'var(--ink3)', marginBottom:4 }}>
                <span>Start: {new Date(sub.startDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
                <span style={{ fontWeight:600, color:barColor }}>
                  {status === 'Expired' ? `Expired ${Math.abs(daysLeft)}d ago` : status === 'Expiring Soon' ? `⚠ ${daysLeft} days left` : `${daysLeft} days remaining`}
                </span>
                <span>Expiry: {new Date(sub.expiryDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
              </div>
              <div style={{ height:6, background:'var(--cream3)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:barColor, borderRadius:3, transition:'width 0.4s' }} />
              </div>
            </div>

            {/* Meta: auto-renew + email */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16, ...fs(11), color:'var(--ink3)' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                {sub.autoRenew
                  ? <><span style={{ color:'#c4912a' }}>🔄</span> Auto-renew on</>
                  : <><span style={{ color:'var(--amber)' }}>⚠</span> Manual renewal</>}
              </span>
              {sub.contactEmail && <span>📧 {sub.contactEmail}</span>}
              {sub.smsNumbers && sub.smsNumbers.length > 0 && <span>💬 {sub.smsNumbers.join(', ')}</span>}
            </div>

            {/* Services grid */}
            <div style={{ ...fs(10), fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>
              Services included ({(customPlan ?? plan).services.length})
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 0' }}>
              {SUB_CATEGORY_ORDER.map(cat => {
                const activeServices = (customPlan ?? plan).services;
                const catServices = SERVICES.filter(s => s.category === cat && activeServices.includes(s.key));
                if (!catServices.length) return null;
                return (
                  <div key={cat} style={{ display:'contents' }}>
                    {catServices.map(svc => (
                      <div key={svc.key} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 0', ...fs(11), color:'var(--ink2)' }}>
                        <span style={{ color:'#c4912a', fontWeight:700 }}>✓</span>
                        <span>{svc.icon}</span>
                        <span>{svc.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
              {/* Show locked services */}
              {SERVICES.filter(s => !(customPlan ?? plan).services.includes(s.key)).length > 0 && (
                SERVICES.filter(s => !(customPlan ?? plan).services.includes(s.key)).map(svc => (
                  <div key={svc.key} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 0', ...fs(11), color:'var(--ink4,#c4c4c4)' }}>
                    <span style={{ color:'#d1d5db' }}>—</span>
                    <span style={{ filter:'grayscale(1)', opacity:0.4 }}>{svc.icon}</span>
                    <span style={{ color:'#c4c4c4' }}>{svc.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Billing summary */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', background:'var(--cream)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--ink)', textTransform:'uppercase', letterSpacing:0.8 }}>Billing Summary</div>
            <div style={{ padding:'16px 16px 4px' }}>
              {(() => {
                const billingMonths = Math.ceil((new Date(sub.expiryDate).getTime()-new Date(sub.startDate).getTime())/(30*86400000));
                return [
                  { label:'Plan rate',       value:`${planCurrSym}${planPrice.toLocaleString()} / month` },
                  { label:'Billing period',  value:`${billingMonths} months` },
                  { label:'Total committed', value:<span style={{ fontWeight:700, color:'#c4912a' }}>{planCurrSym}{(planPrice * billingMonths).toLocaleString()} {planCurrency}</span> },
                  { label:'Next billing',    value: sub.autoRenew
                      ? new Date(sub.expiryDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})
                      : <span style={{ color:'var(--amber)' }}>Manual renewal required</span> },
                  { label:'Payment method',  value: sub.smsNumbers?.[0]
                      ? `M-Pesa (${sub.smsNumbers[0].replace('+2547','07').slice(0,8)}****)`
                      : 'Card ending ****4455' },
                  { label:'Billing contact', value: sub.contactEmail ?? '—' },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:11, color:'var(--ink3)', fontWeight:500 }}>{row.label}</span>
                    <span style={{ fontSize:11, color:'var(--ink)', fontWeight:500 }}>{row.value}</span>
                  </div>
                ));
              })()}
            </div>

            {/* Plan upgrade nudge — only for standard plans */}
            {!customPlan && PLAN_ORDER.indexOf(sub.plan) < PLAN_ORDER.length - 1 && (() => {
              const nextPlan = PLAN_ORDER[PLAN_ORDER.indexOf(sub.plan) + 1];
              const extraCount = PLANS[nextPlan].services.filter(s => !plan.services.includes(s)).length;
              return (
                <div style={{ margin:'12px 16px', padding:'10px 12px', background:'#ede9fe', borderRadius:8, border:'1px solid #c4b5fd' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#5b21b6', marginBottom:3 }}>🚀 Upgrade available</div>
                  <div style={{ fontSize:10, color:'#6d28d9', lineHeight:1.5 }}>
                    Upgrade to <strong>{nextPlan}</strong> to unlock {extraCount} more service{extraCount !== 1 ? 's' : ''}.
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Row 2: Invoices ───────────────────────────────────────── */}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'10px 16px', background:'var(--cream)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--ink)', textTransform:'uppercase', letterSpacing:0.8 }}>
          Payment History
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'var(--cream)', borderBottom:'1px solid var(--border)' }}>
              {['Invoice #','Date','Period','Amount','Method','Status'].map(h => (
                <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:0.5, color:'var(--ink3)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={inv.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'#fff':'var(--cream)' }}>
                <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:11, color:'var(--ink)', fontWeight:600 }}>{inv.id}</td>
                <td style={{ padding:'10px 14px', color:'var(--ink2)', fontSize:11 }}>
                  {new Date(inv.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                </td>
                <td style={{ padding:'10px 14px', color:'var(--ink3)', fontSize:11 }}>{inv.period}</td>
                <td style={{ padding:'10px 14px', fontWeight:700, color:'var(--ink)' }}>${inv.amount.toLocaleString()} {inv.currency}</td>
                <td style={{ padding:'10px 14px', color:'var(--ink3)', fontSize:11 }}>{inv.method}</td>
                <td style={{ padding:'10px 14px' }}>
                  <span style={{
                    fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20,
                    background: inv.status==='Paid'?'rgba(196,145,42,0.12)':inv.status==='Pending'?'var(--amber-lt)':'var(--red-lt)',
                    color: inv.status==='Paid'?'#c4912a':inv.status==='Pending'?'var(--amber)':'var(--red)',
                  }}>{inv.status==='Paid'?'✓ Paid':inv.status==='Pending'?'⏳ Pending':'⚠ Overdue'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Row 3: Subscription history ──────────────────────────── */}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'10px 16px', background:'var(--cream)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--ink)', textTransform:'uppercase', letterSpacing:0.8 }}>
          Subscription History
        </div>
        <div style={{ padding:'16px', position:'relative' }}>
          <div style={{ position:'absolute', left:33, top:16, bottom:16, width:2, background:'var(--border)' }} />
          {history.map((entry, idx) => {
            const ep         = PLANS[entry.plan];
            const isActive   = entry.status === 'Active';
            const isExpired  = entry.status === 'Expired';
            // For the current active entry use custom plan display info if set
            const entryLabel = isActive && customPlan ? customPlan.name    : entry.plan;
            const entryColor = isActive && customPlan ? customPlan.color   : ep.color;
            const entryPrice = isActive && customPlan ? customPlan.price   : ep.price;
            const entryCurrSym = isActive && customPlan ? currencySymbol(customPlan.currency) : '$';
            const entrySvcCount = isActive && customPlan ? customPlan.services.length : ep.services.length;
            return (
              <div key={entry.id} style={{ display:'flex', gap:14, marginBottom: idx < history.length-1 ? 16 : 0, position:'relative' }}>
                {/* dot */}
                <div style={{
                  width:34, height:34, borderRadius:'50%', flexShrink:0, zIndex:1,
                  background: isActive ? entryColor : isExpired ? 'var(--red-lt)' : 'var(--cream3)',
                  border: `2px solid ${isActive ? entryColor : isExpired ? 'var(--red)' : 'var(--border)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:13,
                }}>
                  {isActive ? '●' : isExpired ? '✕' : '✓'}
                </div>
                {/* card */}
                <div style={{ flex:1, background:isActive?`${entryColor}06`:'#fff', border:`1px solid ${isActive?entryColor+'30':'var(--border)'}`, borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:13, fontWeight:700, color: isActive ? entryColor : 'var(--ink)' }}>{entryLabel}</span>
                      {isActive && customPlan && (
                        <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3, background:entryColor, color:'#fff' }}>CUSTOM</span>
                      )}
                      <span style={{ fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:3,
                        background: isActive?entryColor+'18':isExpired?'var(--red-lt)':'var(--cream3)',
                        color: isActive?entryColor:isExpired?'var(--red)':'var(--ink3)',
                      }}>{entry.status}</span>
                    </div>
                    <div style={{ fontSize:10, color:'var(--ink3)', whiteSpace:'nowrap' }}>
                      {new Date(entry.startDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                      {' → '}
                      {new Date(entry.endDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:16, marginTop:8, fontSize:11, color:'var(--ink3)' }}>
                    <span>{entryCurrSym}{entryPrice.toLocaleString()}/mo · {entrySvcCount} services</span>
                    <span style={{ color: isActive?entryColor:isExpired?'var(--red)':'#c4912a', fontStyle:'italic' }}>{entry.note}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manage plan modal */}
      {showModal && (
        <SubscriptionModal
          vehicle={vehicle}
          onClose={() => setShowModal(false)}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams  = useSearchParams();
  const fromParam      = searchParams.get('from');
  const fromCustomerId = fromParam !== 'map' ? fromParam : null;
  const fromMap        = fromParam === 'map';
  const { user } = useAuthStore();
  const role         = user?.role ?? 'viewer';
  const isSuperAdmin = role === 'super_admin' || role === 'platform_admin';
  // Super admins write nowhere across tenants; tenant users need fleet_manager+
  const canWrite     = !isSuperAdmin && (user ? hasMinRole(user, 'fleet_manager') : false);

  const setSelectedVehicleId = useUIStore(s => s.setSelectedVehicleId);
  /* Persist so the playback page knows which vehicle to pre-load */
  useEffect(() => { setSelectedVehicleId(id); }, [id, setSelectedVehicleId]);

  const vehicle        = useVehiclesStore(s => s.vehicles.find(v => v.id === id));
  const storeLoading   = useVehiclesStore(s => s.loading);
  const storeLoaded    = useVehiclesStore(s => s.loaded);
  const allDrivers     = useDriversStore(s => s.drivers);
  const allCustomers   = useCustomersStore(s => s.customers);

  const [activeTab,     setTab]         = useState<Tab>('livetrack');
  const [showTracking,  setShowTracking] = useState(false);
  const fromCustomer = fromCustomerId ? getCustomerById(fromCustomerId) : null;

  if (!vehicle) {
    if (storeLoading || !storeLoaded) {
      return (
        <div style={{ padding: '20px 14px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ height: 14, width: 180, background: 'var(--cream3)', borderRadius: 4, marginBottom: 20 }} />
          <div style={{ height: 110, background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)', borderRadius: 10, marginBottom: 14, opacity: 0.35 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ height: 64, background: 'var(--cream3)', borderRadius: 7, opacity: 0.6 }} />)}
          </div>
          <div style={{ height: 400, background: 'var(--cream3)', borderRadius: 10, opacity: 0.4 }} />
        </div>
      );
    }
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <i className="ti ti-truck" style={{ fontSize: 40, color: 'var(--ink3)', display: 'block', marginBottom: 12 }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Vehicle not found</div>
        <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 20 }}>ID &quot;{id}&quot; does not exist.</div>
        <Link href="/vehicles" style={{ color: '#c4912a', fontSize: 12, fontWeight: 600 }}>← Back to vehicles</Link>
      </div>
    );
  }

  /* ── Tenant isolation gate ───────────────────────────────────────── */
  const userTenantId = user?.tenantId ?? null;
  const isOwnTenant  = isSuperAdmin || userTenantId === vehicle.tenantId;

  if (!isOwnTenant) {
    const ownerMeta = TENANTS_META[vehicle.tenantId];
    return (
      <div style={{ padding: '48px 28px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 32, textAlign: 'left' }}>
          <Link href="/vehicles" style={{ color: '#c4912a', textDecoration: 'none' }}>Vehicles</Link>
          <span> / </span><span>{vehicle.plate}</span>
        </div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>Access denied</div>
        <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.8, marginBottom: 24 }}>
          Vehicle <strong>{vehicle.plate}</strong> belongs to tenant{' '}
          <strong style={{ color: ownerMeta?.color ?? '#c4912a' }}>{ownerMeta?.name ?? vehicle.tenantId}</strong>.
          <br />Your account is scoped to <strong>{user?.tenantName ?? 'another tenant'}</strong>
          {' '}and cannot access vehicles from other tenants.
        </div>
        <div style={{ padding: '14px 20px', background: 'var(--red-lt)', border: '1px solid var(--red)', borderRadius: 10, fontSize: 12, color: 'var(--red)', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>🛡️ Tenant isolation enforced</div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', lineHeight: 2, color: '#7a0000' }}>
            <li>All vehicle data is scoped to the owning tenant</li>
            <li>Cross-tenant vehicle access is blocked at the application layer</li>
            <li>This access attempt has been recorded in the audit log</li>
          </ul>
        </div>
        <Link href="/vehicles" style={{ display: 'inline-block', padding: '9px 20px', background: '#c4912a', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          ← Back to my fleet
        </Link>
      </div>
    );
  }

  /* Super-admin read-only banner */
  const superAdminBanner = isSuperAdmin ? (
    <div style={{ background: 'var(--amber-lt)', border: '1px solid var(--amber)', borderRadius: 8, padding: '9px 14px', marginBottom: 14, fontSize: 12, color: '#92600a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
      👁 Super-admin view — reading {TENANTS_META[vehicle.tenantId]?.name ?? vehicle.tenantId} data · All edits are disabled
    </div>
  ) : null;

  const expiredCount     = vehicle.documents.filter(d => d.status === 'Expired').length;
  const expiringCount    = vehicle.documents.filter(d => d.status === 'Expiring Soon').length;
  const overdueCount     = vehicle.maintenance.filter(m => m.status === 'Overdue').length;
  const vehicleSub           = getSubscription(vehicle.id);
  const vehicleSubStatus     = vehicleSub ? computeSubStatus(vehicleSub) : null;
  const vehicleCustomPlan    = vehicleSub?.customPlanId
    ? getCustomPlans(vehicle.tenantId).find(p => p.id === vehicleSub.customPlanId)
    : null;
  const vehicleSubLabel      = vehicleCustomPlan ? vehicleCustomPlan.name : vehicleSub?.plan ?? '—';
  const vehicleSubColor      = vehicleCustomPlan ? vehicleCustomPlan.color : vehicleSub ? PLANS[vehicleSub.plan].color : 'var(--ink3)';

  const hasGps   = vehicle.latitude !== null && vehicle.longitude !== null && vehicle.status !== 'offline' && vehicle.status !== 'maintenance' && vehicle.status !== 'disposed';
  const canTrack = hasGps && isServiceEnabled(vehicle.id, 'live_tracking');
  const trackPin: VehiclePin | null = hasGps ? {
    id: vehicle.plate, driver: vehicle.driverName ?? 'No driver',
    status: vehicle.status === 'active' ? 'active' : vehicle.status === 'idle' ? 'idle' : 'offline',
    speed: vehicle.speedKmh ?? 0, lat: vehicle.latitude!, lng: vehicle.longitude!,
    fuel: vehicle.fuelLevel, tenantId: vehicle.tenantId,
    make: vehicle.make, model: vehicle.model, year: vehicle.year, category: vehicle.category,
    customerName: vehicle.customerName ?? undefined, odometer: vehicle.odometer,
    tenantName: TENANTS_META[vehicle.tenantId]?.name,
  } : null;

  const CAT_ICON: Record<string, string> = {
    Truck: 'ti-truck', Van: 'ti-van', Pickup: 'ti-car-suv',
    Car: 'ti-car', Bus: 'ti-bus', Motorcycle: 'ti-motorbike', Trailer: 'ti-container',
  };
  const vIcon = CAT_ICON[vehicle.category] ?? 'ti-car';

  return (
    <div className="page-in" style={{ padding: '20px 14px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border: '1px solid rgba(196,145,42,0.18)',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 16,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Back button */}
          {(fromMap || fromCustomer) && (
            <Link
              href={fromCustomer ? `/customers/${fromCustomer.id}` : '/map'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 7,
                background: 'rgba(196,145,42,0.12)',
                border: '1px solid rgba(196,145,42,0.22)',
                color: '#f5d07a', fontSize: 11, fontWeight: 600,
                textDecoration: 'none', flexShrink: 0,
              }}
            >
              <i className="ti ti-arrow-left" style={{ fontSize: 13 }} />
              {fromCustomer ? fromCustomer.name : 'Live Map'}
            </Link>
          )}

          {/* Icon chip */}
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'rgba(196,145,42,0.15)',
            border: '1px solid rgba(196,145,42,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className={`ti ${vIcon}`} style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>
              Vehicle Fleet
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: 1 }}>{vehicle.plate}</h1>
              <StatusBadge status={vehicle.status} />
              {isSuperAdmin && (() => {
                const meta = TENANTS_META[vehicle.tenantId];
                return meta ? (
                  <span style={{ fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:20,background:'rgba(196,145,42,0.15)',color:'#f5d07a',border:'1px solid rgba(196,145,42,0.28)' }}>
                    🏢 {meta.name}
                  </span>
                ) : null;
              })()}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.category} · {vehicle.fuelType}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {expiredCount > 0 && (
                <span style={{ fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:3,background:'var(--red-lt)',color:'var(--red)' }}>
                  🚨 {expiredCount} doc expired
                </span>
              )}
              {expiringCount > 0 && (
                <span style={{ fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:3,background:'var(--amber-lt)',color:'var(--amber)' }}>
                  ⚠️ {expiringCount} expiring soon
                </span>
              )}
              {overdueCount > 0 && (
                <span style={{ fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:3,background:'var(--red-lt)',color:'var(--red)' }}>
                  🔧 {overdueCount} maintenance overdue
                </span>
              )}
              {expiredCount === 0 && expiringCount === 0 && overdueCount === 0 && (
                <span style={{ fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:3,background:'rgba(196,145,42,0.15)',color:'#f5d07a',border:'1px solid rgba(196,145,42,0.22)' }}>
                  ✓ All clear
                </span>
              )}
              {vehicleSubStatus && (
                <span style={{
                  fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:3,
                  ...(vehicleSubStatus === 'Expired'         ? { background:'var(--red-lt)',    color:'var(--red)'    } :
                      vehicleSubStatus === 'Expiring Soon'   ? { background:'var(--amber-lt)',  color:'var(--amber)'  } :
                      vehicleSubStatus === 'Suspended'       ? { background:'#f3f4f6',          color:'#4b5563'       } :
                                                               { background:'rgba(196,145,42,0.15)', color:'#f5d07a'  }),
                }}>
                  💳 {vehicleSubLabel} · {vehicleSubStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right — stats + action */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Odometer',  value: `${vehicle.odometer.toLocaleString()} km` },
              { label: 'Fuel',      value: `${vehicle.fuelLevel}%` },
              { label: 'Docs',      value: `${vehicle.documents.length}` },
              { label: 'Maint',     value: `${vehicle.maintenance.length}` },
              { label: 'Plan',      value: vehicleSubLabel, color: vehicleSubColor },
            ].map((s, i) => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '0 14px',
                borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: (s as {color?:string}).color ?? '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {canTrack ? (
            <button
              onClick={() => setShowTracking(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px',
                background: 'rgba(196,145,42,0.15)',
                color: '#f5d07a',
                border: '1px solid rgba(196,145,42,0.30)',
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <i className="ti ti-map-pin" style={{ fontSize: 14 }} /> View Live Track
            </button>
          ) : (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-map-pin-off" style={{ fontSize: 13 }} />
              <span>{!hasGps ? 'No GPS signal' : 'Live tracking not enabled'}</span>
            </div>
          )}
        </div>
      </div>

      {superAdminBanner}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 18, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          // badge counts
          let badge = 0;
          if (t.id === 'documents')    badge = expiredCount + expiringCount;
          if (t.id === 'maintenance')  badge = overdueCount;
          if (t.id === 'subscription') badge = vehicleSubStatus === 'Expired' || vehicleSubStatus === 'Expiring Soon' ? 1 : 0;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 16px', border: 'none', borderRadius: '8px 8px 0 0',
              background: active ? '#fff' : 'transparent',
              borderBottom: active ? '2px solid #c4912a' : '2px solid transparent',
              color: active ? '#c4912a' : 'var(--ink3)',
              fontWeight: active ? 700 : 400, fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t.icon} {t.label}
              {badge > 0 && (
                <span style={{ fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3,background:'var(--red-lt)',color:'var(--red)' }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'master'       && <MasterDataTab    v={vehicle} />}
      {activeTab === 'history'      && <HistoryTab       events={vehicle.history} vehicleId={vehicle.id} tenantId={vehicle.tenantId} />}
      {activeTab === 'documents'    && <DocumentsTab     docs={vehicle.documents} canWrite={canWrite} />}
      {activeTab === 'assignment'   && <AssignmentTab    v={vehicle} tenantCustomers={allCustomers.filter(c => c.tenantId === vehicle.tenantId)} tenantDrivers={role === 'vehicle_owner' ? [] : allDrivers.filter(d => d.tenantId === vehicle.tenantId)} user={user} />}
      {activeTab === 'device'       && <DeviceIoTTab     v={vehicle} />}
      {activeTab === 'maintenance'  && <MaintenanceTab   v={vehicle} />}
      {activeTab === 'subscription' && <SubscriptionTab  vehicle={vehicle} canWrite={canWrite} />}
      {activeTab === 'security'     && <SecurityTab       vehicle={vehicle} customer={vehicle.customerId ? getCustomerById(vehicle.customerId) : undefined} user={user} />}
      {activeTab === 'livetrack'    && (
        <VehicleTrackingModal
          vehicle={vehicle}
          initialPin={trackPin}
          onClose={() => {}}
          inline
        />
      )}

      {/* Live tracking modal */}
      {showTracking && trackPin && (
        <VehicleTrackingModal
          vehicle={vehicle}
          initialPin={trackPin}
          onClose={() => setShowTracking(false)}
        />
      )}
    </div>
  );
}
