import { getPool, TENANT_UUID } from './pgDb';

export interface AuditEventInput {
  tenantId:           string | null;   // short ID ('1'), full UUID, or null → platform
  actor:              string;          // email or display name
  actorRole:          string;
  action:             string;          // 'login' | 'login_failed' | 'user.create' | etc.
  resource:           string;          // 'Auth' | 'User' | 'Vehicle' | 'Alert' | 'Portal'
  resourceId?:        string;
  outcome:            'success' | 'failure';
  ipAddress?:         string;
  details?:           Record<string, unknown>;
  crossTenantAttempt?: boolean;
}

function resolveTenantUuid(tenantId: string | null): string | null {
  if (!tenantId) return null;
  if (TENANT_UUID[tenantId]) return TENANT_UUID[tenantId];
  // Already a UUID (contains dashes and is long enough)
  if (tenantId.includes('-') && tenantId.length >= 32) return tenantId;
  return null;
}

export async function logAuditEvent(event: AuditEventInput): Promise<void> {
  try {
    const db         = getPool();
    const tenantUuid = resolveTenantUuid(event.tenantId);
    const shortId    = `ae${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    await db.query(
      `INSERT INTO "AuditEvents"
         ("Id","ShortId","TenantId","Timestamp","Actor","ActorRole","Action",
          "Resource","ResourceId","Outcome","IpAddress","Details","CrossTenantAttempt")
       VALUES
         (gen_random_uuid(),$1,$2,NOW(),$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        shortId,
        tenantUuid,
        event.actor,
        event.actorRole,
        event.action,
        event.resource,
        event.resourceId  ?? '',
        event.outcome,
        event.ipAddress   ?? '',
        JSON.stringify(event.details ?? {}),
        event.crossTenantAttempt ?? false,
      ],
    );
  } catch (err) {
    // Never throw — audit failures must not break the primary flow
    console.error('[auditLogger]', err);
  }
}
