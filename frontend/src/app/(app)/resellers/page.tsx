export default function ResellersPage() {
  const rows = [
    { name:'TechFleet USA',      code:'TFU', tier:'Gold',    tenants:12, vehicles:1450, mrr:'$18,400', commission:'15%', joined:'Jan 2024', status:'Active' },
    { name:'LogiSystems Ltd',    code:'LSL', tier:'Silver',  tenants:5,  vehicles:380,  mrr:'$7,200',  commission:'12%', joined:'Mar 2024', status:'Active' },
    { name:'FleetPro UK',        code:'FPU', tier:'Bronze',  tenants:2,  vehicles:120,  mrr:'$2,800',  commission:'10%', joined:'Apr 2024', status:'Active' },
    { name:'Horizon Telematics', code:'HT',  tier:'Pending', tenants:0,  vehicles:0,    mrr:'—',       commission:'—',   joined:'May 2024', status:'Pending' },
  ];
  const TIER: Record<string,React.CSSProperties> = {
    Gold:    { background:'#fffbeb', color:'#d97706' },
    Silver:  { background:'var(--cream3)', color:'var(--ink3)' },
    Bronze:  { background:'#fff7ed', color:'#c2410c' },
    Pending: { background:'#eff6ff', color:'#2563eb' },
  };
  const th: React.CSSProperties = { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' };
  const td: React.CSSProperties = { padding:'11px 12px', fontSize:13, color:'var(--ink2)', borderBottom:'1px solid var(--border)' };

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-building-store" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>SaaS &amp; Billing</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Resellers &amp; Partners</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Channel partners, reseller tiers, and commission tracking</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', gap:0 }}>
            {[{ label:'Active Partners', value:'3' },{ label:'Tenants Managed', value:'19' },{ label:'Combined MRR', value:'$28,400' }].map((s,i)=>(
              <div key={s.label} style={{ textAlign:'center', padding:'0 18px', borderLeft:i>0?'1px solid rgba(196,145,42,0.20)':'none' }}>
                <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>{s.value}</div>
                <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button style={{ padding:'8px 16px', border:'1px solid rgba(196,145,42,0.35)', background:'linear-gradient(135deg,#0d1b2a,#1c2b44)', color:'#f5d07a', borderRadius:7, fontSize:13, cursor:'pointer', fontWeight:600 }}>+ Invite partner</button>
        </div>
      </div>
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Partner','Tier','Tenants','Vehicles','MRR','Commission','Joined','Status'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.code}>
                <td style={{ ...td, color:'var(--ink)', fontWeight:500 }}>{r.name}</td>
                <td style={td}><span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, ...TIER[r.tier] }}>{r.tier}</span></td>
                <td style={td}>{r.tenants || '—'}</td>
                <td style={td}>{r.vehicles || '—'}</td>
                <td style={{ ...td, color:'#c4912a', fontWeight:600 }}>{r.mrr}</td>
                <td style={td}>{r.commission}</td>
                <td style={{ ...td, color:'var(--ink3)' }}>{r.joined}</td>
                <td style={td}><span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, background:r.status==='Active'?'rgba(196,145,42,0.12)':'#eff6ff', color:r.status==='Active'?'#c4912a':'#2563eb' }}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
