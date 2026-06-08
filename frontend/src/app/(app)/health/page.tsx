export default function HealthPage() {
  const services = [
    { name:'API Gateway',        uptime:'99.98%', latency:'42 ms',  status:'Healthy',  incidents:0 },
    { name:'Database (Primary)', uptime:'100%',   latency:'3 ms',   status:'Healthy',  incidents:0 },
    { name:'GPS Data Ingestion', uptime:'99.91%', latency:'18 ms',  status:'Healthy',  incidents:1 },
    { name:'WebSocket / Live',   uptime:'99.87%', latency:'8 ms',   status:'Healthy',  incidents:0 },
    { name:'Notification Service',uptime:'99.72%',latency:'120 ms', status:'Degraded', incidents:1 },
    { name:'Report Generator',   uptime:'99.60%', latency:'850 ms', status:'Healthy',  incidents:0 },
    { name:'Auth Service',       uptime:'100%',   latency:'15 ms',  status:'Healthy',  incidents:0 },
  ];
  const incidents = [
    { service:'Notification Service', severity:'Warning', msg:'Elevated SMS delivery latency via Twilio (resolved)', time:'Today 11:30' },
    { service:'GPS Data Ingestion',   severity:'Info',    msg:'Minor packet loss on TMP-006F device', time:'Today 08:15' },
    { service:'API Gateway',          severity:'Info',    msg:'Routine certificate rotation completed',time:'Yesterday 03:00' },
  ];
  const STS: Record<string,React.CSSProperties> = {
    Healthy:  { background:'rgba(196,145,42,0.12)', color:'#c4912a' },
    Degraded: { background:'#fffbeb', color:'#d97706' },
    Down:     { background:'#fef2f2', color:'#dc2626' },
  };
  const th: React.CSSProperties = { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' };
  const td: React.CSSProperties = { padding:'10px 12px', fontSize:13, color:'var(--ink2)', borderBottom:'1px solid var(--border)' };

  const healthyCount  = services.filter(s=>s.status==='Healthy').length;
  const degradedCount = services.filter(s=>s.status==='Degraded').length;
  const activeIncidents = incidents.length;

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-heart-rate-monitor" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Platform Ops</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Health Dashboards</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Service uptime, latency, and incident tracking</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:0 }}>
          {[{ label:'Healthy', value:String(healthyCount) },{ label:'Degraded', value:String(degradedCount) },{ label:'Incidents', value:String(activeIncidents) }].map((s,i)=>(
            <div key={s.label} style={{ textAlign:'center', padding:'0 18px', borderLeft:i>0?'1px solid rgba(196,145,42,0.20)':'none' }}>
              <div style={{ fontSize:20, fontWeight:700, color:'#fff' }}>{s.value}</div>
              <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginBottom:20 }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, color:'var(--ink)', fontSize:14 }}>Service status</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Service','Uptime','Latency','Status','Incidents (30d)'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {services.map(s=>(
              <tr key={s.name}>
                <td style={{ ...td, fontWeight:500, color:'var(--ink)' }}>{s.name}</td>
                <td style={{ ...td, fontWeight:600, color:parseFloat(s.uptime)>=99.9?'#c4912a':'var(--amber)' }}>{s.uptime}</td>
                <td style={{ ...td, fontFamily:'monospace', fontSize:12 }}>{s.latency}</td>
                <td style={td}><span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, ...STS[s.status] }}>{s.status}</span></td>
                <td style={{ ...td, color:s.incidents>0?'var(--amber)':'var(--ink3)' }}>{s.incidents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, color:'var(--ink)', fontSize:14 }}>Recent incidents</div>
        {incidents.map((inc,i)=>(
          <div key={i} style={{ padding:'14px 16px', borderBottom:i<incidents.length-1?'1px solid var(--border)':'none', display:'flex', gap:12 }}>
            <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, flexShrink:0, alignSelf:'flex-start', background:inc.severity==='Warning'?'#fffbeb':'#eff6ff', color:inc.severity==='Warning'?'#d97706':'#2563eb' }}>{inc.severity}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>{inc.service}</div>
              <div style={{ fontSize:12, color:'var(--ink3)' }}>{inc.msg}</div>
            </div>
            <span style={{ fontSize:11, color:'var(--ink3)', flexShrink:0 }}>{inc.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
