export type UserRole =
  | 'super_admin'
  | 'platform_admin'
  | 'tenant_admin'
  | 'partner'
  | 'fleet_admin'
  | 'fleet_manager'
  | 'dispatcher'
  | 'billing_admin'
  | 'viewer'
  | 'vehicle_owner';

export interface AuthUser {
  token: string;
  role: UserRole;
  email: string;
  fullName: string;
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  /** Populated only for vehicle_owner role — primary vehicle (backward compat) */
  vehicleId: string | null;
  /** All vehicle IDs this owner manages. Length > 1 enables the selector on My Vehicle. */
  vehicleIds: string[];
  /** If non-empty, this user can only see data for these specific vehicle IDs (overrides tenant-wide access). */
  restrictedVehicleIds?: string[];
}

export type VehicleStatus = 'active' | 'idle' | 'offline' | 'maintenance';

export interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: VehicleStatus;
  latitude: number | null;
  longitude: number | null;
  speedKmh: number | null;
  fuelLevel: number | null;
  odometer: number | null;
  assignedDriverName: string | null;
  lastSeenAt: string | null;
}

export type DriverStatus = 'driving' | 'on_duty' | 'off_duty' | 'resting';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseClass: string;
  status: DriverStatus;
  safetyScore: number;
  hosDriven: number;
  hosRemaining: number;
  assignedVehiclePlate: string | null;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AlertSummary {
  id: string;
  severity: AlertSeverity;
  type: string;
  title: string;
  description: string;
  vehiclePlate: string | null;
  occurredAt: string;
  acknowledged: boolean;
}

export interface DashboardSummary {
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
  maintenanceVehicles: number;
  totalDrivers: number;
  driversOnDuty: number;
  openAlerts: number;
  criticalAlerts: number;
  fuelSavedToday: number;
  recentAlerts: AlertSummary[];
}
