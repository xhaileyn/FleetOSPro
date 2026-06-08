// Branch / location data for multi-branch tenant access control

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  city: string;
  region: string;
  vehicleCount: number;
  driverCount: number;
  userCount: number;
  active: boolean;
  managerId?: string;   // TenantUser id of branch manager
  createdAt: string;
}


/** Populated by branchesStore on app load from PostgreSQL. */
export const SEED_BRANCHES: Branch[] = [];

export function getBranchesByTenant(tenantId: string): Branch[] {
  return SEED_BRANCHES.filter(b => b.tenantId === tenantId);
}

export function getBranchById(id: string): Branch | undefined {
  return SEED_BRANCHES.find(b => b.id === id);
}
