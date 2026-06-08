import { Vehicle, Driver, AlertSummary } from './types';

/* ── Mock data moved to PostgreSQL ─────────────────────────────────────
   Seed: DB migration AddVehiclesDriversCustomersBranchesUsers
   Hydrated at runtime via the DB-backed API routes:
     /api/v1/vehicles, /api/v1/drivers, /api/v1/dashboard/summary
   ─────────────────────────────────────────────────────────────────── */

export const MOCK_VEHICLES: Vehicle[] = [];

export const MOCK_DRIVERS: Driver[] = [];

export const MOCK_ALERTS: AlertSummary[] = [];
