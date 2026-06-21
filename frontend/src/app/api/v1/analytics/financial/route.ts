import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, toTenantUuid } from '@/lib/pgDb';

type FinPeriod = 'monthly' | 'quarterly' | 'yearly';

export async function GET(req: NextRequest) {
  const sp        = req.nextUrl.searchParams;
  const tenantId  = sp.get('tenantId') ?? '1';
  const period    = (sp.get('period') ?? 'monthly') as FinPeriod;

  const tenantUuid = toTenantUuid(tenantId);
  if (!tenantUuid) {
    return NextResponse.json({ error: 'Unknown tenantId' }, { status: 400 });
  }

  try {
    const db = getPool();

    let query: string;
    let params: unknown[] = [tenantUuid];

    if (period === 'monthly') {
      // Most recent 12 months available in the warehouse
      query = `
        SELECT
          TO_CHAR(TO_DATE("Year"::text || '-' || LPAD("Month"::text,2,'0'), 'YYYY-MM'), 'Mon YY') AS label,
          SUM("Revenue")        AS revenue,
          SUM("CellularCost")   AS cellular,
          SUM("OpsCost")        AS opscost,
          MAX("ActiveVehicles") AS vehicles
        FROM "FactFinancialMonthly"
        WHERE "TenantId" = $1
        GROUP BY "Year","Month"
        ORDER BY "Year" DESC, "Month" DESC
        LIMIT 12`; // rows will be reversed below to restore chronological order
    } else if (period === 'quarterly') {
      query = `
        SELECT
          'Q' || CEIL("Month"::numeric / 3)::text || ' ' || ("Year" % 100)::text AS label,
          SUM("Revenue")      AS revenue,
          SUM("CellularCost") AS cellular,
          SUM("OpsCost")      AS opscost,
          MAX("ActiveVehicles") AS vehicles
        FROM "FactFinancialMonthly"
        WHERE "TenantId" = $1
        GROUP BY "Year", CEIL("Month"::numeric / 3)
        ORDER BY "Year" ASC, CEIL("Month"::numeric / 3) ASC`;
    } else {
      // yearly
      query = `
        SELECT
          "Year"::text AS label,
          SUM("Revenue")      AS revenue,
          SUM("CellularCost") AS cellular,
          SUM("OpsCost")      AS opscost,
          MAX("ActiveVehicles") AS vehicles
        FROM "FactFinancialMonthly"
        WHERE "TenantId" = $1
        GROUP BY "Year"
        ORDER BY "Year" ASC`;
    }

    const { rows } = await db.query(query, params);

    if (!rows.length) return NextResponse.json({ empty: true });

    // Restore chronological order (DESC query reversed)
    if (period === 'monthly') rows.reverse();

    const finRows = rows.map(r => ({
      label:    r.label as string,
      revenue:  Number(r.revenue),
      cellular: Number(r.cellular),
      opsCost:  Number(r.opscost),
      vehicles: Number(r.vehicles),
    }));

    const latest    = finRows[finRows.length - 1];
    const prev      = finRows[finRows.length - 2];
    const totalRev  = finRows.reduce((s, r) => s + r.revenue,  0);
    const totalCell = finRows.reduce((s, r) => s + r.cellular, 0);
    const totalCost = finRows.reduce((s, r) => s + r.cellular + r.opsCost, 0);
    const netIncome = totalRev - totalCost;
    const netMargin = Math.round((netIncome / totalRev) * 100);
    const revDelta  = prev ? Math.round(((latest.revenue  - prev.revenue)  / prev.revenue)  * 100) : 0;
    const cellDelta = prev ? Math.round(((latest.cellular - prev.cellular) / prev.cellular) * 100) : 0;
    const revPerVehicle = Math.round(totalRev / Math.max(latest.vehicles, 1));

    return NextResponse.json({
      rows: finRows,
      summary: {
        totalRevenue: totalRev,
        totalCellular: totalCell,
        totalCost,
        netIncome,
        netMarginPct: netMargin,
        revenuePerVehicle: revPerVehicle,
        revDelta,
        cellDelta,
      },
    });
  } catch (err) {
    console.error('[analytics/financial]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
