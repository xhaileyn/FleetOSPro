'use client';
import { useState } from 'react';

export default function MfaPage() {
  const [adminReq, setAdminReq] = useState(true);
  const [allReq, setAllReq] = useState(false);
  const [totp, setTotp] = useState(true);
  const [sms, setSms] = useState(true);
  const [email, setEmail] = useState(false);

  const enrolled = [
    { name:'Ali Hassan',      role:'Fleet Admin',    method:'Authenticator app', enrolled:'Jan 15' },
    { name:'Grace Njeri',     role:'Dispatcher',     method:'SMS',               enrolled:'Feb 02' },
    { name:'A. Khan',         role:'Super Admin',    method:'Authenticator app', enrolled:'Dec 01' },
    { name:'James Mwangi',    role:'Fleet Manager',  method:'Authenticator app', enrolled:'Mar 10' },
    { name:'Billing User',    role:'Billing Admin',  method:'SMS',               enrolled:'Apr 05' },
  ];

  const Toggle = ({ on, set }: { on: boolean; set: (v:boolean)=>void }) => (
    <button onClick={()=>set(!on)} style={{ width:42, height:24, borderRadius:12, border:'none', cursor:'pointer', background:on?'#c4912a':'var(--border2)', position:'relative', transition:'background 0.2s' }}>
      <span style={{ position:'absolute', top:3, left: on?20:3, width:18, height:18, borderRadius:9, background:'#fff', transition:'left 0.2s' }} />
    </button>
  );

  const th: React.CSSProperties = { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' };
  const td: React.CSSProperties = { padding:'10px 12px', fontSize:13, color:'var(--ink2)', borderBottom:'1px solid var(--border)' };

  const enabledMethods = [totp, sms, email].filter(Boolean).length;

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border: '1px solid rgba(196,145,42,0.18)',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 20,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'rgba(196,145,42,0.15)',
            border: '1px solid rgba(196,145,42,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="ti ti-shield-check" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>
              Security &amp; Auth
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>MFA Settings</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              Multi-factor authentication policies and enrolled users
            </div>
          </div>
        </div>

        {/* Right — stats */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: 'Enrolled',  value: `${enrolled.length}` },
            { label: 'Methods',   value: `${enabledMethods}` },
            { label: 'Coverage',  value: `${Math.round(enrolled.length / 18 * 100)}%` },
          ].map((s, i) => (
            <div key={s.label} style={{
              textAlign: 'center', padding: '0 18px',
              borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'20px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:16 }}>MFA policy</div>
          {[['Require MFA for admin roles', adminReq, setAdminReq],['Require MFA for all users', allReq, setAllReq]].map(([label, on, set])=>(
            <div key={label as string} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:13, color:'var(--ink)', fontWeight:500 }}>{label as string}</div>
              </div>
              <Toggle on={on as boolean} set={set as (v:boolean)=>void} />
            </div>
          ))}
          <div style={{ marginTop:16, padding:'10px 14px', background:'var(--cream)', borderRadius:8, fontSize:12, color:'var(--ink3)' }}>
            Grace period: 24 hours from first login
          </div>
        </div>
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'20px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:16 }}>Allowed methods</div>
          {[['Authenticator app (TOTP)', totp, setTotp, 'Google Authenticator, Authy'],['SMS one-time code', sms, setSms, 'Delivered via Twilio'],['Email OTP', email, setEmail, 'Fallback method only']].map(([label,on,set,sub])=>(
            <div key={label as string} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:13, color:'var(--ink)', fontWeight:500 }}>{label as string}</div>
                <div style={{ fontSize:11, color:'var(--ink3)' }}>{sub as string}</div>
              </div>
              <Toggle on={on as boolean} set={set as (v:boolean)=>void} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:600, color:'var(--ink)', fontSize:14 }}>Enrolled users</span>
          <span style={{ fontSize:12, color:'var(--ink3)' }}>{enrolled.length} / 18 enrolled</span>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['User','Role','Method','Enrolled'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {enrolled.map(u=>(
              <tr key={u.name}>
                <td style={{ ...td, fontWeight:500, color:'var(--ink)' }}>{u.name}</td>
                <td style={td}>{u.role}</td>
                <td style={td}>{u.method}</td>
                <td style={{ ...td, color:'var(--ink3)' }}>{u.enrolled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
