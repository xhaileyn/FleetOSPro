'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  Customer, CustomerStatus, ComplianceStatus,
} from '@/lib/customers';
import { TENANTS_META } from '@/lib/vehiclesMaster';
import { useCustomersStore } from '@/store/customersStore';
import { useRefDataStore } from '@/store/refDataStore';

/* ── Shared micro-components ────────────────────────────────────────── */
function KpiCard({ icon, iconColor, label, value, sub, subColor, stripe, onClick, active }: {
  icon: string; iconColor?: string; label: string; value: string | number;
  sub?: string; subColor?: string; stripe?: string; onClick?: () => void; active?: boolean;
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
        {sub && <div style={{ fontSize: 9, marginTop: 2, color: subColor ?? 'var(--ink3)', fontWeight: 500 }}>{sub}</div>}
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

/* ── Style helpers ─────────────────────────────────────────────────── */
const STATUS_S: Record<CustomerStatus, React.CSSProperties> = {
  Active:   { background: 'rgba(196,145,42,0.12)',  color: '#c4912a' },
  Inactive: { background: '#f3f4f6',         color: '#6b7280' },
  Prospect: { background: '#fffbeb',         color: '#d97706' },
};
const COMPLIANCE_S: Record<ComplianceStatus, React.CSSProperties> = {
  'Compliant':      { background: 'rgba(196,145,42,0.12)',  color: '#c4912a' },
  'Pending Review': { background: '#fffbeb',         color: '#d97706' },
  'Flagged':        { background: '#fef2f2',         color: '#dc2626' },
};
const TYPE_S: Record<string, React.CSSProperties> = {
  Company:    { background: 'rgba(196,145,42,0.12)', color: '#c4912a' },
  Individual: { background: '#e0f2fe',        color: '#0369a1' },
};
const TYPE_ICON: Record<string, string> = { Company: 'ti-building', Individual: 'ti-user' };

const STEPS = ['Company info', 'Contact details', 'Compliance & review'];

/* ── Tenant chip ───────────────────────────────────────────────────── */
function TenantChip({ tenantId }: { tenantId: string }) {
  const meta = TENANTS_META[tenantId];
  if (!meta) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
      background: meta.color + '18', color: meta.color,
      border: `1px solid ${meta.color}40`, marginLeft: 6,
    }}>
      {meta.name}
    </span>
  );
}

/* ── Tree row ──────────────────────────────────────────────────────── */
function TreeRow({ c, depth, expanded, onToggle, showTenant, allCustomers }: {
  c: Customer; depth: number; expanded: boolean; onToggle: () => void; showTenant?: boolean; allCustomers: Customer[];
}) {
  const children    = allCustomers.filter(x => x.parentId === c.id);
  const hasChildren = children.length > 0;

  const th: React.CSSProperties = { padding: '9px 14px', borderBottom: '1px solid var(--border)' };

  return (
    <>
      <tr style={{ background: depth === 0 ? '#fff' : '#fbfaf9' }}>
        <td style={{ ...th, textAlign: 'center' }}>
          {c.cid
            ? <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#c4912a', background:'rgba(196,145,42,0.10)', padding:'2px 6px', borderRadius:4, border:'1px solid rgba(196,145,42,0.22)' }}>#{c.cid}</span>
            : <span style={{ color:'var(--ink3)', fontSize:11 }}>—</span>}
        </td>
        <td style={th}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: depth * 24 }}>
            {hasChildren ? (
              <button onClick={onToggle} style={{ width: 18, height: 18, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--cream)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, color: 'var(--ink2)' }}>
                {expanded ? '−' : '+'}
              </button>
            ) : (
              <div style={{ width: 18, height: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {depth > 0 && <span style={{ color: 'var(--border2)', fontSize: 12 }}>└</span>}
              </div>
            )}
            <Link href={`/customers/${c.id}`} style={{ fontSize: 13, fontWeight: depth === 0 ? 600 : 500, color: '#c4912a', textDecoration: 'none' }}>
              {c.name}
            </Link>
            {depth === 0 && hasChildren && (
              <span style={{ fontSize: 10, color: 'var(--ink3)', background: 'var(--cream3)', padding: '1px 5px', borderRadius: 3 }}>
                {children.length} {children.length === 1 ? 'branch' : 'branches'}
              </span>
            )}
            {showTenant && <TenantChip tenantId={c.tenantId} />}
          </div>
        </td>
        <td style={th}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, ...(TYPE_S[c.type] ?? {}) }}>
            <i className={`ti ${TYPE_ICON[c.type] ?? 'ti-building'}`} style={{ fontSize: 10 }} />
            {c.type}
          </span>
        </td>
        <td style={{ ...th, fontSize: 12, color: 'var(--ink3)' }}>{c.industry}</td>
        <td style={{ ...th, fontSize: 12, color: 'var(--ink2)' }}>{c.city}, {c.country}</td>
        <td style={th}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5, ...STATUS_S[c.status] }}>{c.status}</span></td>
        <td style={th}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5, ...COMPLIANCE_S[c.complianceStatus] }}>{c.complianceStatus}</span></td>
        <td style={{ ...th, fontSize: 13, color: 'var(--ink)', textAlign: 'center' }}>{c.vehiclesAssigned}</td>
        <td style={{ ...th, fontSize: 12, color: 'var(--ink3)' }}>{c.accountManager}</td>
        <td style={th}>
          <Link href={`/customers/${c.id}`} style={{ fontSize: 11, color: '#c4912a', textDecoration: 'none', fontWeight: 600 }}>
            View →
          </Link>
        </td>
      </tr>
      {hasChildren && expanded && children.map(child => (
        <TreeRow key={child.id} c={child} depth={depth + 1} expanded={false} onToggle={() => {}} showTenant={showTenant} allCustomers={allCustomers} />
      ))}
    </>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function CustomersPage() {
  const { user }     = useAuthStore();
  const router       = useRouter();
  const role         = user?.role ?? 'viewer';
  const isSuperAdmin = role === 'super_admin' || role === 'platform_admin';
  const tenantId     = user?.tenantId ?? '1';

  const allStoreCustomers = useCustomersStore(s => s.customers);
  const storeAddCustomer  = useCustomersStore(s => s.addCustomer);
  const refIndustries     = useRefDataStore(s => s.industries);
  const refCountries      = useRefDataStore(s => s.countries);

  const sourceCustomers = useMemo(
    () => isSuperAdmin ? allStoreCustomers : allStoreCustomers.filter(c => c.tenantId === tenantId),
    [isSuperAdmin, allStoreCustomers, tenantId],
  );

  const [tenantFilter, setTenantFilter] = useState('all');
  const baseCustomers = useMemo(() =>
    isSuperAdmin && tenantFilter !== 'all'
      ? sourceCustomers.filter(c => c.tenantId === tenantFilter)
      : sourceCustomers,
  [sourceCustomers, isSuperAdmin, tenantFilter]);

  const storageKey = useMemo(
    () => `fleetos_customers_${isSuperAdmin ? 'super' : tenantId}`,
    [isSuperAdmin, tenantId],
  );
  const [runtimeCustomers, setRuntimeCustomers] = useState<Customer[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setRuntimeCustomers(raw ? (JSON.parse(raw) as Customer[]) : []);
    } catch { setRuntimeCustomers([]); }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(runtimeCustomers));
  }, [storageKey, runtimeCustomers, hydrated]);

  const allCustomers = useMemo(() => [...baseCustomers, ...runtimeCustomers], [baseCustomers, runtimeCustomers]);

  const [view,            setView]           = useState<'table'|'tree'>('tree');
  const [search,          setSearch]         = useState('');
  const [statusFilter,    setStatus]         = useState<string>('All');
  const [typeFilter,      setTypeFilter]     = useState<'All'|'Company'|'Individual'>('All');
  const [hierarchyFilter, setHierarchyFilter] = useState<'All'|'Parent'|'Subsidiary'>('All');
  const [showWizard,      setShowWizard]     = useState(false);
  const [step,            setStep]           = useState(0);
  const [done,            setDone]           = useState(false);
  const [saving,          setSaving]         = useState(false);
  const [saveError,       setSaveError]      = useState('');
  const [newCustomerId,   setNewCustomerId]  = useState('');
  const [expandedIds,     setExpandedIds]    = useState<Set<string>>(new Set(['c-001','c-002','c-t2-001','c-t3-001','c-t5-001']));

  const [form, setForm] = useState({
    name:'', type:'Company', parentId:'', industry:'Logistics', country:'United States',
    city:'', address:'', phone:'', email:'', website:'',
    contactName:'', contactTitle:'', contactEmail:'', contactPhone:'',
    taxId:'', creditLimit:'', notes:'',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const parents = allCustomers.filter(c => !c.parentId);

  const filtered = allCustomers.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus    = statusFilter === 'All' || c.status === statusFilter;
    const matchType      = typeFilter === 'All' || c.type === typeFilter;
    const matchHierarchy = hierarchyFilter === 'All' ||
      (hierarchyFilter === 'Parent' ? !c.parentId : !!c.parentId);
    return matchSearch && matchStatus && matchType && matchHierarchy;
  });

  const topLevel      = filtered.filter(c => c.parentId === null);
  const totalVehicles = allCustomers.reduce((a, c) => a + c.vehiclesAssigned, 0);

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submitWizard() {
    setSaving(true);
    setSaveError('');
    const effectiveTenantId = isSuperAdmin ? (tenantFilter !== 'all' ? tenantFilter : '1') : tenantId;
    try {
      const res = await fetch('/api/v1/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          form.name,
          tenantId:      effectiveTenantId,
          type:          form.type,
          industry:      form.industry,
          country:       form.country,
          city:          form.city,
          address:       form.address,
          phone:         form.phone,
          email:         form.email,
          website:       form.website,
          taxId:         form.taxId,
          creditLimit:   form.creditLimit,
          notes:         form.notes,
          accountManager: user?.fullName ?? '',
          parentShortId: form.parentId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError((err as { message?: string }).message ?? 'Failed to save customer.');
        setSaving(false);
        return;
      }
      const created: Customer = await res.json();
      storeAddCustomer(created);
      setNewCustomerId(created.id as string);
      setDone(true);
    } catch {
      setSaveError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }

  function closeWizard() {
    setShowWizard(false); setStep(0); setDone(false);
    setSaveError(''); setSaving(false); setNewCustomerId('');
    setForm({ name:'', type:'Company', parentId:'', industry:'Logistics', country:'United States',
      city:'', address:'', phone:'', email:'', website:'',
      contactName:'', contactTitle:'', contactEmail:'', contactPhone:'',
      taxId:'', creditLimit:'', notes:'' });
  }

  const inp: React.CSSProperties = { width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, color:'var(--ink)', boxSizing:'border-box', background:'#fff', fontFamily:'inherit' };
  const lbl: React.CSSProperties = { fontSize:12, fontWeight:500, color:'var(--ink2)', display:'block', marginBottom:4 };
  const th: React.CSSProperties  = { padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)', background:'var(--cream)' };

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
            <i className="ti ti-building-community" style={{ fontSize: 20, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Fleet Management</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Customers</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              {isSuperAdmin
                ? 'Cross-tenant customer directory — read only'
                : `${allCustomers.length} client account${allCustomers.length !== 1 ? 's' : ''} · ${user?.tenantName ?? 'your tenant'}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isSuperAdmin
            ? <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>All tenants — view only</span>
            : <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {user?.tenantName ?? 'Tenant'} only
              </span>
          }
          {!isSuperAdmin && (
            <button onClick={() => setShowWizard(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', fontSize: 12, fontWeight: 600,
              borderRadius: 7, border: '1px solid rgba(196,145,42,0.35)',
              background: 'rgba(196,145,42,0.15)', color: '#f5d07a',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> Onboard customer
            </button>
          )}
        </div>
      </div>

      {/* Super admin tenant selector */}
      {isSuperAdmin && (
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, color: 'var(--ink3)' }}>Filter tenant:</label>
          <select
            value={tenantFilter}
            onChange={e => setTenantFilter(e.target.value)}
            style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--ink)' }}
          >
            <option value="all">All tenants ({allStoreCustomers.length} customers)</option>
            {Object.entries(TENANTS_META).map(([tid, meta]) => {
              const cnt = allStoreCustomers.filter(c => c.tenantId === tid).length;
              return <option key={tid} value={tid}>{meta.name} ({cnt} customers)</option>;
            })}
          </select>
          {tenantFilter !== 'all' && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              background: (TENANTS_META[tenantFilter]?.color ?? '#000') + '18',
              color: TENANTS_META[tenantFilter]?.color ?? 'var(--ink3)',
              border: `1px solid ${(TENANTS_META[tenantFilter]?.color ?? '#000')}40`,
            }}>
              {TENANTS_META[tenantFilter]?.name}
            </span>
          )}
        </div>
      )}

      {/* Tenant scope notice */}
      {!isSuperAdmin && (
        <div style={{ marginBottom: 14, padding: '7px 12px', background: 'rgba(196,145,42,0.12)', borderRadius: 8, fontSize: 11, color: '#c4912a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-lock" style={{ fontSize: 12 }} />
          Scoped to <strong>{user?.tenantName ?? 'your tenant'}</strong> — customer data from other companies is not visible.
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard icon="ti-users" iconColor="#c4912a" label="Total customers" value={allCustomers.length}
          sub="All accounts" stripe="#c4912a"
          active={statusFilter === 'All' && typeFilter === 'All' && hierarchyFilter === 'All'}
          onClick={() => { setStatus('All'); setTypeFilter('All'); setHierarchyFilter('All'); }} />
        <KpiCard icon="ti-user-check" iconColor="#c4912a" label="Active" value={allCustomers.filter(c => c.status === 'Active').length}
          sub="Active accounts" stripe="#c4912a"
          active={statusFilter === 'Active'}
          onClick={() => { setStatus('Active'); setHierarchyFilter('All'); }} />
        <KpiCard icon="ti-building" iconColor="var(--blue)" label="Parent companies" value={allCustomers.filter(c => !c.parentId).length}
          sub="Top-level accounts" stripe="var(--blue)"
          active={hierarchyFilter === 'Parent'}
          onClick={() => { setHierarchyFilter('Parent'); setStatus('All'); }} />
        <KpiCard icon="ti-building-arch" iconColor="var(--purple)" label="Subsidiaries" value={allCustomers.filter(c => !!c.parentId).length}
          sub="Child accounts" stripe="var(--purple)"
          active={hierarchyFilter === 'Subsidiary'}
          onClick={() => { setHierarchyFilter('Subsidiary'); setStatus('All'); }} />
        <KpiCard icon="ti-truck" iconColor="var(--amber)" label="Vehicles assigned" value={totalVehicles}
          sub="Across all customers" stripe="var(--amber)" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: 260, flex: 1 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--ink3)', pointerEvents: 'none' }} />
          <input
            placeholder="Search customers…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, paddingLeft: 30 }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--ink)', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>
          {['All','Active','Inactive','Prospect'].map(s => <option key={s}>{s}</option>)}
        </select>

        {/* Type filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>Type:</span>
          <div style={{ display: 'flex', background: 'var(--cream)', borderRadius: 6, padding: 3 }}>
            {([
              { key: 'All',        label: 'All',        icon: '' },
              { key: 'Company',    label: 'Company',    icon: 'ti-building' },
              { key: 'Individual', label: 'Individual', icon: 'ti-user' },
            ] as const).map(({ key, label, icon }) => (
              <button key={key} onClick={() => setTypeFilter(key)} style={{
                padding: '4px 12px', fontSize: 11, border: 'none', borderRadius: 4, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                background: typeFilter === key ? '#fff' : 'transparent',
                color: typeFilter === key
                  ? (key === 'Individual' ? '#0369a1' : key === 'Company' ? '#c4912a' : 'var(--ink)')
                  : 'var(--ink3)',
                fontWeight: typeFilter === key ? 600 : 400,
                boxShadow: typeFilter === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.12s',
              }}>
                {icon && <i className={`ti ${icon}`} style={{ fontSize: 11 }} />}{label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          {(['tree', 'table'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 12px', fontSize: 11, border: '1px solid var(--border)', borderRadius: 6,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
              background: view === v ? '#c4912a' : '#fff', color: view === v ? '#fff' : 'var(--ink2)',
              fontWeight: view === v ? 600 : 400,
            }}>
              <i className={`ti ${v === 'tree' ? 'ti-hierarchy' : 'ti-table'}`} style={{ fontSize: 11 }} />
              {v === 'tree' ? 'Hierarchy' : 'Table'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tree view ─────────────────────────────────────────────────── */}
      {view === 'tree' && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['CID','Customer','Type','Industry','Location','Status','Compliance','Vehicles','Account mgr',''].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topLevel.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>No customers found.</td></tr>
              ) : topLevel.map(c => (
                <TreeRow
                  key={c.id} c={c} depth={0}
                  expanded={expandedIds.has(c.id)}
                  onToggle={() => toggleExpand(c.id)}
                  showTenant={isSuperAdmin && tenantFilter === 'all'}
                  allCustomers={allCustomers}
                />
              ))}
            </tbody>
          </table>
          <div style={{ padding: '8px 14px', background: 'var(--cream)', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--ink3)' }}>
            {filtered.length} customers · click + to expand branches · click name to open profile
          </div>
        </div>
      )}

      {/* ── Table view ────────────────────────────────────────────────── */}
      {view === 'table' && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['CID','Customer','Parent','Industry','Location','Status','Compliance','Vehicles','Account mgr',''].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>No customers found.</td></tr>
              ) : filtered.map(c => {
                const parent = c.parentId ? allCustomers.find(p => p.id === c.parentId) : null;
                return (
                  <tr key={c.id} style={{ background: '#fff' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                      {c.cid
                        ? <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#c4912a', background:'rgba(196,145,42,0.10)', padding:'2px 6px', borderRadius:4, border:'1px solid rgba(196,145,42,0.22)' }}>#{c.cid}</span>
                        : <span style={{ color:'var(--ink3)', fontSize:11 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Link href={`/customers/${c.id}`} style={{ fontSize: 13, fontWeight: 500, color: '#c4912a', textDecoration: 'none' }}>{c.name}</Link>
                        {isSuperAdmin && tenantFilter === 'all' && <TenantChip tenantId={c.tenantId} />}
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, marginTop: 3, ...(TYPE_S[c.type] ?? {}) }}>
                        <i className={`ti ${TYPE_ICON[c.type] ?? 'ti-building'}`} style={{ fontSize: 9 }} />
                        {c.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink3)', borderBottom: '1px solid var(--border)' }}>
                      {parent ? <Link href={`/customers/${parent.id}`} style={{ color: 'var(--ink2)', textDecoration: 'none' }}>{parent.name}</Link> : <span style={{ color: 'var(--ink3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink3)', borderBottom: '1px solid var(--border)' }}>{c.industry}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink2)', borderBottom: '1px solid var(--border)' }}>{c.city}, {c.country}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5, ...STATUS_S[c.status] }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5, ...COMPLIANCE_S[c.complianceStatus] }}>{c.complianceStatus}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{c.vehiclesAssigned}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink3)', borderBottom: '1px solid var(--border)' }}>{c.accountManager}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                      <Link href={`/customers/${c.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#c4912a', textDecoration: 'none', fontWeight: 600 }}>
                        View <i className="ti ti-arrow-right" style={{ fontSize: 10 }} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Onboarding wizard ──────────────────────────────────────────── */}
      {showWizard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 600, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>

            {/* Gradient modal header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
              borderRadius: '14px 14px 0 0', padding: '16px 22px',
              borderBottom: '1px solid rgba(196,145,42,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-building-community" style={{ fontSize: 16, color: '#f5d07a' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Onboard new customer</div>
                  {!done && <div style={{ fontSize: 11, color: 'rgba(245,208,122,0.65)', marginTop: 1 }}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</div>}
                </div>
              </div>
              <button onClick={closeWizard} style={{ fontSize: 18, border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '2px 6px' }}>×</button>
            </div>

            {/* Progress */}
            {!done && (
              <div style={{ display: 'flex' }}>
                {STEPS.map((_, i) => <div key={i} style={{ flex: 1, height: 3, background: i <= step ? '#c4912a' : 'var(--border)' }} />)}
              </div>
            )}

            <div style={{ padding: '24px' }}>
              {done ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(196,145,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <i className="ti ti-check" style={{ fontSize: 28, color: '#c4912a' }} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Customer onboarded!</div>
                  <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 20 }}>
                    <strong>{form.name}</strong> has been added to your customer directory.<br />
                    Their records are isolated within your tenant.
                  </div>
                  <div style={{ background: 'var(--cream)', borderRadius: 8, padding: '14px', textAlign: 'left', fontSize: 12, color: 'var(--ink2)', marginBottom: 20 }}>
                    {[
                      ['Name', form.name],
                      ['Type', form.type],
                      ['Status', 'Prospect'],
                      ['Parent', form.parentId ? allCustomers.find(c => c.id === form.parentId)?.name ?? '—' : 'Standalone'],
                      ['Industry', form.industry],
                      ['Country', form.country],
                      ['Contact', form.contactName || '—'],
                      ['Email', form.contactEmail || '—'],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--ink3)' }}>{l}</span>
                        <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(196,145,42,0.12)', border: '1px solid #c4912a', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#c4912a', marginBottom: 4 }}>Next step: Register a vehicle</div>
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 12 }}>Assign a tracked vehicle to <strong>{form.name}</strong> to start monitoring their fleet.</div>
                    <button
                      onClick={() => { closeWizard(); router.push(`/vehicles?openWizard=1&customerId=${newCustomerId}`); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#c4912a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                    >
                      <i className="ti ti-truck" style={{ fontSize: 13 }} /> Register vehicle →
                    </button>
                  </div>
                  <button onClick={closeWizard} style={{ padding: '8px 20px', background: 'transparent', color: 'var(--ink3)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Skip for now</button>
                </div>
              ) : step === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={lbl}>Company / customer name *</label>
                      <input style={inp} placeholder="e.g. Atlantic Freight Solutions" value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Type</label>
                      <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
                        <option>Company</option><option>Individual</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Parent company <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>(optional)</span></label>
                      <select style={inp} value={form.parentId} onChange={e => set('parentId', e.target.value)}>
                        <option value="">— Standalone —</option>
                        {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Industry</label>
                      <select style={inp} value={form.industry} onChange={e => set('industry', e.target.value)}>
                        {refIndustries.map(i => <option key={i.value}>{i.value}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Country</label>
                      <select style={inp} value={form.country} onChange={e => set('country', e.target.value)}>
                        {refCountries.map(c => <option key={c.value}>{c.value}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>City</label>
                      <input style={inp} placeholder="New York" value={form.city} onChange={e => set('city', e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={lbl}>Address</label>
                      <input style={inp} placeholder="123 Commerce Blvd" value={form.address} onChange={e => set('address', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Company phone</label>
                      <input style={inp} placeholder="+1 212 555 0100" value={form.phone} onChange={e => set('phone', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Company email</label>
                      <input style={inp} type="email" placeholder="info@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={lbl}>Website</label>
                      <input style={inp} placeholder="company.com" value={form.website} onChange={e => set('website', e.target.value)} />
                    </div>
                  </div>
                  {form.parentId && (
                    <div style={{ padding: '10px 14px', background: 'rgba(196,145,42,0.12)', borderRadius: 7, fontSize: 12, color: '#c4912a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="ti ti-folder" style={{ fontSize: 13 }} />
                      This customer will be created as a subsidiary of <strong>{parents.find(p => p.id === form.parentId)?.name}</strong>.
                    </div>
                  )}
                </div>
              ) : step === 1 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 4 }}>Add the primary contact person at this customer.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={lbl}>Full name</label>
                      <input style={inp} placeholder="John Kamau" value={form.contactName} onChange={e => set('contactName', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Job title</label>
                      <input style={inp} placeholder="Fleet Manager" value={form.contactTitle} onChange={e => set('contactTitle', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Email</label>
                      <input style={inp} type="email" placeholder="john@company.com" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Phone</label>
                      <input style={inp} placeholder="+1 212 555 0100" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'var(--cream)', borderRadius: 7, fontSize: 12, color: 'var(--ink3)' }}>
                    Additional contacts can be added after onboarding from the customer profile page.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={lbl}>Tax ID / KRA PIN</label>
                      <input style={inp} placeholder="P051234567A" value={form.taxId} onChange={e => set('taxId', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Credit limit (KES)</label>
                      <input style={inp} type="number" placeholder="1000000" value={form.creditLimit} onChange={e => set('creditLimit', e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={lbl}>Notes</label>
                      <textarea style={{ ...inp, height: 70, resize: 'vertical' }} placeholder="Any additional notes about this customer…" value={form.notes} onChange={e => set('notes', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ background: 'var(--cream)', borderRadius: 8, padding: '14px', fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>Review summary</div>
                    {[
                      ['Name', form.name || '—'],
                      ['Type', form.type],
                      ['Parent', form.parentId ? (parents.find(p => p.id === form.parentId)?.name ?? '—') : 'Standalone'],
                      ['Industry', `${form.industry} · ${form.country}`],
                      ['Contact', form.contactName ? `${form.contactName} (${form.contactEmail || 'no email'})` : '—'],
                      ['Tax ID', form.taxId || '— (compliance pending)'],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--ink3)' }}>{l}</span>
                        <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 14px', background: 'rgba(196,145,42,0.12)', borderRadius: 7, fontSize: 12, color: '#c4912a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-lock" style={{ fontSize: 13 }} />
                    This customer&apos;s records will be isolated within your tenant and cannot be accessed by other tenants on the platform.
                  </div>
                </div>
              )}
            </div>

            {!done && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {saveError && (
                  <div style={{ padding: '7px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, color: '#dc2626' }}>
                    ⚠ {saveError}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Btn onClick={() => step > 0 ? setStep(s => s - 1) : closeWizard()} disabled={saving}>
                    {step === 0 ? 'Cancel' : '← Back'}
                  </Btn>
                  <Btn
                    variant="primary"
                    onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : submitWizard()}
                    disabled={(step === 0 && !form.name) || saving}
                  >
                    {saving ? 'Saving…' : step === STEPS.length - 1 ? 'Create customer' : 'Next →'}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
