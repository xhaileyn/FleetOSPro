import { NextRequest, NextResponse } from 'next/server';
import { getServerUserByEmail } from '@/lib/usersServerStore';
import { getPool, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';
import { logAuditEvent } from '@/lib/auditLogger';

/* ── Tenant metadata — always fetched from DB ─────────────────────── */
async function getTenantMeta(tenantId: string): Promise<{ name: string; slug: string } | null> {
  try {
    const db = getPool();
    const uuid = toTenantUuid(tenantId);
    if (!uuid) return null;
    const { rows } = await db.query(`SELECT "Name","Slug" FROM "Tenants" WHERE "Id"=$1`, [uuid]);
    if (rows[0]) return { name: rows[0].Name, slug: rows[0].Slug };
  } catch { /* fall through */ }
  return null;
}

/* Platform-level accounts only — no tenant, cannot be in AppUsers table */
const PLATFORM_USERS = [
  { email: 'super@fleetosteam.io',  password: 'Demo1234!', role: 'super_admin',    firstName: 'Super',    lastName: 'Admin',  tenantId: null, tenantName: null, tenantSlug: null },
  { email: 'admin@fleetosteam.io',  password: 'Demo1234!', role: 'platform_admin', firstName: 'Platform', lastName: 'Admin',  tenantId: null, tenantName: null, tenantSlug: null },
];

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    ''
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body as { email: string; password: string };
  const ip = getIp(req);

  /* 1. Platform accounts */
  const platform = PLATFORM_USERS.find(u => u.email === email && u.password === password);
  if (platform) {
    const token = Buffer.from(JSON.stringify({ email: platform.email, role: platform.role, tenantId: platform.tenantId })).toString('base64');
    void logAuditEvent({
      tenantId: platform.tenantId,
      actor: platform.email,
      actorRole: platform.role,
      action: 'login',
      resource: 'Auth',
      resourceId: platform.email,
      outcome: 'success',
      ipAddress: ip,
      details: { fullName: `${platform.firstName} ${platform.lastName}`.trim(), source: 'platform' },
    });
    return NextResponse.json({ token, role: platform.role, email: platform.email,
      fullName: `${platform.firstName} ${platform.lastName}`.trim(),
      tenantId: platform.tenantId, tenantName: platform.tenantName,
      tenantSlug: platform.tenantSlug, vehicleId: null });
  }

  /* 2. Try DB first — query Users table directly */
  try {
    const db = getPool();
    const { rows } = await db.query(`SELECT * FROM "Users" WHERE LOWER("Email")=LOWER($1)`, [email]);
    if (rows[0]) {
      const u = rows[0];
      // Accept the stored PasswordHash (plain text for demo) OR the master Demo1234! key
      const validPassword = password === 'Demo1234!' || password === u.PasswordHash;
      if (!validPassword) {
        void logAuditEvent({
          tenantId: u.TenantId ? (fromTenantUuid((u.TenantId as string).toLowerCase()) ?? null) : null,
          actor: email,
          actorRole: u.Role ?? 'unknown',
          action: 'login_failed',
          resource: 'Auth',
          resourceId: email,
          outcome: 'failure',
          ipAddress: ip,
          details: { reason: 'invalid_password' },
        });
        return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
      }
      if (u.Status === 'Suspended') return NextResponse.json({ message: 'Your account has been suspended. Contact your tenant admin.' }, { status: 403 });
      if (u.Status === 'Pending')   return NextResponse.json({ message: 'Your account is pending activation. Check your email for an invite link.' }, { status: 403 });

      const tenantId = u.TenantId ? (fromTenantUuid((u.TenantId as string).toLowerCase()) ?? null) : null;
      const meta     = tenantId ? await getTenantMeta(tenantId) : null;
      const token    = Buffer.from(JSON.stringify({ email: u.Email, role: u.Role, tenantId })).toString('base64');

      // Stamp LastLoginAt
      void db.query(`UPDATE "Users" SET "LastLoginAt" = NOW() WHERE "Id" = $1`, [u.Id]);

      // Extended fields stored as JSONB (migration 009); pg driver parses them automatically
      const dbVehicleIds:           string[] = Array.isArray(u.VehicleIds)           ? u.VehicleIds           : [];
      const dbRestrictedVehicleIds: string[] = Array.isArray(u.RestrictedVehicleIds) ? u.RestrictedVehicleIds : [];
      const dbVehicleId: string | null       = (u.VehicleId as string) || dbVehicleIds[0] || null;

      void logAuditEvent({
        tenantId,
        actor: u.Email,
        actorRole: u.Role,
        action: 'login',
        resource: 'Auth',
        resourceId: u.Email,
        outcome: 'success',
        ipAddress: ip,
        details: { fullName: `${u.FirstName ?? ''} ${u.LastName ?? ''}`.trim(), source: 'db' },
      });

      return NextResponse.json({
        token,
        role:                u.Role,
        email:               u.Email,
        fullName:            `${u.FirstName ?? ''} ${u.LastName ?? ''}`.trim(),
        tenantId,
        tenantName:          meta?.name ?? null,
        tenantSlug:          meta?.slug ?? null,
        vehicleId:           dbVehicleId,
        vehicleIds:          dbVehicleIds,
        restrictedVehicleIds: dbRestrictedVehicleIds,
      });
    }
  } catch (err) {
    console.error('[login] DB query failed, falling back to server store:', err);
  }

  /* 3. Fall back to server-side in-memory store (covers UI-created users) */
  const tenantUser = (() => {
    const u = getServerUserByEmail(email);
    return u && u.password === password ? u : undefined;
  })();
  if (tenantUser) {
    if (tenantUser.status === 'Suspended') return NextResponse.json({ message: 'Your account has been suspended. Contact your tenant admin.' }, { status: 403 });
    if (tenantUser.status === 'Pending')   return NextResponse.json({ message: 'Your account is pending activation. Check your email for an invite link.' }, { status: 403 });

    const tenantId = tenantUser.tenantId;
    const meta     = tenantId ? await getTenantMeta(tenantId) : null;
    const token    = Buffer.from(JSON.stringify({ email: tenantUser.email, role: tenantUser.role, tenantId })).toString('base64');
    const vehicleIds: string[] = tenantUser.vehicleIds ?? (tenantUser.vehicleId ? [tenantUser.vehicleId] : []);

    void logAuditEvent({
      tenantId,
      actor: tenantUser.email,
      actorRole: tenantUser.role,
      action: 'login',
      resource: 'Auth',
      resourceId: tenantUser.email,
      outcome: 'success',
      ipAddress: ip,
      details: { fullName: `${tenantUser.firstName} ${tenantUser.lastName}`.trim(), source: 'store' },
    });

    return NextResponse.json({
      token, role: tenantUser.role, email: tenantUser.email,
      fullName: `${tenantUser.firstName} ${tenantUser.lastName}`.trim(),
      tenantId,
      tenantName: meta?.name ?? tenantUser.tenantName,
      tenantSlug: meta?.slug ?? tenantUser.tenantSlug,
      vehicleId:  tenantUser.vehicleId ?? null,
      vehicleIds,
      restrictedVehicleIds: tenantUser.restrictedVehicleIds ?? [],
    });
  }

  /* 4. Complete failure — no user found at all */
  void logAuditEvent({
    tenantId: null,
    actor: email || 'unknown',
    actorRole: 'unknown',
    action: 'login_failed',
    resource: 'Auth',
    resourceId: email || '',
    outcome: 'failure',
    ipAddress: ip,
    details: { reason: 'user_not_found' },
  });

  return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
}
