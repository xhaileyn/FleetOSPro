import { NextRequest, NextResponse } from 'next/server';
import { rbacPermissionsStore } from '@/lib/rbacPermissionsStore';
import { getPool } from '@/lib/pgDb';

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id        TEXT        PRIMARY KEY,
    allowed_modules TEXT[]     NOT NULL DEFAULT '{}',
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> },
) {
  const { roleId } = await params;

  if (!roleId) {
    return NextResponse.json({ message: 'roleId is required.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.allowedModules)) {
    return NextResponse.json({ message: 'allowedModules array is required.' }, { status: 400 });
  }

  const allowedModules: string[] = [...new Set(body.allowedModules as string[])];

  // Always update in-memory cache so the current serverless instance is consistent
  rbacPermissionsStore[roleId] = allowedModules;

  // Persist to PostgreSQL so changes survive cold starts
  try {
    const pool = getPool();
    await pool.query(CREATE_TABLE_SQL);
    await pool.query(
      `INSERT INTO role_permissions (role_id, allowed_modules, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (role_id) DO UPDATE
         SET allowed_modules = EXCLUDED.allowed_modules,
             updated_at      = NOW()`,
      [roleId, allowedModules],
    );
  } catch (err) {
    console.error('[rbac] DB write failed for role', roleId, err);
    return NextResponse.json(
      { message: 'Permissions updated in session but database write failed — changes will not persist after a server restart.' },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
