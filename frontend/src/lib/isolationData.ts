/* ── Types ────────────────────────────────────────────────────────── */

export interface TenantMeta {
  id: string;
  name: string;
  plan: string;
  country: string;
  status: 'Active' | 'Suspended' | 'Trial';
  schema: string;
  region: string;
  vehicles: number;
  users: number;
  adminEmail: string;
  encryptionKeyId: string;
  backupRetentionDays: number;
  lastBackupAt: string;
  rlsPoliciesActive: number;
  apiRequestsToday: number;
  crossTenantBlocksToday: number;
}

export type PolicyStatus = 'Enforced' | 'Partial' | 'Disabled';

export interface RLSPolicy {
  id: string;
  tableName: string;
  policyName: string;
  using: string;       // SQL predicate
  check: string;       // SQL check predicate
  operations: ('SELECT'|'INSERT'|'UPDATE'|'DELETE')[];
  status: PolicyStatus;
  tenantsApplied: number;
}

export interface ApiMiddleware {
  id: string;
  name: string;
  order: number;
  description: string;
  validates: string;
  status: PolicyStatus;
  avgLatencyMs: number;
  requestsCheckedToday: number;
}

export interface SessionPolicy {
  id: string;
  label: string;
  description: string;
  enforcement: string;
  status: PolicyStatus;
}

export interface EncryptionKey {
  tenantId: string;
  keyId: string;
  algorithm: string;
  bitLength: number;
  created: string;
  lastRotated: string;
  nextRotation: string;
  status: 'Active' | 'Rotating' | 'Scheduled';
  kmsProvider: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string;
  outcome: 'success' | 'blocked' | 'error';
  ipAddress: string;
  details: string;
  crossTenantAttempt: boolean;
}

export interface BackupRecord {
  tenantId: string;
  backupId: string;
  type: 'Full' | 'Incremental' | 'Snapshot';
  startedAt: string;
  completedAt: string;
  sizeGb: number;
  status: 'Completed' | 'Running' | 'Failed';
  encryptedWith: string;
  storageLocation: string;
  rpoHours: number;
  rtoHours: number;
}

export interface IsolationDimension {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'Infrastructure' | 'Data' | 'Session' | 'Encryption' | 'Audit' | 'Backup';
}

/* ── Tenants ──────────────────────────────────────────────────────── */
export const TENANTS: TenantMeta[] = [
  {
    id:'1', name:'ACME Logistics',   plan:'Enterprise',   country:'United States', status:'Active',    schema:'tenant_acme',  region:'us-east-1',
    vehicles:247, users:18, adminEmail:'admin@acmelogistics.com',
    encryptionKeyId:'kms-key-acme-2024-001',  backupRetentionDays:90,  lastBackupAt:'2026-05-26T02:00:00Z',
    rlsPoliciesActive:48, apiRequestsToday:12847, crossTenantBlocksToday:0,
  },
  {
    id:'2', name:'SwiftCargo Ltd',   plan:'Business',     country:'United States', status:'Active',    schema:'tenant_swift', region:'us-east-1',
    vehicles:45,  users:8,  adminEmail:'admin@swiftcargo.com',
    encryptionKeyId:'kms-key-swift-2024-002', backupRetentionDays:30,  lastBackupAt:'2026-05-26T02:00:00Z',
    rlsPoliciesActive:48, apiRequestsToday:4213,  crossTenantBlocksToday:0,
  },
  {
    id:'3', name:'NextDay Express',  plan:'Business',     country:'United Kingdom', status:'Active',    schema:'tenant_nex',   region:'eu-west-2',
    vehicles:12,  users:3,  adminEmail:'admin@nextdayexpress.co.uk',
    encryptionKeyId:'kms-key-nex-2024-003',   backupRetentionDays:30,  lastBackupAt:'2026-05-26T02:00:00Z',
    rlsPoliciesActive:48, apiRequestsToday:987,   crossTenantBlocksToday:1,
  },
  {
    id:'4', name:'KAM Transport',    plan:'Starter',      country:'United States', status:'Suspended', schema:'tenant_kam',   region:'us-east-1',
    vehicles:78,  users:12, adminEmail:'admin@kamtransport.com',
    encryptionKeyId:'kms-key-kam-2024-004',   backupRetentionDays:7,   lastBackupAt:'2026-05-25T02:00:00Z',
    rlsPoliciesActive:48, apiRequestsToday:0,     crossTenantBlocksToday:2,
  },
  {
    id:'5', name:'PeakFleet Co',     plan:'Business',     country:'United Kingdom', status:'Active',    schema:'tenant_peak',  region:'eu-west-2',
    vehicles:180, users:22, adminEmail:'admin@peakfleet.co.uk',
    encryptionKeyId:'kms-key-peak-2024-005',  backupRetentionDays:30,  lastBackupAt:'2026-05-26T02:00:00Z',
    rlsPoliciesActive:48, apiRequestsToday:8901,  crossTenantBlocksToday:0,
  },
  {
    id:'6', name:'SwiftDeliver Co',  plan:'Starter',      country:'United States', status:'Trial',     schema:'tenant_sde',   region:'us-west-2',
    vehicles:8,   users:2,  adminEmail:'admin@swiftdeliver.com',
    encryptionKeyId:'kms-key-sde-2024-006',   backupRetentionDays:7,   lastBackupAt:'2026-05-26T02:00:00Z',
    rlsPoliciesActive:48, apiRequestsToday:302,   crossTenantBlocksToday:0,
  },
  {
    id:'7', name:'Star Technologies', plan:'Enterprise',   country:'Pakistan',       status:'Active',    schema:'tenant_star',     region:'ap-south-1',
    vehicles:100, users:14, adminEmail:'admin@starttech.io',
    encryptionKeyId:'kms-key-star-2026-007',     backupRetentionDays:30, lastBackupAt:'2026-06-01T02:00:00Z',
    rlsPoliciesActive:48, apiRequestsToday:5412,  crossTenantBlocksToday:0,
  },
  {
    id:'8', name:'Atlantic Freight Inc', plan:'Enterprise',   country:'United States', status:'Active',    schema:'tenant_atlantic', region:'us-east-1',
    vehicles:8,   users:6,  adminEmail:'fleet@atlanticfreight.com',
    encryptionKeyId:'kms-key-atlantic-2023-008',  backupRetentionDays:90, lastBackupAt:'2026-06-06T02:00:00Z',
    rlsPoliciesActive:48, apiRequestsToday:1840,  crossTenantBlocksToday:0,
  },
  {
    id:'9', name:'Meridian Logistics',   plan:'Professional', country:'United States', status:'Active',    schema:'tenant_meridian', region:'us-east-1',
    vehicles:6,   users:4,  adminEmail:'admin@meridianlogistics.com',
    encryptionKeyId:'kms-key-meridian-2024-009',  backupRetentionDays:30, lastBackupAt:'2026-06-06T02:00:00Z',
    rlsPoliciesActive:48, apiRequestsToday:924,   crossTenantBlocksToday:0,
  },
  {
    id:'10', name:'BritFleet Solutions', plan:'Enterprise',   country:'United Kingdom',status:'Active',    schema:'tenant_britfleet',region:'eu-west-2',
    vehicles:8,   users:5,  adminEmail:'fleet@britfleet.co.uk',
    encryptionKeyId:'kms-key-britfleet-2023-010', backupRetentionDays:90, lastBackupAt:'2026-06-06T02:00:00Z',
    rlsPoliciesActive:48, apiRequestsToday:2103,  crossTenantBlocksToday:0,
  },
];

/* ── RLS Policies ─────────────────────────────────────────────────── */
export const RLS_POLICIES: RLSPolicy[] = [
  { id:'rls-1',  tableName:'vehicles',          policyName:'tenant_vehicles_isolation',     using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT','UPDATE','DELETE'], status:'Enforced', tenantsApplied:6 },
  { id:'rls-2',  tableName:'drivers',           policyName:'tenant_drivers_isolation',      using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT','UPDATE','DELETE'], status:'Enforced', tenantsApplied:6 },
  { id:'rls-3',  tableName:'gps_events',        policyName:'tenant_gps_isolation',          using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT'],                   status:'Enforced', tenantsApplied:6 },
  { id:'rls-4',  tableName:'alerts',            policyName:'tenant_alerts_isolation',       using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT','UPDATE','DELETE'], status:'Enforced', tenantsApplied:6 },
  { id:'rls-5',  tableName:'customers',         policyName:'tenant_customers_isolation',    using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT','UPDATE','DELETE'], status:'Enforced', tenantsApplied:6 },
  { id:'rls-6',  tableName:'users',             policyName:'tenant_users_isolation',        using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT','UPDATE'],          status:'Enforced', tenantsApplied:6 },
  { id:'rls-7',  tableName:'maintenance_records',policyName:'tenant_maint_isolation',       using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT','UPDATE','DELETE'], status:'Enforced', tenantsApplied:6 },
  { id:'rls-8',  tableName:'documents',         policyName:'tenant_documents_isolation',    using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT','UPDATE','DELETE'], status:'Enforced', tenantsApplied:6 },
  { id:'rls-9',  tableName:'routes',            policyName:'tenant_routes_isolation',       using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT','UPDATE','DELETE'], status:'Enforced', tenantsApplied:6 },
  { id:'rls-10', tableName:'geofences',         policyName:'tenant_geofences_isolation',    using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT','UPDATE','DELETE'], status:'Enforced', tenantsApplied:6 },
  { id:'rls-11', tableName:'reports',           policyName:'tenant_reports_isolation',      using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT'],                   status:'Enforced', tenantsApplied:6 },
  { id:'rls-12', tableName:'audit_logs',        policyName:'tenant_audit_isolation',        using:'tenant_id = current_setting(\'app.tenant_id\')::uuid', check:'tenant_id = current_setting(\'app.tenant_id\')::uuid', operations:['SELECT','INSERT'],                   status:'Enforced', tenantsApplied:6 },
];

/* ── API Middleware chain ─────────────────────────────────────────── */
export const API_MIDDLEWARE: ApiMiddleware[] = [
  { id:'mw-1', name:'JWT Validation',        order:1, description:'Verifies JWT signature using RS256 keypair. Rejects expired, tampered, or unsigned tokens.', validates:'Token integrity & expiry', status:'Enforced', avgLatencyMs:0.8,  requestsCheckedToday:27250 },
  { id:'mw-2', name:'Tenant Claim Extractor',order:2, description:'Extracts tenant_id from JWT aud/sub claims. Sets app.tenant_id in PostgreSQL session context.', validates:'tenant_id claim presence', status:'Enforced', avgLatencyMs:0.2, requestsCheckedToday:27250 },
  { id:'mw-3', name:'Subdomain Tenant Match',order:3, description:'Ensures the Host header subdomain matches the tenant_id in the JWT. Blocks mismatched requests.', validates:'Host ↔ JWT tenant binding', status:'Enforced', avgLatencyMs:0.3,  requestsCheckedToday:27250 },
  { id:'mw-4', name:'Role Scope Guard',      order:4, description:'Checks UserRole against endpoint permission map. Returns 403 if role is below the required minimum.', validates:'Role ≥ required threshold', status:'Enforced', avgLatencyMs:0.4, requestsCheckedToday:27250 },
  { id:'mw-5', name:'Tenant Suspension Gate',order:5, description:'If the tenant status is Suspended, all mutating endpoints return 423 Locked; read access returns cached data only.', validates:'Tenant status', status:'Enforced', avgLatencyMs:0.1, requestsCheckedToday:302 },
  { id:'mw-6', name:'Request Audit Logger',  order:6, description:'Appends every authenticated request to the tenant-scoped audit_logs table with actor, resource, and outcome.', validates:'Audit completeness', status:'Enforced', avgLatencyMs:1.2,  requestsCheckedToday:27250 },
  { id:'mw-7', name:'Response Scrubber',     order:7, description:'Scans outbound JSON for foreign tenant_id fields. Drops any leaked rows before the response is sent.', validates:'Output data integrity', status:'Enforced', avgLatencyMs:0.6,  requestsCheckedToday:27250 },
];

/* ── Session policies ─────────────────────────────────────────────── */
export const SESSION_POLICIES: SessionPolicy[] = [
  { id:'sp-1', label:'Tenant-bound JWT',         description:'Every access token includes a tenant_id claim. Tokens cannot be reused on a different tenant\'s API subdomain.', enforcement:'JWT aud claim + Host header match', status:'Enforced' },
  { id:'sp-2', label:'Short-lived access tokens', description:'Access tokens expire after 15 minutes. Refresh tokens are single-use and tenant-scoped, expiring after 7 days.', enforcement:'exp claim enforced by JWT Validation middleware', status:'Enforced' },
  { id:'sp-3', label:'Session store isolation',   description:'Redis session keys are namespaced by tenant_id. A token from tenant A cannot be used to restore a session in tenant B.', enforcement:'Key prefix: sess:{tenant_id}:{session_id}', status:'Enforced' },
  { id:'sp-4', label:'Concurrent session cap',    description:'Maximum 5 concurrent sessions per user. New login invalidates the oldest session.', enforcement:'Session count tracked in tenant Redis namespace', status:'Enforced' },
  { id:'sp-5', label:'Cross-tenant replay block', description:'Session tokens contain a tenant fingerprint. Any attempt to replay a session from tenant A against tenant B\'s API returns 401.', enforcement:'HMAC-signed tenant_id bound to session', status:'Enforced' },
  { id:'sp-6', label:'Suspicious IP throttle',    description:'More than 5 failed auth attempts from the same IP within 60 seconds triggers a 5-minute lockout for that tenant endpoint.', enforcement:'Token-bucket rate limiter per IP+tenant', status:'Enforced' },
];

/* ── RBAC permission matrix ───────────────────────────────────────── */
export const RBAC_MATRIX: { resource: string; viewer: boolean; dispatcher: boolean; fleet_manager: boolean; fleet_admin: boolean }[] = [
  { resource:'View own tenant vehicles',   viewer:true,  dispatcher:true,  fleet_manager:true,  fleet_admin:true  },
  { resource:'Register vehicle',           viewer:false, dispatcher:false, fleet_manager:true,  fleet_admin:true  },
  { resource:'Edit vehicle master data',   viewer:false, dispatcher:false, fleet_manager:true,  fleet_admin:true  },
  { resource:'View drivers',               viewer:true,  dispatcher:true,  fleet_manager:true,  fleet_admin:true  },
  { resource:'Assign drivers',             viewer:false, dispatcher:true,  fleet_manager:true,  fleet_admin:true  },
  { resource:'View customers',             viewer:false, dispatcher:true,  fleet_manager:true,  fleet_admin:true  },
  { resource:'Create / edit customers',    viewer:false, dispatcher:false, fleet_manager:true,  fleet_admin:true  },
  { resource:'View alerts',               viewer:true,  dispatcher:true,  fleet_manager:true,  fleet_admin:true  },
  { resource:'Acknowledge alerts',         viewer:false, dispatcher:true,  fleet_manager:true,  fleet_admin:true  },
  { resource:'View reports',              viewer:true,  dispatcher:false, fleet_manager:true,  fleet_admin:true  },
  { resource:'Export data',               viewer:false, dispatcher:false, fleet_manager:true,  fleet_admin:true  },
  { resource:'Invite / manage users',      viewer:false, dispatcher:false, fleet_manager:false, fleet_admin:true  },
  { resource:'View audit logs',           viewer:false, dispatcher:false, fleet_manager:false, fleet_admin:true  },
  { resource:'Edit branding / config',     viewer:false, dispatcher:false, fleet_manager:false, fleet_admin:true  },
  { resource:'View billing / subscription',viewer:false, dispatcher:false, fleet_manager:false, fleet_admin:true  },
  { resource:'Access other tenants',       viewer:false, dispatcher:false, fleet_manager:false, fleet_admin:false },
];

/* ── Encryption keys — moved to PostgreSQL ────────────────────────── */
/* Seed data in DB migration AddDevicesSimsTripsSubscriptionsRolesAudit */
/* Hydrated at runtime via isolation/page.tsx → /api/v1/encryption-keys */
export const ENCRYPTION_KEYS: EncryptionKey[] = [];

/* ── Audit events — moved to PostgreSQL ──────────────────────────── */
/* Hydrated at runtime via isolation/page.tsx → /api/v1/audit-events  */
export const AUDIT_EVENTS: AuditEvent[] = [];

/* ── Backup records — moved to PostgreSQL ────────────────────────── */
/* Hydrated at runtime via isolation/page.tsx → /api/v1/backup-records */
export const BACKUP_RECORDS: BackupRecord[] = [];

/* ── Isolation dimensions (matrix columns) ──────────────────────────── */
export const ISOLATION_DIMENSIONS: IsolationDimension[] = [
  { id:'schema',    label:'Schema',       description:'Dedicated PostgreSQL schema per tenant',   icon:'🗄️', category:'Infrastructure' },
  { id:'rls',       label:'RLS',          description:'Row-level security on all tables',         icon:'🔐', category:'Data'          },
  { id:'api',       label:'API Guard',    description:'JWT tenant_id validated on every request', icon:'🌐', category:'Data'          },
  { id:'session',   label:'Sessions',     description:'Session tokens bound to tenant boundary',  icon:'🪪', category:'Session'       },
  { id:'rbac',      label:'RBAC',         description:'Roles scoped within tenant only',          icon:'👤', category:'Session'       },
  { id:'encrypt',   label:'Encryption',   description:'Tenant-specific AES-256 key in KMS',      icon:'🔑', category:'Encryption'    },
  { id:'audit',     label:'Audit Log',    description:'Tenant-isolated audit trail',              icon:'📋', category:'Audit'         },
  { id:'backup',    label:'Backup',       description:'Isolated encrypted backup per tenant',     icon:'💾', category:'Backup'        },
  { id:'reports',   label:'Reports',      description:'Report queries scoped to tenant data',     icon:'📊', category:'Backup'        },
  { id:'config',    label:'Config',       description:'Configurations & workflows isolated',      icon:'⚙️', category:'Backup'        },
];

/* Compliance of each tenant per dimension — all Enforced */
export type TenantIsolationStatus = Record<string, PolicyStatus>;
export const TENANT_ISOLATION_MATRIX: Record<string, TenantIsolationStatus> = {
  '1': { schema:'Enforced', rls:'Enforced', api:'Enforced', session:'Enforced', rbac:'Enforced', encrypt:'Enforced', audit:'Enforced', backup:'Enforced', reports:'Enforced', config:'Enforced' },
  '2': { schema:'Enforced', rls:'Enforced', api:'Enforced', session:'Enforced', rbac:'Enforced', encrypt:'Enforced', audit:'Enforced', backup:'Enforced', reports:'Enforced', config:'Enforced' },
  '3': { schema:'Enforced', rls:'Enforced', api:'Enforced', session:'Enforced', rbac:'Enforced', encrypt:'Enforced', audit:'Enforced', backup:'Enforced', reports:'Enforced', config:'Enforced' },
  '4': { schema:'Enforced', rls:'Enforced', api:'Enforced', session:'Enforced', rbac:'Enforced', encrypt:'Partial',  audit:'Enforced', backup:'Partial',  reports:'Enforced', config:'Enforced' },
  '5': { schema:'Enforced', rls:'Enforced', api:'Enforced', session:'Enforced', rbac:'Enforced', encrypt:'Enforced', audit:'Enforced', backup:'Enforced', reports:'Enforced', config:'Enforced' },
  '6':  { schema:'Enforced', rls:'Enforced', api:'Enforced', session:'Enforced', rbac:'Enforced', encrypt:'Partial',  audit:'Enforced', backup:'Partial',  reports:'Enforced', config:'Enforced' },
  '7':  { schema:'Enforced', rls:'Enforced', api:'Enforced', session:'Enforced', rbac:'Enforced', encrypt:'Enforced', audit:'Enforced', backup:'Enforced', reports:'Enforced', config:'Enforced' },
  '8':  { schema:'Enforced', rls:'Enforced', api:'Enforced', session:'Enforced', rbac:'Enforced', encrypt:'Enforced', audit:'Enforced', backup:'Enforced', reports:'Enforced', config:'Enforced' },
  '9':  { schema:'Enforced', rls:'Enforced', api:'Enforced', session:'Enforced', rbac:'Enforced', encrypt:'Enforced', audit:'Enforced', backup:'Enforced', reports:'Enforced', config:'Enforced' },
  '10': { schema:'Enforced', rls:'Enforced', api:'Enforced', session:'Enforced', rbac:'Enforced', encrypt:'Enforced', audit:'Enforced', backup:'Enforced', reports:'Enforced', config:'Enforced' },
};

/* helpers */
export function getTenantById(id: string): TenantMeta | undefined {
  return TENANTS.find(t => t.id === id);
}
export function getAuditByTenant(id: string): AuditEvent[] {
  return AUDIT_EVENTS.filter(e => e.tenantId === id);
}
export function getBackupByTenant(id: string): BackupRecord | undefined {
  return BACKUP_RECORDS.find(b => b.tenantId === id);
}
export function getKeyByTenant(id: string): EncryptionKey | undefined {
  return ENCRYPTION_KEYS.find(k => k.tenantId === id);
}
