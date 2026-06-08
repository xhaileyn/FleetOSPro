'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { Driver } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { hasMinRole } from '@/lib/auth';
import { DriverStatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

const STATUS_FILTERS: { id: string; label: string; icon: string }[] = [
  { id: 'all',      label: 'All drivers', icon: 'ti-users' },
  { id: 'driving',  label: 'Driving',     icon: 'ti-truck' },
  { id: 'on_duty',  label: 'On duty',     icon: 'ti-check' },
  { id: 'off_duty', label: 'Off duty',    icon: 'ti-moon' },
  { id: 'resting',  label: 'Resting',     icon: 'ti-zzz' },
];

/* ── KpiCard ─────────────────────────────────────────────────────── */
function KpiCard({ icon, iconColor, label, value, stripe }: {
  icon: string; iconColor?: string; label: string; value: number; stripe?: string;
}) {
  const chipBg = (iconColor ?? '#c4912a') + '15';
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 7,
      padding: '8px 10px', position: 'relative', overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {stripe && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: stripe, borderRadius: '7px 0 0 7px' }} />}
      <div style={{ width: 34, height: 34, borderRadius: 7, background: chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor ?? '#c4912a', fontSize: 16, flexShrink: 0, marginLeft: stripe ? 4 : 0 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1, color: 'var(--ink)' }}>{value}</div>
      </div>
    </div>
  );
}

const STATUS_DOT: Record<string, string> = {
  active: '#c4912a', idle: 'var(--amber)', offline: 'var(--ink3)',
  maintenance: 'var(--red)', disposed: '#aaa',
};
const STATUS_BG: Record<string, string> = {
  active: 'rgba(196,145,42,0.12)', idle: 'var(--amber-lt)', offline: 'var(--cream3)',
  maintenance: 'var(--red-lt)', disposed: '#f5f5f5',
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? '#c4912a' : score >= 70 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color, minWidth: 24 }}>{score}</span>
      <div style={{ flex: 1, height: 2, background: 'var(--cream3)', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 1 }} />
      </div>
    </div>
  );
}

const FIELD: React.CSSProperties = { width: '100%', padding: '9px 10px', border: '1px solid var(--border)', borderRadius: 6, background: '#fff', color: 'var(--ink)', fontSize: 12, outline: 'none', fontFamily: 'inherit' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 4 };

const AVATAR_COLORS = ['#c4912a','#1a5fa0','#5b4bb5','#b8620a','#2d6a28','#b33030'];
function Avatar({ name, index }: { name: string; index: number }) {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

/* ── Assign Vehicle Modal (vehicle_owner only) ───────────────────────── */
function AssignVehicleModal({
  driver,
  myVehicles,
  onClose,
  onSaved,
}: {
  driver: Driver;
  myVehicles: ReturnType<typeof useVehiclesStore.getState>['vehicles'];
  onClose: () => void;
  onSaved: (vehicleId: string | null, vehiclePlate: string | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    driver.assignedVehiclePlate
      ? (myVehicles.find(v => v.plate === driver.assignedVehiclePlate)?.id ?? null)
      : null,
  );
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    const vehicle = selectedId ? myVehicles.find(v => v.id === selectedId) : null;
    try {
      if (selectedId && vehicle) {
        /* Assign this driver to the selected vehicle */
        const res = await fetch(`/api/v1/vehicles/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driverId: driver.id, driverName: driver.name }),
        });
        if (!res.ok && res.status !== 204) {
          const err = await res.json().catch(() => ({}));
          setSaveError((err as { message?: string }).message ?? `Failed (${res.status})`);
          return;
        }
      } else if (!selectedId && driver.assignedVehiclePlate) {
        /* Unassign: clear driver from current vehicle */
        const curVehicle = myVehicles.find(v => v.plate === driver.assignedVehiclePlate);
        if (curVehicle) {
          await fetch(`/api/v1/vehicles/${curVehicle.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverId: null, driverName: null }),
          }).catch(() => {});
        }
      }
      onSaved(selectedId, vehicle?.plate ?? null);
      onClose();
    } catch {
      setSaveError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--cream)', borderRadius: 8, marginBottom: 14 }}>
        <Avatar name={driver.name} index={0} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{driver.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Class {driver.licenseClass} · {driver.licenseNumber || '—'}</div>
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>
        Select vehicle
      </div>

      {/* Unassign option */}
      <div
        onClick={() => setSelectedId(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
          border: selectedId === null ? '2px solid #c4912a' : '2px solid var(--border)',
          background: selectedId === null ? 'rgba(196,145,42,0.12)' : '#fff',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--cream3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🚫</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>No vehicle</div>
          <div style={{ fontSize: 10, color: 'var(--ink3)' }}>Remove driver from any vehicle</div>
        </div>
        {selectedId === null && <span style={{ marginLeft: 'auto', fontSize: 14, color: '#c4912a' }}>✓</span>}
      </div>

      {/* Vehicle list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
        {myVehicles.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink3)', fontSize: 12 }}>
            No vehicles in your account
          </div>
        ) : (
          myVehicles.map(v => {
            const sel = selectedId === v.id;
            const busy = v.driverName && v.driverName !== driver.name;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedId(sel ? null : v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: sel ? '2px solid #c4912a' : '2px solid var(--border)',
                  background: sel ? 'rgba(196,145,42,0.12)' : '#fff',
                  opacity: busy && !sel ? 0.6 : 1,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: sel ? '#c4912a' : 'var(--cream3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  🚛
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#c4912a' : 'var(--ink)' }}>{v.plate}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 1 }}>
                    {v.year} {v.make} {v.model} · {v.category}
                  </div>
                  {busy && (
                    <div style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 600, marginTop: 1 }}>
                      Currently: {v.driverName}
                    </div>
                  )}
                  {v.driverName === driver.name && (
                    <div style={{ fontSize: 10, color: '#c4912a', fontWeight: 600, marginTop: 1 }}>
                      Currently assigned here
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: STATUS_BG[v.status] ?? 'var(--cream3)', color: STATUS_DOT[v.status] ?? 'var(--ink3)' }}>
                    {v.status}
                  </span>
                </div>
                {sel && <span style={{ fontSize: 14, color: '#c4912a', flexShrink: 0 }}>✓</span>}
              </div>
            );
          })
        )}
      </div>

      {saveError && (
        <div style={{ marginTop: 10, padding: '7px 10px', background: 'var(--red-lt)', border: '1px solid var(--red)30', borderRadius: 6, fontSize: 11, color: 'var(--red)' }}>
          ⚠ {saveError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ flex: 1, padding: '9px', borderRadius: 7, border: 'none', background: '#c4912a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}
        >
          {saving ? 'Saving…' : selectedId ? `Assign to ${myVehicles.find(v => v.id === selectedId)?.plate}` : 'Confirm unassign'}
        </button>
        <button
          onClick={onClose}
          style={{ padding: '9px 18px', borderRadius: 7, border: '1px solid var(--border2)', background: '#fff', color: 'var(--ink2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function DriversPage() {
  const { user } = useAuthStore();
  const allVehicles = useVehiclesStore(s => s.vehicles);

  const isOwner  = user?.role === 'vehicle_owner';
  const canWrite = isOwner || (user ? hasMinRole(user, 'fleet_manager') : false);

  /* Vehicles this owner manages */
  const myVehicles = useMemo(() => {
    if (!isOwner || !user) return allVehicles;
    const ids = new Set([...(user.vehicleIds ?? []), ...(user.restrictedVehicleIds ?? [])]);
    return ids.size > 0 ? allVehicles.filter(v => ids.has(v.id)) : allVehicles.filter(v => v.tenantId === user.tenantId);
  }, [isOwner, user, allVehicles]);

  const [drivers, setDrivers]         = useState<Driver[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [statusFilter, setStatus]     = useState('all');
  const [search, setSearch]           = useState('');
  const [showAdd, setShowAdd]         = useState(false);
  const [delTarget, setDelTarget]     = useState<Driver | null>(null);
  const [assignTarget, setAssignTarget] = useState<Driver | null>(null);   // vehicle_owner assign flow
  const [form, setForm]               = useState({ name: '', licenseNumber: '', licenseClass: 'C', phoneNumber: '' });
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      if (isOwner && user.email) {
        params.ownerId  = user.email;
        params.tenantId = user.tenantId ?? '';
      } else if (user.tenantId) {
        params.tenantId = user.tenantId;
      }

      const result = await api.drivers.list(params) as Driver[];
      setDrivers(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, search, isOwner]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!form.name) { setFormError('Name is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload: Record<string, string> = { ...form, tenantId: user?.tenantId ?? '' };
      if (isOwner && user?.email) payload.ownerId = user.email;
      await api.drivers.create(payload);
      setShowAdd(false);
      setForm({ name: '', licenseNumber: '', licenseClass: 'C', phoneNumber: '' });
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add driver.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!delTarget) return;
    await api.drivers.delete(delTarget.id);
    setDelTarget(null);
    load();
  }

  function handleAssignSaved(vehicleId: string | null, vehiclePlate: string | null) {
    /* Update the local driver list to reflect the new assignment */
    setDrivers(prev => prev.map(d =>
      d.id === assignTarget?.id
        ? { ...d, assignedVehiclePlate: vehiclePlate }
        : d,
    ));
  }

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 14,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-users" style={{ fontSize: 19, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Fleet Management</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{isOwner ? 'My Drivers' : 'Driver Performance'}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              {isOwner
                ? `${drivers.length} driver${drivers.length !== 1 ? 's' : ''} · ${myVehicles.length} vehicle${myVehicles.length !== 1 ? 's' : ''}`
                : `${drivers.length} driver${drivers.length !== 1 ? 's' : ''} total`}
            </div>
          </div>
        </div>
        {canWrite && (
          <button onClick={() => setShowAdd(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', fontSize: 12, fontWeight: 600,
            borderRadius: 7, border: '1px solid rgba(196,145,42,0.35)',
            background: 'rgba(196,145,42,0.15)', color: '#f5d07a',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add driver
          </button>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
        <KpiCard icon="ti-users" iconColor="#c4912a" label="Total drivers" value={drivers.length} stripe="#c4912a" />
        <KpiCard icon="ti-truck" iconColor="#c4912a" label="Driving" value={drivers.filter(d => d.status === 'driving').length} stripe="#c4912a" />
        <KpiCard icon="ti-user-check" iconColor="#16a34a" label="On duty" value={drivers.filter(d => d.status === 'on_duty').length} stripe="#16a34a" />
        <KpiCard icon="ti-moon" iconColor="var(--ink3)" label="Off duty / Resting" value={drivers.filter(d => d.status === 'off_duty' || d.status === 'resting').length} stripe="var(--ink3)" />
      </div>

      {/* Owner scope notice */}
      {isOwner && (
        <div style={{ marginBottom: 14, padding: '9px 14px', background: 'rgba(196,145,42,0.12)', border: '1px solid #c4912a30', borderRadius: 8, fontSize: 11, color: '#c4912a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>👤</span>
          <span>
            You can add your own drivers and assign them to any of your vehicles.
            Use the <strong>Assign vehicle</strong> button on each driver row.
          </span>
        </div>
      )}

      {/* Tab strip + search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', marginBottom: 20, background: '#fff', borderRadius: '10px 10px 0 0', padding: '0 8px' }}>
        <div style={{ display: 'flex' }}>
          {STATUS_FILTERS.map(tab => {
            const count = tab.id === 'all' ? drivers.length : drivers.filter(d => d.status === tab.id).length;
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatus(tab.id)}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--ink3)'; }}}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '11px 16px',
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  color: active ? '#c4912a' : 'var(--ink3)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `3px solid ${active ? '#c4912a' : 'transparent'}`,
                  marginBottom: -1,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  transition: 'color 0.15s, background 0.15s',
                }}
              >
                <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />
                {tab.label}
                {count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20, lineHeight: 1.5,
                    background: active ? '#c4912a' : 'var(--cream3)',
                    color: active ? '#fff' : 'var(--ink3)',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, license…"
          style={{ padding: '6px 11px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, outline: 'none', width: 200, fontFamily: 'inherit', color: 'var(--ink)', background: '#fff', marginRight: 4 }}
        />
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>⚠ {error} — is the backend running?</div>}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)', fontSize: 12 }}>Loading drivers…</div>
        ) : drivers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)', fontSize: 12 }}>
            {isOwner ? 'You haven\'t added any drivers yet. Click "+ Add driver" to get started.' : 'No drivers found.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {[
                  'Driver', 'License', 'Status', 'Safety score',
                  'HOS driven', 'HOS remaining', 'Vehicle',
                  canWrite ? 'Actions' : '',
                ].filter(Boolean).map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 13px', fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink3)', borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, i) => (
                <tr key={d.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '9px 13px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={d.name} index={i} />
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{d.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink3)' }}>Class {d.licenseClass}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '9px 13px', borderBottom: '1px solid var(--border)', color: 'var(--ink2)', fontFamily: 'monospace', fontSize: 11 }}>{d.licenseNumber || '—'}</td>
                  <td style={{ padding: '9px 13px', borderBottom: '1px solid var(--border)' }}><DriverStatusBadge status={d.status} /></td>
                  <td style={{ padding: '9px 13px', borderBottom: '1px solid var(--border)', minWidth: 120 }}><ScoreBar score={d.safetyScore} /></td>
                  <td style={{ padding: '9px 13px', borderBottom: '1px solid var(--border)', color: 'var(--ink2)', fontFamily: 'monospace', fontSize: 11 }}>{d.hosDriven.toFixed(1)}h</td>
                  <td style={{ padding: '9px 13px', borderBottom: '1px solid var(--border)', color: d.hosRemaining < 2 ? 'var(--red)' : 'var(--ink2)', fontFamily: 'monospace', fontSize: 11 }}>{d.hosRemaining.toFixed(1)}h</td>
                  <td style={{ padding: '9px 13px', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                    {d.assignedVehiclePlate
                      ? <span style={{ fontWeight: 600, color: '#c4912a', background: 'rgba(196,145,42,0.12)', padding: '2px 8px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 4 }}><i className="ti ti-truck" style={{ fontSize: 11 }} /> {d.assignedVehiclePlate}</span>
                      : <span style={{ color: 'var(--ink3)' }}>Unassigned</span>}
                  </td>
                  {canWrite && (
                    <td style={{ padding: '9px 13px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {isOwner && (
                          <button
                            onClick={() => setAssignTarget(d)}
                            style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, border: '1px solid #c4912a', borderRadius: 5, background: 'rgba(196,145,42,0.12)', color: '#c4912a', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <i className="ti ti-truck" style={{ fontSize: 10 }} /> Assign vehicle
                          </button>
                        )}
                        <button
                          onClick={() => setDelTarget(d)}
                          style={{ padding: '4px 8px', fontSize: 10, border: '1px solid rgba(179,48,48,0.3)', borderRadius: 4, background: '#fff', cursor: 'pointer', color: 'var(--red)', fontFamily: 'inherit' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add driver modal */}
      <Modal open={showAdd} title="Add driver" onClose={() => setShowAdd(false)}
        footer={<>
          <button onClick={() => setShowAdd(false)} style={{ padding: '6px 12px', fontSize: 11, border: '1px solid var(--border2)', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink2)' }}>Cancel</button>
          <button onClick={handleAdd} disabled={saving} style={{ padding: '6px 12px', fontSize: 11, border: 'none', borderRadius: 6, background: '#c4912a', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? 'Adding…' : 'Add driver'}</button>
        </>}>
        {formError && <div style={{ background: 'var(--red-lt)', border: '1px solid rgba(179,48,48,0.2)', borderRadius: 6, padding: '8px 11px', fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>⚠ {formError}</div>}
        <div style={{ marginBottom: 13 }}>
          <label style={LABEL}>Full name *</label>
          <input style={FIELD} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ali Hassan" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginBottom: 13 }}>
          <div><label style={LABEL}>License no.</label><input style={FIELD} value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="LIC-001" /></div>
          <div><label style={LABEL}>Class</label>
            <select style={FIELD} value={form.licenseClass} onChange={e => setForm(f => ({ ...f, licenseClass: e.target.value }))}>
              {['A', 'B', 'C', 'CE'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div><label style={LABEL}>Phone</label><input style={FIELD} value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="+1 555 000 0000" /></div>
      </Modal>

      {/* Assign vehicle modal (vehicle_owner only) */}
      {assignTarget && (
        <Modal
          open={!!assignTarget}
          title={`Assign vehicle — ${assignTarget.name}`}
          onClose={() => setAssignTarget(null)}
          footer={null}
        >
          <AssignVehicleModal
            driver={assignTarget}
            myVehicles={myVehicles}
            onClose={() => setAssignTarget(null)}
            onSaved={handleAssignSaved}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      <Modal open={!!delTarget} title="Delete driver" onClose={() => setDelTarget(null)}
        footer={<>
          <button onClick={() => setDelTarget(null)} style={{ padding: '6px 12px', fontSize: 11, border: '1px solid var(--border2)', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink2)' }}>Cancel</button>
          <button onClick={handleDelete} style={{ padding: '6px 12px', fontSize: 11, border: 'none', borderRadius: 6, background: 'var(--red)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Yes, delete</button>
        </>}>
        <div style={{ textAlign: 'center', padding: '6px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--ink2)' }}>Delete <strong style={{ color: 'var(--ink)' }}>{delTarget?.name}</strong>?</div>
          <div style={{ marginTop: 10, background: '#faeeda', borderRadius: 6, padding: '8px 11px', fontSize: 11, color: '#854f0b' }}>⚠ This cannot be undone.</div>
        </div>
      </Modal>
    </div>
  );
}
