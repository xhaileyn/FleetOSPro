'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';
import { useUsersStore } from '@/store/usersStore';
import { TenantUser, getAllRoles } from '@/lib/tenantUsers';
import { UserRole } from '@/lib/types';
import { TenantCustomRole } from '@/lib/tenantRoles';
import { Branch } from '@/lib/branches';
import { VehicleMaster } from '@/lib/vehiclesMaster';
import { useBranchesStore } from '@/store/branchesStore';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { getSubscription, isServiceEnabled, PLANS, computeSubStatus } from '@/lib/subscriptions';

// ── constants & helpers ───────────────────────────────────────────────────────

const SYSTEM_ROLES: { value: UserRole; label: string; color: string; icon: string }[] = [
  { value: 'tenant_admin',  label: 'Tenant Admin',   color: '#6366f1', icon: 'ti-crown' },
  { value: 'fleet_admin',   label: 'Fleet Admin',    color: '#0891b2', icon: 'ti-shield' },
  { value: 'fleet_manager', label: 'Fleet Manager',  color: '#c4912a', icon: 'ti-steering-wheel' },
  { value: 'dispatcher',    label: 'Dispatcher',     color: '#7c3aed', icon: 'ti-radio' },
  { value: 'billing_admin', label: 'Billing Admin',  color: '#d97706', icon: 'ti-credit-card' },
  { value: 'viewer',        label: 'Viewer',         color: '#6b7280', icon: 'ti-eye' },
  { value: 'vehicle_owner', label: 'Vehicle Owner',  color: '#16a34a', icon: 'ti-car' },
];

const ROLE_COLOR: Record<string, string> = Object.fromEntries(SYSTEM_ROLES.map(r => [r.value, r.color]));
const ROLE_ICON:  Record<string, string> = Object.fromEntries(SYSTEM_ROLES.map(r => [r.value, r.icon]));
function roleLabel(r: UserRole): string { return SYSTEM_ROLES.find(x => x.value === r)?.label ?? r; }

const STATUS_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  Active:    { bg: '#dcfce7', color: '#16a34a', icon: 'ti-circle-check' },
  Suspended: { bg: '#fee2e2', color: '#dc2626', icon: 'ti-ban' },
  Pending:   { bg: '#fef3c7', color: '#ca8a04', icon: 'ti-clock' },
};

function initials(u: TenantUser) {
  return (u.firstName[0] + u.lastName[0]).toUpperCase();
}
function avatarColor(role: UserRole): string {
  return ROLE_COLOR[role] ?? '#6b7280';
}

// ── shared primitives ─────────────────────────────────────────────────────────

function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 0 7px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 13, color: '#c4912a' }} />
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#0d1b2a' }}>{title}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 4 }}>{children}</label>;
}

const INPUT = {
  width: '100%', boxSizing: 'border-box' as const,
  padding: '8px 11px', border: '1px solid var(--border)', borderRadius: 7,
  fontSize: 13, outline: 'none', background: '#fff',
};

// ── form state ────────────────────────────────────────────────────────────────

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  additionalRoles: UserRole[];
  customRoleIds: string[];
  status: 'Active' | 'Suspended' | 'Pending';
  mfaEnabled: boolean;
  vehicleId: string;
  vehicleIds: string[];
  restrictedVehicleIds: string;
  restrictedDeviceIds: string;
  branchIds: string[];
}

const BLANK_FORM: FormState = {
  firstName: '', lastName: '', email: '', password: '',
  role: 'viewer', additionalRoles: [], customRoleIds: [],
  status: 'Active', mfaEnabled: false, vehicleId: '', vehicleIds: [],
  restrictedVehicleIds: '', restrictedDeviceIds: '', branchIds: [],
};

function userToForm(u: TenantUser): FormState {
  return {
    firstName: u.firstName, lastName: u.lastName, email: u.email, password: '',
    role: u.role, additionalRoles: u.additionalRoles ?? [], customRoleIds: u.customRoleIds ?? [],
    status: u.status, mfaEnabled: u.mfaEnabled, vehicleId: u.vehicleId ?? '',
    vehicleIds: u.vehicleIds ?? (u.vehicleId ? [u.vehicleId] : []),
    restrictedVehicleIds: (u.restrictedVehicleIds ?? []).join(', '),
    restrictedDeviceIds:  (u.restrictedDeviceIds  ?? []).join(', '),
    branchIds: u.branchIds ?? [],
  };
}

// ── VehicleOwnerSection ───────────────────────────────────────────────────────

interface VehicleOwnerSectionProps {
  tenantId: string;
  selectedIds: string[];
  onToggle: (vehicleId: string) => void;
  tenantVehicles: VehicleMaster[];
}

function VehicleOwnerSection({ tenantId: _tenantId, selectedIds, onToggle, tenantVehicles }: VehicleOwnerSectionProps) {
  const vehicles = tenantVehicles;

  if (vehicles.length === 0) {
    return (
      <div style={{ fontSize: 12, color: 'var(--ink3)', padding: '8px 10px', background: 'var(--cream)', borderRadius: 7 }}>
        No vehicles registered for this tenant.
      </div>
    );
  }

  const sorted = [...vehicles].sort((a, b) => {
    if (a.ownerType === 'Individual' && b.ownerType !== 'Individual') return -1;
    if (a.ownerType !== 'Individual' && b.ownerType === 'Individual') return 1;
    return a.plate.localeCompare(b.plate);
  });

  return (
    <div>
      <FieldLabel>
        <i className="ti ti-truck" style={{ marginRight: 4 }} />Vehicle assignment
        <span style={{ marginLeft: 6, fontWeight: 400, color: 'var(--ink3)' }}>— select one or more</span>
      </FieldLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 230, overflowY: 'auto',
        border: '1px solid var(--border)', borderRadius: 8, padding: 6 }}>
        {sorted.map(v => {
          const sub           = getSubscription(v.id);
          const planName      = sub?.plan ?? null;
          const hasWebAccess  = isServiceEnabled(v.id, 'web_access');
          const subStatus     = sub ? computeSubStatus(sub) : null;
          const isIndividual  = v.ownerType === 'Individual';
          const isBlocked     = isIndividual && !hasWebAccess;
          const isSelected    = selectedIds.includes(v.id);
          const planColor     = planName ? (PLANS[planName]?.color ?? '#6b7280') : '#6b7280';
          const planServices  = planName ? (PLANS[planName]?.services ?? []) : [];

          return (
            <label key={v.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px',
              borderRadius: 6, cursor: isBlocked ? 'not-allowed' : 'pointer',
              background: isSelected ? '#f0fdf4' : isBlocked ? '#fef2f2' : 'var(--cream)',
              border: `1px solid ${isSelected ? '#86efac' : isBlocked ? '#fecaca' : 'transparent'}`,
              opacity: isBlocked ? 0.65 : 1,
            }}>
              <input type="checkbox" checked={isSelected} disabled={isBlocked}
                onChange={() => !isBlocked && onToggle(v.id)}
                style={{ accentColor: '#16a34a', marginTop: 3, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{v.plate}</span>
                  <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{v.make} {v.model} {v.year}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                    background: isIndividual ? '#ede9fe' : '#dbeafe',
                    color: isIndividual ? '#7c3aed' : '#1d4ed8' }}>
                    {isIndividual ? '👤 Individual' : '🏢 ' + (v.ownerType ?? 'Company')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
                  {planName ? (
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
                      background: planColor + '20', color: planColor, border: `1px solid ${planColor}40` }}>
                      {planName}
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, color: '#dc2626', fontWeight: 600 }}>No subscription</span>
                  )}
                  {subStatus && subStatus !== 'Active' && (
                    <span style={{ fontSize: 9, fontWeight: 600, color: subStatus === 'Expired' ? '#dc2626' : '#ca8a04' }}>
                      ⚠ {subStatus}
                    </span>
                  )}
                  {hasWebAccess
                    ? <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 600 }}><i className="ti ti-world" /> Web ✓</span>
                    : <span style={{ fontSize: 9, color: '#dc2626', fontWeight: 600 }}><i className="ti ti-world-off" /> No web access</span>
                  }
                  {!isIndividual && planServices.length > 0 && (
                    <span style={{ fontSize: 9, color: 'var(--ink3)' }}>{planServices.length} services in plan</span>
                  )}
                </div>
                {isBlocked && (
                  <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>
                    {subStatus === 'Expired'
                      ? 'Subscription expired — renew to enable web access'
                      : `${planName ?? 'Current plan'} does not include web portal access`}
                  </div>
                )}
                {!isIndividual && !hasWebAccess && (
                  <div style={{ fontSize: 10, color: '#ca8a04', marginTop: 2 }}>
                    Web access not in plan — manager/contact can be assigned limited rights per package
                  </div>
                )}
                {!isIndividual && hasWebAccess && (
                  <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>
                    Manager / contact person can access portal per {planName} plan rights
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 5 }}>
        {selectedIds.length === 0
          ? 'No vehicle selected'
          : `${selectedIds.length} vehicle${selectedIds.length > 1 ? 's' : ''} selected · primary: ${selectedIds[0]}`}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function TenantUsersPage() {
  const { user: authUser }              = useAuthStore();
  const config                          = useConfigStore();
  const { users: allUsers, addUser, updateUser, deleteUser } = useUsersStore();
  const isAdmin   = authUser?.role === 'fleet_admin' || authUser?.role === 'super_admin' || authUser?.role === 'tenant_admin';
  const tenantId  = authUser?.tenantId ?? '1';
  const tenantName = authUser?.tenantName ?? 'Your tenant';

  const users = authUser?.role === 'super_admin'
    ? allUsers
    : allUsers.filter(u => u.tenantId === tenantId);

  const customRoles = useMemo<TenantCustomRole[]>(
    () => config.customRoles.filter(r => r.tenantId === tenantId),
    [config.customRoles, tenantId],
  );
  const rbacCustomRoles = config.rbacCustomRoles;

  const storeBranches  = useBranchesStore(s => s.branches);
  const storeVehicles  = useVehiclesStore(s => s.vehicles);

  const branches = useMemo<Branch[]>(
    () => storeBranches.filter(b => b.tenantId === tenantId),
    [storeBranches, tenantId],
  );
  const tenantVehicles = useMemo<VehicleMaster[]>(
    () => storeVehicles.filter(v => v.tenantId === tenantId),
    [storeVehicles, tenantId],
  );

  const [modal, setModal]       = useState<'create' | 'edit' | 'delete' | null>(null);
  const [editing, setEditing]   = useState<TenantUser | null>(null);
  const [form, setForm]         = useState<FormState>(BLANK_FORM);
  const [toast, setToast]       = useState('');
  const [search, setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showPwd, setShowPwd]   = useState(false);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const filtered = useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
      );
    }
    if (filterRole !== 'all') list = list.filter(u => getAllRoles(u).includes(filterRole as UserRole));
    if (filterStatus !== 'all') list = list.filter(u => u.status === filterStatus);
    return list;
  }, [users, search, filterRole, filterStatus]);

  const stats = useMemo(() => ({
    total:     users.length,
    active:    users.filter(u => u.status === 'Active').length,
    suspended: users.filter(u => u.status === 'Suspended').length,
    pending:   users.filter(u => u.status === 'Pending').length,
    mfa:       users.filter(u => u.mfaEnabled).length,
  }), [users]);

  function openCreate() { setForm(BLANK_FORM); setEditing(null); setModal('create'); setShowPwd(false); }
  function openEdit(u: TenantUser) { setForm(userToForm(u)); setEditing(u); setModal('edit'); setShowPwd(false); }
  function openDelete(u: TenantUser) { setEditing(u); setModal('delete'); }

  function toggleUserStatus(u: TenantUser) {
    if (!isAdmin) return;
    const newStatus = u.status === 'Active' ? 'Suspended' : 'Active';
    updateUser({ ...u, status: newStatus });
    showToast(`${u.firstName} ${newStatus === 'Active' ? 'activated' : 'suspended'}`);
  }

  function toggleBranch(branchId: string) {
    setForm(f => ({
      ...f,
      branchIds: f.branchIds.includes(branchId)
        ? f.branchIds.filter(b => b !== branchId)
        : [...f.branchIds, branchId],
    }));
  }

  function toggleAdditionalRole(r: UserRole) {
    setForm(f => ({
      ...f,
      additionalRoles: f.additionalRoles.includes(r)
        ? f.additionalRoles.filter(x => x !== r)
        : [...f.additionalRoles, r],
    }));
  }

  function toggleCustomRole(id: string) {
    setForm(f => ({
      ...f,
      customRoleIds: f.customRoleIds.includes(id)
        ? f.customRoleIds.filter(x => x !== id)
        : [...f.customRoleIds, id],
    }));
  }

  function handleSave() {
    if (!form.firstName.trim() || !form.email.trim()) return;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    if (modal === 'create') {
      const newUser: TenantUser = {
        id: crypto.randomUUID(),
        tenantId,
        tenantName,
        tenantSlug: authUser?.tenantSlug ?? tenantId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password || 'Demo1234!',
        role: form.role,
        additionalRoles: form.additionalRoles,
        customRoleIds: form.customRoleIds,
        status: form.status,
        mfaEnabled: form.mfaEnabled,
        lastLogin: 'Never',
        vehicleId:  form.vehicleIds[0] ?? (form.vehicleId || undefined),
        vehicleIds: form.vehicleIds.length ? form.vehicleIds : undefined,
        restrictedVehicleIds: form.restrictedVehicleIds ? form.restrictedVehicleIds.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        restrictedDeviceIds:  form.restrictedDeviceIds  ? form.restrictedDeviceIds.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        branchIds: form.branchIds.length ? form.branchIds : undefined,
      };
      addUser(newUser);
      showToast(`User ${newUser.firstName} ${newUser.lastName} created`);
    } else if (editing) {
      updateUser({
        ...editing,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        ...(form.password ? { password: form.password } : {}),
        role: form.role,
        additionalRoles: form.additionalRoles,
        customRoleIds: form.customRoleIds,
        status: form.status,
        mfaEnabled: form.mfaEnabled,
        vehicleId:  form.vehicleIds[0] ?? (form.vehicleId || undefined),
        vehicleIds: form.vehicleIds.length ? form.vehicleIds : undefined,
        restrictedVehicleIds: form.restrictedVehicleIds ? form.restrictedVehicleIds.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        restrictedDeviceIds:  form.restrictedDeviceIds  ? form.restrictedDeviceIds.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        branchIds: form.branchIds.length ? form.branchIds : undefined,
      });
      showToast(`${form.firstName} ${form.lastName} updated`);
    }
    setModal(null);
  }

  function handleDelete() {
    if (!editing) return;
    deleteUser(editing.id);
    showToast(`${editing.firstName} ${editing.lastName} removed`);
    setModal(null);
  }

  const canSave = form.firstName.trim() && form.email.trim();

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          background: '#1e293b', color: '#fff', borderRadius: 9,
          padding: '10px 18px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.30)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="ti ti-circle-check" style={{ color: '#4ade80', fontSize: 15 }} /> {toast}
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border: '1px solid rgba(196,145,42,0.18)', borderRadius: 14,
        padding: '20px 24px', marginBottom: 14,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-users" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Org Admin</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>User Management</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{tenantName} · team members, roles &amp; access</div>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',     value: stats.total,     icon: 'ti-users',         color: '#93c5fd' },
            { label: 'Active',    value: stats.active,    icon: 'ti-circle-check',  color: '#4ade80' },
            { label: 'Pending',   value: stats.pending,   icon: 'ti-clock',         color: '#fcd34d' },
            { label: 'Suspended', value: stats.suspended, icon: 'ti-ban',           color: '#f87171' },
            { label: 'MFA On',    value: stats.mfa,       icon: 'ti-shield-check',  color: '#a78bfa' },
          ].map((s, i) => (
            <div key={s.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '6px 14px',
              borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                <i className={`ti ${s.icon}`} style={{ fontSize: 11, color: s.color }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.value}</span>
              </div>
              <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}

          {isAdmin && (
            <button onClick={openCreate} style={{
              marginLeft: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700,
              borderRadius: 8, cursor: 'pointer',
              border: '1px solid rgba(196,145,42,0.40)',
              background: 'rgba(196,145,42,0.18)', color: '#f5d07a',
              display: 'flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.2px',
            }}>
              <i className="ti ti-user-plus" style={{ fontSize: 14 }} /> Add user
            </button>
          )}
        </div>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
        marginBottom: 12, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ padding: '9px 14px', background: 'var(--cream)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <i className="ti ti-filter" style={{ fontSize: 13, color: '#c4912a' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0d1b2a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter Users</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>
            {filtered.length} of {users.length} users
          </span>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink3)', fontSize: 13 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              style={{ ...INPUT, paddingLeft: 32 }}
            />
          </div>
          <select
            value={filterRole} onChange={e => setFilterRole(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, background: '#fff', color: 'var(--ink)', minWidth: 140 }}
          >
            <option value="all">All roles</option>
            {SYSTEM_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, background: '#fff', color: 'var(--ink)', minWidth: 130 }}
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
          {(search || filterRole !== 'all' || filterStatus !== 'all') && (
            <button onClick={() => { setSearch(''); setFilterRole('all'); setFilterStatus('all'); }}
              style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, background: '#fff', cursor: 'pointer', color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-x" style={{ fontSize: 11 }} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── User table ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

        {/* Card header */}
        <div style={{ padding: '9px 14px', background: 'var(--cream)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ti ti-table" style={{ fontSize: 13, color: '#c4912a' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0d1b2a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Members</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
              {[
                { label: 'User',       icon: 'ti-user' },
                { label: 'Roles',      icon: 'ti-shield-half' },
                { label: 'Status',     icon: 'ti-circle' },
                { label: 'MFA',        icon: 'ti-device-mobile' },
                { label: 'Last Login', icon: 'ti-clock' },
                { label: '',           icon: '' },
              ].map(h => (
                <th key={h.label} style={{ textAlign: 'left', padding: '9px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                  {h.icon && <i className={`ti ${h.icon}`} style={{ marginRight: 5, fontSize: 11 }} />}
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, idx) => {
              const sysRoles  = getAllRoles(u);
              const customR   = (u.customRoleIds ?? []).map(id => customRoles.find(r => r.id === id)).filter(Boolean) as TenantCustomRole[];
              const rbacR     = (u.customRoleIds ?? []).map(id => rbacCustomRoles.find(r => r.id === id)).filter(Boolean);
              const ss = STATUS_STYLE[u.status] ?? STATUS_STYLE.Active;
              const rowBg = idx % 2 === 0 ? '#fff' : 'var(--cream)';
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: rowBg, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8f6f0')}
                  onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>

                  {/* User cell */}
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: avatarColor(u.role), color: '#fff',
                        display: 'grid', placeItems: 'center',
                        fontSize: 12, fontWeight: 700,
                        border: `2px solid ${avatarColor(u.role)}40`,
                        boxShadow: `0 0 0 3px ${avatarColor(u.role)}18`,
                      }}>
                        {initials(u)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>{u.email}</div>
                        {(u.branchIds?.length || u.restrictedVehicleIds?.length || u.restrictedDeviceIds?.length) ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                            {u.branchIds?.map(bid => {
                              const br = branches.find(b => b.id === bid);
                              return br ? <span key={bid} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#dbeafe', color: '#2563eb', fontWeight: 600 }}>{br.name}</span> : null;
                            })}
                            {u.restrictedVehicleIds?.length ? <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#fef3c7', color: '#ca8a04', fontWeight: 600 }}>{u.restrictedVehicleIds.length}v scoped</span> : null}
                            {u.restrictedDeviceIds?.length  ? <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#fef3c7', color: '#ca8a04', fontWeight: 600 }}>{u.restrictedDeviceIds.length}d scoped</span>  : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {/* Roles cell */}
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {sysRoles.map(r => (
                        <span key={r} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
                          background: (ROLE_COLOR[r] ?? '#6b7280') + '15',
                          color: ROLE_COLOR[r] ?? '#6b7280',
                          border: `1px solid ${(ROLE_COLOR[r] ?? '#6b7280')}35`,
                        }}>
                          <i className={`ti ${ROLE_ICON[r] ?? 'ti-user'}`} style={{ fontSize: 10 }} />
                          {roleLabel(r)}
                        </span>
                      ))}
                      {customR.map(cr => (
                        <span key={cr.id} style={{
                          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
                          background: cr.color + '15', color: cr.color,
                          border: `1px solid ${cr.color}35`,
                        }}>
                          ★ {cr.name}
                        </span>
                      ))}
                      {rbacR.map(rr => rr && (
                        <span key={rr.id} style={{
                          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
                          background: rr.color + '15', color: rr.color,
                          border: `1px solid ${rr.color}35`,
                        }}>
                          🔒 {rr.label}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 6,
                        background: ss.bg, color: ss.color,
                      }}>
                        <i className={`ti ${ss.icon}`} style={{ fontSize: 11 }} />
                        {u.status}
                      </span>
                      {isAdmin && u.id !== 'u-101' && u.status !== 'Pending' && (
                        <button
                          onClick={() => toggleUserStatus(u)}
                          title={u.status === 'Active' ? 'Suspend user' : 'Activate user'}
                          style={{
                            padding: '3px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                            border: `1px solid ${u.status === 'Active' ? '#fca5a5' : '#86efac'}`,
                            borderRadius: 5, background: '#fff',
                            color: u.status === 'Active' ? '#dc2626' : '#16a34a',
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}
                        >
                          <i className={`ti ${u.status === 'Active' ? 'ti-ban' : 'ti-circle-check'}`} style={{ fontSize: 10 }} />
                          {u.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* MFA */}
                  <td style={{ padding: '11px 14px' }}>
                    {u.mfaEnabled
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#16a34a', fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: '#dcfce7' }}>
                          <i className="ti ti-shield-check" style={{ fontSize: 11 }} /> On
                        </span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink3)', padding: '3px 8px', borderRadius: 5, background: 'var(--cream)' }}>
                          <i className="ti ti-shield-off" style={{ fontSize: 11 }} /> Off
                        </span>
                    }
                  </td>

                  {/* Last login */}
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                    {u.lastLogin}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(u)} style={{
                          padding: '5px 11px', border: '1px solid rgba(196,145,42,0.35)', borderRadius: 6,
                          background: 'rgba(196,145,42,0.08)', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                          color: '#c4912a', display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <i className="ti ti-pencil" style={{ fontSize: 11 }} /> Edit
                        </button>
                        {u.id !== 'u-101' && (
                          <button onClick={() => openDelete(u)} style={{
                            padding: '5px 9px', border: '1px solid #fca5a5', borderRadius: 6,
                            background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: 11,
                            display: 'flex', alignItems: 'center',
                          }}>
                            <i className="ti ti-trash" style={{ fontSize: 12 }} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '52px 0', textAlign: 'center', color: 'var(--ink3)' }}>
                  <i className="ti ti-users-off" style={{ fontSize: 30, display: 'block', marginBottom: 10, opacity: 0.4 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink2)', marginBottom: 4 }}>No users found</div>
                  <div style={{ fontSize: 12 }}>Try adjusting your search or filters.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit modal ───────────────────────────────────────── */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.50)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{
            background: '#fff', borderRadius: 14, width: '90vw', maxWidth: 840,
            maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
          }}>
            {/* Modal header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
              borderRadius: '14px 14px 0 0',
              padding: '16px 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(196,145,42,0.20)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${modal === 'create' ? 'ti-user-plus' : 'ti-user-edit'}`} style={{ fontSize: 17, color: '#f5d07a' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    {modal === 'create' ? 'Add new user' : `Edit — ${editing?.firstName} ${editing?.lastName}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{tenantName}</div>
                </div>
              </div>
              <button onClick={() => setModal(null)} style={{ width: 30, height: 30, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 14, display: 'grid', placeItems: 'center' }}>
                <i className="ti ti-x" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden', minHeight: 0 }}>

              {/* Left: personal details */}
              <div style={{ padding: '18px 20px', borderRight: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

                <SectionLabel icon="ti-id-badge" title="Personal details" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <FieldLabel>First name *</FieldLabel>
                    <input autoFocus value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      style={INPUT} />
                  </div>
                  <div>
                    <FieldLabel>Last name</FieldLabel>
                    <input value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      style={INPUT} />
                  </div>
                </div>

                <div>
                  <FieldLabel>Email address *</FieldLabel>
                  <input value={form.email} type="email"
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    style={INPUT} />
                </div>

                <div>
                  <FieldLabel>{modal === 'edit' ? 'New password (leave blank to keep)' : 'Temporary password'}</FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={modal === 'create' ? 'Min 8 chars' : ''}
                      style={{ ...INPUT, paddingRight: 36 }}
                    />
                    <button onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 14, display: 'grid', placeItems: 'center' }}>
                      <i className={`ti ${showPwd ? 'ti-eye-off' : 'ti-eye'}`} />
                    </button>
                  </div>
                </div>

                <div>
                  <FieldLabel>Account status</FieldLabel>
                  <select value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as FormState['status'] }))}
                    style={{ ...INPUT }}>
                    <option>Active</option><option>Pending</option><option>Suspended</option>
                  </select>
                </div>

                {/* Vehicle assignment */}
                {form.role === 'vehicle_owner' ? (
                  <VehicleOwnerSection
                    tenantId={tenantId}
                    selectedIds={form.vehicleIds}
                    tenantVehicles={tenantVehicles}
                    onToggle={id => setForm(f => ({
                      ...f,
                      vehicleIds: f.vehicleIds.includes(id)
                        ? f.vehicleIds.filter(x => x !== id)
                        : [...f.vehicleIds, id],
                    }))}
                  />
                ) : (
                  <div>
                    <FieldLabel>Vehicle ID <span style={{ fontWeight: 400, color: 'var(--ink3)' }}>(vehicle_owner only)</span></FieldLabel>
                    <input value={form.vehicleId}
                      onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
                      placeholder="e.g. v1"
                      style={{ ...INPUT, color: 'var(--ink3)', background: 'var(--cream)' }} />
                  </div>
                )}

                {/* MFA toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cream)', borderRadius: 8, padding: '10px 13px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Two-factor authentication</div>
                    <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>Require MFA on every login</div>
                  </div>
                  <div onClick={() => setForm(f => ({ ...f, mfaEnabled: !f.mfaEnabled }))}
                    style={{ width: 40, height: 23, borderRadius: 12, cursor: 'pointer', background: form.mfaEnabled ? '#c4912a' : 'var(--border2)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: form.mfaEnabled ? 21 : 3, width: 17, height: 17, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>

                {/* Access scoping */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <SectionLabel icon="ti-lock-access" title="Access scoping" />
                  <p style={{ fontSize: 11, color: 'var(--ink3)', margin: '0 0 12px' }}>Leave blank to allow access to all. Restrict to specific IDs.</p>

                  <div style={{ marginBottom: 10 }}>
                    <FieldLabel><i className="ti ti-truck" style={{ marginRight: 4 }} />Restrict to vehicle IDs</FieldLabel>
                    <input value={form.restrictedVehicleIds}
                      onChange={e => setForm(f => ({ ...f, restrictedVehicleIds: e.target.value }))}
                      placeholder="v1, v2, v3 (comma-separated)"
                      style={{ ...INPUT, fontFamily: 'monospace', fontSize: 12 }} />
                    {form.restrictedVehicleIds && (
                      <div style={{ fontSize: 10, color: '#d97706', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-alert-triangle" style={{ fontSize: 10 }} />
                        Scoped to {form.restrictedVehicleIds.split(',').filter(s => s.trim()).length} vehicles
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <FieldLabel><i className="ti ti-device-analytics" style={{ marginRight: 4 }} />Restrict to device IDs</FieldLabel>
                    <input value={form.restrictedDeviceIds}
                      onChange={e => setForm(f => ({ ...f, restrictedDeviceIds: e.target.value }))}
                      placeholder="dev-001, dev-002 (comma-separated)"
                      style={{ ...INPUT, fontFamily: 'monospace', fontSize: 12 }} />
                  </div>

                  {branches.length > 0 && (
                    <div>
                      <FieldLabel><i className="ti ti-building" style={{ marginRight: 4 }} />Branch access</FieldLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {branches.map(b => (
                          <label key={b.id} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                            background: form.branchIds.includes(b.id) ? '#f0fdf4' : 'var(--cream)',
                            border: `1px solid ${form.branchIds.includes(b.id) ? '#86efac' : 'var(--border)'}`,
                            opacity: b.active ? 1 : 0.5,
                          }}>
                            <input type="checkbox" checked={form.branchIds.includes(b.id)} onChange={() => toggleBranch(b.id)}
                              disabled={!b.active} style={{ accentColor: '#16a34a' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 500 }}>{b.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--ink3)' }}>{b.city} · {b.vehicleCount} vehicles</div>
                            </div>
                            {!b.active && <span style={{ fontSize: 9, color: '#dc2626', fontWeight: 700 }}>INACTIVE</span>}
                          </label>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 6 }}>
                        {form.branchIds.length === 0 ? 'No branch restriction — user sees all branches' : `Restricted to ${form.branchIds.length} branch${form.branchIds.length > 1 ? 'es' : ''}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: role assignment */}
              <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Primary system role */}
                <div>
                  <SectionLabel icon="ti-crown" title="Primary system role" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {SYSTEM_ROLES.map(r => (
                      <label key={r.value} style={{
                        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        padding: '8px 11px', borderRadius: 8,
                        background: form.role === r.value ? r.color + '12' : 'var(--cream)',
                        border: `1px solid ${form.role === r.value ? r.color + '50' : 'var(--border)'}`,
                        transition: 'all 0.12s',
                      }}>
                        <input
                          type="radio" name="primaryRole"
                          checked={form.role === r.value}
                          onChange={() => setForm(f => ({ ...f, role: r.value, additionalRoles: f.additionalRoles.filter(x => x !== r.value) }))}
                          style={{ accentColor: r.color }}
                        />
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: r.color + '18', border: `1px solid ${r.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`ti ${r.icon}`} style={{ fontSize: 14, color: r.color }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: form.role === r.value ? 700 : 400, color: form.role === r.value ? r.color : 'var(--ink)' }}>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional system roles */}
                <div>
                  <SectionLabel icon="ti-layers-union" title="Additional system roles" />
                  <p style={{ fontSize: 11, color: 'var(--ink3)', margin: '0 0 10px' }}>Combine multiple roles on one user.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {SYSTEM_ROLES.filter(r => r.value !== form.role).map(r => (
                      <label key={r.value} style={{
                        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        padding: '7px 11px', borderRadius: 7,
                        background: form.additionalRoles.includes(r.value) ? r.color + '10' : 'var(--cream)',
                        border: `1px solid ${form.additionalRoles.includes(r.value) ? r.color + '40' : 'var(--border)'}`,
                      }}>
                        <input
                          type="checkbox"
                          checked={form.additionalRoles.includes(r.value)}
                          onChange={() => toggleAdditionalRole(r.value)}
                          style={{ accentColor: r.color }}
                        />
                        <i className={`ti ${r.icon}`} style={{ fontSize: 13, color: r.color }} />
                        <span style={{ fontSize: 12, fontWeight: form.additionalRoles.includes(r.value) ? 600 : 400 }}>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom tenant roles */}
                {customRoles.length > 0 && (
                  <div>
                    <SectionLabel icon="ti-puzzle" title="Custom tenant roles" />
                    <p style={{ fontSize: 11, color: 'var(--ink3)', margin: '0 0 10px' }}>Module-level CRUD permissions.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {customRoles.map(cr => (
                        <label key={cr.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                          padding: '7px 11px', borderRadius: 7,
                          background: form.customRoleIds.includes(cr.id) ? cr.color + '10' : 'var(--cream)',
                          border: `1px solid ${form.customRoleIds.includes(cr.id) ? cr.color + '40' : 'var(--border)'}`,
                        }}>
                          <input type="checkbox" checked={form.customRoleIds.includes(cr.id)} onChange={() => toggleCustomRole(cr.id)} style={{ accentColor: cr.color }} />
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cr.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{cr.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--ink3)' }}>{cr.description}</div>
                          </div>
                          <span style={{ fontSize: 9, color: 'var(--ink3)', background: 'var(--cream3)', padding: '1px 5px', borderRadius: 3 }}>{cr.userCount} users</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* RBAC custom roles */}
                {rbacCustomRoles.length > 0 && (
                  <div>
                    <SectionLabel icon="ti-lock" title="Custom system roles" />
                    <p style={{ fontSize: 11, color: 'var(--ink3)', margin: '0 0 10px' }}>Roles defined in Access Control.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {rbacCustomRoles.map(rr => (
                        <label key={rr.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                          padding: '7px 11px', borderRadius: 7,
                          background: form.customRoleIds.includes(rr.id) ? rr.color + '10' : 'var(--cream)',
                          border: `1px solid ${form.customRoleIds.includes(rr.id) ? rr.color + '40' : 'var(--border)'}`,
                        }}>
                          <input type="checkbox" checked={form.customRoleIds.includes(rr.id)} onChange={() => toggleCustomRole(rr.id)} style={{ accentColor: rr.color }} />
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: rr.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>🔒 {rr.label}</div>
                            <div style={{ fontSize: 10, color: 'var(--ink3)' }}>{rr.description}</div>
                          </div>
                          <span style={{ fontSize: 9, color: 'var(--ink3)', background: 'var(--cream3)', padding: '1px 5px', borderRadius: 3 }}>{rr.userCount} users</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '13px 22px', borderTop: '1px solid var(--border)', background: 'var(--cream)', borderRadius: '0 0 14px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                {form.additionalRoles.length + form.customRoleIds.length > 0
                  ? `${1 + form.additionalRoles.length} system + ${form.customRoleIds.length} custom roles`
                  : 'Primary role only'}
              </div>
              <div style={{ display: 'flex', gap: 9 }}>
                <button onClick={() => setModal(null)} style={{ padding: '8px 20px', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  style={{
                    padding: '8px 22px', border: 'none', borderRadius: 8,
                    background: canSave ? '#c4912a' : 'var(--border)',
                    color: canSave ? '#fff' : 'var(--ink3)',
                    cursor: canSave ? 'pointer' : 'default', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <i className={`ti ${modal === 'create' ? 'ti-user-plus' : 'ti-device-floppy'}`} style={{ fontSize: 13 }} />
                  {modal === 'create' ? 'Create user' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ──────────────────────────────────────────────── */}
      {modal === 'delete' && editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.50)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 13, width: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ background: '#fef2f2', padding: '18px 22px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fee2e2', border: '1px solid #fca5a5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <i className="ti ti-user-minus" style={{ fontSize: 19, color: '#dc2626' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#dc2626' }}>Remove user</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{editing.firstName} {editing.lastName}</div>
              </div>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <p style={{ fontSize: 13, color: 'var(--ink2)', margin: '0 0 20px', lineHeight: 1.6 }}>
                This will permanently remove <strong>{editing.firstName} {editing.lastName}</strong> from <strong>{tenantName}</strong>. They will lose all access immediately.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal(null)} style={{ padding: '8px 20px', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                  Cancel
                </button>
                <button onClick={handleDelete} style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-trash" style={{ fontSize: 13 }} /> Remove user
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
