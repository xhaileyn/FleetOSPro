/**
 * Server-side PostgreSQL client (Next.js API routes only — never imported on the client).
 * Connection settings mirror appsettings.json in the backend.
 */

import { Pool, types } from 'pg';

// ── Type parsers ──────────────────────────────────────────────────────────────
// By default the pg library converts PostgreSQL `date` columns to JavaScript
// Date objects, which causes String(val).slice(0,10) to produce the locale
// date string ("Fri Dec 31") rather than the ISO string ("2027-12-31").
// Override type 1082 (date) to keep the value as the raw "YYYY-MM-DD" string.
types.setTypeParser(1082, (val: string) => val);

// Tenant short-ID → stable UUID mapping (matches FleetDbContext seed)
export const TENANT_UUID: Record<string, string> = {
  '1': '00000000-0000-0000-0000-000000000001',
  '2': '00000000-0000-0000-0000-000000000002',
  '3': '00000000-0000-0000-0000-000000000003',
  '4': '00000000-0000-0000-0000-000000000004',
  '5': '00000000-0000-0000-0000-000000000005',
  '6': '00000000-0000-0000-0000-000000000006',
  '7': '00000000-0000-0000-0000-000000000007',
  '8': '00000000-0000-0000-0000-000000000008',
  '9': '00000000-0000-0000-0000-000000000009',
  '10': '00000000-0000-0000-0000-000000000010',
};

// Reverse map: UUID → short tenant ID
export const UUID_TENANT: Record<string, string> = Object.fromEntries(
  Object.entries(TENANT_UUID).map(([k, v]) => [v.toLowerCase(), k]),
);

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host:     process.env.PGHOST     ?? 'localhost',
      port:     Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE ?? 'fleetos',
      user:     process.env.PGUSER     ?? 'postgres',
      password: process.env.PGPASSWORD ?? 'postgres',
      max: 5,
    });
  }
  return pool;
}
