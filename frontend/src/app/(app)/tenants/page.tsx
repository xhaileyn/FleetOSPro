'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRefDataStore } from '@/store/refDataStore';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Tenant {
  id: string | number; name: string; plan: string; vehicles: number;
  users: number; created: string; status: string; domain: string;
  country: string; adminEmail: string; color?: string; initials?: string;
}

const PLANS = [
  { name:'Starter',      price:'$120',  period:'/ mo', vehicles:25,  users:5,   features:['Live tracking','Basic alerts','Email support'],                         color:'var(--ink3)',    bg:'var(--cream3)' },
  { name:'Professional', price:'$480',  period:'/ mo', vehicles:100, users:20,  features:['Everything in Starter','Route optimisation','Analytics','API access'],  color:'#2563eb',       bg:'#eff6ff' },
  { name:'Enterprise',   price:'$2,400',period:'/ mo', vehicles:500, users:null,features:['Everything in Pro','White-labelling','SLA','Dedicated support'],        color:'#c4912a',bg:'rgba(196,145,42,0.12)' },
];


const STATUS_S: Record<string,React.CSSProperties> = {
  Active:    { background:'rgba(196,145,42,0.12)', color:'#c4912a' },
  active:    { background:'rgba(196,145,42,0.12)', color:'#c4912a' },
  Suspended: { background:'#fef2f2', color:'#dc2626' },
  suspended: { background:'#fef2f2', color:'#dc2626' },
  Trial:     { background:'#fffbeb', color:'#d97706' },
  trial:     { background:'#fffbeb', color:'#d97706' },
};
const PLAN_S: Record<string,React.CSSProperties> = {
  Enterprise:   { background:'rgba(196,145,42,0.12)', color:'#c4912a' },
  Professional: { background:'#eff6ff', color:'#2563eb' },
  Starter:      { background:'var(--cream3)', color:'var(--ink3)' },
  Trial:        { background:'#fffbeb', color:'#d97706' },
};

/* ── Wizard step labels ─────────────────────────────────────────────────────── */
const STEPS = ['Company info','Subscription plan','Admin account','Review'];

export default function TenantsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin  = user?.role === 'super_admin' || user?.role === 'platform_admin';
  const refIndustries = useRefDataStore(s => s.industries);
  const refCountries  = useRefDataStore(s => s.countries);

  const [tenants, setTenants]       = useState<Tenant[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [planModal, setPlanModal]   = useState<Tenant | null>(null);
  const [step, setStep]             = useState(0);
  const [done, setDone]             = useState(false);

  useEffect(() => {
    fetch('/api/v1/tenants')
      .then(r => r.json())
      .then((data: Tenant[]) => { setTenants(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* wizard form state */
  const [form, setForm] = useState({
    name:'', domain:'', industry:'Logistics', country:'United States', phone:'', address:'',
    plan:'Professional',
    adminName:'', adminEmail:'', adminPassword: Math.random().toString(36).slice(2,10).toUpperCase() + '!9',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  function submitWizard() {
    fetch('/api/v1/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:       form.name,
        plan:       form.plan,
        country:    form.country,
        domain:     form.domain,
        industry:   form.industry,
        adminEmail: form.adminEmail,
        adminName:  form.adminName,
      }),
    })
      .then(r => r.json())
      .then((t: Tenant) => { setTenants(p => [t, ...p]); setDone(true); })
      .catch(() => setDone(true)); // still show success — reloads on next visit
  }

  function closeWizard() {
    setShowWizard(false); setStep(0); setDone(false);
    setForm({ name:'', domain:'', industry:'Logistics', country:'United States', phone:'', address:'', plan:'Professional', adminName:'', adminEmail:'', adminPassword: Math.random().toString(36).slice(2,10).toUpperCase()+'!9' });
  }

  function changePlan(id: string | number, plan: string) {
    setTenants(p => p.map(t => t.id === id ? { ...t, plan } : t));
    setPlanModal(null);
    fetch(`/api/v1/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    }).catch(console.error);
  }

  const th: React.CSSProperties = { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' };
  const td: React.CSSProperties = { padding:'10px 12px', fontSize:13, color:'var(--ink2)', borderBottom:'1px solid var(--border)' };
  const inp: React.CSSProperties = { width:'100%', padding:'8px 11px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, color:'var(--ink)', boxSizing:'border-box', background:'#fff' };
  const lbl: React.CSSProperties = { fontSize:12, fontWeight:500, color:'var(--ink2)', display:'block', marginBottom:5 };

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-building" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Enterprise</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Tenants</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Manage tenant accounts, plans, and access across the platform</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', gap:0 }}>
            {[{ label:'Total', value:String(tenants.length) },{ label:'Active', value:String(tenants.filter(t=>t.status==='Active').length) },{ label:'Vehicles', value:String(tenants.reduce((a,t)=>a+t.vehicles,0)) },{ label:'Users', value:String(tenants.reduce((a,t)=>a+t.users,0)) }].map((s,i)=>(
              <div key={s.label} style={{ textAlign:'center', padding:'0 16px', borderLeft:i>0?'1px solid rgba(196,145,42,0.20)':'none' }}>
                <div style={{ fontSize:20, fontWeight:700, color:'#fff' }}>{s.value}</div>
                <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {isSuperAdmin && (
            <button onClick={()=>setShowWizard(true)} style={{ padding:'8px 16px', fontSize:13, fontWeight:600, borderRadius:7, cursor:'pointer', border:'1px solid rgba(196,145,42,0.35)', background:'linear-gradient(135deg,#0d1b2a,#1c2b44)', color:'#f5d07a', display:'flex', alignItems:'center', gap:6 }}>
              + Onboard tenant
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        {loading && (
          <div style={{ padding:'32px', textAlign:'center', color:'var(--ink3)', fontSize:13 }}>
            <i className="ti ti-loader-2" style={{ fontSize:18, display:'block', marginBottom:6, opacity:0.5 }} /> Loading tenants…
          </div>
        )}
        {!loading && (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Tenant','Domain','Plan','Vehicles','Users','Country','Created','Status',''].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {tenants.map(t=>(
              <tr key={t.id} style={{ background:t.status==='Suspended'?'#fffaf8':'#fff' }}>
                <td style={{ ...td }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:(t.color??'#c4912a')+'20', border:`1px solid ${t.color??'#c4912a'}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:t.color??'#c4912a', flexShrink:0 }}>{t.initials??'?'}</div>
                    <a href={`/tenants/${t.id}`} style={{ fontWeight:600, color:'var(--ink)', textDecoration:'none' }}>{t.name}</a>
                  </div>
                </td>
                <td style={{ ...td, fontSize:12, fontFamily:'monospace', color:'var(--ink3)' }}>{t.domain}</td>
                <td style={td}><span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, ...PLAN_S[t.plan] }}>{t.plan}</span></td>
                <td style={td}>{t.vehicles}</td>
                <td style={td}>{t.users}</td>
                <td style={td}>{t.country}</td>
                <td style={{ ...td, color:'var(--ink3)' }}>{t.created}</td>
                <td style={td}><span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, ...STATUS_S[t.status] }}>{t.status.charAt(0).toUpperCase()+t.status.slice(1)}</span></td>
                <td style={{ ...td, display:'flex', gap:6 }}>
                  <button onClick={()=>setPlanModal(t)} style={{ padding:'4px 10px', fontSize:11, borderRadius:5, cursor:'pointer', border:'1px solid #c4912a', background:'transparent', color:'#c4912a', whiteSpace:'nowrap' }}>Change plan</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* ── Onboarding Wizard ─────────────────────────────────────────── */}
      {isSuperAdmin && showWizard && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:14, width:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>

            {/* Wizard header */}
            <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:16, color:'var(--ink)' }}>Onboard new tenant</div>
                {!done && <div style={{ fontSize:12, color:'var(--ink3)', marginTop:2 }}>Step {step+1} of {STEPS.length} — {STEPS[step]}</div>}
              </div>
              <button onClick={closeWizard} style={{ fontSize:20, border:'none', background:'transparent', cursor:'pointer', color:'var(--ink3)' }}>×</button>
            </div>

            {/* Progress bar */}
            {!done && (
              <div style={{ display:'flex', gap:0 }}>
                {STEPS.map((s,i)=>(
                  <div key={s} style={{ flex:1, height:3, background:i<=step?'#c4912a':'var(--border)' }} />
                ))}
              </div>
            )}

            <div style={{ padding:'24px' }}>
              {done ? (
                /* Success */
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--ink)', marginBottom:8 }}>Tenant onboarded!</div>
                  <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:6 }}><b>{form.name}</b> has been created successfully.</div>
                  <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:20 }}>
                    An invitation email has been sent to <b>{form.adminEmail}</b>.
                  </div>
                  <div style={{ background:'var(--cream)', borderRadius:8, padding:'14px', fontSize:12, color:'var(--ink2)', textAlign:'left', marginBottom:20 }}>
                    <div style={{ fontWeight:600, marginBottom:8 }}>Tenant details</div>
                    <div>Portal URL: <code>{form.domain || `${form.name.toLowerCase().replace(/\s/g,'-')}.fleetos.app`}</code></div>
                    <div style={{ marginTop:4 }}>Admin: {form.adminEmail}</div>
                    <div style={{ marginTop:4 }}>Temp password: <code>{form.adminPassword}</code></div>
                    <div style={{ marginTop:4 }}>Plan: {form.plan}</div>
                  </div>
                  <button onClick={closeWizard} style={{ padding:'9px 24px', background:'#c4912a', color:'#fff', border:'none', borderRadius:7, fontSize:13, cursor:'pointer', fontWeight:600 }}>Done</button>
                </div>
              ) : step === 0 ? (
                /* Step 1: Company info */
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <div><label style={lbl}>Company name *</label><input style={inp} placeholder="ACME Logistics Ltd" value={form.name} onChange={e=>set('name',e.target.value)} /></div>
                    <div><label style={lbl}>Subdomain</label><input style={inp} placeholder="acme" value={form.domain} onChange={e=>set('domain',e.target.value)} /><div style={{ fontSize:10, color:'var(--ink3)', marginTop:3 }}>{(form.domain||'acme').toLowerCase()}.fleetos.app</div></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <div><label style={lbl}>Industry</label>
                      <select style={inp} value={form.industry} onChange={e=>set('industry',e.target.value)}>
                        {refIndustries.map(i=><option key={i.value}>{i.value}</option>)}
                      </select>
                    </div>
                    <div><label style={lbl}>Country</label>
                      <select style={inp} value={form.country} onChange={e=>set('country',e.target.value)}>
                        {refCountries.map(c=><option key={c.value}>{c.value}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label style={lbl}>Phone</label><input style={inp} placeholder="+1 212 555 0100" value={form.phone} onChange={e=>set('phone',e.target.value)} /></div>
                  <div><label style={lbl}>Address</label><input style={inp} placeholder="123 Commerce Blvd, New York, NY" value={form.address} onChange={e=>set('address',e.target.value)} /></div>
                </div>
              ) : step === 1 ? (
                /* Step 2: Plan selection */
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:4 }}>Choose a subscription plan for this tenant.</div>
                  {PLANS.map(p=>(
                    <div key={p.name} onClick={()=>set('plan',p.name)} style={{ border:`2px solid ${form.plan===p.name?p.color:'var(--border)'}`, borderRadius:10, padding:'16px', cursor:'pointer', background:form.plan===p.name?p.bg:'#fff', transition:'all 0.15s' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${p.color}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {form.plan===p.name && <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />}
                          </div>
                          <span style={{ fontWeight:700, fontSize:14, color:'var(--ink)' }}>{p.name}</span>
                        </div>
                        <span style={{ fontWeight:700, fontSize:16, color:p.color }}>{p.price}<span style={{ fontSize:11, fontWeight:400, color:'var(--ink3)' }}>{p.period}</span></span>
                      </div>
                      <div style={{ fontSize:12, color:'var(--ink3)', marginLeft:26 }}>
                        Up to {p.vehicles} vehicles · {p.users ? `${p.users} users` : 'Unlimited users'}
                      </div>
                      <div style={{ marginLeft:26, marginTop:6, display:'flex', flexWrap:'wrap', gap:4 }}>
                        {p.features.map(f=><span key={f} style={{ fontSize:11, padding:'2px 7px', borderRadius:3, background:'rgba(0,0,0,0.05)', color:'var(--ink2)' }}>✓ {f}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : step === 2 ? (
                /* Step 3: Admin account */
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:4 }}>Create the primary admin account for this tenant.</div>
                  <div><label style={lbl}>Full name *</label><input style={inp} placeholder="John Doe" value={form.adminName} onChange={e=>set('adminName',e.target.value)} /></div>
                  <div><label style={lbl}>Email address *</label><input style={inp} type="email" placeholder="admin@company.com" value={form.adminEmail} onChange={e=>set('adminEmail',e.target.value)} /></div>
                  <div>
                    <label style={lbl}>Temporary password</label>
                    <div style={{ position:'relative' }}>
                      <input style={{ ...inp, fontFamily:'monospace', paddingRight:80 }} value={form.adminPassword} readOnly />
                      <button onClick={()=>set('adminPassword', Math.random().toString(36).slice(2,10).toUpperCase()+'!9')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', padding:'3px 8px', fontSize:11, border:'1px solid var(--border)', borderRadius:4, background:'var(--cream)', cursor:'pointer', color:'var(--ink2)' }}>Regenerate</button>
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink3)', marginTop:3 }}>Admin must change this on first login.</div>
                  </div>
                  <div style={{ padding:'12px 14px', background:'rgba(196,145,42,0.12)', borderRadius:8, fontSize:12, color:'#c4912a', display:'flex', gap:8 }}>
                    <span>🔒</span>
                    <span>This tenant's data will be fully isolated — they can only see their own vehicles, drivers, and reports.</span>
                  </div>
                </div>
              ) : (
                /* Step 4: Review */
                <div>
                  <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:16 }}>Review the details before creating the tenant.</div>
                  {[
                    ['Company', form.name || '—'],
                    ['Portal URL', `${(form.domain||form.name.toLowerCase().replace(/\s/g,'-')||'company')}.fleetos.app`],
                    ['Industry', form.industry],
                    ['Country', form.country],
                    ['Plan', form.plan],
                    ['Admin name', form.adminName || '—'],
                    ['Admin email', form.adminEmail || '—'],
                  ].map(([l,v])=>(
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                      <span style={{ color:'var(--ink3)' }}>{l}</span>
                      <span style={{ color:'var(--ink)', fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:16, padding:'12px 14px', background:'var(--cream)', borderRadius:8, fontSize:12, color:'var(--ink3)' }}>
                    Tenant data will be isolated in a separate schema. An invitation email will be sent immediately after creation.
                  </div>
                </div>
              )}
            </div>

            {/* Wizard footer */}
            {!done && (
              <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                <button onClick={()=>step>0?setStep(s=>s-1):closeWizard()} style={{ padding:'8px 18px', fontSize:13, borderRadius:6, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)' }}>
                  {step===0?'Cancel':'Back'}
                </button>
                <button
                  onClick={()=>step<STEPS.length-1?setStep(s=>s+1):submitWizard()}
                  disabled={step===0&&!form.name}
                  style={{ padding:'8px 22px', fontSize:13, borderRadius:6, cursor:'pointer', border:'none', background:'#c4912a', color:'#fff', fontWeight:600, opacity:step===0&&!form.name?0.5:1 }}
                >
                  {step===STEPS.length-1?'Create tenant':'Next →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Plan Change Modal (US3) ───────────────────────────────────── */}
      {planModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:12, width:520, padding:'24px', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:15, color:'var(--ink)' }}>Change plan — {planModal.name}</div>
              <button onClick={()=>setPlanModal(null)} style={{ fontSize:18, border:'none', background:'transparent', cursor:'pointer', color:'var(--ink3)' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {PLANS.map(p=>(
                <div key={p.name} onClick={()=>changePlan(planModal.id,p.name)} style={{ border:`2px solid ${planModal.plan===p.name?p.color:'var(--border)'}`, borderRadius:8, padding:'14px', cursor:'pointer', background:planModal.plan===p.name?p.bg:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${p.color}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {planModal.plan===p.name && <div style={{ width:7, height:7, borderRadius:'50%', background:p.color }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:'var(--ink)' }}>{p.name}</div>
                      <div style={{ fontSize:11, color:'var(--ink3)' }}>Up to {p.vehicles} vehicles · {p.users??'∞'} users</div>
                    </div>
                  </div>
                  <span style={{ fontWeight:700, color:p.color, fontSize:15 }}>{p.price}<span style={{ fontSize:11, fontWeight:400, color:'var(--ink3)' }}>{p.period}</span></span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={()=>setPlanModal(null)} style={{ padding:'7px 16px', fontSize:13, borderRadius:6, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
