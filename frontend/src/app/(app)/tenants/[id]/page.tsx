'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TenantUser } from '@/lib/tenantUsers';
import { useUsersStore } from '@/store/usersStore';
import { getRoleLabel } from '@/lib/auth';
import { BrandingEditor } from '@/components/BrandingEditor';

/* ── Tenant seed data ─────────────────────────────────────────────── */
interface Tenant {
  name: string; plan: string; domain: string; industry: string;
  country: string; adminEmail: string; vehicles: number; users: number;
  created: string; status: string; schema: string; region: string;
}

const TENANTS: Record<string, Tenant> = {
  '1':  { name:'ACME Logistics',       plan:'Enterprise',   domain:'acme.fleetos.app',     industry:'Logistics',     country:'United States', adminEmail:'admin@acmelogistics.com',      vehicles:247, users:18, created:'Jan 2024', status:'Active',    schema:'tenant_acme',      region:'us-east-1'  },
  '2':  { name:'SwiftCargo Ltd',       plan:'Professional', domain:'swift.fleetos.app',    industry:'Cargo',         country:'United States', adminEmail:'admin@swiftcargo.com',          vehicles:45,  users:8,  created:'Mar 2024', status:'Active',    schema:'tenant_swift',     region:'us-east-1'  },
  '3':  { name:'NextDay Express',      plan:'Starter',      domain:'nex.fleetos.app',      industry:'Courier',       country:'United Kingdom', adminEmail:'admin@nextdayexpress.co.uk',  vehicles:12,  users:3,  created:'Apr 2024', status:'Active',    schema:'tenant_nex',       region:'eu-west-2'  },
  '4':  { name:'KAM Transport',        plan:'Professional', domain:'kam.fleetos.app',      industry:'Transport',     country:'United States', adminEmail:'admin@kamtransport.com',        vehicles:78,  users:12, created:'Feb 2024', status:'Suspended', schema:'tenant_kam',       region:'us-east-1'  },
  '5':  { name:'PeakFleet Co',         plan:'Enterprise',   domain:'peak.fleetos.app',     industry:'Fleet Mgmt',    country:'United Kingdom', adminEmail:'admin@peakfleet.co.uk',       vehicles:180, users:22, created:'Dec 2023', status:'Active',    schema:'tenant_peak',      region:'eu-west-2'  },
  '6':  { name:'SwiftDeliver Co',      plan:'Trial',        domain:'sde.fleetos.app',      industry:'E-commerce',    country:'United States', adminEmail:'admin@swiftdeliver.com',        vehicles:8,   users:2,  created:'May 2024', status:'Trial',     schema:'tenant_sde',       region:'us-west-2'  },
  '7':  { name:'Star Technologies',    plan:'Enterprise',   domain:'star.fleetos.app',     industry:'Technology',    country:'Pakistan',       adminEmail:'admin@starttech.io',            vehicles:100, users:14, created:'Jun 2025', status:'Active',    schema:'tenant_star',      region:'ap-south-1' },
  '8':  { name:'Atlantic Freight Inc', plan:'Enterprise',   domain:'atlantic.fleetos.app', industry:'Freight',       country:'United States', adminEmail:'fleet@atlanticfreight.com',     vehicles:8,   users:6,  created:'Mar 2023', status:'Active',    schema:'tenant_atlantic',  region:'us-east-1'  },
  '9':  { name:'Meridian Logistics',   plan:'Professional', domain:'meridian.fleetos.app', industry:'Logistics',     country:'United States', adminEmail:'admin@meridianlogistics.com',   vehicles:6,   users:4,  created:'Jan 2024', status:'Active',    schema:'tenant_meridian',  region:'us-south-2' },
  '10': { name:'BritFleet Solutions',  plan:'Enterprise',   domain:'britfleet.fleetos.app',industry:'Fleet Mgmt',    country:'United Kingdom', adminEmail:'fleet@britfleet.co.uk',        vehicles:8,   users:5,  created:'Sep 2023', status:'Active',    schema:'tenant_britfleet', region:'eu-west-2'  },
};

const REGION_LABEL: Record<string, string> = {
  'us-east-1':  'us-east-1 · New York, USA',
  'us-west-2':  'us-west-2 · Oregon, USA',
  'eu-west-1':  'eu-west-1 · Dublin, Ireland',
  'eu-west-2':  'eu-west-2 · London, UK',
  'ap-south-1': 'ap-south-1 · Mumbai, India',
};

/* ── Isolation checks ─────────────────────────────────────────────── */
const ISOLATION_CHECKS = [
  { category:'Database',   label:'Dedicated schema',           detail:'All tables in a private PostgreSQL schema — no shared tables.',       layer:'DB',  ok:true  },
  { category:'Database',   label:'Row-level security (RLS)',   detail:'PostgreSQL RLS policies enforce tenant_id on every query.',           layer:'DB',  ok:true  },
  { category:'API',        label:'JWT audience claim',         detail:'Tokens carry tenant_id; middleware rejects cross-tenant requests.',   layer:'API', ok:true  },
  { category:'API',        label:'API key scoping',            detail:'Keys are bound to this tenant — usable only on their subdomain.',     layer:'API', ok:true  },
  { category:'Data',       label:'Vehicle records',            detail:'All vehicle rows carry tenant_id FK — no leakage to other tenants.',  layer:'Data',ok:true  },
  { category:'Data',       label:'GPS & telemetry',            detail:'Time-series partitioned by tenant_id; cross-partition reads blocked.',layer:'Data',ok:true  },
  { category:'Data',       label:'Alerts & notifications',     detail:'Alert rules, recipients, and webhooks are fully tenant-scoped.',      layer:'Data',ok:true  },
  { category:'Data',       label:'Reports & analytics',        detail:'Aggregations run only over this tenant\'s vehicle & driver set.',     layer:'Data',ok:true  },
  { category:'Auth',       label:'Subdomain-gated login',      detail:'Users can only authenticate via their own subdomain portal.',         layer:'Auth',ok:true  },
  { category:'Auth',       label:'Session isolation',          detail:'Sessions cannot be replayed across tenant boundaries.',               layer:'Auth',ok:true  },
  { category:'Audit',      label:'Audit log separation',       detail:'Activity logs stored in tenant schema; exportable independently.',    layer:'Audit',ok:true },
  { category:'Audit',      label:'GDPR data export',           detail:'Full data export available — vehicles, drivers, GPS history, alerts.', layer:'Audit',ok:true},
];

/* ── Audit log entries ───────────────────────────────────────────── */
const AUDIT_LOG = [
  { time:'2026-05-26 14:32:11', user:'James Mitchell',   action:'GET /api/v1/vehicles',          resource:'247 vehicle records',  result:'OK',  ip:'104.24.112.14' },
  { time:'2026-05-26 14:28:04', user:'Sarah Johnson',    action:'GET /api/v1/drivers',           resource:'18 driver records',    result:'OK',  ip:'104.24.112.17' },
  { time:'2026-05-26 14:21:57', user:'[System]',         action:'POST /api/v1/alerts/dispatch',  resource:'Alert #4419',          result:'OK',  ip:'10.0.0.1'      },
  { time:'2026-05-26 13:55:30', user:'[BLOCKED]',        action:'GET /api/v1/vehicles',          resource:'Cross-tenant probe',   result:'403', ip:'185.42.0.9'    },
  { time:'2026-05-26 13:44:18', user:'admin@acme…',      action:'PUT /api/v1/geofences/12',      resource:'Geofence Manhattan Zone', result:'OK', ip:'104.24.112.14' },
  { time:'2026-05-26 12:10:05', user:'Michael Davis',    action:'GET /api/v1/routes/playback',   resource:'Route #REF-0044',      result:'OK',  ip:'104.24.112.8'  },
  { time:'2026-05-26 11:58:43', user:'[System]',         action:'POST /api/v1/reports/generate', resource:'Monthly fuel report',  result:'OK',  ip:'10.0.0.1'      },
  { time:'2026-05-26 09:17:29', user:'admin@acme…',      action:'DELETE /api/v1/sessions/8821',  resource:'Session (logout)',     result:'OK',  ip:'104.24.112.14' },
];

/* ── Firewall rules ──────────────────────────────────────────────── */
const FIREWALL = [
  { rule:'Cross-tenant vehicle query',  blocked:14, last:'3h ago' },
  { rule:'Cross-tenant driver lookup',  blocked:6,  last:'8h ago' },
  { rule:'Schema enumeration attempt',  blocked:3,  last:'1d ago' },
  { rule:'API key reuse across tenants',blocked:1,  last:'3d ago' },
];

/* ── Style maps ──────────────────────────────────────────────────── */
const PLAN_S: Record<string,React.CSSProperties> = {
  Enterprise:   { background:'rgba(196,145,42,0.12)',  color:'#c4912a' },
  Professional: { background:'#eff6ff',          color:'#2563eb' },
  Starter:      { background:'var(--cream3)',    color:'var(--ink3)' },
  Trial:        { background:'#fffbeb',          color:'#d97706' },
};
const STATUS_S: Record<string,React.CSSProperties> = {
  Active:    { background:'rgba(196,145,42,0.12)',  color:'#c4912a' },
  Suspended: { background:'#fef2f2',         color:'#dc2626' },
  Trial:     { background:'#fffbeb',         color:'#d97706' },
};
const LAYER_S: Record<string,React.CSSProperties> = {
  DB:    { background:'#ede9fe', color:'#7c3aed' },
  API:   { background:'#dbeafe', color:'#2563eb' },
  Data:  { background:'rgba(196,145,42,0.12)', color:'#c4912a' },
  Auth:  { background:'#fef3c7', color:'#d97706' },
  Audit: { background:'#f0fdf4', color:'#15803d' },
};

/* ── Sub-components ──────────────────────────────────────────────── */
function Tab({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      padding:'10px 18px', fontSize:13, border:'none', cursor:'pointer', fontFamily:'inherit',
      fontWeight: active ? 600 : 400,
      color:      active ? '#c4912a' : 'var(--ink3)',
      background: active ? '#fff' : 'transparent',
      borderBottom: active ? '2px solid #c4912a' : '2px solid transparent',
      transition:'all 0.15s',
    }}>
      {label}
    </button>
  );
}

function SiloBox({ label, items, color }: { label:string; items:string[]; color:string }) {
  return (
    <div style={{ border:`1.5px solid ${color}`, borderRadius:10, overflow:'hidden', flex:1 }}>
      <div style={{ padding:'8px 12px', background:color, color:'#fff', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>
        {label}
      </div>
      {items.map(item => (
        <div key={item} style={{ padding:'7px 12px', fontSize:11, color:'var(--ink2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:9, color }}>●</span> {item}
        </div>
      ))}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = TENANTS[id];
  const [tab, setTab] = useState<'overview'|'isolation'|'audit'|'data-controls'|'users'|'branding'>('overview');
  const [testRunning, setTestRunning] = useState(false);
  const [testDone,    setTestDone]    = useState(false);
  const [exportDone,  setExportDone]  = useState(false);

  /* Users tab state */
  const allUsers = useUsersStore(s => s.users);
  const [users, setUsers] = useState<TenantUser[]>(() => allUsers.filter(u => u.tenantId === id));
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('fleet_manager');
  const [inviteSent,  setInviteSent]  = useState(false);

  function runIsolationTest() {
    setTestRunning(true); setTestDone(false);
    setTimeout(() => { setTestRunning(false); setTestDone(true); }, 2200);
  }

  if (!t) return (
    <div style={{ padding:'28px 32px' }}>
      <Link href="/tenants" style={{ fontSize:13, color:'#c4912a', textDecoration:'none' }}>← Back to tenants</Link>
      <div style={{ marginTop:40, textAlign:'center', color:'var(--ink3)', fontSize:14 }}>Tenant not found.</div>
    </div>
  );

  const slug = t.name.toLowerCase().replace(/\s+/g, '_');

  return (
    <div style={{ padding:'28px 32px' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom:18 }}>
        <Link href="/tenants" style={{ fontSize:12, color:'#c4912a', textDecoration:'none' }}>← All tenants</Link>
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:52, height:52, borderRadius:12, background:'#c4912a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:22, fontWeight:700, flexShrink:0 }}>
            {t.name[0]}
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:'var(--ink)', margin:0 }}>{t.name}</h1>
            <div style={{ fontSize:12, color:'var(--ink3)', marginTop:3 }}>{t.domain} · {t.industry} · {t.country}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:5, ...PLAN_S[t.plan] }}>{t.plan}</span>
          <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:5, ...STATUS_S[t.status] }}>{t.status}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid var(--border)', marginBottom:24, background:'var(--cream)', borderRadius:'8px 8px 0 0', overflow:'hidden' }}>
        <Tab label="Overview"       active={tab==='overview'}      onClick={()=>setTab('overview')}      />
        <Tab label="Data isolation" active={tab==='isolation'}     onClick={()=>setTab('isolation')}     />
        <Tab label="Audit log"      active={tab==='audit'}         onClick={()=>setTab('audit')}         />
        <Tab label="Data controls"  active={tab==='data-controls'} onClick={()=>setTab('data-controls')} />
        <Tab label={`Users (${users.length})`} active={tab==='users'} onClick={()=>setTab('users')} />
        <Tab label="Branding"       active={tab==='branding'}      onClick={()=>setTab('branding')}      />
      </div>

      {/* ── TAB: Overview ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div>
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
            {[
              { label:'Vehicles',    value:t.vehicles,    big:true,  color:'#c4912a' },
              { label:'Users',       value:t.users,       big:true,  color:'#c4912a' },
              { label:'Member since',value:t.created,     big:false, color:'var(--ink)'  },
              { label:'Admin',       value:t.adminEmail,  big:false, color:'var(--ink)'  },
            ].map(k => (
              <div key={k.label} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'16px 18px' }}>
                <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:5 }}>{k.label}</div>
                <div style={{ fontSize:k.big?26:13, fontWeight:k.big?700:500, color:k.color, wordBreak:'break-all', lineHeight:1.2 }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Tenant details grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'20px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:14 }}>Tenant configuration</div>
              {[
                ['Domain',     t.domain],
                ['Industry',   t.industry],
                ['Country',    t.country],
                ['Plan',       t.plan],
                ['Status',     t.status],
                ['DB schema',  t.schema],
                ['Region',     REGION_LABEL[t.region] ?? t.region],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ color:'var(--ink3)' }}>{l}</span>
                  <span style={{ color:'var(--ink)', fontWeight:500, fontFamily: l==='DB schema'?'monospace':'inherit', fontSize: l==='DB schema'?12:13 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'20px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:14 }}>Isolation at a glance</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px', background:'rgba(196,145,42,0.12)', borderRadius:8, marginBottom:14 }}>
                <span style={{ fontSize:28 }}>🔒</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#c4912a' }}>Fully isolated</div>
                  <div style={{ fontSize:12, color:'#c4912a' }}>All {ISOLATION_CHECKS.length} checks passed · 0 violations</div>
                </div>
              </div>
              {[
                { label:'Cross-tenant requests blocked', value:'24 this week' },
                { label:'Last isolation audit',          value:'Today, 06:00 UTC' },
                { label:'Encryption at rest',            value:'AES-256' },
                { label:'Transport security',            value:'TLS 1.3' },
                { label:'Data residency',                value: REGION_LABEL[t.region] ?? t.region },
                { label:'Backup region',                 value:'eu-west-1 (Ireland)' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                  <span style={{ color:'var(--ink3)' }}>{label}</span>
                  <span style={{ color:'var(--ink)', fontWeight:500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Data isolation ───────────────────────────────────── */}
      {tab === 'isolation' && (
        <div>
          {/* Run test bar */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>Isolation verification</div>
              <div style={{ fontSize:12, color:'var(--ink3)', marginTop:2 }}>
                {testRunning ? 'Running checks across all layers…' : testDone ? 'All checks passed — tenant data is fully isolated.' : `Last run: Today 06:00 UTC · ${ISOLATION_CHECKS.length}/${ISOLATION_CHECKS.length} checks passed`}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {testDone && <span style={{ fontSize:12, fontWeight:600, color:'#c4912a', background:'rgba(196,145,42,0.12)', padding:'4px 10px', borderRadius:5 }}>✓ All clear</span>}
              <button onClick={runIsolationTest} disabled={testRunning} style={{ padding:'8px 18px', fontSize:12, background: testRunning ? 'var(--ink3)' : '#c4912a', color:'#fff', border:'none', borderRadius:6, cursor: testRunning ? 'default' : 'pointer', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
                {testRunning ? (
                  <><span style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>⟳</span> Running…</>
                ) : 'Run isolation test'}
              </button>
            </div>
          </div>

          {/* Silo diagram */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'20px', marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:4 }}>Data silo architecture</div>
            <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:16 }}>Each tenant operates in a completely separate logical silo — no shared data paths.</div>
            <div style={{ display:'flex', gap:12, alignItems:'stretch' }}>
              <SiloBox label={`${t.name} (this tenant)`} color="#c4912a" items={[`Schema: ${t.schema}`, `${t.vehicles} vehicles`, `${t.users} users`, 'Private API keys', 'Isolated GPS data', 'Scoped alerts']} />
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, flexShrink:0 }}>
                <div style={{ fontSize:20, color:'var(--red)' }}>🚫</div>
                <div style={{ fontSize:9, color:'var(--ink3)', textAlign:'center', letterSpacing:0.5 }}>BLOCKED</div>
              </div>
              <SiloBox label="Other tenants" color="#9ca3af" items={['Schema: tenant_swift', 'Schema: tenant_nex', 'Schema: tenant_kim', '…separate data', '…separate users', '…separate keys']} />
            </div>
            <div style={{ marginTop:12, padding:'10px 14px', background:'var(--cream)', borderRadius:6, fontSize:11, color:'var(--ink3)' }}>
              🔒 PostgreSQL Row-Level Security (RLS) + JWT audience checks enforce this boundary on every single database query and API call.
            </div>
          </div>

          {/* Isolation checks grid */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginBottom:20 }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>Layer-by-layer checks</div>
              <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:5, background:'rgba(196,145,42,0.12)', color:'#c4912a' }}>
                ✓ {ISOLATION_CHECKS.filter(c=>c.ok).length}/{ISOLATION_CHECKS.length} passed
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
              {ISOLATION_CHECKS.map((c, i) => (
                <div key={c.label} style={{
                  padding:'14px 18px',
                  borderBottom: i < ISOLATION_CHECKS.length - 2 ? '1px solid var(--border)' : 'none',
                  borderRight:  i % 2 === 0 ? '1px solid var(--border)' : 'none',
                  display:'flex', gap:12, alignItems:'flex-start',
                }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(196,145,42,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                    <span style={{ fontSize:11, color:'#c4912a', fontWeight:700 }}>✓</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{c.label}</span>
                      <span style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius:3, ...LAYER_S[c.layer] }}>{c.layer}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink3)' }}>{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-tenant firewall */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>Cross-tenant firewall — last 7 days</div>
              <span style={{ fontSize:12, color:'var(--red)', fontWeight:600, background:'#fef2f2', padding:'3px 10px', borderRadius:5 }}>
                {FIREWALL.reduce((a,r)=>a+r.blocked,0)} attempts blocked
              </span>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Rule','Blocked attempts','Last seen'].map(h=>(
                    <th key={h} style={{ padding:'8px 18px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIREWALL.map(r=>(
                  <tr key={r.rule}>
                    <td style={{ padding:'11px 18px', fontSize:13, color:'var(--ink)', borderBottom:'1px solid var(--border)' }}>{r.rule}</td>
                    <td style={{ padding:'11px 18px', fontSize:13, borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontWeight:700, color:'var(--red)', background:'#fef2f2', padding:'2px 8px', borderRadius:4 }}>{r.blocked}</span>
                    </td>
                    <td style={{ padding:'11px 18px', fontSize:12, color:'var(--ink3)', borderBottom:'1px solid var(--border)' }}>{r.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: Audit log ────────────────────────────────────────── */}
      {tab === 'audit' && (
        <div>
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>Data access audit log</div>
                <div style={{ fontSize:12, color:'var(--ink3)', marginTop:2 }}>Every API call made against this tenant&apos;s data. Retained for 365 days.</div>
              </div>
              <button style={{ padding:'7px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'#fff', cursor:'pointer', color:'var(--ink2)' }}>
                Export CSV
              </button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Timestamp','User','Action','Resource','Result','IP address'].map(h=>(
                    <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)', background:'var(--cream)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map((row, i)=>(
                  <tr key={i} style={{ background: row.result==='403' ? '#fef9f9' : '#fff' }}>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'var(--ink3)', borderBottom:'1px solid var(--border)', fontFamily:'monospace', whiteSpace:'nowrap' }}>{row.time}</td>
                    <td style={{ padding:'10px 14px', fontSize:12, color: row.user==='[BLOCKED]' ? 'var(--red)' : 'var(--ink)', borderBottom:'1px solid var(--border)', fontWeight: row.user==='[BLOCKED]'?700:400 }}>{row.user}</td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'var(--ink2)', borderBottom:'1px solid var(--border)', fontFamily:'monospace' }}>{row.action}</td>
                    <td style={{ padding:'10px 14px', fontSize:12, color:'var(--ink3)', borderBottom:'1px solid var(--border)' }}>{row.resource}</td>
                    <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, background: row.result==='403' ? '#fef2f2' : 'rgba(196,145,42,0.12)', color: row.result==='403' ? 'var(--red)' : '#c4912a' }}>
                        {row.result==='403' ? '403 BLOCKED' : '200 OK'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'var(--ink3)', borderBottom:'1px solid var(--border)', fontFamily:'monospace' }}>{row.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding:'12px 20px', fontSize:11, color:'var(--ink3)', background:'var(--cream)', borderTop:'1px solid var(--border)' }}>
              Showing 8 of 1,247 entries this month · Logs are append-only and tamper-evident
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Users ───────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div>
          {/* Header row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>User accounts</div>
              <div style={{ fontSize:12, color:'var(--ink3)', marginTop:2 }}>{users.length} users · {users.filter(u=>u.status==='Active').length} active · {users.filter(u=>u.mfaEnabled).length} with MFA</div>
            </div>
            <button
              onClick={()=>{ setShowInvite(true); setInviteSent(false); setInviteEmail(''); }}
              style={{ padding:'8px 16px', fontSize:12, background:'#c4912a', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}
            >
              + Invite user
            </button>
          </div>

          {/* Users table */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginBottom:16 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--cream)' }}>
                  {['User','Email','Role','Status','MFA','Last login',''].map(h=>(
                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u=>(
                  <tr key={u.id} style={{ background: u.status==='Suspended' ? '#fffaf8' : '#fff' }}>
                    <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background: u.status==='Suspended' ? '#e5e7eb' : '#c4912a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700, flexShrink:0 }}>
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{u.firstName} {u.lastName}</div>
                          {u.role === 'fleet_admin' && <div style={{ fontSize:10, color:'#c4912a', fontWeight:600 }}>Tenant admin</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink3)', borderBottom:'1px solid var(--border)', fontFamily:'monospace' }}>{u.email}</td>
                    <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:11, fontWeight:500, padding:'2px 7px', borderRadius:4, background:'var(--cream3)', color:'var(--ink2)' }}>{getRoleLabel(u.role)}</span>
                    </td>
                    <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:4,
                        background: u.status==='Active' ? 'rgba(196,145,42,0.12)' : u.status==='Suspended' ? '#fef2f2' : '#fffbeb',
                        color:      u.status==='Active' ? '#c4912a'  : u.status==='Suspended' ? '#dc2626'   : '#d97706',
                      }}>{u.status}</span>
                    </td>
                    <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                      {u.mfaEnabled
                        ? <span style={{ color:'#c4912a', fontWeight:600 }}>✓ On</span>
                        : <span style={{ color:'var(--ink3)' }}>Off</span>}
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:11, color:'var(--ink3)', borderBottom:'1px solid var(--border)', fontFamily:'monospace', whiteSpace:'nowrap' }}>{u.lastLogin}</td>
                    <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button
                          onClick={()=> setUsers(prev=>prev.map(x=> x.id===u.id ? { ...x, status: x.status==='Active' ? 'Suspended' : 'Active' } : x))}
                          style={{ padding:'3px 9px', fontSize:11, borderRadius:4, cursor:'pointer', border:'1px solid var(--border)', background:'#fff', color: u.status==='Active' ? 'var(--red)' : '#c4912a' }}
                        >
                          {u.status==='Active' ? 'Suspend' : 'Reinstate'}
                        </button>
                        <button
                          onClick={()=> alert(`Password reset email sent to ${u.email}`)}
                          style={{ padding:'3px 9px', fontSize:11, borderRadius:4, cursor:'pointer', border:'1px solid var(--border)', background:'#fff', color:'var(--ink2)' }}
                        >
                          Reset pw
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Role legend */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'16px 18px' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)', marginBottom:10 }}>Role permissions in this tenant</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                { role:'Fleet Admin',    access:'Full control — vehicles, drivers, users, settings' },
                { role:'Fleet Manager',  access:'Vehicles, drivers, routes, alerts — no user mgmt' },
                { role:'Dispatcher',     access:'Live map, routes, and alerts only' },
                { role:'Billing Admin',  access:'Subscription, invoices, and billing history' },
                { role:'Viewer',         access:'Read-only dashboards and reports' },
              ].map(r=>(
                <div key={r.role} style={{ padding:'10px 12px', background:'var(--cream)', borderRadius:6 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--ink)' }}>{r.role}</div>
                  <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>{r.access}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Invite user modal ─────────────────────────────────────────── */}
      {showInvite && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:12, width:440, padding:'24px', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>Invite user to {t.name}</div>
              <button onClick={()=>setShowInvite(false)} style={{ fontSize:18, border:'none', background:'transparent', cursor:'pointer', color:'var(--ink3)' }}>×</button>
            </div>
            {inviteSent ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>✉️</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>Invitation sent!</div>
                <div style={{ fontSize:12, color:'var(--ink3)', marginTop:6 }}>
                  An invite link has been emailed to <strong>{inviteEmail}</strong>.<br/>
                  They will be prompted to set their password on first login.
                </div>
                <button onClick={()=>setShowInvite(false)} style={{ marginTop:16, padding:'8px 20px', background:'#c4912a', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:500 }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, fontWeight:500, color:'var(--ink2)', display:'block', marginBottom:5 }}>Email address</label>
                  <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="colleague@company.com"
                    style={{ width:'100%', padding:'8px 11px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, color:'var(--ink)', boxSizing:'border-box', background:'#fff' }} />
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:12, fontWeight:500, color:'var(--ink2)', display:'block', marginBottom:5 }}>Role</label>
                  <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)}
                    style={{ width:'100%', padding:'8px 11px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, color:'var(--ink)', background:'#fff', cursor:'pointer' }}>
                    <option value="fleet_admin">Fleet Admin — full control</option>
                    <option value="fleet_manager">Fleet Manager — vehicles &amp; drivers</option>
                    <option value="dispatcher">Dispatcher — live map &amp; routes</option>
                    <option value="billing_admin">Billing Admin — subscription &amp; invoices</option>
                    <option value="viewer">Viewer — read only</option>
                  </select>
                </div>
                <div style={{ padding:'10px 12px', background:'rgba(196,145,42,0.12)', borderRadius:7, fontSize:12, color:'#c4912a', marginBottom:20 }}>
                  🔒 This user will only have access to <strong>{t.name}</strong> data — fully isolated from other tenants.
                </div>
                <div style={{ display:'flex', gap:9, justifyContent:'flex-end' }}>
                  <button onClick={()=>setShowInvite(false)} style={{ padding:'8px 16px', fontSize:12, borderRadius:6, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)' }}>Cancel</button>
                  <button
                    disabled={!inviteEmail.includes('@')}
                    onClick={()=>{
                      const parts = inviteEmail.split('@')[0].split('.');
                      setUsers(prev=>[...prev, {
                        id:crypto.randomUUID(), tenantId:id, tenantName:t.name,
                        tenantSlug:t.domain.split('.')[0],
                        firstName:parts[0]??'New', lastName:parts[1]??'User',
                        email:inviteEmail, password:'',
                        role:inviteRole as TenantUser['role'],
                        status:'Pending', mfaEnabled:false, lastLogin:'Never',
                      }]);
                      setInviteSent(true);
                    }}
                    style={{ padding:'8px 20px', fontSize:12, borderRadius:6, cursor:inviteEmail.includes('@')?'pointer':'default', border:'none', background:'#c4912a', color:'#fff', fontWeight:500, opacity:inviteEmail.includes('@')?1:0.5 }}
                  >
                    Send invite
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Data controls ────────────────────────────────────── */}
      {tab === 'data-controls' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* GDPR export */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'20px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:4 }}>Data portability (GDPR Art. 20)</div>
            <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:16 }}>
              Export a full copy of all data held for <strong>{t.name}</strong> — vehicles, drivers, GPS history, alerts, reports, and audit logs.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
              {[
                { label:'Vehicle records',   count:`${t.vehicles} vehicles`,     icon:'ti-truck' },
                { label:'Driver profiles',   count:`${t.users} drivers`,          icon:'ti-user' },
                { label:'GPS history',       count:'90 days retained',            icon:'ti-map-pin' },
                { label:'Alert history',     count:'180 days retained',           icon:'ti-bell' },
                { label:'Audit logs',        count:'365 days retained',           icon:'ti-file-analytics' },
                { label:'Reports',           count:'All generated reports',       icon:'ti-report' },
              ].map(item=>(
                <div key={item.label} style={{ padding:'12px 14px', background:'var(--cream)', borderRadius:8, display:'flex', gap:10, alignItems:'center' }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize:16, color:'#c4912a', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:'var(--ink)' }}>{item.label}</div>
                    <div style={{ fontSize:11, color:'var(--ink3)' }}>{item.count}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={()=>{ setExportDone(false); setTimeout(()=>setExportDone(true), 1500); }}
                style={{ padding:'8px 18px', fontSize:12, background:'#c4912a', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:500 }}
              >
                Request data export (JSON)
              </button>
              <button style={{ padding:'8px 18px', fontSize:12, background:'#fff', color:'var(--ink2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer' }}>
                Request data export (CSV)
              </button>
              {exportDone && <span style={{ fontSize:12, color:'#c4912a', display:'flex', alignItems:'center', gap:4 }}>✓ Export queued — link emailed to {t.adminEmail}</span>}
            </div>
          </div>

          {/* Retention policy */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'20px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:14 }}>Data retention policy</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[
                { label:'GPS / telemetry', value:'90 days',  note:'Configurable 30–365' },
                { label:'Alert history',   value:'180 days', note:'Configurable 30–730' },
                { label:'Audit logs',      value:'365 days', note:'Fixed — compliance' },
                { label:'Deleted records', value:'30 days',  note:'Soft-delete window' },
              ].map(r=>(
                <div key={r.label} style={{ padding:'14px', background:'var(--cream)', borderRadius:8 }}>
                  <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>{r.label}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--ink)', letterSpacing:'-0.5px' }}>{r.value}</div>
                  <div style={{ fontSize:10, color:'var(--ink3)', marginTop:3 }}>{r.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right to erasure */}
          <div style={{ background:'#fff', border:'1px solid #fecaca', borderRadius:10, padding:'20px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:4 }}>Right to erasure (GDPR Art. 17)</div>
            <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:16 }}>
              Permanently and irreversibly delete all data for <strong>{t.name}</strong>. This includes vehicles, drivers, GPS history, alerts, reports, and the database schema <code style={{ background:'var(--cream)', padding:'1px 5px', borderRadius:3, fontFamily:'monospace', fontSize:11 }}>{t.schema}</code>.
              This action is <strong style={{ color:'var(--red)' }}>irreversible</strong> and cannot be undone.
            </div>
            <div style={{ padding:'12px 14px', background:'#fef2f2', borderRadius:8, fontSize:12, color:'#991b1b', marginBottom:16 }}>
              ⚠ Erasure will be scheduled after a 7-day cool-down period during which the tenant admin will receive a confirmation email. A final audit export is automatically generated before deletion.
            </div>
            <button style={{ padding:'8px 18px', fontSize:12, background:'#fff', color:'var(--red)', border:'1px solid var(--red)', borderRadius:6, cursor:'pointer', fontWeight:500 }}>
              Request erasure for {t.name}
            </button>
          </div>

          {/* Data residency */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'20px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:14 }}>Data residency</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {[
                { label:'Primary region',  value: REGION_LABEL[t.region] ?? t.region,  icon:'ti-server',   note:'All primary reads & writes' },
                { label:'Backup region',   value:'eu-west-1 · Dublin, Ireland',  icon:'ti-database', note:'Async replication, 5-min RPO' },
                { label:'Encryption',      value:'AES-256 at rest · TLS 1.3',    icon:'ti-lock',     note:'Keys managed via KMS' },
              ].map(item=>(
                <div key={item.label} style={{ padding:'16px', background:'var(--cream)', borderRadius:8 }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize:18, color:'#c4912a', display:'block', marginBottom:8 }} />
                  <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:3 }}>{item.label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:3 }}>{item.value}</div>
                  <div style={{ fontSize:11, color:'var(--ink3)' }}>{item.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Branding ─────────────────────────────────────────── */}
      {tab === 'branding' && (
        <div>
          {/* Section header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <h2 style={{ fontSize:16, fontWeight:700, color:'var(--ink)', margin:0 }}>Portal branding</h2>
              <div style={{ fontSize:12, color:'var(--ink3)', marginTop:4 }}>
                Customise the logo, colours, and typography for <strong>{t.name}</strong>&apos;s portal.
                Branding is stored per-company and loads automatically when users log in under this tenant.
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:5, background:'rgba(196,145,42,0.12)', color:'#c4912a' }}>
                {t.domain}
              </span>
              <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:5, ...PLAN_S[t.plan] }}>
                {t.plan}
              </span>
            </div>
          </div>

          {/* Company logo placeholder chip */}
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'#fff', border:'1px solid var(--border)', borderRadius:10, marginBottom:20 }}>
            <div style={{ width:44, height:44, borderRadius:10, background:'#c4912a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:20, fontWeight:700, flexShrink:0 }}>
              {t.name[0]}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{t.name}</div>
              <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>
                Branding key: <code style={{ fontFamily:'monospace', background:'var(--cream)', padding:'1px 6px', borderRadius:3, fontSize:10 }}>fleetBrand_tenant_{id}</code>
              </div>
            </div>
            <div style={{ marginLeft:'auto', fontSize:11, color:'var(--ink3)' }}>
              {t.vehicles} vehicles · {t.users} users
            </div>
          </div>

          <BrandingEditor
            storageKey={`fleetBrand_tenant_${id}`}
            defaultName={t.name}
            scopeNote={`Branding is scoped to "${t.name}" (tenant ${id}). Each company in the Enterprise has independent brand settings.`}
            {...(id === '7' && {
              defaultConfig: {
                primaryColor: '#c4912a',
                accentColor:  '#c4912a',
                fontFamily:   'system-ui, -apple-system, sans-serif',
                darkTopbar:   true,
              },
            })}
          />
        </div>
      )}
    </div>
  );
}
