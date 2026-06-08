export default function GlobalMonitorPage() {
  const tenants = [
    { name:'ACME Logistics',       vehicles:247, online:241, alerts:1, health:97,  plan:'Enterprise'   },
    { name:'SwiftCargo Ltd',       vehicles:45,  online:44,  alerts:0, health:98,  plan:'Professional' },
    { name:'NextDay Express',      vehicles:12,  online:10,  alerts:2, health:83,  plan:'Starter'      },
    { name:'KAM Transport',        vehicles:0,   online:0,   alerts:0, health:0,   plan:'Suspended'    },
    { name:'PeakFleet Co',         vehicles:180, online:178, alerts:0, health:99,  plan:'Enterprise'   },
    { name:'SwiftDeliver Co',      vehicles:8,   online:7,   alerts:1, health:87,  plan:'Trial'        },
    { name:'Star Technologies',    vehicles:100, online:97,  alerts:0, health:98,  plan:'Enterprise'   },
    { name:'Atlantic Freight Inc', vehicles:8,   online:8,   alerts:0, health:100, plan:'Enterprise'   },
    { name:'Meridian Logistics',   vehicles:6,   online:5,   alerts:0, health:96,  plan:'Professional' },
    { name:'BritFleet Solutions',  vehicles:8,   online:7,   alerts:1, health:95,  plan:'Enterprise'   },
  ];
  const kpis = [
    { label:'Active tenants',     value:'9'   },
    { label:'Total vehicles',     value:'614' },
    { label:'Online now',         value:'597' },
    { label:'Active alerts',      value:'5'   },
  ];
  const th: React.CSSProperties = { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' };
  const td: React.CSSProperties = { padding:'10px 12px', fontSize:13, color:'var(--ink2)', borderBottom:'1px solid var(--border)' };

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-world" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Platform Ops</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Global Monitoring</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Cross-tenant fleet and service health across all accounts</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:0 }}>
          {kpis.map((k,i)=>(
            <div key={k.label} style={{ textAlign:'center', padding:'0 18px', borderLeft:i>0?'1px solid rgba(196,145,42,0.20)':'none' }}>
              <div style={{ fontSize:20, fontWeight:700, color:'#fff' }}>{k.value}</div>
              <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, color:'var(--ink)', fontSize:14 }}>Tenant health overview</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Tenant','Plan','Vehicles','Online','Alerts','Health'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {tenants.map(t=>(
              <tr key={t.name} style={{ background:t.health<85&&t.health>0?'#fffaf8':'#fff' }}>
                <td style={{ ...td, fontWeight:500, color:'var(--ink)' }}>{t.name}</td>
                <td style={td}><span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, background:t.plan==='Suspended'?'#fef2f2':t.plan==='Enterprise'?'rgba(196,145,42,0.12)':'var(--cream3)', color:t.plan==='Suspended'?'#dc2626':t.plan==='Enterprise'?'#c4912a':'var(--ink3)' }}>{t.plan}</span></td>
                <td style={td}>{t.vehicles || '—'}</td>
                <td style={td}>{t.online || '—'}</td>
                <td style={{ ...td, color:t.alerts>0?'#dc2626':'var(--ink3)', fontWeight:t.alerts>0?600:400 }}>{t.alerts || '—'}</td>
                <td style={{ ...td }}>
                  {t.health > 0 ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:6, background:'var(--cream3)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                        <div style={{ width:`${t.health}%`, height:'100%', background:t.health>=95?'#16a34a':t.health>=85?'var(--amber)':'var(--red)', borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color:t.health>=95?'#16a34a':t.health>=85?'var(--amber)':'var(--red)' }}>{t.health}%</span>
                    </div>
                  ) : <span style={{ color:'var(--ink3)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
