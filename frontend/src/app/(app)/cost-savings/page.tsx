export default function CostSavingsPage() {
  const kpis = [
    { label:'Fuel saved', value:'$4,250', sub:'this month', color:'#c4912a' },
    { label:'CO₂ reduced', value:'1.8 t', sub:'this month', color:'var(--green)' },
    { label:'Idle time cut', value:'320 h', sub:'vs last month', color:'#2563eb' },
    { label:'Cost reduction', value:'−12%', sub:'month-over-month', color:'#c4912a' },
  ];
  const rows = [
    { cat:'Fuel',              last:'$18,400', curr:'$14,150', saving:'$4,250', pct:'−23%' },
    { cat:'Maintenance',       last:'$3,200',  curr:'$2,850',  saving:'$350',   pct:'−11%' },
    { cat:'Driver overtime',   last:'$5,600',  curr:'$4,800',  saving:'$800',   pct:'−14%' },
    { cat:'Route inefficiency',last:'$2,100',  curr:'$1,400',  saving:'$700',   pct:'−33%' },
    { cat:'Idle fuel burn',    last:'$1,800',  curr:'$1,200',  saving:'$600',   pct:'−33%' },
  ];
  const th: React.CSSProperties = { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' };
  const td: React.CSSProperties = { padding:'10px 12px', fontSize:13, color:'var(--ink2)', borderBottom:'1px solid var(--border)' };

  return (
    <div style={{ padding:'28px 32px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Cost and efficiency</div>
        <h1 style={{ fontSize:22, fontWeight:600, color:'var(--ink)', margin:0 }}>Cost savings</h1>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {kpis.map(k=>(
          <div key={k.label} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'18px 20px' }}>
            <div style={{ fontSize:28, fontWeight:700, color:k.color }}>{k.value}</div>
            <div style={{ fontSize:13, color:'var(--ink)', fontWeight:500, marginTop:4 }}>{k.label}</div>
            <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, color:'var(--ink)', fontSize:14 }}>Savings breakdown — May 2026</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Category','Last month','This month','Saving','Change'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.cat}>
                <td style={{ ...td, color:'var(--ink)', fontWeight:500 }}>{r.cat}</td>
                <td style={{ ...td, color:'var(--ink3)' }}>{r.last}</td>
                <td style={td}>{r.curr}</td>
                <td style={{ ...td, color:'#c4912a', fontWeight:600 }}>{r.saving}</td>
                <td style={{ ...td, color:'#c4912a', fontWeight:600 }}>{r.pct}</td>
              </tr>
            ))}
            <tr style={{ background:'var(--cream)' }}>
              <td style={{ ...td, fontWeight:700, color:'var(--ink)' }}>Total</td>
              <td style={{ ...td, color:'var(--ink3)' }}>$31,100</td>
              <td style={{ ...td, fontWeight:600 }}>$24,400</td>
              <td style={{ ...td, color:'#c4912a', fontWeight:700 }}>$6,700</td>
              <td style={{ ...td, color:'#c4912a', fontWeight:700 }}>−22%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
