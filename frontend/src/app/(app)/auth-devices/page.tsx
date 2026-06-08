'use client';
import { useState } from 'react';

const SEED = [
  { id:1, name:'MacBook Pro (M3)',  user:'A. Khan',      os:'macOS 14.4',   browser:'Chrome 124', first:'01 Jan 2026', last:'Today',      trusted:true },
  { id:2, name:'MacBook Pro',       user:'Ali Hassan',   os:'macOS 14.3',   browser:'Chrome 124', first:'15 Jan 2026', last:'Today',      trusted:true },
  { id:3, name:'iPhone 15 Pro',     user:'Grace Njeri',  os:'iOS 17.4',     browser:'Safari 17',  first:'02 Feb 2026', last:'Today',      trusted:true },
  { id:4, name:'Dell XPS 15',       user:'James Mwangi', os:'Windows 11',   browser:'Edge 124',   first:'10 Mar 2026', last:'Yesterday',  trusted:true },
  { id:5, name:'iPad Pro',          user:'Billing User', os:'iPadOS 17',    browser:'Safari 17',  first:'05 Apr 2026', last:'2 days ago', trusted:true },
  { id:6, name:'Unknown Android',   user:'— Unknown',    os:'Android 13',   browser:'Chrome 123', first:'20 May 2026', last:'20 May 2026',trusted:false },
];

export default function AuthDevicesPage() {
  const [devs, setDevs] = useState(SEED);
  const toggle = (id: number) => setDevs(p => p.map(d => d.id===id ? { ...d, trusted:!d.trusted } : d));
  const remove = (id: number) => setDevs(p => p.filter(d => d.id !== id));

  const th: React.CSSProperties = { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' };
  const td: React.CSSProperties = { padding:'10px 12px', fontSize:13, color:'var(--ink2)', borderBottom:'1px solid var(--border)' };

  const trustedCount = devs.filter(d => d.trusted).length;
  const blockedCount = devs.filter(d => !d.trusted).length;

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border: '1px solid rgba(196,145,42,0.18)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 20,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-device-laptop" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Security &amp; Auth</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Device Authorization</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Manage trusted and blocked devices accessing the platform</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: 'Total Devices', value: String(devs.length) },
            { label: 'Trusted',       value: String(trustedCount) },
            { label: 'Blocked',       value: String(blockedCount) },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '0 18px', borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Device','User','OS','Browser','First seen','Last seen','Trusted',''].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {devs.map(d=>(
              <tr key={d.id} style={{ background:d.trusted?'#fff':'#fffaf8' }}>
                <td style={{ ...td, fontWeight:500, color:'var(--ink)' }}>{d.name}</td>
                <td style={{ ...td, color:d.user.startsWith('—')?'var(--ink3)':'var(--ink2)', fontStyle:d.user.startsWith('—')?'italic':'normal' }}>{d.user}</td>
                <td style={{ ...td, fontSize:12 }}>{d.os}</td>
                <td style={{ ...td, fontSize:12 }}>{d.browser}</td>
                <td style={{ ...td, color:'var(--ink3)', fontSize:12 }}>{d.first}</td>
                <td style={{ ...td, color:'var(--ink3)', fontSize:12 }}>{d.last}</td>
                <td style={td}>
                  <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, background:d.trusted?'rgba(196,145,42,0.12)':'#fef2f2', color:d.trusted?'#c4912a':'#dc2626', border:`1px solid ${d.trusted?'rgba(196,145,42,0.25)':'#fecaca'}` }}>{d.trusted?'Trusted':'Blocked'}</span>
                </td>
                <td style={{ ...td, display:'flex', gap:6 }}>
                  <button onClick={()=>toggle(d.id)} style={{ padding:'4px 10px', fontSize:11, borderRadius:5, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)' }}>{d.trusted?'Block':'Trust'}</button>
                  <button onClick={()=>remove(d.id)} style={{ padding:'4px 10px', fontSize:11, borderRadius:5, cursor:'pointer', border:'1px solid #dc2626', background:'transparent', color:'#dc2626' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
