import { NextResponse } from 'next/server';
import { getPool, UUID_TENANT } from '@/lib/pgDb';

/**
 * GET /api/v1/tenants/meta
 * Returns a map of shortId → { name, country, plan, color } for all tenants.
 * Used to replace the hardcoded TENANTS_META constant in the frontend.
 */
export async function GET() {
  const db = getPool();
  try {
    const { rows } = await db.query(
      `SELECT "Id","Name","Plan","Region","PrimaryColor","Status"
         FROM "Tenants"
        ORDER BY "Name"`,
    );

    const meta: Record<string, { name: string; country: string; plan: string; color: string; status: string }> = {};
    for (const r of rows) {
      const shortId = UUID_TENANT[(r.Id as string).toLowerCase()];
      if (shortId) {
        meta[shortId] = {
          name:    r.Name         ?? '',
          country: r.Region       ?? '',
          plan:    r.Plan         ?? '',
          color:   r.PrimaryColor ?? '#c4912a',
          status:  r.Status       ?? 'active',
        };
      }
    }
    return NextResponse.json(meta);
  } catch (err) {
    console.error('[GET /api/v1/tenants/meta]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
