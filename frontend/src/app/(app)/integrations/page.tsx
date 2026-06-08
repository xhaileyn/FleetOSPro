'use client';
import { useState } from 'react';

const INTEGRATIONS = [
  { id:'gmaps',   name:'Google Maps',        cat:'Routing',       icon:'🗺️',  status:'connected', users:18, desc:'Real-time traffic and route optimization' },
  { id:'xero',    name:'Xero',               cat:'Accounting',    icon:'📊',  status:'connected', users:3,  desc:'Automated invoice and expense sync' },
  { id:'slack',   name:'Slack',              cat:'Notifications', icon:'💬',  status:'connected', users:18, desc:'Alert notifications to #fleet-ops channel' },
  { id:'twilio',  name:'Twilio',             cat:'SMS',           icon:'📱',  status:'connected', users:null,desc:'SMS driver notifications and OTP' },
  { id:'sfdc',    name:'Salesforce',         cat:'CRM',           icon:'☁️',  status:'available', users:null,desc:'Sync fleet data with customer accounts' },
  { id:'qb',      name:'QuickBooks',         cat:'Accounting',    icon:'💰',  status:'available', users:null,desc:'Export cost reports to QuickBooks' },
  { id:'webhook', name:'Webhooks',           cat:'Developer',     icon:'🔗',  status:'connected', users:null,desc:'3 active endpoints · POST events on trigger' },
  { id:'api',     name:'REST API',           cat:'Developer',     icon:'⚡',  status:'connected', users:null,desc:'2 active API keys · 1.2M calls this month' },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const toggle = (id: string) => setIntegrations(p => p.map(i => i.id===id ? { ...i, status: i.status==='connected'?'available':'connected' } : i));

  const connectedCount = integrations.filter(i=>i.status==='connected').length;

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-plug" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Enterprise</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Integrations</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Third-party service connections and API access</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:0 }}>
          {[{ label:'Connected', value:String(connectedCount) },{ label:'Available', value:String(integrations.length-connectedCount) },{ label:'Total', value:String(integrations.length) }].map((s,i)=>(
            <div key={s.label} style={{ textAlign:'center', padding:'0 18px', borderLeft:i>0?'1px solid rgba(196,145,42,0.20)':'none' }}>
              <div style={{ fontSize:20, fontWeight:700, color:'#fff' }}>{s.value}</div>
              <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
        {integrations.map(i=>(
          <div key={i.id} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'20px', display:'flex', alignItems:'flex-start', gap:14 }}>
            <div style={{ fontSize:28, width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--cream)', borderRadius:10, flexShrink:0 }}>{i.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <span style={{ fontWeight:600, color:'var(--ink)', fontSize:14 }}>{i.name}</span>
                <span style={{ fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:3, background:'var(--cream3)', color:'var(--ink3)' }}>{i.cat}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:10 }}>{i.desc}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, fontWeight:600, color:i.status==='connected'?'#c4912a':'var(--ink3)' }}>
                  {i.status==='connected' ? '● Connected' : '○ Not connected'}
                  {i.users && i.status==='connected' && <span style={{ fontWeight:400, color:'var(--ink3)', marginLeft:6 }}>{i.users} users</span>}
                </span>
                <button onClick={()=>toggle(i.id)} style={{ padding:'5px 12px', fontSize:12, borderRadius:5, cursor:'pointer', border:'1px solid var(--border)', background: i.status==='connected'?'transparent':'linear-gradient(135deg,#0d1b2a,#1c2b44)', color: i.status==='connected'?'var(--ink2)':'#f5d07a' }}>
                  {i.status==='connected' ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
