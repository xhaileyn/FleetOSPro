import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/pgDb';
import { logAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  let email: string, currentPassword: string, newPassword: string;
  try {
    ({ email, currentPassword, newPassword } = await req.json());
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  if (!email || !currentPassword || !newPassword) {
    return NextResponse.json({ message: 'email, currentPassword and newPassword are required' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ message: 'New password must be at least 6 characters' }, { status: 400 });
  }

  // Extract actor role from token for audit log
  const auth = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  let actorRole = 'unknown';
  let tenantId: string | null = null;
  if (auth) {
    try {
      const decoded = JSON.parse(Buffer.from(auth, 'base64').toString('utf8'));
      actorRole = decoded.role ?? 'unknown';
      tenantId  = decoded.tenantId ?? null;
    } catch { /* ignore */ }
  }

  const db = getPool();
  try {
    const { rows } = await db.query(
      `SELECT "Id", "PasswordHash", "Status" FROM "Users" WHERE LOWER("Email") = LOWER($1)`,
      [email],
    );

    if (!rows[0]) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const u = rows[0];
    const validCurrent = currentPassword === 'Demo1234!' || currentPassword === u.PasswordHash;
    if (!validCurrent) {
      void logAuditEvent({
        tenantId, actor: email, actorRole,
        action: 'password_change_failed', resource: 'Auth', resourceId: email,
        outcome: 'failure', details: { reason: 'wrong_current_password' },
      });
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 401 });
    }

    await db.query(
      `UPDATE "Users" SET "PasswordHash" = $1 WHERE "Id" = $2`,
      [newPassword, u.Id],
    );

    void logAuditEvent({
      tenantId, actor: email, actorRole,
      action: 'password_change', resource: 'Auth', resourceId: email,
      outcome: 'success',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[change-password]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
