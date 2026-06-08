'use client';
import { useState } from 'react';
import { useMaintenanceStore, type MaintenanceSchedule } from '@/store/maintenanceStore';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useAuthStore } from '@/store/authStore';

/* ── Shared micro-components ────────────────────────────────────────── */
function KpiCard({ icon, iconColor, label, value, stripe, onClick, active }: {
  icon: string; iconColor?: string; label: string; value: number;
  stripe?: string; onClick?: () => void; active?: boolean;
}) {
  const chipBg = (iconColor ?? '#c4912a') + '15';
  return (
    <div onClick={onClick} style={{
      background: active ? (iconColor ?? '#c4912a') + '08' : '#fff',
      border: `1px solid ${active ? (iconColor ?? '#c4912a') : 'var(--border)'}`,
      borderRadius: 7, padding: '8px 10px', cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s, border-color 0.15s', position: 'relative', overflow: 'hidden',
      boxShadow: active ? `0 0 0 3px ${(iconColor ?? '#c4912a') + '20'}` : '0 1px 2px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}
      onMouseEnter={e => { if (onClick && !active) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 3px 10px rgba(0,0,0,0.08)'; el.style.borderColor = iconColor ?? '#c4912a'; } }}
      onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; el.style.borderColor = 'var(--border)'; } }}
    >
      {stripe && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: stripe, borderRadius: '7px 0 0 7px' }} />}
      <div style={{ width: 34, height: 34, borderRadius: 7, background: chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor ?? '#c4912a', fontSize: 16, flexShrink: 0, marginLeft: stripe ? 4 : 0 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1, color: 'var(--ink)' }}>{value}</div>
      </div>
      {active && <i className="ti ti-filter-filled" style={{ fontSize: 10, color: iconColor ?? '#c4912a', flexShrink: 0 }} />}
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

/* ─── style helpers ────────────────────────────────────────────────────────── */
const STATUS_S: Record<string, React.CSSProperties> = {
  Overdue:   { background: '#fef2f2', color: '#dc2626' },
  'Due soon':{ background: '#fffbeb', color: '#d97706' },
  Scheduled: { background: 'var(--cream3)', color: 'var(--ink3)' },
  Done:      { background: 'rgba(196,145,42,0.12)', color: '#c4912a' },
};
const PRI_S: Record<string, React.CSSProperties> = {
  High:  { background: '#fef2f2', color: '#dc2626' },
  Medium:{ background: '#fffbeb', color: '#d97706' },
  Low:   { background: '#eff6ff', color: '#2563eb' },
};
const th: React.CSSProperties = {
  padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1,
  borderBottom: '1px solid var(--border)', background: 'var(--cream)',
};
const td: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, color: 'var(--ink2)',
  borderBottom: '1px solid var(--border)',
};

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function fmtDate(d: string | null) {
  if (!d) return '—';
  // d is already YYYY-MM-DD from the API
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
}

function computeStatus(dueAt: string | null, currentStatus: string): string {
  if (currentStatus === 'Done') return 'Done';
  if (!dueAt) return currentStatus;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueAt + 'T00:00:00');
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0)   return 'Overdue';
  if (diffDays <= 30) return 'Due soon';
  return 'Scheduled';
}

/* ─── Schedule modal ───────────────────────────────────────────────────────── */
interface ScheduleForm {
  vehicleShortId: string;
  vehiclePlate:   string;
  vehicleMake:    string;
  serviceType:    string;
  lastDoneAt:     string;
  dueAt:          string;
  mileage:        string;
  priority:       string;
  notes:          string;
}

const EMPTY_FORM: ScheduleForm = {
  vehicleShortId: '', vehiclePlate: '', vehicleMake: '',
  serviceType: '', lastDoneAt: '', dueAt: '',
  mileage: '', priority: 'Medium', notes: '',
};

function ScheduleModal({
  tenantId,
  vehicles,
  onClose,
  onSaved,
}: {
  tenantId: string;
  vehicles: { id: string; plate: string; make: string; model: string }[];
  onClose: () => void;
  onSaved: (s: MaintenanceSchedule) => void;
}) {
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setField(k: keyof ScheduleForm, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'vehicleShortId') {
      const veh = vehicles.find(x => x.id === v);
      if (veh) setForm(f => ({
        ...f,
        vehicleShortId: v,
        vehiclePlate:   veh.plate,
        vehicleMake:    `${veh.make} ${veh.model}`.trim(),
      }));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serviceType.trim()) { setError('Service type is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/v1/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...form }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.message ?? 'Save failed');
        return;
      }
      const saved: MaintenanceSchedule = await res.json();
      onSaved(saved);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid var(--border)',
    borderRadius: 6, background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--ink3)', display: 'block', marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 520, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Schedule Maintenance</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink3)', padding: '0 4px' }}>✕</button>
        </div>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 14 }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gap: 14 }}>
            {/* Vehicle picker */}
            <div>
              <label style={lbl}>Vehicle</label>
              <select value={form.vehicleShortId} onChange={e => setField('vehicleShortId', e.target.value)} style={inp}>
                <option value=''>— Select vehicle —</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            {/* Service type */}
            <div>
              <label style={lbl}>Service type *</label>
              <input value={form.serviceType} onChange={e => setField('serviceType', e.target.value)}
                placeholder='e.g. Oil change, Brake inspection…' style={inp} />
            </div>
            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Last done</label>
                <input type='date' value={form.lastDoneAt} onChange={e => setField('lastDoneAt', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Due date</label>
                <input type='date' value={form.dueAt} onChange={e => setField('dueAt', e.target.value)} style={inp} />
              </div>
            </div>
            {/* Mileage + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Mileage (km)</label>
                <input value={form.mileage} onChange={e => setField('mileage', e.target.value)}
                  placeholder='e.g. 75000' style={inp} />
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <select value={form.priority} onChange={e => setField('priority', e.target.value)} style={inp}>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
            {/* Notes */}
            <div>
              <label style={lbl}>Notes</label>
              <textarea value={form.notes} onChange={e => setField('notes', e.target.value)}
                rows={2} placeholder='Optional notes…'
                style={{ ...inp, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type='button' onClick={onClose}
              style={{ padding: '8px 20px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 7, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type='submit' disabled={saving}
              style={{ padding: '8px 20px', fontSize: 13, border: 'none', borderRadius: 7, background: '#c4912a', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */
export default function MaintenancePage() {
  const { user } = useAuthStore();
  const { schedules, loading, loadSchedules, addSchedule, updateSchedule } = useMaintenanceStore();
  const vehicles = useVehiclesStore(s => s.vehicles);

  const [showModal, setShowModal]     = useState(false);
  const [markBusy, setMarkBusy]       = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const tenantId = user?.tenantId ?? '';

  // Filter to current tenant
  const allRows = schedules
    .filter(s => !tenantId || s.tenantId === tenantId)
    .map(s => ({ ...s, status: computeStatus(s.dueAt, s.status) }));
  const rows = statusFilter === 'All' ? allRows : allRows.filter(r => r.status === statusFilter);

  const tenantVehicles = vehicles.filter(v => !tenantId || (v as { tenantId?: string }).tenantId === tenantId);

  async function markDone(id: string) {
    if (markBusy) return;
    setMarkBusy(id);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/api/v1/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Done', lastDoneAt: today }),
      });
      if (res.ok) {
        const updated: MaintenanceSchedule = await res.json();
        updateSchedule(updated);
      }
    } finally {
      setMarkBusy(null);
    }
  }

  const summaryStatuses = ['Overdue', 'Due soon', 'Scheduled'] as const;

  const overdue   = allRows.filter(r => r.status === 'Overdue').length;
  const dueSoon   = allRows.filter(r => r.status === 'Due soon').length;
  const scheduled = allRows.filter(r => r.status === 'Scheduled').length;
  const done      = allRows.filter(r => r.status === 'Done').length;

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
            <i className="ti ti-tool" style={{ fontSize: 20, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Fleet Management</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Maintenance</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Summary chips in header */}
          {summaryStatuses.map(label => {
            const isActive = statusFilter === label;
            const chipColor = label === 'Overdue' ? '#ef4444' : label === 'Due soon' ? '#f59e0b' : '#f5d07a';
            return (
              <div key={label}
                onClick={() => setStatusFilter(isActive ? 'All' : label)}
                style={{ textAlign: 'center', padding: '0 14px', borderLeft: '1px solid rgba(196,145,42,0.20)', cursor: 'pointer', opacity: isActive ? 1 : 0.85, transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = isActive ? '1' : '0.85')}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: isActive ? chipColor : '#fff', lineHeight: 1 }}>
                  {allRows.filter(r => r.status === label).length}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
              </div>
            );
          })}
          <div style={{ borderLeft: '1px solid rgba(196,145,42,0.20)', paddingLeft: 14, display: 'flex', gap: 8 }}>
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', fontSize: 12, fontWeight: 600,
              borderRadius: 7, border: '1px solid rgba(196,145,42,0.35)',
              background: 'rgba(196,145,42,0.15)', color: '#f5d07a',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> Schedule
            </button>
            <button onClick={() => loadSchedules(tenantId || null)} disabled={loading} style={{
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 7, border: '1px solid rgba(196,145,42,0.35)',
              background: 'rgba(196,145,42,0.12)', color: '#f5d07a',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, opacity: loading ? 0.6 : 1,
            }}>
              {loading ? '…' : <i className="ti ti-refresh" style={{ fontSize: 14 }} />}
            </button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
        <KpiCard icon="ti-alert-octagon" iconColor="#dc2626" label="Overdue" value={overdue}
          stripe="var(--red)" active={statusFilter === 'Overdue'}
          onClick={() => setStatusFilter(statusFilter === 'Overdue' ? 'All' : 'Overdue')} />
        <KpiCard icon="ti-clock-exclamation" iconColor="#d97706" label="Due soon" value={dueSoon}
          stripe="var(--amber)" active={statusFilter === 'Due soon'}
          onClick={() => setStatusFilter(statusFilter === 'Due soon' ? 'All' : 'Due soon')} />
        <KpiCard icon="ti-calendar" iconColor="#2563eb" label="Scheduled" value={scheduled}
          stripe="#2563eb" active={statusFilter === 'Scheduled'}
          onClick={() => setStatusFilter(statusFilter === 'Scheduled' ? 'All' : 'Scheduled')} />
        <KpiCard icon="ti-circle-check" iconColor="#c4912a" label="Done" value={done}
          stripe="#c4912a" active={statusFilter === 'Done'}
          onClick={() => setStatusFilter(statusFilter === 'Done' ? 'All' : 'Done')} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {rows.length === 0 && !loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
            No maintenance schedules yet. Click <strong>+ Schedule</strong> to add one.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Vehicle', 'Make / Model', 'Service type', 'Last done', 'Due date', 'Mileage', 'Priority', 'Status', ''].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ background: r.status === 'Overdue' ? '#fffaf8' : '#fff' }}>
                  <td style={{ ...td, fontWeight: 600, color: 'var(--ink)' }}>{r.vehiclePlate || '—'}</td>
                  <td style={{ ...td, fontSize: 12 }}>{r.vehicleMake || '—'}</td>
                  <td style={{ ...td, color: 'var(--ink)' }}>{r.serviceType}</td>
                  <td style={{ ...td, color: 'var(--ink3)', fontSize: 12 }}>{fmtDate(r.lastDoneAt)}</td>
                  <td style={{ ...td, color: r.status === 'Overdue' ? '#dc2626' : 'var(--ink2)', fontWeight: r.status === 'Overdue' ? 600 : 400 }}>
                    {fmtDate(r.dueAt)}
                  </td>
                  <td style={{ ...td, fontSize: 12 }}>{r.mileage ? `${Number(r.mileage).toLocaleString()} km` : '—'}</td>
                  <td style={td}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, ...PRI_S[r.priority] }}>
                      {r.priority}
                    </span>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, ...STATUS_S[r.status] }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={td}>
                    {r.status !== 'Done' && (
                      <Btn variant="primary" size="xs" onClick={() => markDone(r.id)} disabled={markBusy === r.id}>
                        {markBusy === r.id ? '…' : <><i className="ti ti-check" style={{ fontSize: 10 }} /> Mark done</>}
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ScheduleModal
          tenantId={tenantId}
          vehicles={tenantVehicles as { id: string; plate: string; make: string; model: string }[]}
          onClose={() => setShowModal(false)}
          onSaved={s => { addSchedule(s); setShowModal(false); }}
        />
      )}
    </div>
  );
}
