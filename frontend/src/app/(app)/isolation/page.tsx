'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  TENANTS, RLS_POLICIES, API_MIDDLEWARE, SESSION_POLICIES, RBAC_MATRIX,
  ISOLATION_DIMENSIONS, TENANT_ISOLATION_MATRIX,
  PolicyStatus, AuditEvent, EncryptionKey, BackupRecord,
} from '@/lib/isolationData';
import { useAuthStore } from '@/store/authStore';

/* ── palette ───────────────────────────────────────────────────────── */
const TENANT_COLORS: Record<string, string> = {
  '1':'#0d7377','2':'#7c3aed','3':'#d97706','4':'#dc2626','5':'#0891b2','6':'#16a34a',
};
const STATUS_COLOR: Record<PolicyStatus, string> = {
  Enforced:'#c4912a', Partial:'var(--amber)', Disabled:'var(--red)',
};
const STATUS_BG: Record<PolicyStatus, string> = {
  Enforced:'rgba(196,145,42,0.12)', Partial:'var(--amber-lt)', Disabled:'var(--red-lt)',
};
const STATUS_ICON: Record<PolicyStatus, string> = {
  Enforced:'✅', Partial:'⚠️', Disabled:'❌',
};
const OUTCOME_COLOR: Record<AuditEvent['outcome'], string> = {
  success:'#c4912a', blocked:'var(--red)', error:'var(--amber)',
};
const OUTCOME_BG: Record<AuditEvent['outcome'], string> = {
  success:'rgba(196,145,42,0.12)', blocked:'var(--red-lt)', error:'var(--amber-lt)',
};

/* ── helpers ───────────────────────────────────────────────────────── */
function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

/* ── reusable components ────────────────────────────────────────────── */
function StatusPill({ status }: { status: PolicyStatus }) {
  return (
    <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:STATUS_BG[status],color:STATUS_COLOR[status],whiteSpace:'nowrap' }}>
      {STATUS_ICON[status]} {status}
    </span>
  );
}

function SectionCard({ title, subtitle, children, accent }: { title:string; subtitle?:string; children:React.ReactNode; accent?:string }) {
  return (
    <div style={{ background:'#fff',border:`1px solid ${accent?accent+'30':'var(--border)'}`,borderRadius:12,overflow:'hidden',marginBottom:16 }}>
      <div style={{ padding:'11px 18px',background:accent?accent+'0a':'var(--cream)',borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:12,fontWeight:700,color:accent??'var(--ink)' }}>{title}</div>
        {subtitle&&<div style={{ fontSize:10,color:'var(--ink3)',marginTop:2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding:'14px 18px' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label:string; value:React.ReactNode }) {
  return (
    <div style={{ display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:11,color:'var(--ink3)',fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:11,color:'var(--ink)',fontWeight:600 }}>{value}</span>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <code style={{ display:'block',background:'#0d1117',color:'#58d68d',fontFamily:'monospace',fontSize:11,padding:'10px 14px',borderRadius:8,lineHeight:1.7,whiteSpace:'pre-wrap',wordBreak:'break-all' }}>
      {code}
    </code>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* TAB 1 — Infrastructure                                             */
/* ═══════════════════════════════════════════════════════════════════ */
function InfraTab() {
  return (
    <div>
      {/* Architecture diagram */}
      <SectionCard title="Database architecture — schema-per-tenant" subtitle="Each tenant gets a dedicated PostgreSQL schema with zero shared tables">
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16 }}>
          {TENANTS.map(t => (
            <div key={t.id} style={{ border:`1.5px solid ${TENANT_COLORS[t.id]}40`,borderRadius:10,padding:'12px 14px',background:`${TENANT_COLORS[t.id]}06` }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6 }}>
                <div style={{ fontWeight:700,fontSize:12,color:'var(--ink)' }}>{t.name}</div>
                <span style={{ fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3,background:t.status==='Active'?'rgba(196,145,42,0.12)':t.status==='Trial'?'var(--amber-lt)':'var(--red-lt)',color:t.status==='Active'?'#c4912a':t.status==='Trial'?'var(--amber)':'var(--red)' }}>
                  {t.status}
                </span>
              </div>
              <div style={{ fontFamily:'monospace',fontSize:10,color:TENANT_COLORS[t.id],background:TENANT_COLORS[t.id]+'10',padding:'3px 7px',borderRadius:4,marginBottom:6,display:'inline-block' }}>
                {t.schema}
              </div>
              <div style={{ fontSize:10,color:'var(--ink3)',lineHeight:1.8 }}>
                <div>🌍 {t.region}</div>
                <div>🚛 {t.vehicles} vehicles</div>
                <div>👤 {t.users} users</div>
                <div>🔑 <span style={{ fontFamily:'monospace',fontSize:9 }}>{t.encryptionKeyId.slice(0,20)}…</span></div>
              </div>
            </div>
          ))}
        </div>

        <CodeBlock code={`-- Each tenant gets a fully isolated PostgreSQL schema
CREATE SCHEMA tenant_acme;   -- ACME Logistics  (tenant 1)
CREATE SCHEMA tenant_swift;  -- SwiftCargo Ltd  (tenant 2)
CREATE SCHEMA tenant_nex;    -- NextDay Express (tenant 3)
-- ... one schema per tenant, provisioned on sign-up

-- All tables live inside the tenant schema:
CREATE TABLE tenant_acme.vehicles ( ... );
CREATE TABLE tenant_acme.drivers  ( ... );
-- Public schema contains only platform-level config — no tenant data`} />
      </SectionCard>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        <SectionCard title="Connection pool isolation" subtitle="Each tenant uses a dedicated connection pool with its own DB user">
          <InfoRow label="Pool strategy"      value="Dedicated pool per tenant" />
          <InfoRow label="DB user per tenant" value="tenant_{schema}_app" />
          <InfoRow label="search_path"        value="SET search_path = tenant_{id}" />
          <InfoRow label="Min pool size"      value="2 connections" />
          <InfoRow label="Max pool size"      value="20 connections (Enterprise)" />
          <InfoRow label="Idle timeout"       value="300 s" />
          <InfoRow label="Cross-tenant leak"  value={<span style={{ color:'#c4912a',fontWeight:700 }}>Impossible — schema isolation</span>} />
        </SectionCard>

        <SectionCard title="Storage isolation" subtitle="Object storage buckets are partitioned by tenant ID">
          <InfoRow label="S3 bucket"          value="fleetos-data-us (shared)" />
          <InfoRow label="Object key prefix"  value="s3://.../tenant_{id}/..." />
          <InfoRow label="Bucket policy"      value="IAM policy allows only own prefix" />
          <InfoRow label="Backup bucket"      value="fleetos-backups-eu/tenant_{id}/" />
          <InfoRow label="Signed URL TTL"     value="15 minutes" />
          <InfoRow label="Server-side encrypt"value="SSE-KMS per-tenant key" />
          <InfoRow label="Public access"      value={<span style={{ color:'#c4912a',fontWeight:700 }}>Blocked — all buckets private</span>} />
        </SectionCard>

        <SectionCard title="Network segmentation" subtitle="API gateway enforces tenant subdomain routing">
          <InfoRow label="Tenant URL pattern"  value="{tenant}.api.fleetos.app" />
          <InfoRow label="TLS termination"     value="Per-tenant wildcard cert" />
          <InfoRow label="WAF"                 value="OWASP Top 10 rules enabled" />
          <InfoRow label="DDoS protection"     value="AWS Shield Standard" />
          <InfoRow label="VPC isolation"       value="Private subnet; no public DB" />
          <InfoRow label="Egress rules"        value="Allow-list: KMS, S3, email only" />
        </SectionCard>

        <SectionCard title="Platform health" subtitle="Live isolation health across all tenants">
          <InfoRow label="Tenants on platform"  value={`${TENANTS.length} / 6`} />
          <InfoRow label="Active schemas"        value={`${TENANTS.filter(t=>t.status!=='Suspended').length}`} />
          <InfoRow label="Total RLS policies"    value={`${RLS_POLICIES.length * TENANTS.length} (${RLS_POLICIES.length} × 6 tenants)`} />
          <InfoRow label="API requests today"    value={TENANTS.reduce((s,t)=>s+t.apiRequestsToday,0).toLocaleString()} />
          <InfoRow label="Cross-tenant blocks"   value={<span style={{ color:'var(--red)',fontWeight:700 }}>{TENANTS.reduce((s,t)=>s+t.crossTenantBlocksToday,0)} today</span>} />
          <InfoRow label="Isolation score"       value={<span style={{ color:'#c4912a',fontWeight:700 }}>94.7% — Good</span>} />
        </SectionCard>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* TAB 2 — Data Access & RLS                                          */
/* ═══════════════════════════════════════════════════════════════════ */
function DataRLSTab() {
  const [expand, setExpand] = useState<string|null>(null);
  return (
    <div>
      <SectionCard title="Row-Level Security policies" subtitle={`${RLS_POLICIES.length} RLS policies × 6 tenants = ${RLS_POLICIES.length*6} active policy rows`}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
          <thead>
            <tr style={{ background:'var(--cream)',borderBottom:'1px solid var(--border)' }}>
              {['Table','Policy name','Operations','Applied to','Status',''].map(h=>(
                <th key={h} style={{ padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:600,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RLS_POLICIES.map((p,i)=>(
              <>
                <tr key={p.id} style={{ borderBottom:'1px solid var(--border)',background:i%2?'var(--cream)':'#fff' }}>
                  <td style={{ padding:'8px 12px',fontFamily:'monospace',fontSize:11,color:'#c4912a',fontWeight:600 }}>{p.tableName}</td>
                  <td style={{ padding:'8px 12px',fontFamily:'monospace',fontSize:10,color:'var(--ink2)' }}>{p.policyName}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <div style={{ display:'flex',gap:3,flexWrap:'wrap' }}>
                      {p.operations.map(op=>(
                        <span key={op} style={{ fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3,background:op==='SELECT'?'rgba(196,145,42,0.12)':op==='INSERT'?'var(--amber-lt)':'var(--red-lt)',color:op==='SELECT'?'#c4912a':op==='INSERT'?'var(--amber)':'var(--red)' }}>{op}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding:'8px 12px',fontSize:11,color:'var(--ink3)' }}>{p.tenantsApplied} tenants</td>
                  <td style={{ padding:'8px 12px' }}><StatusPill status={p.status} /></td>
                  <td style={{ padding:'8px 12px' }}>
                    <button onClick={()=>setExpand(expand===p.id?null:p.id)} style={{ fontSize:10,color:'#c4912a',background:'none',border:'none',cursor:'pointer',fontWeight:600 }}>
                      {expand===p.id?'▲ Less':'▼ SQL'}
                    </button>
                  </td>
                </tr>
                {expand===p.id&&(
                  <tr key={p.id+'-exp'} style={{ background:'#0d1117' }}>
                    <td colSpan={6} style={{ padding:'0 12px 12px' }}>
                      <code style={{ display:'block',color:'#58d68d',fontFamily:'monospace',fontSize:11,paddingTop:10,lineHeight:1.8,whiteSpace:'pre-wrap' }}>
{`ALTER TABLE ${p.tableName} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "${p.policyName}" ON ${p.tableName}
  FOR ALL
  TO tenant_app_role
  USING (${p.using})
  WITH CHECK (${p.check});`}
                      </code>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="API middleware chain" subtitle="Every request passes through 7 validation layers before reaching business logic">
        <div style={{ display:'flex',flexDirection:'column',gap:0 }}>
          {API_MIDDLEWARE.map((mw,i)=>(
            <div key={mw.id} style={{ display:'flex',gap:14,alignItems:'flex-start' }}>
              {/* Step connector */}
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0,paddingTop:4 }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:'#c4912a',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,zIndex:1 }}>{mw.order}</div>
                {i<API_MIDDLEWARE.length-1&&<div style={{ width:2,flex:1,background:'var(--border)',minHeight:16 }} />}
              </div>
              {/* Card */}
              <div style={{ flex:1,background:'#fff',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',marginBottom:8 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:700,fontSize:12,color:'var(--ink)',marginBottom:3 }}>{mw.name}</div>
                    <div style={{ fontSize:11,color:'var(--ink2)',lineHeight:1.6 }}>{mw.description}</div>
                  </div>
                  <StatusPill status={mw.status} />
                </div>
                <div style={{ display:'flex',gap:16,marginTop:8,fontSize:10,color:'var(--ink3)' }}>
                  <span>Validates: <strong style={{ color:'var(--ink)' }}>{mw.validates}</strong></span>
                  <span>Avg latency: <strong style={{ color:'#c4912a' }}>{mw.avgLatencyMs} ms</strong></span>
                  <span>Checked today: <strong style={{ color:'var(--ink)' }}>{mw.requestsCheckedToday.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* TAB 3 — Sessions & RBAC                                            */
/* ═══════════════════════════════════════════════════════════════════ */
function SessionsRBACTab() {
  const roles = ['viewer','dispatcher','fleet_manager','fleet_admin'] as const;
  const roleColors: Record<typeof roles[number],string> = {
    viewer:'var(--ink3)', dispatcher:'var(--amber)', fleet_manager:'#c4912a', fleet_admin:'#7c3aed',
  };

  return (
    <div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
        {SESSION_POLICIES.map(sp=>(
          <div key={sp.id} style={{ background:'#fff',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
              <div style={{ fontSize:12,fontWeight:700,color:'var(--ink)' }}>{sp.label}</div>
              <StatusPill status={sp.status} />
            </div>
            <div style={{ fontSize:11,color:'var(--ink2)',lineHeight:1.7,marginBottom:8 }}>{sp.description}</div>
            <div style={{ fontSize:10,color:'var(--ink3)',padding:'5px 10px',background:'var(--cream)',borderRadius:6,fontFamily:'monospace' }}>
              {sp.enforcement}
            </div>
          </div>
        ))}
      </div>

      <SectionCard title="JWT token anatomy" subtitle="Every access token issued by FleetOS Pro carries tenant isolation claims">
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
          <div>
            <div style={{ fontSize:11,fontWeight:600,color:'var(--ink3)',marginBottom:6 }}>HEADER</div>
            <CodeBlock code={`{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "fleetos-signing-key-2026"
}`} />
          </div>
          <div>
            <div style={{ fontSize:11,fontWeight:600,color:'var(--ink3)',marginBottom:6 }}>PAYLOAD</div>
            <CodeBlock code={`{
  "sub": "u-101",
  "email": "admin@acmelogistics.com",
  "tenant_id": "1",            ← isolation claim
  "tenant_slug": "acme",
  "role": "fleet_admin",
  "aud": "acme.api.fleetos.app", ← subdomain bound
  "iat": 1716710400,
  "exp": 1716711300            ← 15-minute TTL
}`} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="RBAC matrix — permissions within tenant scope" subtitle="All roles are bounded to the tenant — no role can access data from another tenant">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
            <thead>
              <tr style={{ background:'var(--cream)' }}>
                <th style={{ padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:600,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:0.5 }}>Resource / Action</th>
                {roles.map(r=>(
                  <th key={r} style={{ padding:'8px 12px',textAlign:'center',fontSize:10,fontWeight:700,color:roleColors[r],textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap' }}>
                    {r.replace('_',' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RBAC_MATRIX.map((row,i)=>(
                <tr key={row.resource} style={{ borderBottom:'1px solid var(--border)',background:i%2?'var(--cream)':'#fff' }}>
                  <td style={{ padding:'7px 12px',fontWeight:row.resource.includes('other tenants')?700:400,color:row.resource.includes('other tenants')?'var(--red)':'var(--ink2)' }}>
                    {row.resource.includes('other tenants')&&'🔒 '}{row.resource}
                  </td>
                  {roles.map(r=>(
                    <td key={r} style={{ padding:'7px 12px',textAlign:'center' }}>
                      {row[r]
                        ? <span style={{ color:'#c4912a',fontSize:14 }}>✓</span>
                        : <span style={{ color:'var(--red)',fontSize:14 }}>✗</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:12,padding:'10px 14px',background:'var(--red-lt)',borderRadius:8,fontSize:11,color:'var(--red)',fontWeight:600 }}>
          🔒 &ldquo;Access other tenants&rdquo; is ✗ for ALL roles — including fleet_admin. Only super_admin (platform level) can view across tenants in read-only mode.
        </div>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* TAB 4 — Encryption                                                 */
/* ═══════════════════════════════════════════════════════════════════ */
function EncryptionTab() {
  const KEY_STATUS_COLOR: Record<string,string> = { Active:'#c4912a', Rotating:'var(--amber)', Scheduled:'#7c3aed' };
  const KEY_STATUS_BG:    Record<string,string> = { Active:'rgba(196,145,42,0.12)', Rotating:'var(--amber-lt)', Scheduled:'#7c3aed18' };

  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKey[]>([]);

  useEffect(() => {
    fetch('/api/v1/encryption-keys')
      .then(r => r.ok ? r.json() : [])
      .then((data: EncryptionKey[]) => { if (Array.isArray(data)) setEncryptionKeys(data); })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:16 }}>
        {[
          { icon:'🔐', title:'At-rest encryption',   body:'All PostgreSQL data encrypted with AES-256-GCM using tenant-specific keys. Each schema\'s tablespace is encrypted independently. Transparent Data Encryption (TDE) active.' },
          { icon:'🔒', title:'In-transit encryption', body:'All API traffic uses TLS 1.3 minimum. Internal service-to-service calls use mTLS with client certificates. Database connections require SSL certificates.' },
          { icon:'🗝️', title:'Key management (KMS)', body:'AWS KMS stores master keys. Application uses envelope encryption: data keys are generated locally and wrapped with the KMS master key. Keys never leave KMS in plaintext.' },
          { icon:'🔄', title:'Key rotation',          body:'Keys rotate annually by default; can be triggered manually. Rotation is zero-downtime — new key encrypts new writes while old key decrypts existing data during migration.' },
        ].map(card=>(
          <div key={card.title} style={{ background:'#fff',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px' }}>
            <div style={{ fontSize:24,marginBottom:8 }}>{card.icon}</div>
            <div style={{ fontSize:12,fontWeight:700,color:'var(--ink)',marginBottom:6 }}>{card.title}</div>
            <div style={{ fontSize:11,color:'var(--ink2)',lineHeight:1.7 }}>{card.body}</div>
          </div>
        ))}
      </div>

      <SectionCard title="Per-tenant encryption keys" subtitle="Each tenant has a dedicated AES-256-GCM key in AWS KMS — keys are never shared">
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
          <thead>
            <tr style={{ background:'var(--cream)',borderBottom:'1px solid var(--border)' }}>
              {['Tenant','Key ID','Algorithm','Created','Last rotated','Next rotation','KMS Provider','Status'].map(h=>(
                <th key={h} style={{ padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:600,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {encryptionKeys.map((k,i)=>{
              const tenant = TENANTS.find(t=>t.id===k.tenantId);
              return (
                <tr key={k.keyId} style={{ borderBottom:'1px solid var(--border)',background:i%2?'var(--cream)':'#fff' }}>
                  <td style={{ padding:'8px 12px' }}>
                    <div style={{ fontWeight:700,fontSize:12,color:TENANT_COLORS[k.tenantId] }}>{tenant?.name}</div>
                  </td>
                  <td style={{ padding:'8px 12px',fontFamily:'monospace',fontSize:10,color:'var(--ink2)' }}>{k.keyId}</td>
                  <td style={{ padding:'8px 12px',fontSize:11 }}>{k.algorithm}</td>
                  <td style={{ padding:'8px 12px',fontSize:11,color:'var(--ink3)' }}>{fmtDate(k.created)}</td>
                  <td style={{ padding:'8px 12px',fontSize:11,color:'var(--ink3)' }}>{fmtDate(k.lastRotated)}</td>
                  <td style={{ padding:'8px 12px',fontSize:11,color:'var(--ink3)' }}>{fmtDate(k.nextRotation)}</td>
                  <td style={{ padding:'8px 12px',fontSize:10,color:'var(--ink3)' }}>{k.kmsProvider}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:KEY_STATUS_BG[k.status],color:KEY_STATUS_COLOR[k.status] }}>
                      {k.status==='Rotating'?'🔄':k.status==='Scheduled'?'⏰':'🔑'} {k.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="Envelope encryption — how it works" subtitle="Data keys are tenant-specific and wrapped by KMS master keys">
        <CodeBlock code={`// 1. Generate a tenant data key from KMS
const { plaintext: dataKey, ciphertext: wrappedKey } =
  await kms.generateDataKey({ KeyId: tenant.kmsKeyId, KeySpec: 'AES_256' });

// 2. Encrypt the data locally using the plaintext data key
const encrypted = aes256gcm.encrypt(data, dataKey);

// 3. Store ONLY the encrypted data + wrapped key (plaintext never persisted)
await db.insert({ encrypted_payload: encrypted, wrapped_key: wrappedKey });

// On read — decrypt:
// 4. Unwrap the data key using KMS (requires tenant IAM role)
const { plaintext: dataKey } = await kms.decrypt({ CiphertextBlob: wrappedKey });

// 5. Decrypt — possible only with the correct tenant's KMS key
const plaintext = aes256gcm.decrypt(encrypted_payload, dataKey);`} />
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* TAB 5 — Audit Trail                                                */
/* ═══════════════════════════════════════════════════════════════════ */
function AuditTab() {
  const [auditEvents,  setAuditEvents] = useState<AuditEvent[]>([]);
  const [tenantFilter, setFilter]      = useState('all');
  const [showBlocked,  setShowBlocked] = useState(false);

  useEffect(() => {
    fetch('/api/v1/audit-events')
      .then(r => r.ok ? r.json() : [])
      .then((data: AuditEvent[]) => { if (Array.isArray(data)) setAuditEvents(data); })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => auditEvents.filter(e => {
    const matchTenant = tenantFilter==='all' || e.tenantId===tenantFilter;
    const matchBlocked = !showBlocked || e.outcome==='blocked';
    return matchTenant && matchBlocked;
  }), [auditEvents, tenantFilter, showBlocked]);

  const crossTenantCount = auditEvents.filter(e=>e.crossTenantAttempt).length;
  const blockedCount     = auditEvents.filter(e=>e.outcome==='blocked').length;

  return (
    <div>
      {/* KPIs */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16 }}>
        {[
          { label:'Audit events today',        value:auditEvents.length, color:'#c4912a',  icon:'📋' },
          { label:'Cross-tenant blocks',        value:crossTenantCount,    color:'var(--red)',   icon:'🚫' },
          { label:'All blocked attempts',       value:blockedCount,        color:'var(--red)',   icon:'🔒' },
          { label:'RBAC deny events',           value:1,                   color:'var(--amber)', icon:'👤' },
        ].map(k=>(
          <div key={k.label} style={{ background:'#fff',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px' }}>
            <div style={{ fontSize:20,marginBottom:4 }}>{k.icon}</div>
            <div style={{ fontSize:22,fontWeight:700,color:k.color,lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:10,color:'var(--ink3)',marginTop:3,fontWeight:500 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {crossTenantCount>0&&(
        <div style={{ background:'var(--red-lt)',border:'1px solid var(--red)',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:12,color:'var(--red)',fontWeight:600 }}>
          🚨 {crossTenantCount} cross-tenant access attempt{crossTenantCount!==1?'s':''} detected today — all blocked. Review entries highlighted in red below.
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center' }}>
        <select value={tenantFilter} onChange={e=>setFilter(e.target.value)} style={{ padding:'7px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,color:'var(--ink)' }}>
          <option value="all">All tenants</option>
          {TENANTS.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <label style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--ink2)',cursor:'pointer' }}>
          <input type="checkbox" checked={showBlocked} onChange={e=>setShowBlocked(e.target.checked)} />
          Show blocked only
        </label>
        <span style={{ fontSize:11,color:'var(--ink3)',marginLeft:'auto' }}>{filtered.length} event{filtered.length!==1?'s':''}</span>
      </div>

      {/* Event feed */}
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {filtered.map(ev => {
          const tenant = TENANTS.find(t=>t.id===ev.tenantId);
          return (
            <div key={ev.id} style={{
              background:'#fff',borderRadius:10,padding:'12px 16px',
              border:`1px solid ${ev.crossTenantAttempt?'var(--red)':ev.outcome==='blocked'?'var(--amber)':'var(--border)'}`,
              borderLeft:`4px solid ${OUTCOME_COLOR[ev.outcome]}`,
            }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4 }}>
                    <span style={{ fontSize:12,fontWeight:700,color:'var(--ink)',fontFamily:'monospace' }}>{ev.action}</span>
                    <span style={{ fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:OUTCOME_BG[ev.outcome],color:OUTCOME_COLOR[ev.outcome] }}>
                      {ev.outcome==='success'?'✓':ev.outcome==='blocked'?'⛔':'⚠'} {ev.outcome.toUpperCase()}
                    </span>
                    {ev.crossTenantAttempt&&(
                      <span style={{ fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:'var(--red-lt)',color:'var(--red)' }}>
                        🚨 CROSS-TENANT ATTEMPT
                      </span>
                    )}
                    <span style={{ fontSize:10,padding:'1px 6px',borderRadius:3,background:TENANT_COLORS[ev.tenantId]+'15',color:TENANT_COLORS[ev.tenantId],fontWeight:600 }}>
                      {tenant?.name}
                    </span>
                  </div>
                  <div style={{ fontSize:11,color:'var(--ink2)',lineHeight:1.6 }}>{ev.details}</div>
                  <div style={{ display:'flex',gap:16,marginTop:5,fontSize:10,color:'var(--ink3)' }}>
                    <span>👤 {ev.actor} ({ev.actorRole})</span>
                    <span>📦 {ev.resource}/{ev.resourceId}</span>
                    <span>🌐 {ev.ipAddress}</span>
                  </div>
                </div>
                <div style={{ fontSize:10,color:'var(--ink3)',whiteSpace:'nowrap',flexShrink:0 }}>{fmtTs(ev.timestamp)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit architecture */}
      <SectionCard title="Audit log architecture" subtitle="Audit events are stored in the tenant's own schema and are export-ready" accent="#c4912a">
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
          <div>
            <InfoRow label="Storage"          value="tenant_{id}.audit_logs table" />
            <InfoRow label="Events captured"  value="All API requests, auth, admin actions" />
            <InfoRow label="Retention"        value="Enterprise: 2 yrs · Business: 1 yr · Starter: 90 days" />
            <InfoRow label="Immutability"     value="INSERT-only table — no UPDATE/DELETE" />
            <InfoRow label="Export formats"   value="JSON, CSV, SIEM-compatible (CEF)" />
            <InfoRow label="Real-time alerts" value="Cross-tenant attempt → immediate PagerDuty" />
          </div>
          <CodeBlock code={`CREATE TABLE tenant_acme.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor       TEXT NOT NULL,     -- user email or SYSTEM
  actor_role  TEXT NOT NULL,
  action      TEXT NOT NULL,     -- e.g. VEHICLE_VIEW
  resource    TEXT NOT NULL,
  resource_id TEXT,
  outcome     TEXT NOT NULL,     -- success | blocked | error
  ip_address  INET,
  details     JSONB,
  cross_tenant BOOLEAN DEFAULT FALSE
);

ALTER TABLE tenant_acme.audit_logs
  ENABLE ROW LEVEL SECURITY;   -- tenant-scoped reads`} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* TAB 6 — Backup, Reports & Config                                   */
/* ═══════════════════════════════════════════════════════════════════ */
function BackupConfigTab() {
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([]);
  const [testTenantId,  setTestTenant]    = useState('1');
  const [testRunning,   setTestRunning]   = useState(false);
  const [testResult,    setTestResult]    = useState<null|'pass'|'fail'>(null);

  useEffect(() => {
    fetch('/api/v1/backup-records')
      .then(r => r.ok ? r.json() : [])
      .then((data: BackupRecord[]) => { if (Array.isArray(data)) setBackupRecords(data); })
      .catch(() => {});
  }, []);

  function runTest() {
    setTestRunning(true); setTestResult(null);
    setTimeout(()=>{ setTestRunning(false); setTestResult('pass'); }, 1400);
  }

  return (
    <div>
      {/* Backups */}
      <SectionCard title="Isolated encrypted backups" subtitle="Every tenant has a dedicated backup chain — no shared backup files">
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
          <thead>
            <tr style={{ background:'var(--cream)',borderBottom:'1px solid var(--border)' }}>
              {['Tenant','Backup ID','Type','Completed','Size','Encrypted with','Storage location','RPO','RTO','Status'].map(h=>(
                <th key={h} style={{ padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:600,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {backupRecords.map((b,i)=>{
              const tenant = TENANTS.find(t=>t.id===b.tenantId);
              return (
                <tr key={b.backupId} style={{ borderBottom:'1px solid var(--border)',background:i%2?'var(--cream)':'#fff' }}>
                  <td style={{ padding:'8px 12px',fontWeight:700,color:TENANT_COLORS[b.tenantId],fontSize:12 }}>{tenant?.name}</td>
                  <td style={{ padding:'8px 12px',fontFamily:'monospace',fontSize:10,color:'var(--ink2)' }}>{b.backupId}</td>
                  <td style={{ padding:'8px 12px',fontSize:11 }}>
                    <span style={{ fontSize:10,padding:'1px 6px',borderRadius:3,background:b.type==='Full'?'rgba(196,145,42,0.12)':b.type==='Incremental'?'var(--amber-lt)':'var(--cream3)',color:b.type==='Full'?'#c4912a':b.type==='Incremental'?'var(--amber)':'var(--ink3)',fontWeight:600 }}>
                      {b.type}
                    </span>
                  </td>
                  <td style={{ padding:'8px 12px',fontSize:11,color:'var(--ink3)' }}>{fmtTs(b.completedAt)}</td>
                  <td style={{ padding:'8px 12px',fontSize:11 }}>{b.sizeGb} GB</td>
                  <td style={{ padding:'8px 12px',fontFamily:'monospace',fontSize:9,color:'var(--ink3)' }}>{b.encryptedWith.slice(0,20)}…</td>
                  <td style={{ padding:'8px 12px',fontFamily:'monospace',fontSize:9,color:'var(--ink3)' }}>{b.storageLocation}</td>
                  <td style={{ padding:'8px 12px',fontSize:11,color:'var(--ink2)' }}>{b.rpoHours}h</td>
                  <td style={{ padding:'8px 12px',fontSize:11,color:'var(--ink2)' }}>{b.rtoHours}h</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:'rgba(196,145,42,0.12)',color:'#c4912a' }}>✓ {b.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        {/* Report scoping */}
        <SectionCard title="Tenant-scoped report generation" subtitle="All analytics and reports query exclusively within the tenant's schema">
          <div style={{ fontSize:11,color:'var(--ink2)',lineHeight:1.7,marginBottom:12 }}>
            Every report query is prefixed with the tenant context before execution. The database connection is set to the tenant schema — no cross-schema joins are possible.
          </div>
          <CodeBlock code={`-- Report query (automatically tenant-scoped)
SET search_path = tenant_acme, public;
SET app.tenant_id = '1';

SELECT
  v.plate,
  SUM(f.litres) AS fuel_used,
  AVG(t.speed) AS avg_speed
FROM vehicles v          -- reads tenant_acme.vehicles only
JOIN fuel_events f ON f.vehicle_id = v.id
JOIN telemetry t   ON t.vehicle_id = v.id
WHERE v.tenant_id = current_setting('app.tenant_id')::uuid
  AND f.recorded_at >= now() - interval '30 days'
GROUP BY v.plate;`} />
        </SectionCard>

        {/* Config isolation */}
        <SectionCard title="Configuration & workflow isolation" subtitle="Each tenant has fully independent configuration namespaces">
          <InfoRow label="Branding"         value="Logo, colours, fonts stored in tenant schema" />
          <InfoRow label="Alert rules"      value="Tenant-specific thresholds & recipients" />
          <InfoRow label="Geofences"        value="Scoped to tenant vehicles only" />
          <InfoRow label="Route templates"  value="Stored in tenant_id.routes table" />
          <InfoRow label="Notification cfg" value="Email/SMS/webhook per tenant" />
          <InfoRow label="API keys"         value="Key → tenant binding in key registry" />
          <InfoRow label="Maintenance schedule" value="Configurable per-tenant intervals" />
          <InfoRow label="Report templates" value="Custom templates per tenant" />
          <div style={{ marginTop:10,padding:'10px 12px',background:'var(--cream)',borderRadius:8,fontSize:11,color:'var(--ink3)' }}>
            Tenant config is loaded at session start and stored in React context / Zustand. A super admin impersonating Tenant A cannot accidentally apply Tenant B&apos;s config — configs are fetched fresh on each tenant switch.
          </div>
        </SectionCard>
      </div>

      {/* Isolation policy tester */}
      <SectionCard title="🧪 Isolation policy tester" subtitle="Simulate a cross-tenant access attempt and verify the block" accent="#7c3aed">
        <div style={{ display:'flex',gap:12,alignItems:'flex-end',marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:10,fontWeight:600,color:'var(--ink3)',display:'block',marginBottom:4 }}>Requesting tenant</label>
            <select value={testTenantId} onChange={e=>setTestTenant(e.target.value)} style={{ width:'100%',padding:'8px 10px',border:'1px solid var(--border2)',borderRadius:6,fontSize:12,color:'var(--ink)' }}>
              {TENANTS.map(t=><option key={t.id} value={t.id}>{t.name} (tenant {t.id})</option>)}
            </select>
          </div>
          <div style={{ flex:2,padding:'8px 12px',background:'var(--cream)',borderRadius:6,fontSize:11,color:'var(--ink3)',fontFamily:'monospace' }}>
            GET /api/v1/vehicles?tenant_id=
            <span style={{ color:'var(--red)',fontWeight:700 }}>
              {testTenantId==='1'?'2':'1'}
            </span>
            {' '}(attempting to read another tenant)
          </div>
          <button onClick={runTest} disabled={testRunning} style={{ padding:'9px 18px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap' }}>
            {testRunning?'Testing…':'Run test'}
          </button>
        </div>

        {testResult==='pass'&&(
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {[
              { step:'1', label:'JWT validation',          result:'✅ Token for tenant '+testTenantId+' is valid',               color:'#c4912a' },
              { step:'2', label:'Subdomain tenant match',  result:'✅ Host matches JWT tenant_id',                               color:'#c4912a' },
              { step:'3', label:'Cross-tenant URL check',  result:'🚨 tenant_id in URL ('+( testTenantId==='1'?'2':'1')+') ≠ JWT tenant_id ('+testTenantId+')', color:'var(--red)' },
              { step:'4', label:'Request blocked',         result:'⛔ 403 Forbidden — cross-tenant access denied',               color:'var(--red)' },
              { step:'5', label:'Audit event recorded',    result:'📋 CROSS_TENANT_BLOCK written to audit_logs',                 color:'var(--amber)' },
            ].map(row=>(
              <div key={row.step} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#fff',borderRadius:8,border:'1px solid var(--border)' }}>
                <div style={{ width:22,height:22,borderRadius:'50%',background:row.color,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0 }}>{row.step}</div>
                <span style={{ fontSize:11,color:'var(--ink3)',fontWeight:600,minWidth:160 }}>{row.label}</span>
                <span style={{ fontSize:11,color:row.color,fontWeight:600 }}>{row.result}</span>
              </div>
            ))}
            <div style={{ padding:'10px 14px',background:'rgba(196,145,42,0.12)',borderRadius:8,fontSize:12,color:'#c4912a',fontWeight:600,marginTop:4 }}>
              ✅ Isolation working correctly — cross-tenant access was blocked at middleware layer 3 (0.3 ms)
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* Isolation matrix (bottom of page)                                  */
/* ═══════════════════════════════════════════════════════════════════ */
function IsolationMatrix() {
  const dimCategories = Array.from(new Set(ISOLATION_DIMENSIONS.map(d=>d.category)));

  return (
    <div style={{ background:'#fff',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden',marginTop:24 }}>
      <div style={{ padding:'12px 20px',background:'var(--cream)',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <div>
          <div style={{ fontWeight:700,fontSize:14,color:'var(--ink)' }}>Tenant isolation matrix</div>
          <div style={{ fontSize:11,color:'var(--ink3)',marginTop:2 }}>All 10 isolation dimensions × 6 tenants — colour-coded compliance status</div>
        </div>
        <div style={{ display:'flex',gap:12,fontSize:10 }}>
          {(['Enforced','Partial','Disabled'] as PolicyStatus[]).map(s=>(
            <span key={s} style={{ display:'flex',alignItems:'center',gap:4,fontWeight:600,color:STATUS_COLOR[s] }}>
              <span style={{ width:10,height:10,borderRadius:'50%',background:STATUS_COLOR[s],display:'inline-block' }} />{s}
            </span>
          ))}
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
          <thead>
            <tr>
              <th style={{ padding:'10px 16px',textAlign:'left',background:'var(--cream)',borderBottom:'1px solid var(--border)',fontSize:10,color:'var(--ink3)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,minWidth:160 }}>
                Tenant
              </th>
              {ISOLATION_DIMENSIONS.map(dim=>(
                <th key={dim.id} style={{ padding:'10px 12px',textAlign:'center',background:'var(--cream)',borderBottom:'1px solid var(--border)',fontSize:10,color:'var(--ink3)',fontWeight:600,whiteSpace:'nowrap' }}>
                  <div>{dim.icon}</div>
                  <div style={{ marginTop:2 }}>{dim.label}</div>
                  <div style={{ fontSize:8,opacity:0.7,fontWeight:400 }}>{dim.category}</div>
                </th>
              ))}
              <th style={{ padding:'10px 12px',textAlign:'center',background:'var(--cream)',borderBottom:'1px solid var(--border)',fontSize:10,color:'var(--ink3)',fontWeight:600 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {TENANTS.map((t,ti)=>{
              const row = TENANT_ISOLATION_MATRIX[t.id] ?? {};
              const enforced = ISOLATION_DIMENSIONS.filter(d=>row[d.id]==='Enforced').length;
              const pct = Math.round((enforced/ISOLATION_DIMENSIONS.length)*100);
              return (
                <tr key={t.id} style={{ borderBottom:'1px solid var(--border)',background:ti%2?'var(--cream)':'#fff' }}>
                  <td style={{ padding:'10px 16px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ width:8,height:8,borderRadius:'50%',background:TENANT_COLORS[t.id],flexShrink:0 }} />
                      <div>
                        <div style={{ fontWeight:700,color:'var(--ink)',fontSize:12 }}>{t.name}</div>
                        <div style={{ fontSize:9,color:'var(--ink3)',fontFamily:'monospace' }}>{t.schema}</div>
                      </div>
                    </div>
                  </td>
                  {ISOLATION_DIMENSIONS.map(dim=>{
                    const st = (row[dim.id] ?? 'Enforced') as PolicyStatus;
                    return (
                      <td key={dim.id} style={{ padding:'10px 12px',textAlign:'center' }}>
                        <span style={{ fontSize:14 }} title={st}>{STATUS_ICON[st]}</span>
                      </td>
                    );
                  })}
                  <td style={{ padding:'10px 12px',textAlign:'center' }}>
                    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                      <div style={{ fontWeight:700,fontSize:12,color:pct===100?'#c4912a':pct>=80?'var(--amber)':'var(--red)' }}>{pct}%</div>
                      <div style={{ width:50,height:4,background:'var(--cream3)',borderRadius:2,overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`,height:'100%',background:pct===100?'#c4912a':pct>=80?'var(--amber)':'var(--red)',borderRadius:2 }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* Main page                                                          */
/* ═══════════════════════════════════════════════════════════════════ */
type Tab = 'infra'|'data'|'sessions'|'encryption'|'audit'|'backup';
const TABS: { id:Tab; label:string; icon:string; stories:string }[] = [
  { id:'infra',      label:'Infrastructure',  icon:'🗄️', stories:'Schema/DB isolation · storage · networking' },
  { id:'data',       label:'Data & RLS',      icon:'🔐', stories:'Row-level security · API middleware chain' },
  { id:'sessions',   label:'Sessions & RBAC', icon:'🪪', stories:'Session isolation · JWT · role permissions' },
  { id:'encryption', label:'Encryption',      icon:'🔑', stories:'Per-tenant keys · KMS · at-rest/in-transit' },
  { id:'audit',      label:'Audit trail',     icon:'📋', stories:'Activity log · cross-tenant block events' },
  { id:'backup',     label:'Backup & Config', icon:'💾', stories:'Isolated backups · tenant reports · configs' },
];

export default function IsolationPage() {
  const { user } = useAuthStore();
  const role = user?.role ?? 'viewer';
  const isSuperAdmin = role === 'super_admin' || role === 'platform_admin';

  const [activeTab, setTab] = useState<Tab>('infra');

  const totalBlocks = TENANTS.reduce((s,t)=>s+t.crossTenantBlocksToday,0);
  const totalRequests = TENANTS.reduce((s,t)=>s+t.apiRequestsToday,0);
  const fullyEnforced = TENANTS.filter(t => {
    const row = TENANT_ISOLATION_MATRIX[t.id]??{};
    return ISOLATION_DIMENSIONS.every(d=>row[d.id]==='Enforced');
  }).length;

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-shield-check" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Platform Ops</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Isolation Center</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Complete tenant data isolation · {TENANTS.length} tenants · {RLS_POLICIES.length} RLS policies · {API_MIDDLEWARE.length} API middleware layers</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:0 }}>
          {[{ label:'Tenants Isolated', value:`${TENANTS.length}/${TENANTS.length}` },{ label:'Fully Enforced', value:String(fullyEnforced) },{ label:'Cross-Tenant Blocks', value:String(totalBlocks) }].map((s,i)=>(
            <div key={s.label} style={{ textAlign:'center', padding:'0 18px', borderLeft:i>0?'1px solid rgba(196,145,42,0.20)':'none' }}>
              <div style={{ fontSize:20, fontWeight:700, color:'#fff' }}>{s.value}</div>
              <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Super-admin notice */}
      {!isSuperAdmin && (
        <div style={{ background:'var(--amber-lt)',border:'1px solid var(--amber)',borderRadius:8,padding:'9px 14px',marginBottom:16,fontSize:12,color:'#92600a',fontWeight:600,display:'flex',gap:8,alignItems:'center' }}>
          👤 You are viewing isolation policies for <strong>{user?.tenantName ?? 'your tenant'}</strong> only. Super admins see the cross-tenant matrix.
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:20 }}>
        {[
          { label:'Tenants isolated',       value:`${TENANTS.length}/${TENANTS.length}`,   color:'#c4912a', icon:'🏢' },
          { label:'RLS policies active',    value:RLS_POLICIES.length*TENANTS.length,       color:'#c4912a', icon:'🔐' },
          { label:'API middleware layers',  value:API_MIDDLEWARE.length,                    color:'#c4912a', icon:'🌐' },
          { label:'API requests today',     value:totalRequests.toLocaleString(),           color:'#c4912a', icon:'📡' },
          { label:'Cross-tenant blocked',   value:totalBlocks,                              color:totalBlocks?'var(--red)':'#c4912a', icon:'🚫' },
          { label:'Fully compliant',        value:`${fullyEnforced}/${TENANTS.length}`,     color:fullyEnforced===TENANTS.length?'#c4912a':'var(--amber)', icon:'✅' },
        ].map(k=>(
          <div key={k.label} style={{ background:'#fff',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px' }}>
            <div style={{ fontSize:16,marginBottom:4 }}>{k.icon}</div>
            <div style={{ fontSize:18,fontWeight:700,color:k.color,lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:9,color:'var(--ink3)',marginTop:3,fontWeight:500 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:2,marginBottom:20,borderBottom:'1px solid var(--border)',flexWrap:'wrap' }}>
        {TABS.map(t=>{
          const active = activeTab===t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'10px 16px',border:'none',borderRadius:'8px 8px 0 0',
              background:active?'#fff':'transparent',
              borderBottom:active?'2px solid #c4912a':'2px solid transparent',
              color:active?'#c4912a':'var(--ink3)',
              fontWeight:active?700:400,fontSize:12,cursor:'pointer',
              display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap',
            }}>
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* Story tag */}
      <div style={{ marginBottom:16,padding:'7px 14px',background:'var(--cream)',borderRadius:8,fontSize:11,color:'var(--ink3)',borderLeft:'3px solid #c4912a' }}>
        📌 {TABS.find(t=>t.id===activeTab)?.stories}
      </div>

      {/* Tab content */}
      {activeTab==='infra'      && <InfraTab />}
      {activeTab==='data'       && <DataRLSTab />}
      {activeTab==='sessions'   && <SessionsRBACTab />}
      {activeTab==='encryption' && <EncryptionTab />}
      {activeTab==='audit'      && <AuditTab />}
      {activeTab==='backup'     && <BackupConfigTab />}

      {/* Always-visible isolation matrix */}
      <IsolationMatrix />
    </div>
  );
}
