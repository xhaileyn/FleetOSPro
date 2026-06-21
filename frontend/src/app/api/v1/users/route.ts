import { NextRequest, NextResponse } from 'next/server';
import { upsertServerUser } from '@/lib/usersServerStore';
import { getPool, TENANT_UUID, UUID_TENANT, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';
import { logAuditEvent } from '@/lib/auditLogger';
import type { TenantUser } from '@/lib/tenantUsers';

function actorFromReq(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!auth) return { email: 'system', role: 'system', tenantId: null as string | null };
  try {
    const { email, role, tenantId } = JSON.parse(Buffer.from(auth, 'base64').toString('utf8'));
    return { email: email ?? 'system', role: role ?? 'system', tenantId: tenantId ?? null };
  } catch { return { email: 'system', role: 'system', tenantId: null as string | null }; }
}

/** Map a raw DB row to the TenantUser client shape */
function rowToTenantUser(u: Record<string, unknown>): TenantUser {
  const tenantUuid = u.TenantId as string | null;
  const tenantId   = tenantUuid
    ? (fromTenantUuid(tenantUuid.toLowerCase()) ?? tenantUuid)
    : '';

  return {
    id:         String(u.Id),
    tenantId,
    tenantName: '',
    tenantSlug: '',
    firstName:  String(u.FirstName ?? ''),
    lastName:   String(u.LastName  ?? ''),
    email:      String(u.Email),
    password:   String(u.PasswordHash ?? 'Demo1234!'),
    role:       (u.Role as TenantUser['role']) ?? 'viewer',
    status:     (u.Status as TenantUser['status']) ?? 'Active',
    mfaEnabled: Boolean(u.MfaEnabled),
    lastLogin:  u.LastLoginAt
      ? new Date(u.LastLoginAt as string).toLocaleString('en-GB', {
          dateStyle: 'short', timeStyle: 'short',
        })
      : 'Never',
    // Extended fields
    additionalRoles:      jsonField<TenantUser['additionalRoles']>(u.AdditionalRoles),
    customRoleIds:        jsonField<string[]>(u.CustomRoleIds),
    vehicleId:            (u.VehicleId as string) || undefined,
    vehicleIds:           jsonField<string[]>(u.VehicleIds),
    restrictedVehicleIds: jsonField<string[]>(u.RestrictedVehicleIds),
    restrictedDeviceIds:  jsonField<string[]>(u.RestrictedDeviceIds),
    branchIds:            jsonField<string[]>(u.BranchIds),
  };
}

/** Safely parse a JSONB column (already parsed by pg driver) */
function jsonField<T>(v: unknown): T | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v as T;
  try { return JSON.parse(v as string) as T; } catch { return undefined; }
}

/** GET /api/v1/users?tenantId=1 — list users from PostgreSQL */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  try {
    const db = getPool();
    let rows;
    if (tenantId) {
      const uuid = toTenantUuid(tenantId);
      if (!uuid) return NextResponse.json([]);
      ({ rows } = await db.query(
        `SELECT * FROM "Users" WHERE "TenantId" = $1 ORDER BY "Email"`,
        [uuid],
      ));
    } else {
      ({ rows } = await db.query(`SELECT * FROM "Users" ORDER BY "Email"`));
    }
    return NextResponse.json(rows.map(rowToTenantUser));
  } catch (err) {
    console.error('[users] GET error', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

/** POST /api/v1/users — create a user in PostgreSQL and the in-memory store */
export async function POST(req: NextRequest) {
  const actor = actorFromReq(req);
  let user: TenantUser;
  try {
    user = (await req.json()) as TenantUser;
    if (!user?.id || !user?.email) {
      return NextResponse.json({ message: 'id and email are required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const tenantUuid   = user.tenantId ? (toTenantUuid(user.tenantId) ?? null) : null;
  const passwordHash = user.password || 'Demo1234!';

  try {
    const db = getPool();
    await db.query(
      `INSERT INTO "Users" (
         "Id", "TenantId", "Email", "FirstName", "LastName",
         "Role", "Status", "MfaEnabled", "PasswordHash", "CreatedAt",
         "AdditionalRoles", "CustomRoleIds", "VehicleId", "VehicleIds",
         "RestrictedVehicleIds", "RestrictedDeviceIds", "BranchIds"
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT ("Email") DO UPDATE SET
         "FirstName"           = EXCLUDED."FirstName",
         "LastName"            = EXCLUDED."LastName",
         "Role"                = EXCLUDED."Role",
         "Status"              = EXCLUDED."Status",
         "MfaEnabled"          = EXCLUDED."MfaEnabled",
         "PasswordHash"        = EXCLUDED."PasswordHash",
         "AdditionalRoles"     = EXCLUDED."AdditionalRoles",
         "CustomRoleIds"       = EXCLUDED."CustomRoleIds",
         "VehicleId"           = EXCLUDED."VehicleId",
         "VehicleIds"          = EXCLUDED."VehicleIds",
         "RestrictedVehicleIds"= EXCLUDED."RestrictedVehicleIds",
         "RestrictedDeviceIds" = EXCLUDED."RestrictedDeviceIds",
         "BranchIds"           = EXCLUDED."BranchIds"`,
      [
        user.id,
        tenantUuid,
        user.email.trim().toLowerCase(),
        user.firstName?.trim() ?? '',
        user.lastName?.trim()  ?? '',
        user.role,
        user.status ?? 'Active',
        user.mfaEnabled ?? false,
        passwordHash,
        new Date().toISOString(),
        jsonOrNull(user.additionalRoles),
        jsonOrNull(user.customRoleIds),
        user.vehicleId || null,
        jsonOrNull(user.vehicleIds),
        jsonOrNull(user.restrictedVehicleIds),
        jsonOrNull(user.restrictedDeviceIds),
        jsonOrNull(user.branchIds),
      ],
    );
  } catch (err) {
    console.error('[users] POST DB error', err);
  }

  upsertServerUser(user);
  void logAuditEvent({
    tenantId:   actor.tenantId ?? user.tenantId ?? null,
    actor:      actor.email,
    actorRole:  actor.role,
    action:     'user.create',
    resource:   'User',
    resourceId: user.id,
    outcome:    'success',
    details:    { email: user.email, role: user.role, targetTenantId: user.tenantId },
  });
  return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
}

function jsonOrNull(v: unknown[] | undefined | null): string | null {
  if (!v || v.length === 0) return null;
  return JSON.stringify(v);
}
