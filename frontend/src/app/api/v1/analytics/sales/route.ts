import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, toTenantUuid } from '@/lib/pgDb';

type SalePeriod = 'monthly' | 'quarterly' | 'yearly';

export async function GET(req: NextRequest) {
  const sp        = req.nextUrl.searchParams;
  const tenantId  = sp.get('tenantId') ?? '1';
  const period    = (sp.get('period') ?? 'monthly') as SalePeriod;

  const tenantUuid = toTenantUuid(tenantId);
  if (!tenantUuid) {
    return NextResponse.json({ error: 'Unknown tenantId' }, { status: 400 });
  }

  try {
    const db = getPool();

    let query: string;
    const params: unknown[] = [tenantUuid];

    if (period === 'monthly') {
      query = `
        SELECT
          TO_CHAR(TO_DATE("Year"::text || '-' || LPAD("Month"::text,2,'0'), 'YYYY-MM'), 'Mon YY') AS label,
          SUM("NewContracts")  AS newcontracts,
          SUM("Renewals")      AS renewals,
          SUM("Churned")       AS churned,
          MAX("PipelineValue") AS pipeline,
          SUM("ClosedRevenue") AS revenue
        FROM "FactSalesMonthly"
        WHERE "TenantId" = $1
        GROUP BY "Year","Month"
        ORDER BY "Year" DESC, "Month" DESC
        LIMIT 12`;
    } else if (period === 'quarterly') {
      query = `
        SELECT
          'Q' || CEIL("Month"::numeric / 3)::text || ' ' || ("Year" % 100)::text AS label,
          SUM("NewContracts")  AS newcontracts,
          SUM("Renewals")      AS renewals,
          SUM("Churned")       AS churned,
          MAX("PipelineValue") AS pipeline,
          SUM("ClosedRevenue") AS revenue
        FROM "FactSalesMonthly"
        WHERE "TenantId" = $1
        GROUP BY "Year", CEIL("Month"::numeric / 3)
        ORDER BY "Year" ASC, CEIL("Month"::numeric / 3) ASC`;
    } else {
      query = `
        SELECT
          "Year"::text AS label,
          SUM("NewContracts")  AS newcontracts,
          SUM("Renewals")      AS renewals,
          SUM("Churned")       AS churned,
          MAX("PipelineValue") AS pipeline,
          SUM("ClosedRevenue") AS revenue
        FROM "FactSalesMonthly"
        WHERE "TenantId" = $1
        GROUP BY "Year"
        ORDER BY "Year" ASC`;
    }

    const { rows } = await db.query(query, params);

    if (!rows.length) return NextResponse.json({ empty: true });

    if (period === 'monthly') rows.reverse();

    const saleRows = rows.map(r => ({
      label:        r.label        as string,
      newContracts: Number(r.newcontracts),
      renewals:     Number(r.renewals),
      churned:      Number(r.churned),
      pipeline:     Number(r.pipeline) / 1000,  // store as $, return as $K
      revenue:      Number(r.revenue)  / 1000,
    }));

    const latest     = saleRows[saleRows.length - 1];
    const prev       = saleRows[saleRows.length - 2];
    const totalNew   = saleRows.reduce((s, r) => s + r.newContracts, 0);
    const totalRen   = saleRows.reduce((s, r) => s + r.renewals,     0);
    const totalChurn = saleRows.reduce((s, r) => s + r.churned,      0);
    const totalRev   = saleRows.reduce((s, r) => s + r.revenue,      0);
    const avgDeal    = Math.round((totalRev * 1000) / Math.max(totalNew, 1));
    const netNew     = totalNew - totalChurn;
    const churnRate  = Math.round((totalChurn / Math.max(totalRen, 1)) * 1000) / 10;
    const revDelta   = prev ? Math.round(((latest.revenue - prev.revenue) / prev.revenue) * 100) : 0;

    return NextResponse.json({
      rows: saleRows,
      summary: {
        totalNewContracts: totalNew,
        totalRenewals:     totalRen,
        totalChurned:      totalChurn,
        netContracts:      netNew,
        avgDealSize:       avgDeal,
        churnRate,
        revDelta,
        latestPipeline:    latest.pipeline,
        latestRevenue:     latest.revenue,
      },
    });
  } catch (err) {
    console.error('[analytics/sales]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
