import { UserRole } from './types';

export interface TenantUser {
  id: string;
  tenantId: string;          // matches tenant seed id ('1'–'6')
  tenantName: string;
  tenantSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;          // demo only — never do this in production
  role: UserRole;            // primary system role (kept for auth compat)
  additionalRoles?: UserRole[];   // extra system roles assigned to this user
  customRoleIds?: string[];       // tenant custom role IDs (from tenantRoles.ts)
  status: 'Active' | 'Suspended' | 'Pending';
  mfaEnabled: boolean;
  lastLogin: string;         // ISO string or human label
  vehicleId?: string;        // primary vehicle (backward compat for single-vehicle owners)
  vehicleIds?: string[];     // all vehicles this owner manages (enables selector when length > 1)

  /** Customer this user was created for (portal user created from customer profile) */
  customerId?: string;

  // ── Access scoping ─────────────────────────────────────────────────────────
  /** If non-empty, user can only see/manage these specific vehicle IDs */
  restrictedVehicleIds?: string[];
  /** If non-empty, user can only see/manage these specific device IDs */
  restrictedDeviceIds?: string[];
  /** If non-empty, user only sees data from these branch IDs */
  branchIds?: string[];
}

/** Returns all system roles assigned to a user (primary + additional) */
export function getAllRoles(user: TenantUser): UserRole[] {
  return [user.role, ...(user.additionalRoles ?? [])];
}


/** Populated by usersStore on app load (server-side in-memory store seeded from DB). */
export const TENANT_USERS: TenantUser[] = [];

/** Get all users for a given tenantId */
export function getUsersByTenant(tenantId: string): TenantUser[] {
  return TENANT_USERS.filter(u => u.tenantId === tenantId);
}

/** Get the fleet_admin(s) for a tenant */
export function getTenantAdmins(tenantId: string): TenantUser[] {
  return TENANT_USERS.filter(u => u.tenantId === tenantId && u.role === 'fleet_admin');
}
