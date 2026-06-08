import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID } from '@/lib/pgDb';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  try {
    const db = getPool();
    const params: unknown[] = [];
    let vehicleWhere = '';
    let driverWhere  = '';
    let alertWhere   = '';

    if (tenantId) {
      const uuid = TENANT_UUID[tenantId];
      if (uuid) {
        vehicleWhere = ` WHERE "TenantId" = $1`;
        driverWhere  = ` WHERE "TenantId" = $1`;
        alertWhere   = ` WHERE "TenantId" = $1`;
        params.push(uuid);
      }
    }

    const [vRows, dRows, aRows] = await Promise.all([
      db.query(`SELECT "Status" FROM "Vehicles"${vehicleWhere}`, params),
      db.query(`SELECT "Status" FROM "Drivers"${driverWhere}`, params),
      db.query(
        `SELECT a."Id" as id, a."Severity" as severity, a."Type" as type,
                a."Title" as title, a."Description" as description,
                a."Acknowledged" as acknowledged, a."OccurredAt" as "occurredAt",
                v."Plate" as "vehiclePlate"
         FROM "Alerts" a
         LEFT JOIN "Vehicles" v ON a."VehicleId" = v."Id"
         ${alertWhere.replace('"TenantId"', 'a."TenantId"')}`,
        params,
      ),
    ]);

    const vehicles   = vRows.rows;
    const drivers    = dRows.rows;
    const allAlerts  = aRows.rows;

    const openAlerts    = allAlerts.filter(a => !a.acknowledged);
    const onDuty        = drivers.filter(d => d.Status === 'Driving' || d.Status === 'driving' || d.Status === 'on_duty').length;

    return NextResponse.json({
      totalVehicles:       vehicles.length,
      activeVehicles:      vehicles.filter(v => v.Status?.toLowerCase() === 'active').length,
      idleVehicles:        vehicles.filter(v => v.Status?.toLowerCase() === 'idle').length,
      offlineVehicles:     vehicles.filter(v => v.Status?.toLowerCase() === 'offline').length,
      maintenanceVehicles: vehicles.filter(v => v.Status?.toLowerCase() === 'maintenance').length,
      totalDrivers:        drivers.length,
      driversOnDuty:       onDuty,
      openAlerts:          openAlerts.length,
      criticalAlerts:      openAlerts.filter(a => a.severity === 'critical').length,
      fuelSavedToday:      840,
      recentAlerts:        openAlerts.slice(0, 5),
    });
  } catch (err) {
    console.error('[dashboard/summary] DB error', err);
    return NextResponse.json({
      totalVehicles: 0, activeVehicles: 0, idleVehicles: 0,
      offlineVehicles: 0, maintenanceVehicles: 0,
      totalDrivers: 0, driversOnDuty: 0,
      openAlerts: 0, criticalAlerts: 0, fuelSavedToday: 0, recentAlerts: [],
    });
  }
}
