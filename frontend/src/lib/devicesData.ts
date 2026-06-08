/* ── Types ─────────────────────────────────────────────────────────── */

export type DeviceType   = 'GPS Tracker' | 'OBD Dongle' | 'Dashcam' | 'Temp Sensor' | 'Fuel Sensor';
export type DeviceStatus = 'Online' | 'Offline' | 'Maintenance';
export type SignalStrength = 'Strong' | 'Medium' | 'Weak' | 'None';

export interface GpsDevice {
  id: string;
  did?: number;            // numeric device ID (auto-increment PK from DB)
  tenantId: string;
  vehicleId: string;       // matches VehicleMaster.id
  vid?: number | null;     // numeric vehicle ID reference (FK to VehicleMaster.vid)
  vehiclePlate: string;
  type: DeviceType;
  model: string;
  serialNo: string;
  imei: string;
  firmware: string;
  signal: SignalStrength;
  battery: number | null;  // % for battery-powered; null = hardwired (uses vehicle power)
  lastSeen: string;        // relative string for display
  status: DeviceStatus;
  simId: string | null;    // matches SimCard.id
  installedAt: string;
  notes: string;
}

/* ── Master device list — moved to PostgreSQL ─────────────────────── */
/* Seed data in DB migration AddDevicesSimsTripsSubscriptionsRolesAudit */
/* Hydrated at runtime via useDevicesStore → /api/v1/devices            */
export const DEVICES: GpsDevice[] = [];

/* ── Helpers ───────────────────────────────────────────────────────── */
export function getDevicesByTenant(tenantId: string): GpsDevice[] {
  return DEVICES.filter(d => d.tenantId === tenantId);
}

export function getDevicesByVehicle(vehicleId: string): GpsDevice[] {
  return DEVICES.filter(d => d.vehicleId === vehicleId);
}
