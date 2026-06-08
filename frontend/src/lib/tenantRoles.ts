// Tenant-scoped custom roles with per-module CRUD permissions

export interface ModulePermission {
  moduleId: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface FeaturePermission {
  featureId: string;
  enabled: boolean;
}

export interface TenantCustomRole {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  permissions: ModulePermission[];
  /** Sub-feature level permissions within modules (featureId → enabled) */
  featurePermissions: Record<string, boolean>;
  createdAt: string;
  userCount: number;
}

export const TENANT_MODULES = [
  { id: 'dashboard',    label: 'Live Dashboard',       section: 'Real-time ops' },
  { id: 'map',          label: 'Live Map',              section: 'Real-time ops' },
  { id: 'playback',     label: 'Route Playback',        section: 'Real-time ops' },
  { id: 'alerts',       label: 'Alerts',                section: 'Real-time ops' },
  { id: 'vehicles',     label: 'Vehicles',              section: 'Fleet management' },
  { id: 'drivers',      label: 'Driver Performance', section: 'Fleet management' },
  { id: 'routes',       label: 'Route Optimisation',    section: 'Fleet management' },
  { id: 'geofences',    label: 'Geofences',             section: 'Fleet management' },
  { id: 'unauthorized', label: 'Unauthorized Usage',    section: 'Fleet management' },
  { id: 'maintenance',  label: 'Maintenance',           section: 'Fleet management' },
  { id: 'analytics',    label: 'Analytics',             section: 'Cost & efficiency' },
  { id: 'reports',      label: 'Reports',               section: 'Cost & efficiency' },
  { id: 'subscription', label: 'Subscription',          section: 'Billing' },
  { id: 'tenant-users', label: 'User Management',       section: 'Administration' },
  { id: 'tenant-roles', label: 'Custom Roles',          section: 'Administration' },
] as const;

export type TenantModuleId = (typeof TENANT_MODULES)[number]['id'];

// ── Feature-level sub-permissions within modules ──────────────────────────────

export interface ModuleFeature {
  id: string;    // e.g. "vehicles:export"
  label: string;
  description: string;
  /** Which CRUD operation this feature maps to */
  crudType: 'create' | 'read' | 'update' | 'delete';
}

export const MODULE_FEATURES: Partial<Record<TenantModuleId, ModuleFeature[]>> = {
  vehicles: [
    { id: 'vehicles:export',    label: 'Export CSV',          description: 'Download fleet list as CSV',        crudType: 'read'   },
    { id: 'vehicles:import',    label: 'Import data',         description: 'Bulk import vehicles from file',    crudType: 'create' },
    { id: 'vehicles:telemetry', label: 'View telemetry',      description: 'Live speed, fuel, GPS data',        crudType: 'read'   },
    { id: 'vehicles:documents', label: 'Manage documents',    description: 'Insurance, token tax, fitness',     crudType: 'update' },
    { id: 'vehicles:transfer',  label: 'Transfer vehicle',    description: 'Reassign to another driver/branch', crudType: 'update' },
  ],
  drivers: [
    { id: 'drivers:export',     label: 'Export CSV',          description: 'Download driver list as CSV',       crudType: 'read'   },
    { id: 'drivers:scorecard',  label: 'View scorecards',     description: 'Individual driver safety scores',   crudType: 'read'   },
    { id: 'drivers:hos',        label: 'Manage HOS log',      description: 'View & adjust hours of service',    crudType: 'update' },
    { id: 'drivers:documents',  label: 'Driver documents',    description: 'Licence, PSV, medical docs',        crudType: 'update' },
  ],
  alerts: [
    { id: 'alerts:acknowledge', label: 'Acknowledge alerts',  description: 'Mark alerts as seen/resolved',      crudType: 'update' },
    { id: 'alerts:config',      label: 'Configure rules',     description: 'Create/edit alert trigger rules',   crudType: 'create' },
    { id: 'alerts:history',     label: 'Alert history',       description: 'Full historical audit trail',       crudType: 'read'   },
  ],
  geofences: [
    { id: 'geo:draw',           label: 'Draw geofences',      description: 'Create polygon/circle zones',       crudType: 'create' },
    { id: 'geo:triggers',       label: 'Configure triggers',  description: 'Set entry/exit alert rules',        crudType: 'update' },
    { id: 'geo:history',        label: 'Zone event history',  description: 'View geofence entry/exit log',      crudType: 'read'   },
  ],
  maintenance: [
    { id: 'maint:schedule',     label: 'Schedule service',    description: 'Create upcoming maintenance jobs',  crudType: 'create' },
    { id: 'maint:approve',      label: 'Approve work orders', description: 'Sign off on maintenance requests',  crudType: 'update' },
    { id: 'maint:history',      label: 'Full history',        description: 'All past maintenance records',      crudType: 'read'   },
    { id: 'maint:cost',         label: 'View costs',          description: 'Labour and parts cost breakdown',   crudType: 'read'   },
  ],
  reports: [
    { id: 'rpt:mileage',        label: 'Mileage report',      description: 'Vehicle mileage over time',         crudType: 'read'   },
    { id: 'rpt:fuel',           label: 'Fuel consumption',    description: 'Fuel usage & efficiency',           crudType: 'read'   },
    { id: 'rpt:driver',         label: 'Driver scorecard',    description: 'Safety & performance scores',       crudType: 'read'   },
    { id: 'rpt:geofence',       label: 'Geofence activity',   description: 'Zone entry/exit events',            crudType: 'read'   },
    { id: 'rpt:unauthorized',   label: 'Unauthorized usage',  description: 'Trips outside allowed zones/hours', crudType: 'read'   },
    { id: 'rpt:maintenance',    label: 'Maintenance log',     description: 'Service history & upcoming',        crudType: 'read'   },
    { id: 'rpt:cost',           label: 'Cost analysis',       description: 'Operational cost breakdown',        crudType: 'read'   },
    { id: 'rpt:export',         label: 'Export reports',      description: 'Download as PDF or Excel',          crudType: 'read'   },
  ],
  analytics: [
    { id: 'analytics:kpi',      label: 'KPI dashboard',       description: 'Fleet-wide performance KPIs',       crudType: 'read'   },
    { id: 'analytics:trends',   label: 'Trend analysis',      description: 'Historical charts and forecasts',   crudType: 'read'   },
    { id: 'analytics:compare',  label: 'Driver comparison',   description: 'Side-by-side driver metrics',       crudType: 'read'   },
    { id: 'analytics:export',   label: 'Export data',         description: 'Download raw analytics data',       crudType: 'read'   },
  ],
};

/** Build a default featurePermissions map (all enabled) for a new role */
export function defaultFeaturePermissions(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const features of Object.values(MODULE_FEATURES)) {
    if (!features) continue;
    for (const f of features) result[f.id] = true;
  }
  return result;
}

// Group modules by section
export function getModulesBySection(): Record<string, typeof TENANT_MODULES[number][]> {
  const grouped: Record<string, typeof TENANT_MODULES[number][]> = {};
  for (const mod of TENANT_MODULES) {
    if (!grouped[mod.section]) grouped[mod.section] = [];
    grouped[mod.section].push(mod);
  }
  return grouped;
}

/** Default all-false permission set for a brand-new role */
export function emptyPermissions(): ModulePermission[] {
  return TENANT_MODULES.map(m => ({ moduleId: m.id, create: false, read: false, update: false, delete: false }));
}

/** All-false feature permissions for a brand-new role */
export function emptyFeaturePermissions(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const features of Object.values(MODULE_FEATURES)) {
    if (!features) continue;
    for (const f of features) result[f.id] = false;
  }
  return result;
}

/** Seed data moved to PostgreSQL — loaded at runtime from /api/v1/tenant-roles. */
export const SEED_TENANT_ROLES: TenantCustomRole[] = [];

/** Get custom roles for a tenant */
export function getRolesByTenant(tenantId: string): TenantCustomRole[] {
  return SEED_TENANT_ROLES.filter(r => r.tenantId === tenantId);
}

/** Get a role by id */
export function getRoleById(id: string): TenantCustomRole | undefined {
  return SEED_TENANT_ROLES.find(r => r.id === id);
}
