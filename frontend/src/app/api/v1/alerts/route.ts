import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, toTenantUuid } from '@/lib/pgDb';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tenantId = searchParams.get('tenantId');
  const status   = searchParams.get('status');   // Active | Acknowledged | Closed | all

  try {
    const db = getPool();
    const params: unknown[] = [];
    const clauses: string[] = [];

    if (tenantId) {
      const uuid = toTenantUuid(tenantId);
      if (uuid) {
        params.push(uuid);
        clauses.push(`a."TenantId" = $${params.length}`);
      }
    }

    if (status && status !== 'all') {
      params.push(status);
      clauses.push(`a."Status" = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT
         a."Id"               AS id,
         a."Severity"         AS severity,
         a."Type"             AS type,
         a."Title"            AS title,
         a."Description"      AS description,
         a."Status"           AS status,
         a."Acknowledged"     AS acknowledged,
         a."OperatorResponse" AS "operatorResponse",
         a."OperatorName"     AS "operatorName",
         a."ClosedAt"         AS "closedAt",
         a."OccurredAt"       AS "occurredAt",
         a."TenantId"         AS "tenantId",
         v."Plate"            AS "vehiclePlate",
         v."DriverName"       AS "driverName",
         v."Latitude"         AS latitude,
         v."Longitude"        AS longitude
       FROM "Alerts" a
       LEFT JOIN "Vehicles" v ON a."VehicleId" = v."Id"
       ${where}
       ORDER BY a."OccurredAt" DESC`,
      params,
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error('[alerts] GET error', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
