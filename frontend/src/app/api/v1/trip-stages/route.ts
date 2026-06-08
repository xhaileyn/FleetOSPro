import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID } from '@/lib/pgDb';

// GET /api/v1/trip-stages?tenantId=1&tripId=t1
// Returns all stages for a trip in order, with event summaries.
export async function GET(req: NextRequest) {
  const sp       = req.nextUrl.searchParams;
  const tenantId = sp.get('tenantId') ?? '1';
  const tripId   = sp.get('tripId');
  const vehicleId = sp.get('vehicleId');

  const tenantUuid = TENANT_UUID[tenantId];
  if (!tenantUuid) {
    return NextResponse.json({ error: 'Unknown tenantId' }, { status: 400 });
  }
  if (!tripId && !vehicleId) {
    return NextResponse.json({ error: 'tripId or vehicleId required' }, { status: 400 });
  }

  try {
    const db     = getPool();
    const params: unknown[] = [tenantUuid];
    const wheres = [`s."TenantId" = $1`];

    if (tripId) {
      const tripRow = await db.query(
        `SELECT "Id" FROM "Trips" WHERE ("ShortId"=$1 OR "Id"::text=$1) AND "TenantId"=$2 LIMIT 1`,
        [tripId, tenantUuid],
      );
      if (!tripRow.rows.length) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
      params.push(tripRow.rows[0].Id);
      wheres.push(`s."TripId" = $${params.length}`);
    }

    if (vehicleId) {
      const vehRow = await db.query(
        `SELECT "Id" FROM "Vehicles" WHERE ("ShortId"=$1 OR "Id"::text=$1) AND "TenantId"=$2 LIMIT 1`,
        [vehicleId, tenantUuid],
      );
      if (!vehRow.rows.length) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      params.push(vehRow.rows[0].Id);
      wheres.push(`s."VehicleId" = $${params.length}`);
    }

    const { rows } = await db.query(
      `SELECT
         s."Id",
         s."StageNo",
         s."Stage",
         s."StartAt",
         s."EndAt",
         s."DurationSec",
         s."StartLat", s."StartLng",
         s."EndLat",   s."EndLng",
         s."StartAddress", s."EndAddress",
         s."DistanceKm",
         s."MaxSpeedKmh", s."AvgSpeedKmh",
         s."StartOdometerKm", s."EndOdometerKm",
         s."FuelConsumedL",
         s."PingCount",
         s."HarshBrakeCount", s."HarshAccelCount",
         s."OverspeedSec"
       FROM "TripStages" s
       WHERE ${wheres.join(' AND ')}
       ORDER BY s."TripId", s."StageNo"`,
      params,
    );

    const stages = rows.map(r => ({
      id:             r.Id,
      stageNo:        Number(r.StageNo),
      stage:          r.Stage as string,
      startAt:        r.StartAt,
      endAt:          r.EndAt ?? null,
      durationSec:    Number(r.DurationSec),
      startLat:       Number(r.StartLat),
      startLng:       Number(r.StartLng),
      endLat:         Number(r.EndLat),
      endLng:         Number(r.EndLng),
      startAddress:   r.StartAddress ?? null,
      endAddress:     r.EndAddress ?? null,
      distanceKm:     Number(r.DistanceKm),
      maxSpeedKmh:    Number(r.MaxSpeedKmh),
      avgSpeedKmh:    Number(r.AvgSpeedKmh),
      startOdometerKm: Number(r.StartOdometerKm),
      endOdometerKm:  Number(r.EndOdometerKm),
      fuelConsumedL:  Number(r.FuelConsumedL),
      pingCount:      Number(r.PingCount),
      harshBrakeCount: Number(r.HarshBrakeCount),
      harshAccelCount: Number(r.HarshAccelCount),
      overspeedSec:   Number(r.OverspeedSec),
    }));

    // Aggregate summary across stages
    const drivingStages = stages.filter(s => s.stage === 'driving');
    const idleStages    = stages.filter(s => s.stage === 'idle');
    const stoppedStages = stages.filter(s => s.stage === 'stopped');

    return NextResponse.json({
      count: stages.length,
      stages,
      summary: {
        totalStages:      stages.length,
        drivingStages:    drivingStages.length,
        idleStages:       idleStages.length,
        stoppedStages:    stoppedStages.length,
        totalDrivingSec:  drivingStages.reduce((s, r) => s + r.durationSec, 0),
        totalIdleSec:     idleStages.reduce((s, r) => s + r.durationSec, 0),
        totalStoppedSec:  stoppedStages.reduce((s, r) => s + r.durationSec, 0),
        totalDistanceKm:  Math.round(drivingStages.reduce((s, r) => s + r.distanceKm, 0) * 10) / 10,
        totalFuelL:       Math.round(stages.reduce((s, r) => s + r.fuelConsumedL, 0) * 100) / 100,
        totalPings:       stages.reduce((s, r) => s + r.pingCount, 0),
        harshBrakeTotal:  stages.reduce((s, r) => s + r.harshBrakeCount, 0),
        harshAccelTotal:  stages.reduce((s, r) => s + r.harshAccelCount, 0),
        overspeedSec:     stages.reduce((s, r) => s + r.overspeedSec, 0),
        maxSpeedKmh:      Math.max(...stages.map(s => s.maxSpeedKmh), 0),
      },
    });
  } catch (err) {
    console.error('[trip-stages GET]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
