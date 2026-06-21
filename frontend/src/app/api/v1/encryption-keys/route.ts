import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  try {
    const db = getPool();
    let query = `SELECT * FROM "EncryptionKeys"`;
    const params: unknown[] = [];

    if (tenantId) {
      const uuid = toTenantUuid(tenantId);
      if (uuid) { query += ` WHERE "TenantId" = $1`; params.push(uuid); }
    }

    const { rows } = await db.query(query, params);
    return NextResponse.json(rows.map(r => ({
      tenantId:     fromTenantUuid((r.TenantId as string)?.toLowerCase()) ?? r.TenantId,
      keyId:        r.KeyId,
      algorithm:    r.Algorithm,
      bitLength:    r.BitLength,
      created:      r.Created      ? String(r.Created).slice(0, 10)      : '',
      lastRotated:  r.LastRotated  ? String(r.LastRotated).slice(0, 10)  : '',
      nextRotation: r.NextRotation ? String(r.NextRotation).slice(0, 10) : '',
      status:       r.Status,
      kmsProvider:  r.KmsProvider,
    })));
  } catch (err) {
    console.error('[encryption-keys] DB error', err);
    return NextResponse.json([]);
  }
}
