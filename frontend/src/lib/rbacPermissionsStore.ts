/**
 * In-memory store shared by the mock RBAC API routes.
 * Initialised from the same default deny-lists as the frontend RBAC page.
 * State persists for the lifetime of the Next.js server process (dev only).
 * In production the real C# / PostgreSQL backend is used instead.
 */

const ALL_MODULE_IDS = [
  'real-time','my-vehicle','map','playback','alerts',
  'customers','vehicles','devices','drivers','routes','geofences','unauthorized','maintenance',
  'cost-savings','analytics','reports',
  'subscription','resellers',
  'integrations','tenants','branding',
  'auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices',
  'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  'global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation',
  'module-config','nav-config','password-policy',
] as const;

const SYS_DENIED: Record<string, string[]> = {
  super_admin:    [],
  platform_admin: ['subscription','resellers','tenants','global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config'],
  tenant_admin:   ['resellers','tenants','global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation','nav-config','module-config','password-policy'],
  fleet_admin:    ['tenants','global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','nav-config','password-policy'],
  fleet_manager:  ['subscription','resellers','tenants','global-monitor','health','sys-config','tenant-mgmt','global-alerts','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','devices','integrations','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
  dispatcher:     ['subscription','resellers','tenants','branding','global-monitor','health','sys-config','tenant-mgmt','global-alerts','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','cost-savings','reports','analytics','unauthorized','maintenance','devices','integrations','isolation','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
  vehicle_owner:  ['real-time','customers','vehicles','devices','cost-savings','resellers','integrations','tenants','branding','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
  viewer:         ['subscription','resellers','devices','integrations','tenants','branding','global-monitor','health','sys-config','tenant-mgmt','global-alerts','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','unauthorized','maintenance','routes','map','playback','alerts','analytics','reports','cost-savings','customers','isolation','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
  billing_admin:  ['map','playback','alerts','vehicles','drivers','routes','geofences','unauthorized','maintenance','cost-savings','analytics','reports','resellers','devices','integrations','tenants','branding','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
  partner:        ['global-monitor','health','sys-config','tenant-mgmt','global-alerts','vehicles','drivers','routes','geofences','unauthorized','maintenance','devices','cost-savings','analytics','reports','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','isolation','tenants','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
};

function buildDefaults(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [role, deniedList] of Object.entries(SYS_DENIED)) {
    const denied = new Set(deniedList);
    result[role] = ALL_MODULE_IDS.filter(id => !denied.has(id));
  }
  return result;
}

/** Singleton — mutated in-place by the PUT mock route */
export const rbacPermissionsStore: Record<string, string[]> = buildDefaults();
