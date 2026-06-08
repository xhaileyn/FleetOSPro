'use client';
import { useState } from 'react';

const SEED = [
  { id:1, name:'ACME Logistics',   plan:'Enterprise',   vehicles:247, users:18, mrr:'$2,400', status:'Active',    suspended:null, reason:null },
  { id:2, name:'SwiftCargo Ltd',   plan:'Professional', vehicles:45,  users:8,  mrr:'$480',   status:'Active',    suspended:null, reason:null },
  { id:3, name:'NextDay Express',   plan:'Starter',      vehicles:12,  users:3,  mrr:'$120',   status:'Active',    suspended:null, reason:null },
  { id:4, name:'KAM Transport',    plan:'Professional', vehicles:78,  users:12, mrr:'$480',   status:'Suspended', suspended:'01 May 2026', reason:'Non-payment (30 days)' },
  { id:5, name:'PeakFleet Co',     plan:'Enterprise',   vehicles:180, users:22, mrr:'$2,400', status:'Active',    suspended:null, reason:null },
  { id:6, name:'SwiftDeliver Co',  plan:'Trial',        vehicles:8,   users:2,  mrr:'$0',     status:'Trial',     suspended:null, reason:null },
  { id:7,  name:'Star Technologies',    plan:'Enterprise',   vehicles:100, users:14, mrr:'$2,400', status:'Active',    suspended:null, reason:null },
  { id:8,  name:'Atlantic Freight Inc', plan:'Enterprise',   vehicles:8,   users:6,  mrr:'$4,200', status:'Active',    suspended:null, reason:null },
  { id:9,  name:'Meridian Logistics',   plan:'Professional', vehicles:6,   users:4,  mrr:'$2,100', status:'Active',    suspended:null, reason:null },
  { id:10, name:'BritFleet Solutions',  plan:'Enterprise',   vehicles:8,   users:5,  mrr:'$3,600', status:'Active',    suspended:null, reason:null },
];

export default function TenantMgmtPage() {
  const [rows, setRows] = useState(SEED);
  const [confirm, setConfirm] = useState<number|null>(null);

  const suspend = (id: number) => { setRows(p=>p.map(r=>r.id===id?{...r,status:'Suspended',suspended:'24 May 2026',reason:'Manual suspension'}:r)); setConfirm(null); };
  const restore = (id: number) => setRows(p=>p.map(r=>r.id===id?{...r,status:'Active',suspended:null,reason:null}:r));

  const STS: Record<string,React.CSSProperties> = {
    Active:    { background:'rgba(196,145,42,0.12)', color:'#c4912a' },
    Suspended: { background:'#fef2f2', color:'#dc2626' },
    Trial:     { background:'#fffbeb', color:'#d97706' },
  };
  const th: React.CSSProperties = { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' };
  const td: React.CSSProperties = { padding:'10px 12px', fontSize:13, color:'var(--ink2)', borderBottom:'1px solid var(--border)' };

  const activeCount    = rows.filter(r=>r.status==='Active').length;
  const suspendedCount = rows.filter(r=>r.status==='Suspended').length;

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-users-group" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Platform Ops</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Tenant Suspension</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Manage tenant account status and access revocation</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:0 }}>
          {[{ label:'Total', value:String(rows.length) },{ label:'Active', value:String(activeCount) },{ label:'Suspended', value:String(suspendedCount) }].map((s,i)=>(
            <div key={s.label} style={{ textAlign:'center', padding:'0 18px', borderLeft:i>0?'1px solid rgba(196,145,42,0.20)':'none' }}>
              <div style={{ fontSize:20, fontWeight:700, color:'#fff' }}>{s.value}</div>
              <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      {confirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'28px', width:360 }}>
            <div style={{ fontSize:16, fontWeight:600, color:'var(--ink)', marginBottom:8 }}>Suspend tenant?</div>
            <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:20 }}>This will immediately revoke access for all users of <b>{rows.find(r=>r.id===confirm)?.name}</b>.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={()=>setConfirm(null)} style={{ padding:'7px 16px', fontSize:13, borderRadius:6, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)' }}>Cancel</button>
              <button onClick={()=>suspend(confirm)} style={{ padding:'7px 16px', fontSize:13, borderRadius:6, cursor:'pointer', border:'none', background:'#dc2626', color:'#fff' }}>Suspend</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Tenant','Plan','Vehicles','Users','MRR','Status','Suspended since','Reason','Actions'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} style={{ background:r.status==='Suspended'?'#fffaf8':'#fff' }}>
                <td style={{ ...td, fontWeight:500, color:'var(--ink)' }}>{r.name}</td>
                <td style={td}>{r.plan}</td>
                <td style={td}>{r.vehicles}</td>
                <td style={td}>{r.users}</td>
                <td style={{ ...td, fontWeight:600, color:'#c4912a' }}>{r.mrr}</td>
                <td style={td}><span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, ...STS[r.status] }}>{r.status}</span></td>
                <td style={{ ...td, color:'var(--ink3)', fontSize:12 }}>{r.suspended || '—'}</td>
                <td style={{ ...td, color:'var(--ink3)', fontSize:12 }}>{r.reason || '—'}</td>
                <td style={td}>
                  <div style={{ display:'flex', gap:6 }}>
                    {r.status==='Active'&&<button onClick={()=>setConfirm(r.id)} style={{ padding:'4px 10px', fontSize:11, borderRadius:5, cursor:'pointer', border:'1px solid #dc2626', background:'transparent', color:'#dc2626' }}>Suspend</button>}
                    {r.status==='Suspended'&&<button onClick={()=>restore(r.id)} style={{ padding:'4px 10px', fontSize:11, borderRadius:5, cursor:'pointer', border:'1px solid #c4912a', background:'transparent', color:'#c4912a' }}>Restore</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
