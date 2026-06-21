import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, toTenantUuid } from '@/lib/pgDb';

type Period = 'week' | 'month' | 'quarter';

const ALERT_COLORS: Record<string, string> = {
  Speeding:       '#ef4444',
  'Harsh braking':'#f97316',
  'Idle time':    '#eab308',
  'Geofence exit':'#8b5cf6',
  Other:          '#94a3b8',
};

export async function GET(req: NextRequest) {
  const sp       = req.nextUrl.searchParams;
  const tenantId = sp.get('tenantId') ?? '1';
  const period   = (sp.get('period') ?? 'week') as Period;

  const tenantUuid = toTenantUuid(tenantId);
  if (!tenantUuid) {
    return NextResponse.json({ error: 'Unknown tenantId' }, { status: 400 });
  }

  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;

  try {
    const db = getPool();

    // ── Fetch daily rows for the period ──────────────────────
    const { rows } = await db.query<{
      date: string;
      totaltrips: string;
      distancekm: string;
      fleetutilizationpct: string;
      fuelefficiencykml: string;
      ontimeratepct: string;
      driveravgscore: string;
      activevehicles: string;
      idlevehicles: string;
      offlinevehicles: string;
      inservicevehicles: string;
      speedingalerts: string;
      harshbrakingalerts: string;
      idletimealerts: string;
      geofencealerts: string;
      otheralerts: string;
    }>(
      `SELECT
        "Date"                AS date,
        "TotalTrips"          AS totaltrips,
        "DistanceKm"          AS distancekm,
        "FleetUtilizationPct" AS fleetutilizationpct,
        "FuelEfficiencyKmL"   AS fuelefficiencykml,
        "OnTimeRatePct"       AS ontimeratepct,
        "DriverAvgScore"      AS driveravgscore,
        "ActiveVehicles"      AS activevehicles,
        "IdleVehicles"        AS idlevehicles,
        "OfflineVehicles"     AS offlinevehicles,
        "InServiceVehicles"   AS inservicevehicles,
        "SpeedingAlerts"      AS speedingalerts,
        "HarshBrakingAlerts"  AS harshbrakingalerts,
        "IdleTimeAlerts"      AS idletimealerts,
        "GeofenceAlerts"      AS geofencealerts,
        "OtherAlerts"         AS otheralerts
       FROM "FactOpsDaily"
       WHERE "TenantId" = $1
         AND "Date" >= CURRENT_DATE - INTERVAL '${days - 1} days'
       ORDER BY "Date" ASC`,
      [tenantUuid],
    );

    if (rows.length === 0) {
      return NextResponse.json({ empty: true });
    }

    // ── For quarter: bucket daily rows into ~13 weekly points ─
    const buckets =
      period === 'quarter'
        ? bucketByWeek(rows)
        : rows;

    // ── Trend: total trips per bucket ─────────────────────────
    const trend = buckets.map(r => Number(r.totaltrips));

    // ── Aggregate totals ──────────────────────────────────────
    const totalTrips = rows.reduce((s, r) => s + Number(r.totaltrips), 0);
    const totalDist  = rows.reduce((s, r) => s + Number(r.distancekm), 0);
    const avgUtil    = avg(rows.map(r => Number(r.fleetutilizationpct)));
    const avgFuel    = avg(rows.map(r => Number(r.fuelefficiencykml)));
    const avgOnTime  = avg(rows.map(r => Number(r.ontimeratepct)));
    const avgScore   = avg(rows.map(r => Number(r.driveravgscore)));

    // prev period for deltas — fetch all metrics
    const { rows: prevRows } = await db.query<{
      totaltrips: string; distancekm: string; fleetutilizationpct: string;
      fuelefficiencykml: string; ontimeratepct: string; driveravgscore: string;
    }>(
      `SELECT
        SUM("TotalTrips")          AS totaltrips,
        SUM("DistanceKm")          AS distancekm,
        AVG("FleetUtilizationPct") AS fleetutilizationpct,
        AVG("FuelEfficiencyKmL")   AS fuelefficiencykml,
        AVG("OnTimeRatePct")       AS ontimeratepct,
        AVG("DriverAvgScore")      AS driveravgscore
       FROM "FactOpsDaily"
       WHERE "TenantId" = $1
         AND "Date" >= CURRENT_DATE - INTERVAL '${days * 2 - 1} days'
         AND "Date"  < CURRENT_DATE - INTERVAL '${days - 1} days'`,
      [tenantUuid],
    );
    const p = prevRows[0];
    const prevTrips  = p ? Number(p.totaltrips)          : totalTrips;
    const prevDist   = p ? Number(p.distancekm)          : totalDist;
    const prevUtil   = p ? Number(p.fleetutilizationpct) : avgUtil;
    const prevFuel   = p ? Number(p.fuelefficiencykml)   : avgFuel;
    const prevOnTime = p ? Number(p.ontimeratepct)       : avgOnTime;
    const prevScore  = p ? Number(p.driveravgscore)      : avgScore;

    const pctDelta  = (cur: number, prev: number) => prev === 0 ? 0 : Math.round((cur - prev) / prev * 1000) / 10;
    const ppDelta   = (cur: number, prev: number) => Math.round((cur - prev) * 10) / 10;

    // ── KPIs ─────────────────────────────────────────────────
    const kpis = [
      {
        label: 'Total trips',
        value: totalTrips.toLocaleString(),
        delta: pctDelta(totalTrips, prevTrips), unit: '%', goodUp: true,
        spark: buckets.map(r => Number(r.totaltrips)),
      },
      {
        label: 'Distance covered',
        value: `${Math.round(totalDist).toLocaleString()} km`,
        delta: pctDelta(totalDist, prevDist), unit: '%', goodUp: true,
        spark: buckets.map(r => Number(r.distancekm)),
      },
      {
        label: 'Fleet utilization',
        value: `${avgUtil.toFixed(1)}%`,
        delta: ppDelta(avgUtil, prevUtil),
        unit: 'pp', goodUp: true,
        spark: buckets.map(r => Number(r.fleetutilizationpct)),
      },
      {
        label: 'Fuel efficiency',
        value: `${avgFuel.toFixed(1)} km/L`,
        delta: pctDelta(avgFuel, prevFuel), unit: '%', goodUp: true,
        spark: buckets.map(r => Number(r.fuelefficiencykml)),
      },
      {
        label: 'On-time rate',
        value: `${avgOnTime.toFixed(1)}%`,
        delta: ppDelta(avgOnTime, prevOnTime), unit: 'pp', goodUp: true,
        spark: buckets.map(r => Number(r.ontimeratepct)),
      },
      {
        label: 'Driver avg score',
        value: `${avgScore.toFixed(0)} / 100`,
        delta: pctDelta(avgScore, prevScore), unit: '%', goodUp: true,
        spark: buckets.map(r => Number(r.driveravgscore)),
      },
    ];

    // ── Alert distribution ────────────────────────────────────
    const alerts = [
      { label: 'Speeding',        count: rows.reduce((s,r) => s + Number(r.speedingalerts),    0), color: ALERT_COLORS['Speeding'] },
      { label: 'Harsh braking',   count: rows.reduce((s,r) => s + Number(r.harshbrakingalerts),0), color: ALERT_COLORS['Harsh braking'] },
      { label: 'Idle time',       count: rows.reduce((s,r) => s + Number(r.idletimealerts),    0), color: ALERT_COLORS['Idle time'] },
      { label: 'Geofence exit',   count: rows.reduce((s,r) => s + Number(r.geofencealerts),    0), color: ALERT_COLORS['Geofence exit'] },
      { label: 'Other',           count: rows.reduce((s,r) => s + Number(r.otheralerts),       0), color: ALERT_COLORS['Other'] },
    ];

    // Fleet status from latest row
    const latest = rows[rows.length - 1];
    const fleetStatus = [
      { label: 'On route',   count: Number(latest.activevehicles),    color: '#16a34a' },
      { label: 'Idle',       count: Number(latest.idlevehicles),       color: '#d97706' },
      { label: 'Offline',    count: Number(latest.offlinevehicles),    color: '#94a3b8' },
      { label: 'In service', count: Number(latest.inservicevehicles),  color: '#0891b2' },
    ];
    const totalFleet = fleetStatus.reduce((s, f) => s + f.count, 0);

    // X-axis labels
    const xLabels =
      period === 'week'
        ? rows.map(r => new Date(r.date).toLocaleDateString('en', { weekday: 'short' }))
        : period === 'month'
        ? [rows[0]?.date?.slice(0,10) ?? '', '', '', rows[rows.length-1]?.date?.slice(0,10) ?? '']
        : buckets.map((_, i) => `Wk ${i + 1}`);

    return NextResponse.json({
      trend, kpis, alerts, fleetStatus, totalFleet, xLabels,
      totals: {
        trips: totalTrips,
        dist:  Math.round(totalDist).toLocaleString(),
        util:  Math.round(avgUtil),
      },
    });
  } catch (err) {
    console.error('[analytics/operations]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

function avg(vals: number[]): number {
  if (!vals.length) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function bucketByWeek(rows: { totaltrips: string; distancekm: string; fleetutilizationpct: string; fuelefficiencykml: string; ontimeratepct: string; driveravgscore: string; [k: string]: string }[]) {
  const buckets: typeof rows = [];
  const size = Math.ceil(rows.length / 13);
  for (let i = 0; i < rows.length; i += size) {
    const slice = rows.slice(i, i + size);
    const sum = (key: string) => slice.reduce((s, r) => s + Number(r[key]), 0);
    const mean = (key: string) => sum(key) / slice.length;
    buckets.push({
      ...slice[slice.length - 1],
      totaltrips:          String(sum('totaltrips')),
      distancekm:          String(sum('distancekm')),
      fleetutilizationpct: String(mean('fleetutilizationpct').toFixed(1)),
      fuelefficiencykml:   String(mean('fuelefficiencykml').toFixed(2)),
      ontimeratepct:       String(mean('ontimeratepct').toFixed(1)),
      driveravgscore:      String(mean('driveravgscore').toFixed(1)),
    });
  }
  return buckets;
}
