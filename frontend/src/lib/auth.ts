import { AuthUser, UserRole } from './types';

const TOKEN_KEY = 'fleetos_token';
const USER_KEY  = 'fleetos_user';

export function saveAuth(user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, user.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuth();
}

// Role hierarchy for UI visibility decisions
const ROLE_WEIGHTS: Record<UserRole, number> = {
  super_admin:    100,
  platform_admin: 80,
  tenant_admin:   70,
  partner:        60,
  fleet_admin:    50,
  fleet_manager:  40,
  dispatcher:     30,
  billing_admin:  20,
  viewer:         10,
  vehicle_owner:   5,
};

export function hasMinRole(user: AuthUser, minRole: UserRole): boolean {
  return (ROLE_WEIGHTS[user.role] ?? 0) >= (ROLE_WEIGHTS[minRole] ?? 0);
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin:    'Super Admin',
    platform_admin: 'Platform Admin',
    tenant_admin:   'Tenant Admin',
    partner:        'Partner / Reseller',
    fleet_admin:    'Fleet Admin',
    fleet_manager:  'Fleet Manager',
    dispatcher:     'Dispatcher',
    billing_admin:  'Billing Admin',
    viewer:         'Read-only Viewer',
    vehicle_owner:  'Vehicle Owner',
  };
  return labels[role] ?? role;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
