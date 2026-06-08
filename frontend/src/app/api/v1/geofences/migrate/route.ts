import { NextResponse } from 'next/server';
import { getPool } from '@/lib/pgDb';

export async function POST() {
  const db = getPool();
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS "Geofences" (
        "Id"         UUID             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        "ShortId"    TEXT             NOT NULL UNIQUE,
        "TenantId"   UUID             NOT NULL,
        "Name"       TEXT             NOT NULL,
        "Type"       TEXT             NOT NULL DEFAULT 'Home base',
        "Shape"      TEXT             NOT NULL DEFAULT 'circle',
        "Lat"        DOUBLE PRECISION NOT NULL DEFAULT 0,
        "Lng"        DOUBLE PRECISION NOT NULL DEFAULT 0,
        "Radius"     DOUBLE PRECISION NOT NULL DEFAULT 500,
        "Points"     JSONB,
        "Status"     TEXT             NOT NULL DEFAULT 'Active',
        "Triggers"   JSONB            NOT NULL DEFAULT '["Entry","Exit"]',
        "Inside"     INTEGER          NOT NULL DEFAULT 0,
        "CreatedBy"  TEXT,
        "Visibility" TEXT             NOT NULL DEFAULT 'tenant',
        "VehicleIds" JSONB            NOT NULL DEFAULT '[]',
        "CreatedAt"  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
        "UpdatedAt"  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS "idx_geofences_tenant"     ON "Geofences"("TenantId")`);
    await db.query(`CREATE INDEX IF NOT EXISTS "idx_geofences_created_by" ON "Geofences"("CreatedBy")`);
    await db.query(`CREATE INDEX IF NOT EXISTS "idx_geofences_status"     ON "Geofences"("Status")`);
    return NextResponse.json({ ok: true, message: 'Geofences table ready' });
  } catch (err) {
    console.error('[migrate/geofences]', err);
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}
