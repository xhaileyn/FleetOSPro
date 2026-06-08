/* ─────────────────────────────────────────────────────────────────────────
   FleetOS+ Subscription Plans & Service Catalogue
   Seed reference date: 2026-05-28
   Expiring Soon window : ≤ 30 days to expiry
   Expired              : expiry date < today → all gated services suspended
───────────────────────────────────────────────────────────────────────── */

/* ── Service catalogue ───────────────────────────────────────────────── */
export type ServiceKey =
  | 'web_access'          // Web portal & dashboard login
  | 'live_tracking'       // Real-time live map & movement
  | 'on_call_location'    // On-demand "where is my vehicle?" request
  | 'sms_alert'           // SMS notifications to registered numbers
  | 'geofence_alert'      // Geofence entry / exit alerts
  | 'engine_cut'          // Remote engine cut / immobiliser command
  | 'door_lock'           // Remote door lock / unlock
  | 'route_playback'      // Historical route playback
  | 'reports'             // Fleet & compliance reports
  | 'driver_behaviour'    // Harsh braking, speeding, idling scores
  | 'maintenance_alerts'  // Service due & overdue push/SMS reminders
  | 'fuel_monitoring'     // Fuel level trend & anomaly detection
  | 'api_access';         // REST API & webhook integrations

export interface ServiceDef {
  key:         ServiceKey;
  icon:        string;
  label:       string;
  description: string;
  category:    'Connectivity' | 'Tracking' | 'Alerts' | 'Control' | 'Analytics' | 'Integration';
}

export const SERVICES: ServiceDef[] = [
  /* Connectivity */
  { key: 'web_access',        icon: '🌐', label: 'Web Portal Access',      description: 'Full dashboard, vehicle list & management console',       category: 'Connectivity' },
  { key: 'api_access',        icon: '⚙️', label: 'API & Webhooks',          description: 'REST API + webhook push to your own systems',              category: 'Integration'  },
  /* Tracking */
  { key: 'live_tracking',     icon: '📍', label: 'Live Tracking',           description: 'Real-time map with 30-second position updates & trails',   category: 'Tracking'     },
  { key: 'on_call_location',  icon: '📡', label: 'On-Call Location',        description: 'Request current location on-demand via SMS or portal',     category: 'Tracking'     },
  { key: 'route_playback',    icon: '▶️', label: 'Route Playback',           description: 'Replay any historical route with speed & stop data',       category: 'Tracking'     },
  /* Alerts */
  { key: 'sms_alert',         icon: '💬', label: 'SMS Alerts',              description: 'Instant SMS to registered numbers for any triggered alert', category: 'Alerts'       },
  { key: 'geofence_alert',    icon: '📐', label: 'Geofence Entry/Exit',     description: 'Set virtual zones; get alerted on entry or exit',          category: 'Alerts'       },
  { key: 'maintenance_alerts',icon: '🔧', label: 'Maintenance Alerts',      description: 'Push & SMS reminders when service is due or overdue',      category: 'Alerts'       },
  /* Control */
  { key: 'engine_cut',        icon: '⚡', label: 'Engine Cut',              description: 'Remotely immobilise the engine from the portal',           category: 'Control'      },
  { key: 'door_lock',         icon: '🔒', label: 'Remote Door Lock',        description: 'Lock / unlock doors remotely via GPS device command',      category: 'Control'      },
  /* Analytics */
  { key: 'driver_behaviour',  icon: '🎯', label: 'Driver Behaviour',        description: 'Harsh braking, acceleration, cornering & idling scores',   category: 'Analytics'    },
  { key: 'fuel_monitoring',   icon: '⛽', label: 'Fuel Monitoring',         description: 'Fuel level trends, refill detection & anomaly alerts',     category: 'Analytics'    },
  { key: 'reports',           icon: '📊', label: 'Reports & Compliance',    description: 'Mileage, fuel, utilisation & compliance PDF/Excel reports', category: 'Analytics'    },
];

/* ── Plan names & definitions ────────────────────────────────────────── */
export type PlanName  = 'Starter' | 'Basic' | 'Professional' | 'Enterprise';
export type SubStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Suspended';

export interface PlanDef {
  name:        PlanName;
  tagline:     string;
  price:       number;   // USD / vehicle / month
  color:       string;
  highlight:   boolean;  // "most popular"
  services:    ServiceKey[];
}

export const PLANS: Record<PlanName, PlanDef> = {
  Starter: {
    name: 'Starter', tagline: 'Basic visibility for small fleets',
    price: 19, color: '#6b7280', highlight: false,
    services: ['web_access', 'on_call_location'],
  },
  Basic: {
    name: 'Basic', tagline: 'Live tracking + SMS alerts',
    price: 39, color: '#2563eb', highlight: false,
    services: ['web_access', 'live_tracking', 'on_call_location', 'sms_alert', 'maintenance_alerts', 'reports'],
  },
  Professional: {
    name: 'Professional', tagline: 'Full operations suite',
    price: 79, color: '#7c3aed', highlight: true,
    services: [
      'web_access', 'live_tracking', 'on_call_location', 'route_playback',
      'sms_alert', 'geofence_alert', 'maintenance_alerts',
      'engine_cut', 'door_lock',
      'driver_behaviour', 'fuel_monitoring', 'reports',
    ],
  },
  Enterprise: {
    name: 'Enterprise', tagline: 'Everything + API integrations',
    price: 129, color: '#c4912a', highlight: false,
    services: [
      'web_access', 'live_tracking', 'on_call_location', 'route_playback',
      'sms_alert', 'geofence_alert', 'maintenance_alerts',
      'engine_cut', 'door_lock',
      'driver_behaviour', 'fuel_monitoring', 'reports',
      'api_access',
    ],
  },
};

export const PLAN_ORDER: PlanName[] = ['Starter', 'Basic', 'Professional', 'Enterprise'];

/* ── Per-vehicle subscription records ───────────────────────────────── */
export interface VehicleSubscription {
  vehicleId:     string;
  plan:          PlanName;
  customPlanId?: string;   // custom tenant plan ID, overrides platform plan display
  startDate:     string;
  expiryDate:    string;
  autoRenew:     boolean;
  contactEmail?: string;
  smsNumbers?:   string[];
}

/* Seed data moved to PostgreSQL (DB migration AddDevicesSimsTripsSubscriptionsRolesAudit).
   Hydrate _overrides from DB via hydrateSubscriptionsFromDb() on app startup.           */
const SEED_SUBSCRIPTIONS: VehicleSubscription[] = [];

/* ── Mutable override map (UI-updated, persisted to localStorage) ───── */
const _LS_SUBS_KEY = 'fleetOS_subscriptions';
const _overrides = new Map<string, VehicleSubscription>();

/** Returns true only if the string is a valid YYYY-MM-DD date (rejects garbled locale strings). */
function isValidIsoDate(d: unknown): boolean {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

// Hydrate overrides from localStorage on module load.
// Skip entries with garbled date strings (can arise when the pg type parser
// was not set and String(DateObject).slice(0,10) produced e.g. "Fri Dec 31").
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(_LS_SUBS_KEY);
    if (raw) {
      const saved: VehicleSubscription[] = JSON.parse(raw);
      for (const s of saved) {
        if (isValidIsoDate(s.expiryDate) && isValidIsoDate(s.startDate)) {
          _overrides.set(s.vehicleId, s);
        }
      }
    }
  } catch { /* ignore */ }
}

export function saveSubscription(sub: VehicleSubscription): void {
  _overrides.set(sub.vehicleId, sub);
  // Persist to localStorage as cache
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(_LS_SUBS_KEY, JSON.stringify(Array.from(_overrides.values())));
    } catch { /* ignore quota errors */ }
    // Also persist to DB (fire-and-forget)
    const tenantId = (sub as VehicleSubscription & { tenantId?: string }).tenantId;
    if (tenantId) {
      fetch(`/api/v1/subscriptions?tenantId=${tenantId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub),
      }).catch(() => { /* ignore network errors */ });
    }
  }
}

/**
 * Hydrate subscriptions from the DB into _overrides.
 * Call once on app startup (e.g. in app layout effect).
 */
export async function hydrateSubscriptionsFromDb(tenantId: string | null): Promise<void> {
  try {
    const url  = tenantId ? `/api/v1/subscriptions?tenantId=${tenantId}` : '/api/v1/subscriptions';
    const res  = await fetch(url);
    if (!res.ok) return;
    const data: VehicleSubscription[] = await res.json();
    if (!Array.isArray(data)) return;
    for (const s of data) _overrides.set(s.vehicleId, s);
    // Write the freshly-fetched data back to localStorage so the next cold
    // start reads correct ISO dates rather than any previously garbled values.
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(_LS_SUBS_KEY, JSON.stringify(Array.from(_overrides.values())));
      } catch { /* ignore quota errors */ }
    }
  } catch { /* network error — keep cached data */ }
}

/**
 * Hydrate custom plans from the DB.
 * Call once on app startup.
 */
export async function hydrateCustomPlansFromDb(tenantId: string | null): Promise<void> {
  try {
    const url  = tenantId ? `/api/v1/custom-plans?tenantId=${tenantId}` : '/api/v1/custom-plans';
    const res  = await fetch(url);
    if (!res.ok) return;
    const data: CustomPlanDef[] = await res.json();
    if (!Array.isArray(data)) return;
    for (const p of data) _customPlans.set(p.id, p);
  } catch { /* network error */ }
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
const TODAY = new Date('2026-05-28');

export function daysUntilSubExpiry(expiryDate: string): number {
  return Math.ceil((new Date(expiryDate).getTime() - TODAY.getTime()) / 86_400_000);
}

export function computeSubStatus(sub: VehicleSubscription): SubStatus {
  const d = daysUntilSubExpiry(sub.expiryDate);
  if (d < 0)   return 'Expired';
  if (d <= 30) return 'Expiring Soon';
  return 'Active';
}

export function getSubscription(vehicleId: string): VehicleSubscription | null {
  return _overrides.get(vehicleId) ?? SEED_SUBSCRIPTIONS.find(s => s.vehicleId === vehicleId) ?? null;
}

export function isServiceEnabled(vehicleId: string, service: ServiceKey): boolean {
  const sub = getSubscription(vehicleId);
  if (!sub) return false;
  const status = computeSubStatus(sub);
  if (status === 'Expired' || status === 'Suspended') return false;
  if (sub.customPlanId) {
    const cp = SEED_CUSTOM_PLANS.find(p => p.id === sub.customPlanId);
    if (cp) return cp.services.includes(service);
  }
  return PLANS[sub.plan].services.includes(service);
}

/* ── Custom / tenant-configurable plans ─────────────────────────────── */

/** Quantitative limits that a tenant admin can tune per-service */
export interface ServiceLimits {
  smsPerMonth?:       number | 'unlimited';  // for sms_alert
  gpsRefreshSec?:     60 | 30 | 15 | 5;      // for live_tracking
  routeHistoryDays?:  30 | 90 | 365 | 730;   // for route_playback
  apiCallsPerMonth?:  number | 'unlimited';   // for api_access
  reportsPerMonth?:   number | 'unlimited';   // for reports
}

export interface CustomPlanDef {
  id:           string;
  tenantId:     string;
  name:         string;
  tagline:      string;
  price:        number;       // price per vehicle per month (in the plan's currency)
  currency:     string;       // ISO 4217 code e.g. 'USD', 'PKR', 'KES'
  color:        string;
  highlight:    boolean;      // shown as "recommended"
  services:     ServiceKey[];
  limits:       ServiceLimits;
  status:       'draft' | 'active' | 'archived';
  isDefault:    boolean;      // assigned to new vehicles automatically
  vehicleCount: number;       // how many vehicles are currently on this plan
  createdAt:    string;
  updatedAt:    string;
}

/** Returns the display symbol for a currency code. */
export function currencySymbol(code: string): string {
  switch (code) {
    case 'PKR': return 'Rs.';
    case 'KES': return 'KSh';
    case 'UGX': return 'USh';
    case 'TZS': return 'TSh';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default:    return '$';
  }
}

/* ── Star Technologies (tenantId '7') — Pakistan market, PKR pricing ─ */
const SEED_CUSTOM_PLANS: CustomPlanDef[] = [
  {
    id:           'cp-star-001',
    tenantId:     '7',
    name:         'StarTrack Basic',
    tagline:      'Essential visibility for small fleets',
    price:        2500,
    currency:     'PKR',
    color:        '#059669',
    highlight:    false,
    services:     ['web_access', 'on_call_location', 'sms_alert', 'maintenance_alerts'],
    limits:       { smsPerMonth: 50, gpsRefreshSec: 60 },
    status:       'active',
    isDefault:    false,
    vehicleCount: 14,
    createdAt:    '2026-06-01',
    updatedAt:    '2026-06-01',
  },
  {
    id:           'cp-star-002',
    tenantId:     '7',
    name:         'StarTrack Pro',
    tagline:      'Live tracking + alerts for growing fleets',
    price:        5500,
    currency:     'PKR',
    color:        '#0d6e5e',
    highlight:    true,
    services:     [
      'web_access', 'live_tracking', 'on_call_location',
      'sms_alert', 'geofence_alert', 'maintenance_alerts',
      'route_playback', 'driver_behaviour', 'reports',
    ],
    limits:       { smsPerMonth: 200, gpsRefreshSec: 30, routeHistoryDays: 90, reportsPerMonth: 20 },
    status:       'active',
    isDefault:    true,
    vehicleCount: 28,
    createdAt:    '2026-06-01',
    updatedAt:    '2026-06-01',
  },
  {
    id:           'cp-star-003',
    tenantId:     '7',
    name:         'StarTrack Enterprise',
    tagline:      'Full fleet operations suite with remote control',
    price:        9500,
    currency:     'PKR',
    color:        '#7c3aed',
    highlight:    false,
    services:     [
      'web_access', 'live_tracking', 'on_call_location', 'route_playback',
      'sms_alert', 'geofence_alert', 'maintenance_alerts',
      'engine_cut', 'door_lock',
      'driver_behaviour', 'fuel_monitoring', 'reports',
    ],
    limits:       { smsPerMonth: 500, gpsRefreshSec: 15, routeHistoryDays: 365, reportsPerMonth: 'unlimited' },
    status:       'active',
    isDefault:    false,
    vehicleCount: 21,
    createdAt:    '2026-06-01',
    updatedAt:    '2026-06-01',
  },
  {
    id:           'cp-star-004',
    tenantId:     '7',
    name:         'StarTrack API Suite',
    tagline:      'Maximum features + REST API for enterprise integrations',
    price:        14000,
    currency:     'PKR',
    color:        '#1d4ed8',
    highlight:    false,
    services:     [
      'web_access', 'live_tracking', 'on_call_location', 'route_playback',
      'sms_alert', 'geofence_alert', 'maintenance_alerts',
      'engine_cut', 'door_lock',
      'driver_behaviour', 'fuel_monitoring', 'reports',
      'api_access',
    ],
    limits:       { smsPerMonth: 'unlimited', gpsRefreshSec: 5, routeHistoryDays: 730, reportsPerMonth: 'unlimited', apiCallsPerMonth: 'unlimited' },
    status:       'active',
    isDefault:    false,
    vehicleCount: 18,
    createdAt:    '2026-06-01',
    updatedAt:    '2026-06-01',
  },
];

const _customPlans = new Map<string, CustomPlanDef>(
  SEED_CUSTOM_PLANS.map(p => [p.id, p])
);

export function getCustomPlans(tenantId: string): CustomPlanDef[] {
  return Array.from(_customPlans.values()).filter(p => p.tenantId === tenantId);
}

export function saveCustomPlan(plan: CustomPlanDef): void {
  _customPlans.set(plan.id, plan);
}

export function deleteCustomPlan(id: string): void {
  _customPlans.delete(id);
}

export function genPlanId(): string {
  return `cp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
}

/** Returns every custom plan across all tenants (super admin only). */
export function getAllCustomPlans(): CustomPlanDef[] {
  return Array.from(_customPlans.values());
}

/* ── Per-tenant platform plan access control ─────────────────────────── */
/**
 * Tracks which platform plans are enabled per tenant.
 * All plans are enabled by default; a super admin can restrict them.
 * Stored in localStorage under 'fleetOS_tenantPlanAccess'.
 */
export type PlanAccessMap = Record<string, Record<PlanName, boolean>>;

const _LS_PLAN_ACCESS_KEY = 'fleetOS_tenantPlanAccess';

function _defaultPlanAccess(): Record<PlanName, boolean> {
  return { Starter: true, Basic: true, Professional: true, Enterprise: true };
}

const _planAccess = new Map<string, Record<PlanName, boolean>>();

// Hydrate from localStorage
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(_LS_PLAN_ACCESS_KEY);
    if (raw) {
      const saved: PlanAccessMap = JSON.parse(raw);
      for (const [tid, access] of Object.entries(saved)) {
        _planAccess.set(tid, access as Record<PlanName, boolean>);
      }
    }
  } catch { /* ignore */ }
}

function _persistPlanAccess() {
  if (typeof window !== 'undefined') {
    try {
      const obj: PlanAccessMap = {};
      _planAccess.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem(_LS_PLAN_ACCESS_KEY, JSON.stringify(obj));
    } catch { /* ignore */ }
  }
}

/** Returns the plan-access config for a tenant (all enabled by default). */
export function getTenantPlanAccess(tenantId: string): Record<PlanName, boolean> {
  return _planAccess.get(tenantId) ?? _defaultPlanAccess();
}

/** Super admin: enable or disable a platform plan for a specific tenant. */
export function setTenantPlanAccess(tenantId: string, planName: PlanName, enabled: boolean): void {
  const current = _planAccess.get(tenantId) ?? _defaultPlanAccess();
  _planAccess.set(tenantId, { ...current, [planName]: enabled });
  _persistPlanAccess();
}

/** Returns true if a platform plan is currently enabled for the given tenant. */
export function isPlanEnabledForTenant(tenantId: string, planName: PlanName): boolean {
  return getTenantPlanAccess(tenantId)[planName] ?? true;
}

/** Returns all active subscriptions across all vehicles. */
export function getAllSubscriptions(): VehicleSubscription[] {
  return Array.from(_overrides.values());
}

/* ── Expiry report ───────────────────────────────────────────────────── */
export interface SubExpirySummary {
  vehicleId:  string;
  plate:      string;
  plan:       PlanName;
  expiryDate: string;
  daysLeft:   number;
  status:     SubStatus;
  autoRenew:  boolean;
}

export function getExpiryReport(vehicles: { id: string; plate: string }[]) {
  const expiring: SubExpirySummary[] = [];
  const expired:  SubExpirySummary[] = [];
  for (const v of vehicles) {
    const sub = getSubscription(v.id);
    if (!sub) continue;
    const status   = computeSubStatus(sub);
    const daysLeft = daysUntilSubExpiry(sub.expiryDate);
    const entry    = { vehicleId: v.id, plate: v.plate, plan: sub.plan, expiryDate: sub.expiryDate, daysLeft, status, autoRenew: sub.autoRenew };
    if      (status === 'Expired')        expired.push(entry);
    else if (status === 'Expiring Soon')  expiring.push(entry);
  }
  expiring.sort((a, b) => a.daysLeft - b.daysLeft);
  expired.sort((a, b) => a.daysLeft - b.daysLeft);
  return { expiring, expired };
}
