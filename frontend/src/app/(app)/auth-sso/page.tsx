'use client';
import { useState } from 'react';

const PROVIDERS = [
  { id:'google', name:'Google Workspace', icon:'G', color:'#ea4335', status:'connected', users:14, desc:'Sign in with @yourdomain.com accounts' },
  { id:'azure',  name:'Microsoft Azure AD', icon:'M', color:'#0078d4', status:'available', users:0, desc:'Enterprise single sign-on via Azure Active Directory' },
  { id:'okta',   name:'Okta',             icon:'O', color:'#007dc1', status:'available', users:0, desc:'Connect your Okta organization for SSO' },
  { id:'saml',   name:'SAML 2.0',         icon:'S', color:'#6366f1', status:'available', users:0, desc:'Generic SAML 2.0 identity provider' },
  { id:'ldap',   name:'LDAP / Active Directory', icon:'L', color:'#374151', status:'available', users:0, desc:'Connect to on-premise directory services' },
];

export default function SsoPage() {
  const [providers, setProviders] = useState(PROVIDERS);
  const toggle = (id: string) => setProviders(p => p.map(pr => pr.id===id ? { ...pr, status: pr.status==='connected'?'available':'connected', users: pr.status==='connected'?0:8 } : pr));

  const connectedCount = providers.filter(p => p.status === 'connected').length;
  const totalUsers     = providers.filter(p => p.status === 'connected').reduce((s, p) => s + p.users, 0);

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border: '1px solid rgba(196,145,42,0.18)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 20,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-key" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Security &amp; Auth</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>OAuth / SSO</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Identity provider integrations &amp; single sign-on</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:0 }}>
          {[
            { label:'Providers',  value: String(providers.length) },
            { label:'Connected',  value: String(connectedCount) },
            { label:'SSO Users',  value: String(totalUsers) },
          ].map((s,i) => (
            <div key={s.label} style={{ textAlign:'center', padding:'0 18px', borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none' }}>
              <div style={{ fontSize:20, fontWeight:700, color:'#fff' }}>{s.value}</div>
              <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {providers.map(p=>(
          <div key={p.id} style={{ background:'#fff', border:`1px solid ${p.status==='connected'?'rgba(196,145,42,0.45)':'var(--border)'}`, borderRadius:10, padding:'18px 20px', display:'flex', alignItems:'center', gap:16,
            boxShadow: p.status==='connected' ? '0 0 0 3px rgba(196,145,42,0.08)' : 'none' }}>
            <div style={{ width:44, height:44, borderRadius:10, background:p.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:700, flexShrink:0 }}>{p.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
                <span style={{ fontWeight:600, color:'var(--ink)', fontSize:14 }}>{p.name}</span>
                {p.status==='connected' && <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, background:'rgba(196,145,42,0.12)', color:'#c4912a', border:'1px solid rgba(196,145,42,0.25)' }}>Connected · {p.users} users</span>}
              </div>
              <div style={{ fontSize:12, color:'var(--ink3)' }}>{p.desc}</div>
            </div>
            <button onClick={()=>toggle(p.id)} style={{ padding:'7px 16px', fontSize:13, borderRadius:6, cursor:'pointer', flexShrink:0,
              border: p.status==='connected' ? '1px solid var(--border)' : '1px solid rgba(196,145,42,0.35)',
              background: p.status==='connected' ? 'transparent' : 'linear-gradient(135deg,#0d1b2a,#1c2b44)',
              color: p.status==='connected' ? 'var(--ink2)' : '#f5d07a' }}>
              {p.status==='connected' ? 'Disconnect' : 'Configure'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
