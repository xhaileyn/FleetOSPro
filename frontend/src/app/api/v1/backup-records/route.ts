import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT } from '@/lib/pgDb';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  try {
    const db = getPool();
    let query = `SELECT * FROM "BackupRecords"`;
    const params: unknown[] = [];

    if (tenantId) {
      const uuid = TENANT_UUID[tenantId];
      if (uuid) { query += ` WHERE "TenantId" = $1`; params.push(uuid); }
    }
    query += ` ORDER BY "StartedAt" DESC`;

    const { rows } = await db.query(query, params);
    return NextResponse.json(rows.map(r => ({
      tenantId:        UUID_TENANT[(r.TenantId as string)?.toLowerCase()] ?? r.TenantId,
      backupId:        r.BackupId,
      type:            r.Type,
      startedAt:       r.StartedAt,
      completedAt:     r.CompletedAt,
      sizeGb:          Number(r.SizeGb),
      status:          r.Status,
      encryptedWith:   r.EncryptedWith,
      storageLocation: r.StorageLocation,
      rpoHours:        r.RpoHours,
      rtoHours:        r.RtoHours,
    })));
  } catch (err) {
    console.error('[backup-records] DB error', err);
    return NextResponse.json([]);
  }
}
