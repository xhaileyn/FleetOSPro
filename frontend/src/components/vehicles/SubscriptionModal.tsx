'use client';
import { useState } from 'react';
import {
  PLANS, PLAN_ORDER, SERVICES, PlanName, ServiceKey,
  getSubscription, computeSubStatus, daysUntilSubExpiry,
  saveSubscription, VehicleSubscription,
  getCustomPlans, CustomPlanDef, currencySymbol,
} from '@/lib/subscriptions';
import { VehicleMaster, TENANTS_META } from '@/lib/vehiclesMaster';

/* ── helpers ─────────────────────────────────────────────────────────── */
const DURATIONS = [
  { label: '1 month',  months: 1  },
  { label: '3 months', months: 3  },
  { label: '6 months', months: 6  },
  { label: '1 year',   months: 12, badge: 'Save 2 months' },
];

function addMonths(base: string, n: number): string {
  const d = new Date(base);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  Active:          { background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7' },
  'Expiring Soon': { background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' },
  Expired:         { background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' },
  Suspended:       { background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' },
};

const CATEGORY_ORDER = ['Connectivity','Tracking','Alerts','Control','Analytics','Integration'] as const;

/* ── component ───────────────────────────────────────────────────────── */
interface Props {
  vehicle: VehicleMaster;
  onClose: () => void;
  onSaved: () => void;
}

export function SubscriptionModal({ vehicle, onClose, onSaved }: Props) {
  const existing   = getSubscription(vehicle.id);
  const curStatus  = existing ? computeSubStatus(existing) : null;
  const TODAY      = '2026-05-28';

  const tenantCustomPlans = getCustomPlans(vehicle.tenantId).filter(p => p.status === 'active');

  /* form state */
  const [tab,         setTab]         = useState<'plans' | 'compare'>('plans');
  const [plan,        setPlan]        = useState<PlanName>(existing?.plan ?? 'Professional');
  const [customPlanId,setCustomPlanId]= useState<string | null>(existing?.customPlanId ?? null);
  const [durIdx,      setDurIdx]      = useState(3);          // default 12 months
  const [autoRenew,   setAutoRenew]   = useState(existing?.autoRenew ?? true);
  const [email,       setEmail]       = useState(existing?.contactEmail ?? '');
  const [sms,         setSms]         = useState((existing?.smsNumbers ?? ['']).join(', '));
  const [saving,      setSaving]      = useState(false);
  const [done,        setDone]        = useState(false);

  const dur              = DURATIONS[durIdx];
  const planDef          = PLANS[plan];
  const selectedCustom   = customPlanId ? tenantCustomPlans.find(p => p.id === customPlanId) ?? null : null;
  const expiry           = addMonths(TODAY, dur.months);
  const activeName       = selectedCustom ? selectedCustom.name : plan;
  const activeColor      = selectedCustom ? selectedCustom.color : planDef.color;
  const activePrice      = selectedCustom ? selectedCustom.price : planDef.price;
  const activeCurrSym    = selectedCustom ? currencySymbol(selectedCustom.currency) : '$';
  const activeServices   = selectedCustom ? selectedCustom.services : planDef.services;
  const total            = activePrice * dur.months;
  const monthly          = activePrice;

  function handleSubscribe() {
    setSaving(true);
    setTimeout(() => {
      const sub: VehicleSubscription = {
        vehicleId:    vehicle.id,
        plan,
        customPlanId: customPlanId ?? undefined,
        startDate:    TODAY,
        expiryDate:   expiry,
        autoRenew,
        contactEmail: email.trim() || undefined,
        smsNumbers:   sms.split(',').map(s => s.trim()).filter(Boolean),
      };
      saveSubscription(sub);
      setSaving(false);
      setDone(true);
      setTimeout(() => { onSaved(); onClose(); }, 1000);
    }, 700);
  }

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div
      style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1300,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      onClick={onClose}
    >
      <div
        style={{ background:'#fff',borderRadius:16,width:'min(860px,96vw)',maxHeight:'94vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 64px rgba(0,0,0,0.28)',overflow:'hidden' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fafafa',flexShrink:0 }}>
          <div>
            <div style={{ fontSize:15,fontWeight:700,color:'var(--ink)' }}>Subscription Plans</div>
            <div style={{ fontSize:12,color:'var(--ink3)',marginTop:2 }}>
              <span style={{ fontWeight:700,fontFamily:'monospace',color:'#c4912a' }}>{vehicle.plate}</span>
              {' · '}{vehicle.year} {vehicle.make} {vehicle.model}
              {TENANTS_META[vehicle.tenantId] && <span style={{ marginLeft:8,fontSize:10 }}>({TENANTS_META[vehicle.tenantId].name})</span>}
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            {/* tab switcher */}
            {(['plans','compare'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:'5px 14px',borderRadius:20,border:'1px solid var(--border)',background:tab===t?'var(--ink)':'transparent',color:tab===t?'#fff':'var(--ink2)',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit',textTransform:'capitalize' }}>
                {t === 'compare' ? '⚖ Compare' : '📦 Plans'}
              </button>
            ))}
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:18,cursor:'pointer',color:'var(--ink3)',lineHeight:1,padding:4 }}>✕</button>
          </div>
        </div>

        {/* ── Current subscription banner ─────────────────────────── */}
        {existing && curStatus && (
          <div style={{ padding:'8px 20px',background: curStatus==='Expired'?'#fef2f2': curStatus==='Expiring Soon'?'#fffbeb':'#f0fdf4',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,fontSize:12,flexShrink:0 }}>
            <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:4,...STATUS_STYLE[curStatus] }}>{curStatus}</span>
            <span style={{ color:'var(--ink2)' }}>
              Current plan: <strong style={{ color: existing.customPlanId ? (tenantCustomPlans.find(p => p.id === existing.customPlanId)?.color ?? PLANS[existing.plan].color) : PLANS[existing.plan].color }}>
                {existing.customPlanId ? (tenantCustomPlans.find(p => p.id === existing.customPlanId)?.name ?? existing.plan) : existing.plan}
              </strong>
              {' · '}Expires {new Date(existing.expiryDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
              {curStatus==='Expiring Soon' && <span style={{ color:'#92400e' }}> ({daysUntilSubExpiry(existing.expiryDate)}d left)</span>}
              {curStatus==='Expired'       && <span style={{ color:'#991b1b' }}> ({Math.abs(daysUntilSubExpiry(existing.expiryDate))}d ago)</span>}
            </span>
            {curStatus==='Expired' && <span style={{ marginLeft:'auto',fontSize:11,fontWeight:600,color:'#991b1b' }}>⚠ Services suspended — renew below</span>}
          </div>
        )}

        <div style={{ overflowY:'auto',flex:1 }}>

          {/* ════════════════ PLANS TAB ════════════════ */}
          {tab === 'plans' && (
            <div style={{ padding:'18px 20px',display:'flex',flexDirection:'column',gap:18 }}>

              {/* Standard plan cards */}
              <div>
                <div style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,color:'var(--ink3)',marginBottom:8 }}>Standard Plans</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10 }}>
                  {PLAN_ORDER.map(p => {
                    const def    = PLANS[p];
                    const active = !customPlanId && plan === p;
                    return (
                      <button key={p} onClick={() => { setPlan(p); setCustomPlanId(null); }} style={{ padding:'14px 12px',borderRadius:12,cursor:'pointer',textAlign:'left',fontFamily:'inherit',border: active?`2.5px solid ${def.color}`:'1.5px solid var(--border)',background: active?def.color+'0f':'#fff',position:'relative',transition:'all 0.15s' }}>
                        {def.highlight && <span style={{ position:'absolute',top:-9,left:'50%',transform:'translateX(-50%)',fontSize:9,fontWeight:700,padding:'2px 10px',borderRadius:20,background:def.color,color:'#fff',whiteSpace:'nowrap' }}>MOST POPULAR</span>}
                        <div style={{ fontSize:14,fontWeight:700,color:def.color,marginBottom:2 }}>{def.name}</div>
                        <div style={{ fontSize:20,fontWeight:800,color:'var(--ink)',lineHeight:1,marginBottom:4 }}>
                          ${def.price}<span style={{ fontSize:10,fontWeight:400,color:'var(--ink3)' }}>/mo</span>
                        </div>
                        <div style={{ fontSize:10,color:'var(--ink3)',lineHeight:1.4,marginBottom:8 }}>{def.tagline}</div>
                        <div style={{ display:'flex',flexDirection:'column',gap:3 }}>
                          {def.services.slice(0,4).map(s => {
                            const sdef = SERVICES.find(x => x.key===s);
                            return <div key={s} style={{ fontSize:10,color:'var(--ink2)',display:'flex',alignItems:'center',gap:4 }}><span style={{ color:def.color }}>✓</span>{sdef?.label}</div>;
                          })}
                          {def.services.length > 4 && <div style={{ fontSize:10,color:'var(--ink3)',marginTop:2 }}>+{def.services.length-4} more services</div>}
                        </div>
                        {active && <div style={{ position:'absolute',top:10,right:10,width:16,height:16,borderRadius:'50%',background:def.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',fontWeight:700 }}>✓</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom plan cards (tenant-specific) */}
              {tenantCustomPlans.length > 0 && (
                <div>
                  <div style={{ height:1,background:'var(--border)',marginBottom:14 }} />
                  <div style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,color:'var(--ink3)',marginBottom:8 }}>
                    Custom Plans · {TENANTS_META[vehicle.tenantId]?.name ?? 'Your Tenant'}
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10 }}>
                    {tenantCustomPlans.map(cp => {
                      const active = customPlanId === cp.id;
                      return (
                        <button key={cp.id} onClick={() => setCustomPlanId(cp.id)} style={{ padding:'14px 12px',borderRadius:12,cursor:'pointer',textAlign:'left',fontFamily:'inherit',border: active?`2.5px solid ${cp.color}`:'1.5px solid var(--border)',background: active?cp.color+'0f':'#fff',position:'relative',transition:'all 0.15s' }}>
                          {cp.highlight && <span style={{ position:'absolute',top:-9,left:'50%',transform:'translateX(-50%)',fontSize:9,fontWeight:700,padding:'2px 10px',borderRadius:20,background:cp.color,color:'#fff',whiteSpace:'nowrap' }}>POPULAR</span>}
                          <div style={{ fontSize:14,fontWeight:700,color:cp.color,marginBottom:2 }}>{cp.name}</div>
                          <div style={{ fontSize:18,fontWeight:800,color:'var(--ink)',lineHeight:1,marginBottom:4 }}>
                            {currencySymbol(cp.currency)}{cp.price.toLocaleString()}<span style={{ fontSize:10,fontWeight:400,color:'var(--ink3)' }}>/mo</span>
                          </div>
                          <div style={{ fontSize:10,color:'var(--ink3)',lineHeight:1.4,marginBottom:8 }}>{cp.tagline}</div>
                          <div style={{ display:'flex',flexDirection:'column',gap:3 }}>
                            {cp.services.slice(0,4).map(s => {
                              const sdef = SERVICES.find(x => x.key===s);
                              return <div key={s} style={{ fontSize:10,color:'var(--ink2)',display:'flex',alignItems:'center',gap:4 }}><span style={{ color:cp.color }}>✓</span>{sdef?.label}</div>;
                            })}
                            {cp.services.length > 4 && <div style={{ fontSize:10,color:'var(--ink3)',marginTop:2 }}>+{cp.services.length-4} more services</div>}
                          </div>
                          {active && <div style={{ position:'absolute',top:10,right:10,width:16,height:16,borderRadius:'50%',background:cp.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',fontWeight:700 }}>✓</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Duration */}
              <div>
                <div style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,color:'var(--ink3)',marginBottom:8 }}>Billing Duration</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                  {DURATIONS.map((d,i) => (
                    <button key={d.months} onClick={() => setDurIdx(i)} style={{ padding:'9px 8px',borderRadius:9,cursor:'pointer',fontFamily:'inherit',border: durIdx===i?`2px solid #c4912a`:'1.5px solid var(--border)',background: durIdx===i?'rgba(196,145,42,0.12)':'#fff',color: durIdx===i?'#c4912a':'var(--ink2)',fontWeight: durIdx===i?700:400,fontSize:12,transition:'all 0.12s',position:'relative' }}>
                      {d.label}
                      {'badge' in d && <div style={{ fontSize:8,color:'#c4912a',fontWeight:700,marginTop:2 }}>{d.badge}</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates + SMS/Email */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                <div style={{ padding:'10px 14px',background:'#f8fafc',borderRadius:9,border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,color:'var(--ink3)',marginBottom:6 }}>Coverage Period</div>
                  <div style={{ fontSize:12,color:'var(--ink2)' }}>
                    <strong style={{ color:'var(--ink)' }}>{new Date(TODAY).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</strong>
                    <span style={{ margin:'0 6px',color:'var(--ink3)' }}>→</span>
                    <strong style={{ color:'#c4912a' }}>{new Date(expiry).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</strong>
                  </div>
                  <div style={{ fontSize:10,color:'var(--ink3)',marginTop:3 }}>Activates immediately upon subscription</div>
                </div>
                <div style={{ padding:'10px 14px',background:'#f8fafc',borderRadius:9,border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,color:'var(--ink3)',marginBottom:4 }}>Auto-Renew</div>
                    <div style={{ fontSize:11,color:'var(--ink2)' }}>Renew automatically on expiry</div>
                  </div>
                  <button onClick={() => setAutoRenew(r => !r)} style={{ width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',background:autoRenew?'#c4912a':'#d1d5db',position:'relative',flexShrink:0,transition:'background 0.2s' }}>
                    <span style={{ position:'absolute',top:3,left:autoRenew?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              </div>

              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,color:'var(--ink3)',display:'block',marginBottom:6 }}>Contact Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="billing@company.com" style={{ width:'100%',padding:'8px 11px',border:'1px solid var(--border)',borderRadius:8,fontSize:12,fontFamily:'inherit',outline:'none',background:'#fff',boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,color:'var(--ink3)',display:'block',marginBottom:6 }}>
                    SMS Alert Numbers {!activeServices.includes('sms_alert') && <span style={{ color:'#9ca3af',fontWeight:400,textTransform:'none' }}>(not in {activeName} plan)</span>}
                  </label>
                  <input value={sms} onChange={e => setSms(e.target.value)} placeholder="+254722000001, +254733000002" disabled={!activeServices.includes('sms_alert')} style={{ width:'100%',padding:'8px 11px',border:'1px solid var(--border)',borderRadius:8,fontSize:12,fontFamily:'monospace',outline:'none',background: activeServices.includes('sms_alert')?'#fff':'#f9fafb',boxSizing:'border-box',color: activeServices.includes('sms_alert')?'var(--ink)':'#9ca3af' }} />
                </div>
              </div>

              {/* Pricing summary + CTA */}
              <div style={{ background: activeColor+'0a',border:`1.5px solid ${activeColor}30`,borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12 }}>
                <div>
                  <div style={{ fontSize:11,color:'var(--ink3)',marginBottom:2 }}>{activeName} · {dur.label} · {vehicle.plate}</div>
                  <div style={{ display:'flex',alignItems:'baseline',gap:6 }}>
                    <span style={{ fontSize:28,fontWeight:800,color:activeColor }}>{activeCurrSym}{total.toLocaleString()}</span>
                    <span style={{ fontSize:12,color:'var(--ink3)' }}>{selectedCustom ? selectedCustom.currency : 'USD'} total</span>
                    {dur.months > 1 && <span style={{ fontSize:11,color:'var(--ink3)' }}>({activeCurrSym}{monthly.toLocaleString()}/mo × {dur.months})</span>}
                  </div>
                  <div style={{ fontSize:10,color:'var(--ink3)',marginTop:2 }}>{activeServices.length} services included · {autoRenew ? '🔄 Auto-renews' : '⚠ Manual renewal'}</div>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={saving || done}
                  style={{ padding:'12px 28px',borderRadius:10,border:'none',background: done?'#10b981':activeColor,color:'#fff',fontSize:14,fontWeight:700,cursor: saving||done?'default':'pointer',fontFamily:'inherit',transition:'background 0.2s',minWidth:190,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}
                >
                  {done ? '✓ Activated!' : saving ? '⏳ Activating…' : `Subscribe · ${activeName}`}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════ COMPARE TAB ════════════════ */}
          {tab === 'compare' && (
            <div style={{ padding:'18px 20px' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:'left',padding:'8px 10px',fontSize:10,fontWeight:700,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:0.8,width:'34%',borderBottom:'2px solid var(--border)' }}>Service</th>
                    {PLAN_ORDER.map(p => (
                      <th key={p} style={{ textAlign:'center',padding:'8px 6px',borderBottom:'2px solid var(--border)',width:'16.5%' }}>
                        <div style={{ fontWeight:700,color:PLANS[p].color,fontSize:12 }}>{p}</div>
                        <div style={{ fontSize:11,color:'var(--ink3)',fontWeight:400 }}>${PLANS[p].price}/mo</div>
                        {PLANS[p].highlight && <div style={{ fontSize:8,fontWeight:700,padding:'1px 6px',borderRadius:3,background:PLANS[p].color,color:'#fff',display:'inline-block',marginTop:3 }}>POPULAR</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORY_ORDER.map(cat => {
                    const catServices = SERVICES.filter(s => s.category === cat);
                    if (!catServices.length) return null;
                    return [
                      <tr key={`cat-${cat}`}>
                        <td colSpan={5} style={{ padding:'10px 10px 4px',fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'var(--ink3)',background:'var(--cream)',borderTop:'1px solid var(--border)' }}>{cat}</td>
                      </tr>,
                      ...catServices.map((svc, i) => (
                        <tr key={svc.key} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding:'9px 10px',borderBottom:'1px solid var(--border)' }}>
                            <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                              <span style={{ fontSize:14 }}>{svc.icon}</span>
                              <div>
                                <div style={{ fontWeight:600,color:'var(--ink)',fontSize:12 }}>{svc.label}</div>
                                <div style={{ fontSize:10,color:'var(--ink3)',marginTop:1 }}>{svc.description}</div>
                              </div>
                            </div>
                          </td>
                          {PLAN_ORDER.map(p => {
                            const inc = PLANS[p].services.includes(svc.key);
                            return (
                              <td key={p} style={{ textAlign:'center',padding:'9px 6px',borderBottom:'1px solid var(--border)' }}>
                                {inc
                                  ? <span style={{ fontSize:15,color:PLANS[p].color }}>✓</span>
                                  : <span style={{ fontSize:12,color:'#d1d5db' }}>—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      )),
                    ];
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background:'var(--cream)' }}>
                    <td style={{ padding:'10px',fontWeight:700,fontSize:12,color:'var(--ink)',borderTop:'2px solid var(--border)' }}>Monthly price</td>
                    {PLAN_ORDER.map(p => (
                      <td key={p} style={{ textAlign:'center',padding:'10px 6px',borderTop:'2px solid var(--border)' }}>
                        <button
                          onClick={() => { setPlan(p); setTab('plans'); }}
                          style={{ padding:'6px 14px',borderRadius:8,border:`1.5px solid ${PLANS[p].color}`,background: plan===p?PLANS[p].color:'transparent',color: plan===p?'#fff':PLANS[p].color,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s' }}
                        >
                          ${PLANS[p].price}/mo
                        </button>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
