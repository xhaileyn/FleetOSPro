'use client';
import { useState } from 'react';

export default function SysConfigPage() {
  const [tz, setTz] = useState('America/New_York');
  const [lang, setLang] = useState('en');
  const [dateFormat, setDateFormat] = useState('DD MMM YYYY');
  const [speedUnit, setSpeedUnit] = useState('km/h');
  const [retention, setRetention] = useState('90');
  const [alertRetention, setAlertRetention] = useState('180');
  const [maxVehicles, setMaxVehicles] = useState('500');
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };

  const Field = ({ label, note, children }: { label:string; note?:string; children:React.ReactNode }) => (
    <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:16, padding:'16px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
      <div>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{label}</div>
        {note && <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>{note}</div>}
      </div>
      <div>{children}</div>
    </div>
  );

  const inputStyle: React.CSSProperties = { padding:'7px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, color:'var(--ink)', width:220, background:'#fff' };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor:'pointer' };

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-settings" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Platform Ops</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Platform Config</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Global system settings — timezone, formatting, data retention</div>
          </div>
        </div>
        <button onClick={save} style={{ padding:'8px 20px', background:saved?'rgba(22,163,74,0.9)':'linear-gradient(135deg,#c4912a,#d4a23a)', color:saved?'#fff':'#0d1b2a', border:'none', borderRadius:7, fontSize:13, cursor:'pointer', fontWeight:700, transition:'background 0.2s' }}>
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'0 20px', marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', padding:'16px 0 4px' }}>General</div>
        <Field label="Timezone">
          <select value={tz} onChange={e=>setTz(e.target.value)} style={selectStyle}>
            <option value="America/New_York">America/New_York (EST/EDT)</option>
            <option value="America/Chicago">America/Chicago (CST/CDT)</option>
            <option value="America/Denver">America/Denver (MST/MDT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
            <option value="America/Toronto">America/Toronto</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
            <option value="UTC">UTC</option>
          </select>
        </Field>
        <Field label="Language">
          <select value={lang} onChange={e=>setLang(e.target.value)} style={selectStyle}>
            <option value="en">English</option>
            <option value="sw">Swahili</option>
            <option value="fr">French</option>
          </select>
        </Field>
        <Field label="Date format">
          <select value={dateFormat} onChange={e=>setDateFormat(e.target.value)} style={selectStyle}>
            <option value="DD MMM YYYY">DD MMM YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          </select>
        </Field>
        <Field label="Speed units">
          <select value={speedUnit} onChange={e=>setSpeedUnit(e.target.value)} style={selectStyle}>
            <option value="km/h">km/h</option>
            <option value="mph">mph</option>
          </select>
        </Field>
      </div>

      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'0 20px', marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', padding:'16px 0 4px' }}>Data retention</div>
        <Field label="GPS history" note="Days of raw GPS data retained">
          <input type="number" value={retention} onChange={e=>setRetention(e.target.value)} style={inputStyle} min={30} max={365} />
        </Field>
        <Field label="Alert history" note="Days of alert records retained">
          <input type="number" value={alertRetention} onChange={e=>setAlertRetention(e.target.value)} style={inputStyle} min={30} max={730} />
        </Field>
      </div>

      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'0 20px' }}>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', padding:'16px 0 4px' }}>Limits</div>
        <Field label="Max vehicles per tenant">
          <input type="number" value={maxVehicles} onChange={e=>setMaxVehicles(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="API rate limit" note="Requests per minute per tenant">
          <input type="number" defaultValue={1000} style={inputStyle} />
        </Field>
      </div>
    </div>
  );
}
