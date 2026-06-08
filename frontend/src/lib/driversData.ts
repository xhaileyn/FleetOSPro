export type DriverStatus = 'driving' | 'on_duty' | 'off_duty' | 'resting';
export type LicenseClass = 'A' | 'B' | 'C' | 'CE';

export interface DriverRecord {
  id: string;
  tenantId: string;
  name: string;
  licenseNumber: string;
  licenseClass: LicenseClass;
  phoneNumber: string;
  status: DriverStatus;
  safetyScore: number;
  hosDriven: number;
  hosRemaining: number;
  assignedVehicleId: string | null;
  assignedVehiclePlate: string | null;
  /** Set when a vehicle_owner creates the driver — scopes it to that owner only */
  ownerId?: string | null;
}


/** Populated by driversStore on app load from PostgreSQL. */
export const DRIVERS: DriverRecord[] = [];


export function getDriversByTenant(tenantId: string): DriverRecord[] {
  return DRIVERS.filter(d => d.tenantId === tenantId);
}

export function getDriverById(id: string): DriverRecord | undefined {
  return DRIVERS.find(d => d.id === id);
}

export function getDriverByVehicle(vehicleId: string): DriverRecord | undefined {
  return DRIVERS.find(d => d.assignedVehicleId === vehicleId);
}

export const STATUS_LABEL: Record<DriverStatus, string> = {
  driving:  'Driving',
  on_duty:  'On duty',
  off_duty: 'Off duty',
  resting:  'Resting',
};

export const STATUS_COLOR: Record<DriverStatus, { bg: string; color: string }> = {
  driving:  { bg: 'rgba(196,145,42,0.12)',  color: '#c4912a'  },
  on_duty:  { bg: '#dbeafe',         color: '#1d4ed8'          },
  off_duty: { bg: '#f3f4f6',         color: '#6b7280'          },
  resting:  { bg: '#fffbeb',         color: '#92400e'          },
};

const AVATAR_PALETTE = ['#0d6e5e','#1a5fa0','#5b4bb5','#b8620a','#2d6a28','#b33030','#0f766e','#9333ea'];

export function driverAvatarColor(id: string): string {
  const idx = parseInt(id.replace('d', ''), 10) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}
