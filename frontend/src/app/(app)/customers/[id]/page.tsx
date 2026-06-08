'use client';
import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCustomerById, ContactPerson, ComplianceStatus, Customer } from '@/lib/customers';
import { TENANTS_META } from '@/lib/vehiclesMaster';
import { getSubscription, PLANS, getCustomPlans, isServiceEnabled, computeSubStatus, SERVICES, PlanName } from '@/lib/subscriptions';
import { useUsersStore } from '@/store/usersStore';
import { useAuthStore } from '@/store/authStore';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useCustomersStore } from '@/store/customersStore';
import type { UserRole } from '@/lib/types';
import { RegisterVehicleWizard } from '@/components/vehicles/RegisterVehicleWizard';

/* ── Style helpers ─────────────────────────────────────────────────── */
const COMPLIANCE_S: Record<ComplianceStatus, React.CSSProperties> = {
  'Compliant':      { background:'rgba(196,145,42,0.12)',  color:'#c4912a' },
  'Pending Review': { background:'#fffbeb',         color:'#d97706' },
  'Flagged':        { background:'#fef2f2',         color:'#dc2626' },
};
const STATUS_S = {
  Active:   { background:'rgba(196,145,42,0.12)',  color:'#c4912a' },
  Inactive: { background:'#f3f4f6',         color:'#6b7280' },
  Prospect: { background:'#fffbeb',         color:'#d97706' },
};
const VSTATUS_S: Record<string, React.CSSProperties> = {
  active:      { background:'rgba(196,145,42,0.12)', color:'#c4912a' },
  inactive:    { background:'#f3f4f6',        color:'#6b7280' },
  maintenance: { background:'#fffbeb',        color:'#d97706' },
};
const CAT_ICON: Record<string, string> = { Car:'🚗', Truck:'🚛', Motorcycle:'🏍️', Bus:'🚌', Van:'🚐', Trailer:'🚚' };
const COLOR_DOT: Record<string, string> = {
  'white':'#f0f0f0','pearl white':'#f0f0f0','black':'#1f1f1f','silver':'#c0c0c0',
  'grey':'#808080','gray':'#808080','red':'#ef4444','blue':'#3b82f6',
  'dark blue':'#1d4ed8','navy blue':'#1e3a5f','green':'#22c55e','yellow':'#eab308',
  'orange':'#f97316','brown':'#78350f','beige':'#d4b483','maroon':'#7f1d1d',
};

const PORTAL_ROLES: { value: UserRole; label: string; color: string; desc: string }[] = [
  { value: 'vehicle_owner',  label: 'Vehicle Owner',  color: '#16a34a', desc: 'Access only to their assigned vehicles' },
  { value: 'fleet_manager',  label: 'Fleet Manager',  color: '#c4912a', desc: 'Manage vehicles, drivers, routes & analytics' },
  { value: 'dispatcher',     label: 'Dispatcher',     color: '#7c3aed', desc: 'Live ops, real-time tracking & alerts' },
  { value: 'billing_admin',  label: 'Billing Admin',  color: '#d97706', desc: 'Subscription & billing only' },
  { value: 'viewer',         label: 'Viewer',         color: '#6b7280', desc: 'Read-only access to fleet data' },
];

const ROLE_COLOR: Record<string, string> = Object.fromEntries(PORTAL_ROLES.map(r => [r.value, r.color]));

const USER_STATUS_S: Record<string, { bg: string; color: string }> = {
  Active:    { bg: '#dcfce7', color: '#16a34a' },
  Suspended: { bg: '#fee2e2', color: '#dc2626' },
  Pending:   { bg: '#fef3c7', color: '#ca8a04' },
};

/** Suggest a portal role based on the best plan the customer has */
function suggestRole(vehicles: { id: string }[], isIndividual: boolean): UserRole {
  if (isIndividual) return 'vehicle_owner';
  const planOrder: PlanName[] = ['Enterprise', 'Professional', 'Basic', 'Starter'];
  for (const plan of planOrder) {
    if (vehicles.some(v => { const s = getSubscription(v.id); return s?.plan === plan; })) {
      if (plan === 'Enterprise' || plan === 'Professional') return 'fleet_manager';
      if (plan === 'Basic') return 'dispatcher';
      return 'viewer';
    }
  }
  return 'viewer';
}

/** Split "First Last Name" into { firstName, lastName } */
function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/* ── Tab ──────────────────────────────────────────────────────────── */
function Tab({ label, icon, badge, active, onClick }: {
  label: string; icon: string; badge?: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--ink3)'; }}}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '11px 16px',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? '#c4912a' : 'var(--ink3)',
        background: 'transparent',
        border: 'none',
        borderBottom: `3px solid ${active ? '#c4912a' : 'transparent'}`,
        marginBottom: -1,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        transition: 'color 0.15s, background 0.15s',
      }}
    >
      {icon.startsWith('ti-')
        ? <i className={`ti ${icon}`} style={{ fontSize: 15, lineHeight: 1 }} />
        : <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>}
      {label}
      {badge != null && badge > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '2px 6px', borderRadius: 20, lineHeight: 1.5,
          background: active ? '#c4912a' : 'var(--cream3)',
          color: active ? '#fff' : 'var(--ink3)',
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

function Field({ label, value, mono }: { label:string; value:string; mono?:boolean }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 18px', borderBottom:'1px solid var(--border)', fontSize:13, gap:12 }}>
      <span style={{ color:'var(--ink3)', fontSize:12, flexShrink:0 }}>{label}</span>
      <span style={{ color:'var(--ink)', fontWeight:600, fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? 12 : 13, textAlign:'right' }}>{value || '—'}</span>
    </div>
  );
}

function CardHeader({ icon, title, action }: { icon:string; title:string; action?: React.ReactNode }) {
  return (
    <div style={{ padding:'11px 18px', background:'var(--cream)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <i className={`ti ${icon}`} style={{ fontSize:15, color:'#c4912a' }} />
        <span style={{ fontSize:12, fontWeight:700, color:'var(--ink)', letterSpacing:'-0.1px' }}>{title}</span>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── Hierarchy node ─────────────────────────────────────────────────── */
function HierarchyNode({ id, currentId, depth = 0, allCustomers }: { id:string; currentId:string; depth?:number; allCustomers: Customer[] }) {
  const c = getCustomerById(id) ?? allCustomers.find(x => x.id === id) ?? null;
  if (!c) return null;
  const children = allCustomers.filter(x => x.parentId === id);
  const isCurrent = id === currentId;
  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:6, marginBottom:4,
        background: isCurrent ? 'rgba(196,145,42,0.12)' : 'var(--cream)',
        border: isCurrent ? '1.5px solid #c4912a' : '1px solid var(--border)',
      }}>
        {depth > 0 && <span style={{ color:'var(--ink3)', fontSize:14 }}>└</span>}
        <div style={{ width:28, height:28, borderRadius:6, background: isCurrent ? '#c4912a' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', color: isCurrent ? '#fff' : 'var(--ink3)', fontSize:11, fontWeight:700, flexShrink:0 }}>
          {c.name[0]}
        </div>
        <div style={{ flex:1 }}>
          {isCurrent ? (
            <span style={{ fontSize:13, fontWeight:600, color:'#c4912a' }}>{c.name} <span style={{ fontSize:10, background:'#c4912a', color:'#fff', padding:'1px 5px', borderRadius:3, marginLeft:4 }}>You are here</span></span>
          ) : (
            <Link href={`/customers/${c.id}`} style={{ fontSize:13, fontWeight:500, color:'var(--ink)', textDecoration:'none' }}>{c.name}</Link>
          )}
          <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>{c.industry} · {c.city}, {c.country}</div>
        </div>
        <span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:4, ...STATUS_S[c.status] }}>{c.status}</span>
        <span style={{ fontSize:11, color:'var(--ink3)' }}>{c.vehiclesAssigned} vehicles</span>
      </div>
      {children.map(child => (
        <HierarchyNode key={child.id} id={child.id} currentId={currentId} depth={depth + 1} allCustomers={allCustomers} />
      ))}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function CustomerDetailPage() {
  const { id } = useParams<{ id:string }>();
  const { user: authUser } = useAuthStore();
  const { users: allUsers, addUser, loadUsers } = useUsersStore();
  const allVehicles  = useVehiclesStore(s => s.vehicles);
  const allCustomers = useCustomersStore(s => s.customers);
  const customer = getCustomerById(id) ?? allCustomers.find(c => c.id === id) ?? null;

  const [tab, setTab]   = useState<'profile'|'hierarchy'|'contacts'|'compliance'|'vehicles'|'web-users'>('profile');
  const [contacts, setContacts] = useState<ContactPerson[]>(customer?.contacts ?? []);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name:'', title:'', email:'', phone:'' });

  // ── Portal user creation state ───────────────────────────────────
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalContactIdx, setPortalContactIdx] = useState(0);
  const [portalForm, setPortalForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', role: 'vehicle_owner' as UserRole,
    vehicleIds: [] as string[],
    status: 'Active' as 'Active' | 'Pending' | 'Suspended',
    mfaEnabled: false,
  });
  const [showPortalPwd, setShowPortalPwd] = useState(false);
  const [portalToast, setPortalToast] = useState('');
  const [showVehicleWizard, setShowVehicleWizard] = useState(false);

  // Refresh users from DB whenever the Web Users tab becomes active so LastLoginAt is current
  useEffect(() => {
    if (tab === 'web-users') {
      void loadUsers(customer?.tenantId ?? null);
    }
  }, [tab, customer?.tenantId, loadUsers]);

  if (!customer) return (
    <div style={{ padding:'28px 32px' }}>
      <Link href="/customers" style={{ fontSize:13, color:'#c4912a', textDecoration:'none' }}>← Back to customers</Link>
      <div style={{ marginTop:40, textAlign:'center', color:'var(--ink3)', fontSize:14 }}>Customer not found.</div>
    </div>
  );

  const parent   = customer.parentId ? getCustomerById(customer.parentId) ?? allCustomers.find(c => c.id === customer.parentId) ?? null : null;
  const children = allCustomers.filter(c => c.parentId === customer.id);
  const rootId   = parent ? (allCustomers.find(c => c.id === parent.parentId) ? parent.parentId! : parent.id) : customer.id;

  const customerVehicles = allVehicles.filter(
    v => v.customerId === customer.id && v.tenantId === customer.tenantId,
  );
  const customerVehicleIds = new Set(customerVehicles.map(v => v.id));
  const isIndividual = customer.type === 'Individual';

  // Users linked to this customer
  const linkedUsers = allUsers.filter(u =>
    u.tenantId === customer.tenantId && (
      u.customerId === customer.id ||
      (u.vehicleIds ?? []).some(vid => customerVehicleIds.has(vid)) ||
      (u.vehicleId && customerVehicleIds.has(u.vehicleId)) ||
      contacts.some(c => c.email && c.email === u.email)
    )
  );

  // Tenant slug/name for new users — derive from allUsers store instead of TENANT_USERS
  const tenantUserSeed = allUsers.find(u => u.tenantId === customer.tenantId);
  const tenantSlug = tenantUserSeed?.tenantSlug ?? customer.tenantId;
  const tenantName = tenantUserSeed?.tenantName ?? TENANTS_META[customer.tenantId]?.name ?? 'Unknown';

  function saveEdit() { setSaved(true); setEditMode(false); setTimeout(()=>setSaved(false), 2000); }

  function addContact() {
    if (!newContact.name) return;
    setContacts(p => [...p, { id:`cp-${Date.now()}`, ...newContact, primary: p.length === 0 }]);
    setNewContact({ name:'', title:'', email:'', phone:'' });
    setShowAddContact(false);
  }

  // ── Open portal modal pre-filled from customer ───────────────────
  function openPortalModal() {
    const contactIdx = 0;
    const contact = contacts[contactIdx];
    const name = contact ? contact.name : (isIndividual ? customer!.name : '');
    const { firstName, lastName } = splitName(name);
    const email = contact ? contact.email : customer!.email;
    const role = suggestRole(customerVehicles, isIndividual);
    // Pre-select vehicles with web_access if individual
    const preVehicles = isIndividual
      ? customerVehicles.filter(v => isServiceEnabled(v.id, 'web_access')).map(v => v.id)
      : [];
    setPortalContactIdx(contactIdx);
    setPortalForm({ firstName, lastName, email, password: '', role, vehicleIds: preVehicles, status: 'Active', mfaEnabled: false });
    setShowPortalModal(true);
    setShowPortalPwd(false);
  }

  // Sync portal form when contact selection changes
  function selectPortalContact(idx: number) {
    const contact = contacts[idx];
    if (!contact) return;
    const { firstName, lastName } = splitName(contact.name);
    setPortalContactIdx(idx);
    setPortalForm(f => ({ ...f, firstName, lastName, email: contact.email }));
  }

  function handlePortalSave() {
    if (!portalForm.firstName.trim() || !portalForm.email.trim()) return;
    const newUser = {
      id: crypto.randomUUID(),
      tenantId: customer!.tenantId,
      tenantName,
      tenantSlug,
      firstName: portalForm.firstName.trim(),
      lastName: portalForm.lastName.trim(),
      email: portalForm.email.trim(),
      password: portalForm.password || 'Demo1234!',
      role: portalForm.role,
      status: portalForm.status,
      mfaEnabled: portalForm.mfaEnabled,
      lastLogin: 'Never',
      customerId: customer!.id,
      vehicleId: portalForm.vehicleIds[0] ?? undefined,
      vehicleIds: portalForm.vehicleIds.length ? portalForm.vehicleIds : undefined,
    };
    addUser(newUser);
    setShowPortalModal(false);
    setPortalToast(`Portal user ${newUser.firstName} ${newUser.lastName} created`);
    setTimeout(() => setPortalToast(''), 3500);
  }

  const portalCanSave = portalForm.firstName.trim() && portalForm.email.trim();

  const inp: React.CSSProperties = { width:'100%', padding:'7px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, color:'var(--ink)', boxSizing:'border-box', background:'#fff', fontFamily:'inherit' };

  return (
    <div style={{ padding:'28px 32px' }}>

      {portalToast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:9999, background:'#1e293b', color:'#fff', borderRadius:8, padding:'10px 18px', fontSize:13, boxShadow:'0 4px 20px rgba(0,0,0,0.25)' }}>
          ✓ {portalToast}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ marginBottom:10, display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--ink3)' }}>
        <Link href="/customers" style={{ color:'#c4912a', textDecoration:'none' }}>Customers</Link>
        {parent && <><span>›</span><Link href={`/customers/${parent.id}`} style={{ color:'#c4912a', textDecoration:'none' }}>{parent.name}</Link></>}
        <span>›</span>
        <span style={{ color:'var(--ink2)' }}>{customer.name}</span>
      </div>

      {/* ── Standard dark header ─────────────────────────────────────── */}
      <div style={{
        background:'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border:'1px solid rgba(196,145,42,0.18)',
        borderRadius:14,
        padding:'20px 24px',
        marginBottom:14,
        boxShadow:'0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        {/* Left */}
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className={`ti ${isIndividual ? 'ti-user' : 'ti-building-community'}`} style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>
              {customer.industry}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0, letterSpacing:'-0.3px' }}>{customer.name}</h1>
              {customer.cid != null && (
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'rgba(196,145,42,0.15)', color:'#f5d07a', border:'1px solid rgba(196,145,42,0.28)' }}>#{customer.cid}</span>
              )}
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background: isIndividual ? 'rgba(124,58,237,0.2)' : 'rgba(59,130,246,0.2)', color: isIndividual ? '#a78bfa' : '#93c5fd', border:`1px solid ${isIndividual ? 'rgba(124,58,237,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
                {isIndividual ? 'Individual' : 'Company'}
              </span>
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:3 }}>
              {customer.city}, {customer.country}
              {customer.accountManager && ` · ${customer.accountManager}`}
              {parent && ` · ↑ ${parent.name}`}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, flexShrink:0 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:6, ...STATUS_S[customer.status] }}>{customer.status}</span>
            <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:6, ...COMPLIANCE_S[customer.complianceStatus] }}>{customer.complianceStatus}</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {TENANTS_META[customer.tenantId] && (
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, background:'rgba(196,145,42,0.12)', color:'#f5d07a', border:'1px solid rgba(196,145,42,0.22)' }}>
                {TENANTS_META[customer.tenantId].name}
              </span>
            )}
            <button
              onClick={() => editMode ? saveEdit() : setEditMode(true)}
              style={{ padding:'5px 13px', fontSize:11, borderRadius:7, cursor:'pointer', fontWeight:600, fontFamily:'inherit', border:'1px solid rgba(196,145,42,0.35)', background:'rgba(196,145,42,0.15)', color:'#f5d07a' }}
            >
              {editMode ? '✓ Save' : '✎ Edit'}
            </button>
            {saved && <span style={{ fontSize:11, color:'#86efac', fontWeight:700 }}>✓ Saved</span>}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:14 }}>
        {([
          { icon:'ti-car',          label:'Vehicles',         value: customerVehicles.length,      onClick: ()=>setTab('vehicles') },
          { icon:'ti-file-check',   label:'Active contracts', value: customer.activeContracts,     onClick: undefined },
          { icon:'ti-address-book', label:'Contacts',         value: contacts.length,              onClick: ()=>setTab('contacts') },
          { icon:'ti-sitemap',      label:'Subsidiaries',     value: children.length,              onClick: children.length>0 ? ()=>setTab('hierarchy') : undefined },
          { icon:'ti-users',        label:'Portal users',     value: linkedUsers.length,           onClick: ()=>setTab('web-users') },
          { icon:'ti-credit-card',  label:'Credit limit',     value: customer.creditLimit > 0 ? `KES ${customer.creditLimit.toLocaleString()}` : 'N/A', onClick: undefined },
        ] as { icon:string; label:string; value:string|number; onClick:(() => void)|undefined }[]).map(k => (
          <div key={k.label} onClick={k.onClick} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', cursor: k.onClick ? 'pointer' : 'default', transition:'box-shadow 0.12s' }}
            onMouseEnter={e => { if (k.onClick) (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
              <i className={`ti ${k.icon}`} style={{ fontSize:13, color:'#c4912a' }} />
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase', color:'var(--ink3)' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: typeof k.value === 'number' ? 22 : 14, fontWeight:800, color:'var(--ink)', letterSpacing:'-0.5px' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:'#fff', border:'1px solid var(--border)', borderRadius:'10px 10px 0 0', marginBottom:16, padding:'0 8px' }}>
        <Tab label="Profile"    icon="ti-user"          active={tab==='profile'}    onClick={()=>setTab('profile')}    />
        <Tab label="Hierarchy"  icon="ti-sitemap"       badge={children.length}     active={tab==='hierarchy'}         onClick={()=>setTab('hierarchy')}  />
        <Tab label="Contacts"   icon="ti-address-book"  badge={contacts.length}     active={tab==='contacts'}          onClick={()=>setTab('contacts')}   />
        <Tab label="Vehicles"   icon="ti-car"           badge={customerVehicles.length} active={tab==='vehicles'}      onClick={()=>setTab('vehicles')}   />
        <Tab label="Compliance" icon="ti-shield-check"  active={tab==='compliance'} onClick={()=>setTab('compliance')} />
        <Tab label="Web Users"  icon="ti-users"         badge={linkedUsers.length}  active={tab==='web-users'}         onClick={()=>setTab('web-users')}  />
      </div>

      {/* ── Profile ─────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14 }}>
          {/* Left: Details */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <CardHeader
              icon={isIndividual ? 'ti-user' : 'ti-building'}
              title={isIndividual ? 'Personal details' : 'Company details'}
              action={
                <button onClick={()=>editMode?saveEdit():setEditMode(true)} style={{ padding:'4px 12px', fontSize:11, borderRadius:6, cursor:'pointer', fontWeight:600, fontFamily:'inherit', border:'1px solid rgba(196,145,42,0.35)', background: editMode ? '#c4912a' : 'rgba(196,145,42,0.08)', color: editMode ? '#fff' : '#c4912a' }}>
                  {editMode ? '✓ Save' : '✎ Edit'}
                </button>
              }
            />
            <div>
              <Field label="Legal name"       value={customer.name}     />
              <Field label="Type"             value={customer.type}     />
              <Field label="Industry"         value={customer.industry} />
              <Field label="Country"          value={customer.country}  />
              <Field label="City"             value={customer.city}     />
              <Field label="Address"          value={customer.address}  />
              <Field label="Phone"            value={customer.phone}    />
              <Field label="Email"            value={customer.email}    />
              <Field label="Website"          value={customer.website}  />
              <Field label="Member since"     value={customer.createdAt} />
              <Field label="Account manager"  value={customer.accountManager} />
            </div>
          </div>

          {/* Right: Notes + Relationship */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <CardHeader icon="ti-notes" title="Notes" />
              <div style={{ padding:'14px 18px' }}>
                {editMode ? (
                  <textarea defaultValue={customer.notes} style={{ ...inp, height:90, resize:'vertical' }} />
                ) : (
                  <p style={{ fontSize:13, color:'var(--ink2)', lineHeight:1.65, margin:0 }}>{customer.notes || <span style={{ color:'var(--ink3)', fontStyle:'italic' }}>No notes recorded.</span>}</p>
                )}
              </div>
            </div>
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <CardHeader icon="ti-affiliate" title="Relationship" />
              <div>
                <Field label="Customer type"    value={parent ? 'Subsidiary / Branch' : 'Parent company'} />
                <Field label="Parent company"   value={parent?.name ?? 'Standalone'} />
                <Field label="Subsidiaries"     value={children.length > 0 ? children.map(c=>c.name).join(', ') : 'None'} />
                <Field label="Active contracts" value={String(customer.activeContracts)} />
                <Field label="Tenant"           value={`${tenantName} (isolated)`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hierarchy ───────────────────────────────────────────────── */}
      {tab === 'hierarchy' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Description */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <CardHeader icon="ti-sitemap" title="Parent-child hierarchy" />
            <div style={{ padding:'14px 18px', fontSize:13, color:'var(--ink3)', lineHeight:1.7 }}>
              {parent
                ? <><strong style={{ color:'var(--ink)' }}>{customer.name}</strong> is a subsidiary of <strong style={{ color:'var(--ink)' }}>{parent.name}</strong>. The full group tree is shown below.</>
                : children.length > 0
                  ? <><strong style={{ color:'var(--ink)' }}>{customer.name}</strong> is a parent company with <strong style={{ color:'var(--ink)' }}>{children.length}</strong> {children.length===1?'subsidiary':'subsidiaries'}.</>
                  : <><strong style={{ color:'var(--ink)' }}>{customer.name}</strong> is a standalone company with no subsidiaries.</>}
            </div>
            <div style={{ padding:'0 18px 18px' }}>
              <HierarchyNode id={rootId} currentId={customer.id} allCustomers={allCustomers} />
            </div>
          </div>

          {/* Group summary */}
          {(parent || children.length > 0) && (() => {
            const parentChildren = parent ? allCustomers.filter(c => c.parentId === parent.id) : [];
            const groupIds   = parent ? [parent.id, ...parentChildren.map(c=>c.id)] : [customer.id, ...children.map(c=>c.id)];
            const groupCusts = allCustomers.filter(c=>groupIds.includes(c.id));
            const totalVeh   = groupCusts.reduce((a,c)=>a+c.vehiclesAssigned,0);
            return (
              <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
                <CardHeader icon="ti-chart-bar" title="Group summary" />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
                  {[
                    { icon:'ti-buildings',    label:'Total entities', value: groupCusts.length },
                    { icon:'ti-circle-check', label:'Active',         value: groupCusts.filter(c=>c.status==='Active').length },
                    { icon:'ti-car',          label:'Total vehicles', value: totalVeh },
                    { icon:'ti-world',        label:'Countries',      value: [...new Set(groupCusts.map(c=>c.country))].length },
                  ].map((k, i) => (
                    <div key={k.label} style={{ padding:'16px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', textAlign:'center' }}>
                      <i className={`ti ${k.icon}`} style={{ fontSize:18, color:'#c4912a', display:'block', marginBottom:6 }} />
                      <div style={{ fontSize:24, fontWeight:800, color:'var(--ink)', letterSpacing:'-0.5px', lineHeight:1 }}>{k.value}</div>
                      <div style={{ fontSize:11, color:'var(--ink3)', marginTop:4 }}>{k.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Actions */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <CardHeader icon="ti-adjustments-alt" title="Manage hierarchy" />
            <div style={{ padding:'14px 18px', display:'flex', gap:10, flexWrap:'wrap' }}>
              <button style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:12, fontWeight:600, border:'1px solid rgba(196,145,42,0.35)', color:'#c4912a', background:'rgba(196,145,42,0.07)', borderRadius:7, cursor:'pointer', fontFamily:'inherit' }}>
                <i className="ti ti-plus" style={{ fontSize:13 }} /> Add subsidiary
              </button>
              {parent && <button style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:12, fontWeight:500, border:'1px solid var(--border)', color:'var(--ink2)', background:'#fff', borderRadius:7, cursor:'pointer', fontFamily:'inherit' }}>
                <i className="ti ti-arrows-transfer-up" style={{ fontSize:13 }} /> Move to different parent
              </button>}
              {!parent && <button style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:12, fontWeight:500, border:'1px solid var(--border)', color:'var(--ink2)', background:'#fff', borderRadius:7, cursor:'pointer', fontFamily:'inherit' }}>
                <i className="ti ti-arrow-up-circle" style={{ fontSize:13 }} /> Set as subsidiary of…
              </button>}
            </div>
          </div>
        </div>
      )}

      {/* ── Contacts ────────────────────────────────────────────────── */}
      {tab === 'contacts' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <CardHeader
              icon="ti-address-book"
              title={`Contact persons · ${contacts.length}`}
              action={
                <button onClick={()=>setShowAddContact(true)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', fontSize:11, fontWeight:600, fontFamily:'inherit', border:'1px solid rgba(196,145,42,0.35)', background:'rgba(196,145,42,0.08)', color:'#c4912a', borderRadius:6, cursor:'pointer' }}>
                  <i className="ti ti-plus" style={{ fontSize:12 }} /> Add contact
                </button>
              }
            />
            {contacts.length === 0 ? (
              <div style={{ padding:'48px 24px', textAlign:'center' }}>
                <i className="ti ti-user-off" style={{ fontSize:32, color:'var(--ink3)', display:'block', marginBottom:10 }} />
                <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:4 }}>No contacts yet</div>
                <div style={{ fontSize:12, color:'var(--ink3)' }}>Add a contact person for {customer.name}.</div>
              </div>
            ) : (
              <div>
                {contacts.map((c, idx) => (
                  <div key={c.id} style={{ padding:'14px 18px', borderBottom: idx < contacts.length-1 ? '1px solid var(--border)' : 'none', display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:42, height:42, borderRadius:10, background: c.primary ? '#c4912a' : 'var(--cream2)', display:'flex', alignItems:'center', justifyContent:'center', color: c.primary ? '#fff' : 'var(--ink3)', fontSize:14, fontWeight:800, flexShrink:0, border: c.primary ? 'none' : '1px solid var(--border)' }}>
                      {c.name.split(' ').map((n: string)=>n[0]).slice(0,2).join('')}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{c.name}</span>
                        {c.primary && <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:20, background:'rgba(196,145,42,0.12)', color:'#c4912a', border:'1px solid rgba(196,145,42,0.22)' }}>Primary</span>}
                      </div>
                      <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>{c.title || <span style={{ fontStyle:'italic' }}>No title</span>}</div>
                      <div style={{ display:'flex', gap:14, marginTop:6, flexWrap:'wrap' }}>
                        {c.email && <span style={{ fontSize:11, color:'var(--ink2)', display:'flex', alignItems:'center', gap:4 }}><i className="ti ti-mail" style={{ fontSize:12, color:'var(--ink3)' }} />{c.email}</span>}
                        {c.phone && <span style={{ fontSize:11, color:'var(--ink2)', display:'flex', alignItems:'center', gap:4 }}><i className="ti ti-phone" style={{ fontSize:12, color:'var(--ink3)' }} />{c.phone}</span>}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    {!c.primary && (
                      <button onClick={()=>setContacts(prev=>prev.map(x=>({...x, primary: x.id===c.id})))}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11, fontWeight:600, border:'1px solid rgba(196,145,42,0.35)', color:'#c4912a', background:'rgba(196,145,42,0.07)', borderRadius:5, cursor:'pointer', fontFamily:'inherit' }}>
                        <i className="ti ti-star" style={{ fontSize:11 }} /> Primary
                      </button>
                    )}
                    <button onClick={()=>{ openPortalModal(); selectPortalContact(contacts.findIndex(x=>x.id===c.id)); }}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11, fontWeight:500, border:'1px solid var(--border)', color:'var(--ink2)', background:'#fff', borderRadius:5, cursor:'pointer', fontFamily:'inherit' }}>
                      <i className="ti ti-user-plus" style={{ fontSize:11 }} /> Portal user
                    </button>
                    <button onClick={()=>setContacts(prev=>prev.filter(x=>x.id!==c.id))}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11, fontWeight:500, border:'1px solid #fca5a5', color:'#dc2626', background:'#fff', borderRadius:5, cursor:'pointer', fontFamily:'inherit' }}>
                      <i className="ti ti-trash" style={{ fontSize:11 }} />
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
          {showAddContact && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
              <div style={{ background:'#fff', borderRadius:12, width:420, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', background:'var(--cream)', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <i className="ti ti-user-plus" style={{ fontSize:16, color:'#c4912a' }} />
                    <span style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>Add contact</span>
                  </div>
                  <button onClick={()=>setShowAddContact(false)} style={{ fontSize:18, border:'none', background:'transparent', cursor:'pointer', color:'var(--ink3)', lineHeight:1 }}>×</button>
                </div>
                <div style={{ padding:'20px' }}>
                  {[
                    { label:'Full name', key:'name', placeholder:'Jane Smith', required:true },
                    { label:'Job title', key:'title', placeholder:'Operations Manager', required:false },
                    { label:'Email',     key:'email', placeholder:'jane@company.com', required:false },
                    { label:'Phone',     key:'phone', placeholder:'+1 212 555 0100', required:false },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom:12 }}>
                      <label style={{ fontSize:11, fontWeight:600, color:'var(--ink2)', display:'block', marginBottom:4, letterSpacing:'0.2px' }}>
                        {f.label}{f.required && <span style={{ color:'#dc2626', marginLeft:2 }}>*</span>}
                      </label>
                      <input style={inp} placeholder={f.placeholder}
                        value={newContact[f.key as keyof typeof newContact]}
                        onChange={e=>setNewContact(p=>({...p, [f.key]:e.target.value}))} />
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:9, justifyContent:'flex-end', marginTop:16 }}>
                    <button onClick={()=>setShowAddContact(false)} style={{ padding:'7px 16px', fontSize:12, borderRadius:6, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)', fontFamily:'inherit' }}>Cancel</button>
                    <button onClick={addContact} disabled={!newContact.name} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 18px', fontSize:12, fontWeight:600, borderRadius:6, cursor:newContact.name?'pointer':'default', border:'none', background:'#c4912a', color:'#fff', fontFamily:'inherit', opacity:newContact.name?1:0.5 }}>
                      <i className="ti ti-plus" style={{ fontSize:13 }} /> Add contact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Vehicles ────────────────────────────────────────────────── */}
      {tab === 'vehicles' && (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <CardHeader
            icon="ti-car"
            title={`Registered vehicles · ${customerVehicles.length}`}
            action={
              <button onClick={() => setShowVehicleWizard(true)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', fontSize:11, fontWeight:600, fontFamily:'inherit', border:'1px solid rgba(196,145,42,0.35)', background:'rgba(196,145,42,0.08)', color:'#c4912a', borderRadius:6, cursor:'pointer' }}>
                <i className="ti ti-plus" style={{ fontSize:12 }} /> Register vehicle
              </button>
            }
          />
          {customerVehicles.length === 0 ? (
            <div style={{ padding:'52px 24px', textAlign:'center' }}>
              <i className="ti ti-car-off" style={{ fontSize:36, color:'var(--ink3)', display:'block', marginBottom:10 }} />
              <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:6 }}>No vehicles registered</div>
              <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:18 }}>Register a vehicle for {customer.name} to start tracking their fleet.</div>
              <button onClick={() => setShowVehicleWizard(true)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 20px', fontSize:13, fontWeight:600, background:'#c4912a', color:'#fff', borderRadius:7, border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                <i className="ti ti-plus" style={{ fontSize:15 }} /> Register vehicle
              </button>
            </div>
          ) : (
            <>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--cream)' }}>
                    {[
                      { label:'Vehicle', icon:'ti-license' },
                      { label:'Category', icon:'ti-tag' },
                      { label:'Color', icon:'ti-palette' },
                      { label:'Status', icon:'ti-circle-dot' },
                      { label:'Subscription', icon:'ti-package' },
                      { label:'Web', icon:'ti-world' },
                      { label:'Odometer', icon:'ti-dashboard' },
                      { label:'', icon:'' },
                    ].map(h => (
                      <th key={h.label} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'0.6px', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>
                        {h.icon && <><i className={`ti ${h.icon}`} style={{ fontSize:11, marginRight:4, verticalAlign:'middle' }} /></>}{h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customerVehicles.map((v, idx) => {
                    const sub = getSubscription(v.id);
                    const customPlan = sub?.customPlanId ? getCustomPlans(v.tenantId).find(p => p.id === sub.customPlanId) : null;
                    const planLabel  = customPlan ? customPlan.name : sub?.plan ?? '—';
                    const planColor  = customPlan ? customPlan.color : sub ? PLANS[sub.plan].color : 'var(--ink3)';
                    const webOk = isServiceEnabled(v.id, 'web_access');
                    return (
                      <tr key={v.id} style={{ background: idx % 2 === 0 ? '#fff' : 'var(--cream)' }}>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:7, background:'rgba(196,145,42,0.10)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <i className={`ti ${CAT_ICON[v.category] ? 'ti-'+v.category.toLowerCase() : 'ti-car'}`} style={{ fontSize:15, color:'#c4912a' }} />
                            </div>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:'var(--ink)', fontFamily:'monospace', letterSpacing:0.8 }}>{v.plate}</div>
                              <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>{v.year} {v.make} {v.model}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                          <span style={{ fontSize:11, color:'var(--ink3)', display:'flex', alignItems:'center', gap:4 }}>
                            <i className="ti ti-tag" style={{ fontSize:11 }} />{v.category}
                          </span>
                        </td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:11, height:11, borderRadius:'50%', background: COLOR_DOT[v.color.toLowerCase()] ?? '#d1d5db', border:'1px solid rgba(0,0,0,0.12)', flexShrink:0 }} />
                            <span style={{ fontSize:11, color:'var(--ink3)' }}>{v.color}</span>
                          </div>
                        </td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                          <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, ...(VSTATUS_S[v.status] ?? {}) }}>
                            {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, background: planColor + '22', color: planColor }}>{planLabel}</span>
                        </td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                          {webOk
                            ? <span style={{ fontSize:11, color:'#16a34a', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><i className="ti ti-circle-check" style={{ fontSize:13 }} /> Yes</span>
                            : <span style={{ fontSize:11, color:'#9ca3af', fontWeight:500, display:'flex', alignItems:'center', gap:3 }}><i className="ti ti-circle-x" style={{ fontSize:13 }} /> No</span>}
                        </td>
                        <td style={{ padding:'11px 14px', fontSize:11, color:'var(--ink2)', borderBottom:'1px solid var(--border)', fontVariantNumeric:'tabular-nums' }}>
                          {v.odometer != null ? `${v.odometer.toLocaleString()} km` : '—'}
                        </td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                          <Link href={`/vehicles/${v.id}?from=${customer.id}`} style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11, color:'#c4912a', textDecoration:'none', fontWeight:600, padding:'3px 9px', border:'1px solid rgba(196,145,42,0.3)', borderRadius:5, background:'rgba(196,145,42,0.05)' }}>
                            View <i className="ti ti-arrow-right" style={{ fontSize:11 }} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding:'9px 14px', background:'var(--cream)', borderTop:'1px solid var(--border)', fontSize:11, color:'var(--ink3)' }}>
                {customerVehicles.length} vehicle{customerVehicles.length !== 1 ? 's' : ''} · click View to open full details
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Compliance ──────────────────────────────────────────────── */}
      {tab === 'compliance' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Status banner */}
          {(() => {
            const isCompliant = customer.complianceStatus === 'Compliant';
            const isFlagged   = customer.complianceStatus === 'Flagged';
            const bg    = isCompliant ? 'rgba(196,145,42,0.07)'  : isFlagged ? '#fef2f2'  : '#fffbeb';
            const bdr   = isCompliant ? 'rgba(196,145,42,0.30)'  : isFlagged ? '#fca5a5'  : '#fcd34d';
            const ic    = isCompliant ? 'ti-shield-check'         : isFlagged ? 'ti-shield-x' : 'ti-shield-half';
            const icClr = isCompliant ? '#c4912a'                 : isFlagged ? '#dc2626'  : '#ca8a04';
            return (
              <div style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:10, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:10, background: isCompliant ? 'rgba(196,145,42,0.12)' : isFlagged ? '#fef2f2' : '#fffbeb', border:`1px solid ${bdr}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={`ti ${ic}`} style={{ fontSize:22, color:icClr }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>{customer.complianceStatus}</div>
                  <div style={{ fontSize:12, color:'var(--ink3)', marginTop:2 }}>{customer.complianceNotes || 'No compliance notes on record.'}</div>
                </div>
                <button style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', fontSize:12, fontWeight:600, border:'1px solid var(--border)', borderRadius:7, background:'#fff', cursor:'pointer', color:'var(--ink2)', fontFamily:'inherit' }}>
                  <i className="ti ti-edit" style={{ fontSize:13 }} /> Update status
                </button>
              </div>
            );
          })()}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {/* Tax & financial */}
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <CardHeader icon="ti-receipt-tax" title="Tax & financial" />
              <div>
                <Field label="Tax ID / KRA PIN"  value={customer.taxId}    mono />
                <Field label="Credit limit"      value={customer.creditLimit > 0 ? `KES ${customer.creditLimit.toLocaleString()}` : 'Not set'} />
                <Field label="Active contracts"  value={String(customer.activeContracts)} />
                <Field label="Account manager"   value={customer.accountManager} />
              </div>
            </div>

            {/* Checklist */}
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <CardHeader icon="ti-checklist" title="Compliance checklist" />
              {(() => {
                const items = [
                  { item:'Tax ID on file',              done: !!customer.taxId },
                  { item:'Primary contact recorded',    done: contacts.length > 0 },
                  { item:'Address verified',            done: !!customer.address },
                  { item:'Credit limit set',            done: customer.creditLimit > 0 },
                  { item:'Compliance notes',            done: !!customer.complianceNotes },
                  { item:'Account manager assigned',    done: !!customer.accountManager },
                  { item:'Regulatory certification',    done: customer.complianceStatus === 'Compliant' },
                  { item:'Annual review completed',     done: customer.complianceStatus === 'Compliant' },
                ];
                const pct = Math.round(items.filter(i=>i.done).length / items.length * 100);
                return (
                  <>
                    <div style={{ padding:'10px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ flex:1, height:5, background:'var(--cream3)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background: pct===100?'#c4912a':'#d97706', borderRadius:3, transition:'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color: pct===100?'#c4912a':'var(--ink3)', flexShrink:0 }}>{pct}%</span>
                    </div>
                    {items.map(r => (
                      <div key={r.item} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 18px', borderBottom:'1px solid var(--border)' }}>
                        <i className={`ti ${r.done ? 'ti-circle-check' : 'ti-circle-x'}`} style={{ fontSize:16, color: r.done ? '#c4912a' : '#d1d5db', flexShrink:0 }} />
                        <span style={{ fontSize:12, color: r.done ? 'var(--ink)' : 'var(--ink3)', flex:1 }}>{r.item}</span>
                        {!r.done && <span style={{ fontSize:10, fontWeight:600, color:'#dc2626', background:'#fef2f2', padding:'1px 6px', borderRadius:3 }}>Required</span>}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Isolation notice */}
          <div style={{ padding:'13px 18px', background:'rgba(196,145,42,0.07)', border:'1px solid rgba(196,145,42,0.25)', borderRadius:8, fontSize:12, color:'#92600a', display:'flex', gap:10, alignItems:'flex-start' }}>
            <i className="ti ti-lock" style={{ fontSize:16, color:'#c4912a', flexShrink:0, marginTop:1 }} />
            <div><strong>Data isolation guaranteed.</strong> All compliance documents, tax records, and financial data for {customer.name} are stored within your tenant&apos;s isolated database schema.</div>
          </div>
        </div>
      )}

      {/* ── Web Users ───────────────────────────────────────────────── */}
      {tab === 'web-users' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Plan access summary */}
          {customerVehicles.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <CardHeader icon="ti-package" title="Plan-based web access" />
              <div>
                {customerVehicles.map((v, idx) => {
                  const sub = getSubscription(v.id);
                  const customPlan = sub?.customPlanId ? getCustomPlans(v.tenantId).find(p => p.id === sub.customPlanId) : null;
                  const planName   = customPlan ? customPlan.name : sub?.plan;
                  const planColor  = customPlan ? customPlan.color : sub ? PLANS[sub.plan]?.color : '#6b7280';
                  const services   = customPlan ? customPlan.services : sub ? (PLANS[sub.plan]?.services ?? []) : [];
                  const webOk = isServiceEnabled(v.id, 'web_access');
                  const subStatus = sub ? computeSubStatus(sub) : null;
                  return (
                    <div key={v.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', borderBottom: idx < customerVehicles.length-1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width:30, height:30, borderRadius:7, background:'rgba(196,145,42,0.10)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <i className="ti ti-car" style={{ fontSize:14, color:'#c4912a' }} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:12, fontWeight:700, fontFamily:'monospace', color:'var(--ink)' }}>{v.plate}</span>
                        <span style={{ fontSize:11, color:'var(--ink3)', marginLeft:8 }}>{v.make} {v.model}</span>
                      </div>
                      {planName && (
                        <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:4, background: (planColor ?? '#6b7280') + '22', color: planColor ?? '#6b7280', border:`1px solid ${(planColor ?? '#6b7280')}40` }}>
                          {planName}
                        </span>
                      )}
                      {subStatus && subStatus !== 'Active' && (
                        <span style={{ fontSize:10, fontWeight:600, color: subStatus === 'Expired' ? '#dc2626' : '#ca8a04', display:'flex', alignItems:'center', gap:3 }}>
                          <i className="ti ti-alert-triangle" style={{ fontSize:11 }} />{subStatus}
                        </span>
                      )}
                      {webOk
                        ? <span style={{ fontSize:11, color:'#16a34a', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><i className="ti ti-world" style={{ fontSize:13 }} /> Web ✓</span>
                        : <span style={{ fontSize:11, color:'#9ca3af', fontWeight:500, display:'flex', alignItems:'center', gap:3 }}><i className="ti ti-world-off" style={{ fontSize:13 }} /> No web</span>}
                      <div style={{ display:'flex', gap:3 }}>
                        {services.slice(0,4).map((sk: string) => {
                          const svc = SERVICES.find(s => s.key === sk);
                          return svc ? (
                            <span key={sk} title={svc.label} style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:'#e0f2fe', color:'#0369a1' }}>{svc.icon}</span>
                          ) : null;
                        })}
                        {services.length > 4 && <span style={{ fontSize:9, color:'var(--ink3)' }}>+{services.length-4}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding:'10px 18px', background: isIndividual ? 'rgba(124,58,237,0.06)' : 'rgba(59,130,246,0.06)', borderTop:'1px solid var(--border)', fontSize:12, color: isIndividual ? '#5b21b6' : '#1e40af', display:'flex', gap:8, alignItems:'flex-start' }}>
                <i className={`ti ${isIndividual ? 'ti-user' : 'ti-building'}`} style={{ fontSize:14, flexShrink:0, marginTop:1 }} />
                {isIndividual
                  ? <span><strong>Individual account:</strong> Portal access requires at least one vehicle with <em>Web Portal Access</em> in its subscription plan.</span>
                  : <span><strong>Company account:</strong> Managers and contacts can be granted portal rights based on their package plan and assigned services.</span>}
              </div>
            </div>
          )}

          {/* Users list */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <CardHeader
              icon="ti-users"
              title={`Portal users · ${linkedUsers.length}`}
              action={
                <div style={{ display:'flex', gap:7 }}>
                  <button onClick={() => void loadUsers(customer?.tenantId ?? null)} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11, fontWeight:500, fontFamily:'inherit', background:'#fff', color:'var(--ink2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer' }}>
                    <i className="ti ti-refresh" style={{ fontSize:12 }} /> Refresh
                  </button>
                  <button onClick={openPortalModal} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 12px', fontSize:11, fontWeight:600, fontFamily:'inherit', background:'rgba(196,145,42,0.08)', color:'#c4912a', border:'1px solid rgba(196,145,42,0.35)', borderRadius:6, cursor:'pointer' }}>
                    <i className="ti ti-user-plus" style={{ fontSize:12 }} /> Create user
                  </button>
                </div>
              }
            />
            {linkedUsers.length === 0 ? (
              <div style={{ padding:'48px 24px', textAlign:'center' }}>
                <i className="ti ti-users-group" style={{ fontSize:36, color:'var(--ink3)', display:'block', marginBottom:10 }} />
                <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:4 }}>No portal users yet</div>
                <div style={{ fontSize:12, color:'var(--ink3)', maxWidth:340, margin:'0 auto 18px' }}>
                  {isIndividual ? 'Create a web portal account for this individual to let them track their vehicle online.' : 'Grant managers or contacts access to the web portal based on their package plan.'}
                </div>
                <button onClick={openPortalModal} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 20px', fontSize:12, fontWeight:600, background:'#c4912a', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontFamily:'inherit' }}>
                  <i className="ti ti-user-plus" style={{ fontSize:14 }} /> Create first portal user
                </button>
              </div>
            ) : (
              <div>
                {linkedUsers.map((u, idx) => {
                  const roleColor = ROLE_COLOR[u.role] ?? '#6b7280';
                  const ss = USER_STATUS_S[u.status] ?? USER_STATUS_S.Active;
                  const uVehicles = (u.vehicleIds ?? (u.vehicleId ? [u.vehicleId] : []));
                  const roleMeta = PORTAL_ROLES.find(r => r.value === u.role);
                  return (
                    <div key={u.id} style={{ padding:'13px 18px', borderBottom: idx < linkedUsers.length-1 ? '1px solid var(--border)' : 'none', display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:40, height:40, borderRadius:10, background: roleColor + '22', border:`1px solid ${roleColor}40`, display:'flex', alignItems:'center', justifyContent:'center', color: roleColor, fontSize:14, fontWeight:800, flexShrink:0 }}>
                        {(u.firstName[0] + (u.lastName?.[0] ?? '')).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{u.firstName} {u.lastName}</span>
                          <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background: roleColor + '18', color: roleColor, border:`1px solid ${roleColor}40` }}>
                            {roleMeta?.label ?? u.role}
                          </span>
                          <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:20, background: ss.bg, color: ss.color }}>{u.status}</span>
                          {u.mfaEnabled && <span style={{ fontSize:10, fontWeight:600, color:'#7c3aed', display:'flex', alignItems:'center', gap:3 }}><i className="ti ti-shield-check" style={{ fontSize:11 }} /> MFA</span>}
                        </div>
                        <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                          <i className="ti ti-mail" style={{ fontSize:11 }} />{u.email}
                        </div>
                        {uVehicles.length > 0 && (
                          <div style={{ display:'flex', gap:4, marginTop:5, flexWrap:'wrap' }}>
                            {uVehicles.map((vid: string) => {
                              const veh = allVehicles.find(v => v.id === vid);
                              return veh ? (
                                <span key={vid} style={{ fontSize:10, padding:'1px 7px', borderRadius:4, background:'rgba(196,145,42,0.10)', color:'#c4912a', fontFamily:'monospace', border:'1px solid rgba(196,145,42,0.22)', fontWeight:700 }}>
                                  {veh.plate}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:10, color:'var(--ink3)' }}>{u.lastLogin === 'Never' ? 'Never logged in' : `Last login`}</div>
                        {u.lastLogin !== 'Never' && <div style={{ fontSize:11, fontWeight:600, color:'var(--ink2)', marginTop:1 }}>{u.lastLogin}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Register Vehicle Modal ──────────────────────────────────── */}
      {showVehicleWizard && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}
          onClick={e => { if (e.target === e.currentTarget) setShowVehicleWizard(false); }}>
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', overflow:'hidden', width:'100%', maxWidth:680 }}>
            <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>Register new vehicle</div>
              <button onClick={() => setShowVehicleWizard(false)} style={{ border:'none', background:'none', fontSize:20, cursor:'pointer', color:'var(--ink3)', lineHeight:1 }}>×</button>
            </div>
            <div style={{ maxHeight:'80vh', overflowY:'auto' }}>
              <RegisterVehicleWizard
                customer={customer}
                tenantId={customer.tenantId}
                onClose={() => setShowVehicleWizard(false)}
                onSaved={() => { setShowVehicleWizard(false); setTab('vehicles'); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Portal User Creation Modal ───────────────────────────────── */}
      {showPortalModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.48)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowPortalModal(false); }}>
          <div style={{ background:'#fff', borderRadius:14, width:'90vw', maxWidth:860, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.22)' }}>

            {/* Modal header */}
            <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700 }}>Create portal user</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
                  <span style={{ fontSize:12, color:'var(--ink3)' }}>{customer.name}</span>
                  <span style={{ fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:3, background: isIndividual ? '#ede9fe' : '#dbeafe', color: isIndividual ? '#7c3aed' : '#1d4ed8' }}>
                    {isIndividual ? '👤 Individual' : '🏢 Company'}
                  </span>
                  <span style={{ fontSize:10, color:'var(--ink3)' }}>·</span>
                  <span style={{ fontSize:12, color:'var(--ink3)' }}>{tenantName}</span>
                </div>
              </div>
              <button onClick={() => setShowPortalModal(false)} style={{ border:'none', background:'none', fontSize:20, cursor:'pointer', color:'var(--ink3)', lineHeight:1 }}>×</button>
            </div>

            {/* Modal body */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', flex:1, overflow:'hidden' }}>

              {/* Left — identity & account */}
              <div style={{ padding:'20px', borderRight:'1px solid var(--border)', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>

                {/* Contact selector — company only */}
                {!isIndividual && contacts.length > 0 && (
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--ink3)', display:'block', marginBottom:8 }}>
                      Contact person
                    </label>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {contacts.map((c, idx) => (
                        <label key={c.id} style={{
                          display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:7, cursor:'pointer',
                          background: portalContactIdx === idx ? 'rgba(196,145,42,0.12)' : 'var(--cream)',
                          border: `1px solid ${portalContactIdx === idx ? '#c4912a' : 'transparent'}`,
                        }}>
                          <input type="radio" name="portalContact" checked={portalContactIdx === idx}
                            onChange={() => selectPortalContact(idx)} style={{ accentColor:'#c4912a' }} />
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600 }}>{c.name}
                              {c.primary && <span style={{ marginLeft:6, fontSize:9, padding:'1px 4px', borderRadius:3, background:'#c4912a', color:'#fff' }}>Primary</span>}
                            </div>
                            <div style={{ fontSize:11, color:'var(--ink3)' }}>{c.title} · {c.email || 'No email'}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div style={{ fontSize:10, color:'var(--ink3)', marginTop:6 }}>
                      Selected contact&apos;s details will be pre-filled below. You can edit before saving.
                    </div>
                  </div>
                )}

                {/* Identity info label */}
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--ink3)' }}>
                  {isIndividual ? 'Individual details' : 'Account details'}
                </div>

                {/* Name */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', display:'block', marginBottom:4 }}>First name *</label>
                    <input value={portalForm.firstName} autoFocus
                      onChange={e => setPortalForm(f => ({ ...f, firstName: e.target.value }))}
                      style={{ width:'100%', boxSizing:'border-box', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', display:'block', marginBottom:4 }}>Last name</label>
                    <input value={portalForm.lastName}
                      onChange={e => setPortalForm(f => ({ ...f, lastName: e.target.value }))}
                      style={{ width:'100%', boxSizing:'border-box', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13 }} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', display:'block', marginBottom:4 }}>Email address *</label>
                  <input type="email" value={portalForm.email}
                    onChange={e => setPortalForm(f => ({ ...f, email: e.target.value }))}
                    style={{ width:'100%', boxSizing:'border-box', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13 }} />
                </div>

                {/* Password */}
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', display:'block', marginBottom:4 }}>Temporary password</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPortalPwd ? 'text' : 'password'} value={portalForm.password}
                      onChange={e => setPortalForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Leave blank for Demo1234!"
                      style={{ width:'100%', boxSizing:'border-box', padding:'8px 36px 8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13 }} />
                    <button onClick={() => setShowPortalPwd(p => !p)} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', border:'none', background:'none', cursor:'pointer', color:'var(--ink3)', fontSize:13 }}>
                      <i className={`ti ${showPortalPwd ? 'ti-eye-off' : 'ti-eye'}`} />
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', display:'block', marginBottom:4 }}>Status</label>
                    <select value={portalForm.status}
                      onChange={e => setPortalForm(f => ({ ...f, status: e.target.value as typeof portalForm.status }))}
                      style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, background:'#fff' }}>
                      <option>Active</option><option>Pending</option><option>Suspended</option>
                    </select>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px 10px', background:'var(--cream)', borderRadius:6 }}>
                      <input type="checkbox" checked={portalForm.mfaEnabled}
                        onChange={() => setPortalForm(f => ({ ...f, mfaEnabled: !f.mfaEnabled }))}
                        style={{ accentColor:'#c4912a' }} />
                      <span style={{ fontSize:12, fontWeight:500 }}>Require MFA</span>
                    </label>
                  </div>
                </div>

                {/* Vehicle picker for this customer's vehicles */}
                {(portalForm.role === 'vehicle_owner' || isIndividual) && customerVehicles.length > 0 && (
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--ink3)', display:'block', marginBottom:8 }}>
                      Vehicle access
                    </label>
                    <div style={{ display:'flex', flexDirection:'column', gap:4, border:'1px solid var(--border)', borderRadius:8, padding:6, maxHeight:200, overflowY:'auto' }}>
                      {customerVehicles.map(v => {
                        const sub = getSubscription(v.id);
                        const planName = sub?.plan ?? null;
                        const hasWeb = isServiceEnabled(v.id, 'web_access');
                        const subStatus = sub ? computeSubStatus(sub) : null;
                        const blocked = isIndividual && !hasWeb;
                        const selected = portalForm.vehicleIds.includes(v.id);
                        const planColor = planName ? (PLANS[planName]?.color ?? '#6b7280') : '#6b7280';
                        return (
                          <label key={v.id} style={{
                            display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', borderRadius:6,
                            cursor: blocked ? 'not-allowed' : 'pointer',
                            background: selected ? '#f0fdf4' : blocked ? '#fef2f2' : 'var(--cream)',
                            border: `1px solid ${selected ? '#86efac' : blocked ? '#fecaca' : 'transparent'}`,
                            opacity: blocked ? 0.6 : 1,
                          }}>
                            <input type="checkbox" checked={selected} disabled={blocked}
                              onChange={() => !blocked && setPortalForm(f => ({
                                ...f,
                                vehicleIds: f.vehicleIds.includes(v.id)
                                  ? f.vehicleIds.filter(x => x !== v.id)
                                  : [...f.vehicleIds, v.id],
                              }))}
                              style={{ accentColor:'#16a34a', marginTop:2 }} />
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                <span style={{ fontSize:12, fontWeight:700, fontFamily:'monospace' }}>{v.plate}</span>
                                <span style={{ fontSize:10, color:'var(--ink3)' }}>{v.make} {v.model}</span>
                                {planName && <span style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius:3, background: planColor + '20', color: planColor, border:`1px solid ${planColor}40` }}>{planName}</span>}
                                {subStatus && subStatus !== 'Active' && <span style={{ fontSize:9, color: subStatus === 'Expired' ? '#dc2626' : '#ca8a04', fontWeight:600 }}>⚠ {subStatus}</span>}
                                {hasWeb
                                  ? <span style={{ fontSize:9, color:'#16a34a', fontWeight:600 }}><i className="ti ti-world" /> Web ✓</span>
                                  : <span style={{ fontSize:9, color:'#dc2626', fontWeight:600 }}><i className="ti ti-world-off" /> No web</span>}
                              </div>
                              {blocked && <div style={{ fontSize:10, color:'#dc2626', marginTop:2 }}>{subStatus === 'Expired' ? 'Subscription expired' : `${planName ?? 'Plan'} does not include web access`}</div>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <div style={{ fontSize:10, color:'var(--ink3)', marginTop:4 }}>
                      {portalForm.vehicleIds.length === 0 ? 'No vehicle selected' : `${portalForm.vehicleIds.length} vehicle${portalForm.vehicleIds.length > 1 ? 's' : ''} selected`}
                    </div>
                  </div>
                )}
              </div>

              {/* Right — role & plan rights */}
              <div style={{ padding:'20px', overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>

                {/* Role selection */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--ink3)', marginBottom:8 }}>
                    Portal role
                  </div>
                  {isIndividual ? (
                    <div style={{ padding:'10px 14px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:'#16a34a', flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>Vehicle Owner</div>
                        <div style={{ fontSize:11, color:'var(--ink3)' }}>Role is fixed for individual accounts — access scoped to assigned vehicles only</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {PORTAL_ROLES.map(r => (
                        <label key={r.value} style={{
                          display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:7, cursor:'pointer',
                          background: portalForm.role === r.value ? r.color + '12' : 'var(--cream)',
                          border: `1px solid ${portalForm.role === r.value ? r.color + '50' : 'transparent'}`,
                        }}>
                          <input type="radio" name="portalRole" checked={portalForm.role === r.value}
                            onChange={() => setPortalForm(f => ({ ...f, role: r.value }))}
                            style={{ accentColor: r.color, marginTop:2 }} />
                          <div style={{ width:8, height:8, borderRadius:'50%', background: r.color, marginTop:4, flexShrink:0 }} />
                          <div>
                            <div style={{ fontSize:13, fontWeight: portalForm.role === r.value ? 600 : 400 }}>{r.label}</div>
                            <div style={{ fontSize:11, color:'var(--ink3)' }}>{r.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plan-based rights info */}
                {customerVehicles.length > 0 && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--ink3)', marginBottom:8 }}>
                      Package plan rights
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {customerVehicles.map(v => {
                        const sub = getSubscription(v.id);
                        const customPlan = sub?.customPlanId ? getCustomPlans(v.tenantId).find(p => p.id === sub.customPlanId) : null;
                        const planName = customPlan ? customPlan.name : sub?.plan;
                        const planColor = customPlan ? customPlan.color : sub ? PLANS[sub.plan]?.color : '#6b7280';
                        const services = customPlan ? customPlan.services : sub ? (PLANS[sub.plan]?.services ?? []) : [];
                        const webOk = isServiceEnabled(v.id, 'web_access');
                        return (
                          <div key={v.id} style={{ padding:'10px 12px', background:'var(--cream)', borderRadius:8 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                              <span style={{ fontSize:12, fontWeight:700, fontFamily:'monospace' }}>{v.plate}</span>
                              {planName && (
                                <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4, background: (planColor ?? '#6b7280') + '22', color: planColor ?? '#6b7280', border:`1px solid ${(planColor ?? '#6b7280')}40` }}>
                                  {planName}
                                </span>
                              )}
                              {!webOk && <span style={{ fontSize:10, color:'#dc2626', fontWeight:600 }}>Portal not included</span>}
                            </div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                              {services.map(sk => {
                                const svc = SERVICES.find(s => s.key === sk);
                                return svc ? (
                                  <span key={sk} style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, padding:'2px 6px', borderRadius:4, background:'#e0f2fe', color:'#0369a1' }}>
                                    {svc.icon} {svc.label}
                                  </span>
                                ) : null;
                              })}
                              {services.length === 0 && <span style={{ fontSize:11, color:'var(--ink3)' }}>No services in plan</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop:8, padding:'8px 10px', background: isIndividual ? '#ede9fe' : '#dbeafe', borderRadius:6, fontSize:11, color: isIndividual ? '#5b21b6' : '#1e40af' }}>
                      {isIndividual
                        ? '👤 Individual: web portal access is gated on plan — user can only log in if their vehicle plan includes Web Portal Access.'
                        : '🏢 Company: manager / contact person rights are determined by the package plan. The system role above controls which pages they see.'}
                    </div>
                  </div>
                )}

                {customerVehicles.length === 0 && (
                  <div style={{ padding:'14px', background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:8, fontSize:12, color:'#92400e' }}>
                    <strong>No vehicles registered.</strong> Register a vehicle with a plan that includes Web Portal Access before creating a portal user.
                    <button onClick={() => { setShowPortalModal(false); setShowVehicleWizard(true); }} style={{ display:'block', marginTop:6, background:'none', border:'none', padding:0, color:'#c4912a', fontWeight:600, fontSize:12, cursor:'pointer', textAlign:'left' }}>
                      🚛 Register vehicle →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:12, color:'var(--ink3)' }}>
                Will be created under <strong>{tenantName}</strong> tenant
                {portalForm.vehicleIds.length > 0 && ` · ${portalForm.vehicleIds.length} vehicle${portalForm.vehicleIds.length > 1 ? 's' : ''} assigned`}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowPortalModal(false)}
                  style={{ padding:'8px 20px', border:'1px solid var(--border)', borderRadius:7, background:'#fff', cursor:'pointer', fontSize:13 }}>
                  Cancel
                </button>
                <button onClick={handlePortalSave} disabled={!portalCanSave}
                  style={{ padding:'8px 22px', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: portalCanSave ? 'pointer' : 'default', background: portalCanSave ? '#c4912a' : 'var(--border)', color: portalCanSave ? '#fff' : 'var(--ink3)' }}>
                  <i className="ti ti-user-plus" style={{ marginRight:6 }} />Create portal user
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
