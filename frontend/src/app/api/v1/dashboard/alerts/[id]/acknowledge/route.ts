import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/pgDb';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getPool();
    await db.query(
      `UPDATE "Alerts"
       SET "Status" = 'Acknowledged', "Acknowledged" = true
       WHERE "Id" = $1`,
      [id],
    );
  } catch (err) {
    console.error('[alerts/acknowledge] DB error', err);
  }
  return new NextResponse(null, { status: 204 });
}
