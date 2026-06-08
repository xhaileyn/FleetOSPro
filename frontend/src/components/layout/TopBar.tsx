'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore, ActiveTenant } from '@/store/tenantStore';
import { getInitials, getRoleLabel } from '@/lib/auth';
import { FleetOSLockup } from './FleetOSMark';

/* Tenant list available for switching (mirrors seed data) */
const SWITCH_TENANTS: ActiveTenant[] = [
  { id:'8',  name:'Atlantic Freight Inc',  plan:'Enterprise',   domain:'atlantic.fleetos.app', status:'Active',    vehicles:8,   users:6,  adminEmail:'fleet@atlanticfreight.com'   },
  { id:'9',  name:'Meridian Logistics',    plan:'Professional', domain:'meridian.fleetos.app', status:'Active',    vehicles:6,   users:4,  adminEmail:'admin@meridianlogistics.com' },
  { id:'10', name:'BritFleet Solutions',   plan:'Enterprise',   domain:'britfleet.fleetos.app',status:'Active',    vehicles:8,   users:5,  adminEmail:'fleet@britfleet.co.uk'       },
  { id:'1',  name:'ACME Logistics',        plan:'Enterprise',   domain:'acme.fleetos.app',     status:'Active',    vehicles:247, users:18, adminEmail:'admin@acmelogistics.com'     },
  { id:'2',  name:'SwiftCargo Ltd',        plan:'Professional', domain:'swift.fleetos.app',    status:'Active',    vehicles:45,  users:8,  adminEmail:'admin@swiftcargo.com'         },
  { id:'3',  name:'NextDay Express',       plan:'Starter',      domain:'nex.fleetos.app',      status:'Active',    vehicles:12,  users:3,  adminEmail:'admin@nextdayexpress.co.uk'   },
  { id:'4',  name:'KAM Transport',         plan:'Professional', domain:'kam.fleetos.app',      status:'Suspended', vehicles:78,  users:12, adminEmail:'admin@kamtransport.com'       },
  { id:'5',  name:'PeakFleet Co',          plan:'Enterprise',   domain:'peak.fleetos.app',     status:'Active',    vehicles:180, users:22, adminEmail:'admin@peakfleet.co.uk'        },
  { id:'6',  name:'SwiftDeliver Co',       plan:'Trial',        domain:'sde.fleetos.app',      status:'Trial',     vehicles:8,   users:2,  adminEmail:'admin@swiftdeliver.com'       },
  { id:'7',  name:'Star Technologies',     plan:'Enterprise',   domain:'star.fleetos.app',     status:'Active',    vehicles:92,  users:14, adminEmail:'admin@starttech.io'           },
];

const STATUS_COLOR: Record<string, string> = {
  Active: '#22c55e', Suspended: '#ef4444', Trial: '#f59e0b',
};

const PLAN_COLOR: Record<string, string> = {
  Enterprise: '#0d6e5e', Professional: '#1d4ed8', Starter: '#b45309',
  Suspended: '#b91c1c', Trial: '#b45309',
};

/* ── Small icon helpers ──────────────────────────────────────────────── */
function GridIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}
function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function ExitIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3H19a2 2 0 012 2v14a2 2 0 01-2 2H15" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6l3 3 5-5" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ── Change Password Modal ───────────────────────────────────────────── */
function ChangePasswordModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('fleetos_token') : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next !== confirm) { setError('New passwords do not match'); return; }
    if (next.length < 6)  { setError('New password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.message ?? 'Password change failed'); return; }
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    flex: 1, padding: '8px 10px', border: '1px solid #d1d5db',
    borderRadius: 6, fontSize: 13, fontFamily: 'inherit',
    color: '#0f172a', background: '#fff', outline: 'none',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', width: 400, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ color: '#c4912a' }}><LockIcon /></span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Change password</span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        {success ? (
          <div style={{ padding: '40px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Password changed</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Your password has been updated successfully.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '22px' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
              Changing password for <strong>{email}</strong>
            </div>

            {/* Current password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Current password</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
                <input
                  type={showCur ? 'text' : 'password'}
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  placeholder="Enter current password"
                  required
                  style={{ ...inp, border: 'none', borderRadius: 0 }}
                />
                <button type="button" onClick={() => setShowCur(v => !v)}
                  style={{ padding: '0 10px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  <EyeIcon off={showCur} />
                </button>
              </div>
            </div>

            {/* New password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>New password</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
                <input
                  type={showNext ? 'text' : 'password'}
                  value={next}
                  onChange={e => setNext(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  style={{ ...inp, border: 'none', borderRadius: 0 }}
                />
                <button type="button" onClick={() => setShowNext(v => !v)}
                  style={{ padding: '0 10px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  <EyeIcon off={showNext} />
                </button>
              </div>
              {/* Strength bar */}
              {next.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 3 }}>
                  {[1,2,3,4].map(i => {
                    const strength = next.length >= 12 ? 4 : next.length >= 8 ? 3 : next.length >= 6 ? 2 : 1;
                    const colors = ['#ef4444','#f97316','#eab308','#22c55e'];
                    return <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? colors[strength-1] : '#e5e7eb', transition: 'background 0.2s' }} />;
                  })}
                  <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>
                    {next.length >= 12 ? 'Strong' : next.length >= 8 ? 'Good' : next.length >= 6 ? 'Fair' : 'Weak'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm new password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Confirm new password</label>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${confirm && confirm !== next ? '#ef4444' : '#d1d5db'}`, borderRadius: 6, overflow: 'hidden' }}>
                <input
                  type={showConf ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{ ...inp, border: 'none', borderRadius: 0 }}
                />
                <button type="button" onClick={() => setShowConf(v => !v)}
                  style={{ padding: '0 10px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  <EyeIcon off={showConf} />
                </button>
              </div>
              {confirm && confirm !== next && (
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Passwords do not match</div>
              )}
              {confirm && confirm === next && next.length > 0 && (
                <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4 }}>✓ Passwords match</div>
              )}
            </div>

            {error && (
              <div style={{ padding: '9px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 7, cursor: 'pointer', background: '#fff', color: '#374151', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading || !current || !next || !confirm}
                style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 7, cursor: loading ? 'wait' : 'pointer', background: '#c4912a', color: '#fff', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving…' : 'Change password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function TopBar() {
  const { user, logout }               = useAuthStore();
  const { activeTenant, switchTenant } = useTenantStore();
  const router                         = useRouter();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);

  const [brandName,   setBrandName]   = useState('');
  const [brandLogo,   setBrandLogo]   = useState('');
  const [brandAccent, setBrandAccent] = useState('#c4912a');

  useEffect(() => {
    try {
      const tenantKey = user?.tenantId ? `fleetBrand_tenant_${user.tenantId}` : null;
      const raw = (tenantKey && localStorage.getItem(tenantKey)) ?? localStorage.getItem('fleetBrand');
      if (!raw) return;
      const b = JSON.parse(raw);
      if (b.companyName) setBrandName(b.companyName);
      if (b.logoDataUrl)  setBrandLogo(b.logoDataUrl);
      if (b.accentColor)  setBrandAccent(b.accentColor);
    } catch { /* ignore */ }
  }, [user?.tenantId]);

  const handleSignOut = () => {
    switchTenant(null);
    logout();
    router.push('/login');
  };

  const handleSwitch = (tenant: ActiveTenant) => {
    switchTenant(tenant);
    setSwitcherOpen(false);
  };

  const handleExitTenant = () => {
    switchTenant(null);
    setSwitcherOpen(false);
  };

  if (!user) return null;

  const isSuperAdmin = user.role === 'super_admin';

  /* If custom logo uploaded, render that; otherwise the FleetOS mark */
  const logoNode = brandLogo ? (
    <div style={{
      width: 44, height: 44, borderRadius: 9, overflow: 'hidden', flexShrink: 0,
      background: brandAccent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src={brandLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  ) : null;

  return (
    <>
      <header style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(180deg, var(--chrome-lt) 0%, var(--chrome) 100%)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        height: 64,
        position: 'relative',
        zIndex: 100,
        boxShadow: '0 1px 0 rgba(196,145,42,0.28), 0 2px 14px rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(196,145,42,0.20)',
      }}>
        <style>{`
          .tb-switcher-btn:hover { background: rgba(255,255,255,0.07) !important; }
          .tb-tenant-row:hover { background: rgba(196,145,42,0.10) !important; }
          .tb-user-btn:hover .tb-avatar { border-color: rgba(255,255,255,0.25) !important; }
          .tb-menu-item:hover { background: var(--cream) !important; }
          .tb-menu-danger:hover { background: #fef2f2 !important; }
          .tb-exit-btn:hover { background: rgba(255,255,255,0.18) !important; }
        `}</style>

        {/* ── Logo ────────────────────────────────────────────────────── */}
        <Link href="/dashboard" style={{
          display: 'flex', alignItems: 'center',
          padding: '0 18px 0 4px',
          borderRight: '1px solid rgba(196,145,42,0.22)',
          textDecoration: 'none', cursor: 'pointer', flexShrink: 0,
          filter: 'drop-shadow(0 0 8px rgba(196,145,42,0.18))',
        }}>
          {logoNode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              {logoNode}
              <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>
                {brandName.endsWith('+')
                  ? <>{brandName.slice(0, -1)}<span style={{ color: brandAccent }}>+</span></>
                  : brandName}
              </span>
            </div>
          ) : (
            <FleetOSLockup
              size={44}
              accent={brandAccent}
              nameOverride={brandName || undefined}
            />
          )}
        </Link>

        {/* ── Tenant switcher (super_admin only) ──────────────────────── */}
        {isSuperAdmin && (
          <div style={{ marginLeft: 12, position: 'relative' }}>
            <button
              onClick={() => { setSwitcherOpen(o => !o); setMenuOpen(false); }}
              className="tb-switcher-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '5px 11px', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                background: activeTenant ? 'rgba(196,145,42,0.14)' : 'rgba(255,255,255,0.05)',
                color: activeTenant ? '#f5d07a' : 'rgba(255,255,255,0.5)',
                fontSize: 12, transition: 'background 0.12s',
              }}
            >
              {activeTenant ? (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[activeTenant.status] ?? '#9ca3af', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontWeight: 600 }}>{activeTenant.name}</span>
                </>
              ) : (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}><GridIcon /></span>
                  <span>Platform view</span>
                </>
              )}
              <span style={{ opacity: 0.5 }}><ChevronDown /></span>
            </button>

            {switcherOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setSwitcherOpen(false)} />
                <div style={{
                  position: 'absolute', top: 48, left: 0,
                  background: 'linear-gradient(160deg, var(--hero-s) 0%, var(--hero-m) 100%)',
                  border: '1px solid rgba(196,145,42,0.28)',
                  borderRadius: 12,
                  boxShadow: '0 12px 40px rgba(13,27,42,0.70), 0 0 0 1px rgba(196,145,42,0.10), inset 0 1px 0 rgba(196,145,42,0.12)',
                  minWidth: 290, zIndex: 999, overflow: 'hidden',
                }}>
                  {/* Platform view option */}
                  <button
                    onClick={handleExitTenant}
                    style={{
                      width: '100%', padding: '12px 14px', border: 'none',
                      background: !activeTenant ? 'rgba(196,145,42,0.14)' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 10,
                      borderBottom: '1px solid rgba(196,145,42,0.14)',
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(196,145,42,0.15)',
                      border: '1px solid rgba(196,145,42,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#f5d07a',
                    }}>
                      <GridIcon />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: !activeTenant ? '#f5d07a' : 'rgba(255,255,255,0.80)' }}>
                        Platform view
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(245,208,122,0.45)', marginTop: 1 }}>All tenants · super admin</div>
                    </div>
                    {!activeTenant && (
                      <span style={{ color: '#f5d07a', flexShrink: 0 }}><CheckIcon /></span>
                    )}
                  </button>

                  <div style={{ padding: '8px 14px 5px', fontSize: 9, fontWeight: 700, color: 'rgba(245,208,122,0.45)',
                    textTransform: 'uppercase', letterSpacing: 1.4 }}>
                    Switch tenant
                  </div>

                  {SWITCH_TENANTS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSwitch(t)}
                      className="tb-tenant-row"
                      style={{
                        width: '100%', padding: '9px 14px', border: 'none',
                        background: activeTenant?.id === t.id ? 'rgba(196,145,42,0.14)' : 'transparent',
                        cursor: t.status === 'Suspended' ? 'default' : 'pointer',
                        textAlign: 'left', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 10,
                        borderTop: '1px solid rgba(196,145,42,0.09)',
                        opacity: t.status === 'Suspended' ? 0.45 : 1,
                        transition: 'background 0.1s',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                        background: 'rgba(196,145,42,0.15)',
                        border: '1px solid rgba(196,145,42,0.22)',
                        color: '#f5d07a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800,
                      }}>
                        {t.name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600,
                            color: activeTenant?.id === t.id ? '#f5d07a' : 'rgba(255,255,255,0.82)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.name}
                          </span>
                          {t.status === 'Suspended' && (
                            <span style={{ fontSize: 9, background: 'rgba(185,28,28,0.25)', color: '#fca5a5',
                              padding: '1px 5px', borderRadius: 3, fontWeight: 700, flexShrink: 0,
                              textTransform: 'uppercase', letterSpacing: 0.3 }}>
                              Suspended
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: PLAN_COLOR[t.plan] ? `${PLAN_COLOR[t.plan]}cc` : 'rgba(255,255,255,0.38)' }}>
                            {t.plan}
                          </span>
                          <span style={{ color: 'rgba(196,145,42,0.30)' }}>·</span>
                          <span>{t.vehicles} vehicles</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%',
                          background: STATUS_COLOR[t.status] ?? '#9ca3af', display: 'inline-block',
                          boxShadow: `0 0 5px ${STATUS_COLOR[t.status] ?? '#9ca3af'}80`,
                        }} />
                        {activeTenant?.id === t.id && (
                          <span style={{ color: '#f5d07a' }}><CheckIcon /></span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tenant name badge (non-super_admin) */}
        {!isSuperAdmin && user.tenantName && (
          <div style={{
            marginLeft: 14,
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '4px 12px 4px 8px',
            background: 'rgba(196,145,42,0.12)',
            border: '1px solid rgba(196,145,42,0.28)',
            borderRadius: 20,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#f5d07a', flexShrink: 0, display: 'inline-block',
            }} />
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#f5d07a',
              letterSpacing: '0.2px', whiteSpace: 'nowrap',
            }}>
              {user.tenantName}
            </span>
          </div>
        )}

        {/* ── Right side ──────────────────────────────────────────────── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
          }}>
            <span className="pulse-dot" style={{ width: 5, height: 5 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Live</span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />

          {/* Role badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
            background: `${brandAccent}1c`, color: brandAccent,
            letterSpacing: '0.5px', border: `1px solid ${brandAccent}38`,
            textTransform: 'uppercase',
          }}>
            {getRoleLabel(user.role)}
          </span>

          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setMenuOpen(o => !o); setSwitcherOpen(false); }}
              className="tb-user-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 6px', borderRadius: 6,
              }}
            >
              <div
                className="tb-avatar"
                style={{
                  width: 34, height: 34,
                  background: 'rgba(196,145,42,0.18)',
                  border: '1.5px solid rgba(196,145,42,0.45)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#f5d07a',
                  transition: 'border-color 0.15s', flexShrink: 0,
                }}
              >
                {getInitials(user.fullName)}
              </div>
              <div style={{ minWidth: 0, maxWidth: 130 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#f5d07a',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  letterSpacing: '0.1px',
                }}>
                  {user.fullName}
                </div>
                <div style={{
                  fontSize: 10, color: 'rgba(245,208,122,0.5)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user.email}
                </div>
              </div>
              <span style={{ color: 'rgba(196,145,42,0.55)', flexShrink: 0 }}><ChevronDown /></span>
            </button>

            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setMenuOpen(false)} />
                <div style={{
                  position: 'absolute', top: 42, right: 0, background: '#fff',
                  border: '1px solid #e2e8f0', borderRadius: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
                  minWidth: 220, zIndex: 999, overflow: 'hidden',
                }}>
                  {/* User info header */}
                  <div style={{
                    padding: '16px', borderBottom: '1px solid rgba(196,145,42,0.18)',
                    background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 100%)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(196,145,42,0.18)',
                        border: '2px solid rgba(196,145,42,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 800, color: '#f5d07a',
                      }}>
                        {getInitials(user.fullName)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.fullName}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center',
                          marginTop: 5, fontSize: 10, fontWeight: 700, color: '#f5d07a',
                          textTransform: 'uppercase', letterSpacing: '0.6px',
                          background: 'rgba(196,145,42,0.15)',
                          border: '1px solid rgba(196,145,42,0.28)',
                          borderRadius: 4, padding: '2px 7px',
                        }}>
                          {getRoleLabel(user.role)}
                        </div>
                      </div>
                    </div>
                    {activeTenant && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
                        paddingTop: 8, borderTop: '1px solid rgba(196,145,42,0.18)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f5d07a', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#f5d07a', fontWeight: 600 }}>
                          Viewing as {activeTenant.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Exit impersonation */}
                  {activeTenant && (
                    <button
                      onClick={handleExitTenant}
                      className="tb-exit-btn"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '10px 16px', width: '100%', fontSize: 12,
                        color: '#92400e', cursor: 'pointer',
                        background: '#fffbeb', border: 'none',
                        borderBottom: '1px solid #fde68a',
                        fontWeight: 600, textAlign: 'left', fontFamily: 'inherit',
                        transition: 'background 0.12s',
                      }}
                    >
                      <ExitIcon />
                      Exit tenant view
                    </button>
                  )}

                  {/* Change password */}
                  <button
                    onClick={() => { setMenuOpen(false); setShowChangePwd(true); }}
                    className="tb-menu-item"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '11px 16px', width: '100%', fontSize: 12,
                      color: '#0f172a', cursor: 'pointer',
                      background: 'none', border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      fontWeight: 500, textAlign: 'left', fontFamily: 'inherit',
                      transition: 'background 0.12s',
                    }}
                  >
                    <span style={{ color: '#c4912a' }}><LockIcon /></span>
                    Change password
                  </button>

                  {/* Sign out */}
                  <button
                    onClick={handleSignOut}
                    className="tb-menu-danger"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '11px 16px', width: '100%', fontSize: 12,
                      color: 'var(--red)', cursor: 'pointer',
                      background: 'none', border: 'none',
                      fontWeight: 500, textAlign: 'left', fontFamily: 'inherit',
                      transition: 'background 0.12s',
                    }}
                  >
                    <SignOutIcon />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Change password modal — rendered outside header so it overlays everything */}
      {showChangePwd && user && (
        <ChangePasswordModal
          email={user.email}
          onClose={() => setShowChangePwd(false)}
        />
      )}
    </>
  );
}
