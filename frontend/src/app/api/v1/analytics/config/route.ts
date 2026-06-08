import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID } from '@/lib/pgDb';

export async function GET(req: NextRequest) {
  const sp       = req.nextUrl.searchParams;
  const tenantId = sp.get('tenantId') ?? '1';
  const view     = sp.get('view')     ?? 'operations';
  const period   = sp.get('period')   ?? 'week';

  const tenantUuid = TENANT_UUID[tenantId];
  if (!tenantUuid) {
    return NextResponse.json({ error: 'Unknown tenantId' }, { status: 400 });
  }

  try {
    const db = getPool();
    const t  = [tenantUuid];

    const [
      speedRows, salesRepRows, channelRows,
      carrierRows, revStreamRows, planRows,
      funnelRows, vehicleRows, driverRows, insightRows,
    ] = await Promise.all([
      db.query(`SELECT "Range","Pct","Safe" FROM "FactSpeedProfile"
                WHERE "TenantId"=$1 ORDER BY "SortOrder"`, t),
      db.query(`SELECT "Name","DealsWon","Revenue","Quota","ConversionPct" FROM "FactSalesRep"
                WHERE "TenantId"=$1 ORDER BY "SortOrder"`, t),
      db.query(`SELECT "Channel","Pct","Color" FROM "FactSalesChannel"
                WHERE "TenantId"=$1 ORDER BY "SortOrder"`, t),
      db.query(`SELECT "Carrier","Pct","Color" FROM "FactCellularCarrier"
                WHERE "TenantId"=$1 ORDER BY "SortOrder"`, t),
      db.query(`SELECT "Stream","Pct","Color" FROM "FactRevStream"
                WHERE "TenantId"=$1 ORDER BY "SortOrder"`, t),
      db.query(`SELECT "PlanName","ARR","Vehicles","Color" FROM "FactPlanMix"
                WHERE "TenantId"=$1 ORDER BY "SortOrder"`, t),
      db.query(`SELECT "Stage","Count","Color" FROM "FactFunnelSnapshot"
                WHERE "TenantId"=$1 ORDER BY "SortOrder"`, t),
      // Most recent month vehicles
      db.query(`SELECT "Plate","DistanceKm","FuelLitres"
                FROM "FactVehicleOpsMonthly"
                WHERE "TenantId"=$1
                  AND ("Year","Month") = (
                    SELECT "Year","Month" FROM "FactVehicleOpsMonthly"
                    WHERE "TenantId"=$1
                    ORDER BY "Year" DESC,"Month" DESC LIMIT 1
                  )
                ORDER BY "DistanceKm" DESC`, t),
      // Most recent month drivers
      db.query(`SELECT "DriverName","SafetyScore","Trips","DistanceKm"
                FROM "FactDriverMonthly"
                WHERE "TenantId"=$1
                  AND ("Year","Month") = (
                    SELECT "Year","Month" FROM "FactDriverMonthly"
                    WHERE "TenantId"=$1
                    ORDER BY "Year" DESC,"Month" DESC LIMIT 1
                  )
                ORDER BY "SafetyScore" DESC`, t),
      // Insights for current view + period
      db.query(`SELECT "Icon","Title","Body","Bg","Bd"
                FROM "AnalyticsInsight"
                WHERE "TenantId"=$1 AND "View"=$2 AND "Period"=$3
                ORDER BY "SortOrder"`,
        [tenantUuid, view, period]),
    ]);

    return NextResponse.json({
      speeds:          speedRows.rows.map(r => ({
        range: r.Range, pct: Number(r.Pct), safe: r.Safe,
      })),
      salesReps:       salesRepRows.rows.map(r => ({
        name: r.Name, deals: Number(r.DealsWon),
        revenue: Number(r.Revenue), quota: Number(r.Quota),
        conv: Number(r.ConversionPct),
      })),
      saleChannels:    channelRows.rows.map(r => ({
        label: r.Channel, pct: Number(r.Pct), color: r.Color,
      })),
      cellularCarriers: carrierRows.rows.map(r => ({
        name: r.Carrier, pct: Number(r.Pct), color: r.Color,
      })),
      revStreams:       revStreamRows.rows.map(r => ({
        label: r.Stream, pct: Number(r.Pct), color: r.Color,
      })),
      planMix:          planRows.rows.map(r => ({
        label: r.PlanName, arr: Number(r.ARR),
        vehicles: Number(r.Vehicles), color: r.Color,
      })),
      funnelStages:     funnelRows.rows.map(r => ({
        label: r.Stage, value: Number(r.Count), color: r.Color,
      })),
      vehicles:         vehicleRows.rows.map(r => ({
        id: r.Plate, km: Number(r.DistanceKm), fuel: Number(r.FuelLitres),
      })),
      drivers:          driverRows.rows.map(r => ({
        name: r.DriverName, score: Number(r.SafetyScore),
        trips: Number(r.Trips),
        dist:  Number(r.DistanceKm).toLocaleString() + ' km',
      })),
      insights:         insightRows.rows.map(r => ({
        icon: r.Icon, title: r.Title, body: r.Body, bg: r.Bg, bd: r.Bd,
      })),
    });
  } catch (err) {
    console.error('[analytics/config]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
