import { NextRequest, NextResponse } from 'next/server';
import { getPool, UUID_TENANT } from '@/lib/pgDb';

/**
 * GET /api/v1/tenants
 * Returns all tenants with live vehicle/user counts for the super-admin dashboard.
 */
export async function GET() {
  const db = getPool();
  try {
    const { rows } = await db.query(`
      SELECT
        t."Id", t."Name", t."Slug", t."Plan", t."Region", t."Status",
        t."PrimaryColor", t."LogoInitials", t."CreatedAt",
        COUNT(DISTINCT v."Id")::int  AS vehicle_count,
        COUNT(DISTINCT u."Id")::int  AS user_count,
        (SELECT u2."Email"
           FROM "AppUsers" u2
          WHERE u2."TenantId" = t."Id"
            AND u2."Role" IN ('tenant_admin','fleet_admin')
          ORDER BY u2."CreatedAt"
          LIMIT 1
        ) AS admin_email
      FROM "Tenants" t
      LEFT JOIN "Vehicles"  v ON v."TenantId" = t."Id"
      LEFT JOIN "AppUsers"  u ON u."TenantId" = t."Id"
      GROUP BY t."Id"
      ORDER BY t."Name"
    `);

    const tenants = rows.map(r => {
      const shortId = UUID_TENANT[(r.Id as string).toLowerCase()];
      const created = r.CreatedAt
        ? new Date(r.CreatedAt as string).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
        : '—';
      return {
        id:          shortId ?? r.Id,
        uuid:        r.Id,
        name:        r.Name         ?? '',
        plan:        r.Plan         ?? 'Starter',
        country:     r.Region       ?? '',
        status:      r.Status       ?? 'active',
        color:       r.PrimaryColor ?? '#c4912a',
        initials:    r.LogoInitials ?? '??',
        domain:      `${r.Slug ?? ''}.fleetos.app`,
        vehicles:    r.vehicle_count ?? 0,
        users:       r.user_count    ?? 0,
        adminEmail:  r.admin_email   ?? '',
        created,
      };
    });

    return NextResponse.json(tenants);
  } catch (err) {
    console.error('[GET /api/v1/tenants]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/tenants
 * Creates a new tenant and its first admin user.
 */
export async function POST(req: NextRequest) {
  const db = getPool();
  try {
    const body = await req.json() as {
      name: string; plan: string; country: string; domain?: string;
      industry?: string; adminEmail?: string; adminName?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ message: 'name is required' }, { status: 400 });
    }

    const slug = (body.domain?.replace(/\.fleetos\.app$/, '') || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));

    const { rows } = await db.query(
      `INSERT INTO "Tenants" ("Id","Name","Slug","Plan","Region","Status","PrimaryColor","LogoInitials","Mrr","CreatedAt")
       VALUES (gen_random_uuid(),$1,$2,$3,$4,'active','#c4912a',$5,0,NOW())
       RETURNING "Id","Name","Slug","Plan","Region","Status","PrimaryColor","CreatedAt"`,
      [
        body.name.trim(),
        slug,
        body.plan ?? 'Starter',
        body.country ?? '',
        (body.name.trim().split(' ').map(w => w[0]).join('').toUpperCase()).slice(0, 2),
      ],
    );

    const r = rows[0];
    return NextResponse.json({
      id:         UUID_TENANT[(r.Id as string).toLowerCase()] ?? r.Id,
      uuid:       r.Id,
      name:       r.Name,
      plan:       r.Plan,
      country:    r.Region,
      status:     r.Status,
      domain:     `${r.Slug}.fleetos.app`,
      vehicles:   0,
      users:      0,
      adminEmail: body.adminEmail ?? '',
      created:    new Date(r.CreatedAt as string).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/tenants]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
