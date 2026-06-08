import { NextRequest, NextResponse } from 'next/server';
import { rbacPermissionsStore } from '@/lib/rbacPermissionsStore';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> },
) {
  const { roleId } = await params;

  if (!roleId) {
    return NextResponse.json({ message: 'roleId is required.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.allowedModules)) {
    return NextResponse.json({ message: 'allowedModules array is required.' }, { status: 400 });
  }

  const allowedModules: string[] = [...new Set(body.allowedModules as string[])];
  rbacPermissionsStore[roleId] = allowedModules;

  return new NextResponse(null, { status: 204 });
}
