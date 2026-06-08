import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/pgDb';
import { logAuditEvent } from '@/lib/auditLogger';

function actorFromReq(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!auth) return { email: 'system', role: 'system', tenantId: null as string | null };
  try {
    const { email, role, tenantId } = JSON.parse(Buffer.from(auth, 'base64').toString('utf8'));
    return { email: email ?? 'system', role: role ?? 'system', tenantId: tenantId ?? null };
  } catch { return { email: 'system', role: 'system', tenantId: null as string | null }; }
}

// PATCH /api/v1/alerts/:id
// Body: { status, operatorResponse?, operatorName? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const actor = actorFromReq(req);
  let body: { status?: string; operatorResponse?: string; operatorName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const { status, operatorResponse, operatorName } = body;
  if (!status) {
    return NextResponse.json({ message: 'status is required' }, { status: 400 });
  }

  const db = getPool();
  try {
    const sets: string[] = [];
    const values: unknown[] = [];

    sets.push(`"Status" = $${values.length + 1}`);
    values.push(status);

    sets.push(`"Acknowledged" = $${values.length + 1}`);
    values.push(status === 'Acknowledged' || status === 'Closed');

    if (operatorResponse !== undefined) {
      sets.push(`"OperatorResponse" = $${values.length + 1}`);
      values.push(operatorResponse || null);
    }
    if (operatorName !== undefined) {
      sets.push(`"OperatorName" = $${values.length + 1}`);
      values.push(operatorName || null);
    }
    if (status === 'Closed') {
      sets.push(`"ClosedAt" = $${values.length + 1}`);
      values.push(new Date().toISOString());
    }

    values.push(id);
    const { rowCount } = await db.query(
      `UPDATE "Alerts" SET ${sets.join(', ')} WHERE "Id" = $${values.length}`,
      values,
    );

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Alert not found' }, { status: 404 });
    }

    const action = status === 'Closed' ? 'alert.close' : 'alert.acknowledge';
    void logAuditEvent({
      tenantId:   actor.tenantId,
      actor:      actor.email,
      actorRole:  actor.role,
      action,
      resource:   'Alert',
      resourceId: id,
      outcome:    'success',
      details:    { status, operatorName, operatorResponse },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[alerts] PATCH error', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
