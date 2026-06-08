/**
 * Shared trip types and helpers for My Vehicle and Route Playback pages.
 * Seed data moved to PostgreSQL (DB migration AddDevicesSimsTripsSubscriptionsRolesAudit).
 * Hydrated at runtime via useTripsStore → /api/v1/trips.
 */
import type { RoutePoint } from '@/components/maps/PlaybackMap';

export interface Trip {
  id: string;
  vehicleId: string;       // which vehicle this trip belongs to
  date: string;            // display string e.g. "2026-05-28 07:14"
  dateISO: string;         // ISO date for input[type=date]
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  avgSpeed: number;
  maxSpeed: number;
  fuelUsedL: number;
  status: 'Completed' | 'In Progress';
  route: RoutePoint[];
}

/* ── Trip catalogue — moved to PostgreSQL ────────────────────────────── */
export const TRIPS: Trip[] = [];

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
