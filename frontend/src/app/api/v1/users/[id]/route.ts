import { NextRequest, NextResponse } from 'next/server';
import { upsertServerUser, deleteServerUser } from '@/lib/usersServerStore';
import { getPool, TENANT_UUID, toTenantUuid } from '@/lib/pgDb';
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

function jsonOrNull(v: unknown[] | undefined | null): string | null {
  if (!v || (v as unknown[]).length === 0) return null;
  return JSON.stringify(v);
}

/** PUT /api/v1/users/:id — update an existing user */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const actor = actorFromReq(req);
  let user: TenantUser;
  try {
    user = (await req.json()) as TenantUser;
    if (!user?.id) {
      return NextResponse.json({ message: 'id is required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const tenantUuid = user.tenantId ? (toTenantUuid(user.tenantId) ?? null) : null;

  try {
    const db = getPool();
    const sets: string[]   = [];
    const values: unknown[] = [];

    function add(col: string, val: unknown) {
      values.push(val);
      sets.push(`"${col}" = $${values.length}`);
    }

    add('FirstName',           user.firstName?.trim() ?? '');
    add('LastName',            user.lastName?.trim()  ?? '');
    add('Email',               user.email.trim().toLowerCase());
    add('Role',                user.role);
    add('Status',              user.status ?? 'Active');
    add('MfaEnabled',          user.mfaEnabled ?? false);
    add('TenantId',            tenantUuid);
    add('AdditionalRoles',     jsonOrNull(user.additionalRoles));
    add('CustomRoleIds',       jsonOrNull(user.customRoleIds));
    add('VehicleId',           user.vehicleId || null);
    add('VehicleIds',          jsonOrNull(user.vehicleIds));
    add('RestrictedVehicleIds',jsonOrNull(user.restrictedVehicleIds));
    add('RestrictedDeviceIds', jsonOrNull(user.restrictedDeviceIds));
    add('BranchIds',           jsonOrNull(user.branchIds));

    if (user.password) {
      add('PasswordHash', user.password);
    }

    values.push(id);
    const { rowCount } = await db.query(
      `UPDATE "Users" SET ${sets.join(', ')} WHERE "Id" = $${values.length}`,
      values,
    );

    if (rowCount === 0) {
      console.warn(`[users] PUT: no row matched id=${id}`);
    }
  } catch (err) {
    console.error('[users] PUT DB error', err);
  }

  upsertServerUser(user);
  void logAuditEvent({
    tenantId:   actor.tenantId ?? user.tenantId ?? null,
    actor:      actor.email,
    actorRole:  actor.role,
    action:     'user.update',
    resource:   'User',
    resourceId: id,
    outcome:    'success',
    details:    { email: user.email, role: user.role },
  });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/v1/users/:id — remove a user */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const actor = actorFromReq(req);

  try {
    const db = getPool();
    await db.query(`DELETE FROM "Users" WHERE "Id" = $1`, [id]);
  } catch (err) {
    console.error('[users] DELETE DB error', err);
  }

  deleteServerUser(id);
  void logAuditEvent({
    tenantId:   actor.tenantId,
    actor:      actor.email,
    actorRole:  actor.role,
    action:     'user.delete',
    resource:   'User',
    resourceId: id,
    outcome:    'success',
  });
  return NextResponse.json({ ok: true });
}
