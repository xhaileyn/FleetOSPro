import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { firstName, lastName, email, companyName, plan } = body as Record<string, string>;

  if (!email || !firstName) {
    return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
  }

  const token = Buffer.from(JSON.stringify({ email, role: 'fleet_admin' })).toString('base64');
  const tenantId = crypto.randomUUID();

  return NextResponse.json({
    token,
    role: 'fleet_admin',
    email,
    fullName: `${firstName} ${lastName}`.trim(),
    tenantId,
    tenantName: companyName ?? 'My Fleet',
    tenantSlug: (companyName ?? 'myfleet').toLowerCase().replace(/\s+/g, '-'),
  });
}
