import { NextResponse } from 'next/server';
import { rbacPermissionsStore } from '@/lib/rbacPermissionsStore';
import { getPool } from '@/lib/pgDb';

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id        TEXT        PRIMARY KEY,
    allowed_modules TEXT[]     NOT NULL DEFAULT '{}',
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export async function GET() {
  try {
    const pool = getPool();
    await pool.query(CREATE_TABLE_SQL);
    const { rows } = await pool.query<{ role_id: string; allowed_modules: string[] }>(
      'SELECT role_id, allowed_modules FROM role_permissions',
    );

    if (rows.length > 0) {
      const dbMap = new Map(rows.map(r => [r.role_id, r.allowed_modules]));
      const merged = Object.entries(rbacPermissionsStore).map(([roleId, allowedModules]) => ({
        roleId,
        allowedModules: dbMap.get(roleId) ?? allowedModules,
      }));
      for (const [roleId, allowedModules] of dbMap) {
        if (!Object.prototype.hasOwnProperty.call(rbacPermissionsStore, roleId)) {
          merged.push({ roleId, allowedModules });
        }
      }
      return NextResponse.json(merged);
    }
  } catch {
    // DB unavailable — fall through to in-memory defaults
  }

  const payload = Object.entries(rbacPermissionsStore).map(([roleId, allowedModules]) => ({
    roleId,
    allowedModules,
  }));
  return NextResponse.json(payload);
}
