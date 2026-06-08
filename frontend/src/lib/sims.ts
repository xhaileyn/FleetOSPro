/* ── Types ─────────────────────────────────────────────────────────── */

export type SimStatus = 'Active' | 'Inactive' | 'Suspended' | 'Expired';
export type SimType   = 'Primary' | 'Backup';

export interface SimCard {
  id: string;
  sid?: number;           // numeric SIM ID (auto-increment PK from DB)
  tenantId: string;
  vehicleId: string;      // matches VehicleMaster.id
  vid?: number | null;    // numeric vehicle ID reference (FK to VehicleMaster.vid)
  vehiclePlate: string;
  iccid: string;          // 20-digit SIM identifier
  msisdn: string;         // phone number on SIM
  operator: string;
  country: string;
  type: SimType;
  status: SimStatus;
  dataUsedMB: number;
  dataPlanMB: number;
  apn: string;
  activatedAt: string;
  expiresAt: string;
  notes: string;
}

/* ── Master SIM list — moved to PostgreSQL ─────────────────────────── */
/* Seed data in DB migration AddDevicesSimsTripsSubscriptionsRolesAudit */
/* Hydrated at runtime via useSimsStore → /api/v1/sims                  */
export const SIMS: SimCard[] = [];

/* ── Helpers ───────────────────────────────────────────────────────── */
export function getSimsByTenant(tenantId: string): SimCard[] {
  return SIMS.filter(s => s.tenantId === tenantId);
}

export function getSimsByVehicle(vehicleId: string): SimCard[] {
  return SIMS.filter(s => s.vehicleId === vehicleId);
}

export function simDataUsagePct(sim: SimCard): number {
  return Math.round((sim.dataUsedMB / sim.dataPlanMB) * 100);
}
