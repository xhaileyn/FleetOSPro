import { NextResponse } from 'next/server';
import { rbacPermissionsStore } from '@/lib/rbacPermissionsStore';

export async function GET() {
  const payload = Object.entries(rbacPermissionsStore).map(([roleId, allowedModules]) => ({
    roleId,
    allowedModules,
  }));
  return NextResponse.json(payload);
}
