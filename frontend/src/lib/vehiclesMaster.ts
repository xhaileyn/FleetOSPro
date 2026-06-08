/* ── Types ─────────────────────────────────────────────────────────── */

export type VehicleStatus   = 'active' | 'idle' | 'offline' | 'maintenance' | 'disposed';
export type FuelType        = 'Diesel' | 'Petrol' | 'Electric' | 'Hybrid' | 'CNG';
export type Transmission    = 'Manual' | 'Automatic';
export type VehicleCategory = 'Truck' | 'Van' | 'Pickup' | 'Car' | 'Bus' | 'Motorcycle' | 'Trailer';
export type OwnerType       = 'Company' | 'Individual' | 'Government' | 'Leased' | 'Finance';

export type DocType    = 'Insurance' | 'Token Tax' | 'Fitness' | 'Registration' | 'Permit' | 'Other';
export type DocStatus  = 'Valid' | 'Expiring Soon' | 'Expired';
export type HistType   = 'Onboarding' | 'Transfer' | 'Assignment' | 'Unassignment' | 'Status Change' | 'Disposal' | 'Maintenance' | 'Document Update' | 'Device Link' | 'Device Unlink' | 'SIM Link' | 'SIM Unlink';
export type MaintType  = 'Oil Change' | 'Full Service' | 'Tyre Rotation' | 'Brake Inspection' | 'Engine Overhaul' | 'Body Repair' | 'Other';
export type MaintStatus= 'Completed' | 'Upcoming' | 'Overdue';

export interface VehicleDocument {
  id: string;
  type: DocType;
  name: string;
  referenceNo: string;
  issuer: string;
  issuedDate: string;
  expiryDate: string;
  status: DocStatus;
  notes: string;
}

export interface VehicleHistoryEvent {
  id: string;
  date: string;
  type: HistType;
  title: string;
  description: string;
  by: string;
  meta?: string;        // e.g. previous value → new value
}

export interface MaintenanceRecord {
  id: string;
  type: MaintType;
  status: MaintStatus;
  scheduledDate: string;
  completedDate?: string;
  odometerDue: number;
  odometerDone?: number;
  garage: string;
  cost?: number;
  notes: string;
  reminderSent: boolean;
}

export interface VehicleMaster {
  /* Identity */
  id: string;
  vid?: number;               // numeric vehicle ID (auto-increment PK from DB)
  tenantId: string;
  plate: string;
  vin: string;
  /* Classification */
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  bodyType: string;
  color: string;
  /* Engine & technical */
  engineNo: string;
  engineCapacity: string;
  fuelType: FuelType;
  transmission: Transmission;
  axles: number;
  grossWeightKg: number;
  payloadKg: number;
  seatingCapacity: number;
  /* Registration */
  registrationCountry: string;
  registrationDate: string;
  purchaseDate: string;
  purchasePrice: number;
  supplier: string;
  /* Ownership */
  ownerType?: OwnerType;
  ownerName?: string;
  ownerIdNo?: string;    // Company Reg No / National ID / Lease Ref
  ownerContact?: string;
  /* Operational */
  status: VehicleStatus;
  odometer: number;
  fuelLevel: number;
  /* Assignment */
  customerId: string | null;
  customerName: string | null;
  cid?: number | null;        // numeric customer ID reference (FK to Customer.cid)
  department: string | null;
  driverName: string | null;
  driverId: string | null;
  /* GPS */
  latitude: number | null;
  longitude: number | null;
  speedKmh: number | null;
  lastSeenAt: string | null;
  /* Sub-collections */
  documents: VehicleDocument[];
  history: VehicleHistoryEvent[];
  maintenance: MaintenanceRecord[];
}

/* ── GPS Device ─────────────────────────────────────────────────────── */
export interface GpsDevice {
  deviceId:      string;
  model:         string;
  imei:          string;
  serialNo:      string;
  firmware:      string;
  batteryPct:    number;   // 0-100
  signalBars:    number;   // 0-5
  iccid:         string;
  msisdn:        string;
  operator:      string;
  dataNetwork:   '2G' | '3G' | '4G' | '5G';
  installedDate: string;
}

/* ── Helpers ───────────────────────────────────────────────────────── */

/** Returns days until expiry (negative = already expired) */
export function daysUntilExpiry(expiryDate: string): number {
  return Math.floor((new Date(expiryDate).getTime() - Date.now()) / 86400000);
}

export function docStatus(expiryDate: string): DocStatus {
  const d = daysUntilExpiry(expiryDate);
  if (d < 0)   return 'Expired';
  if (d <= 30) return 'Expiring Soon';
  return 'Valid';
}

export function getVehicleById(id: string): VehicleMaster | undefined {
  return VEHICLES_MASTER.find(v => v.id === id);
}

export function getVehiclesByTenant(tenantId: string): VehicleMaster[] {
  return VEHICLES_MASTER.filter(v => v.tenantId === tenantId);
}

export function getExpiringDocuments(vehicles: VehicleMaster[], withinDays = 60) {
  const results: { vehicle: VehicleMaster; doc: VehicleDocument }[] = [];
  for (const v of vehicles) {
    for (const doc of v.documents) {
      const days = daysUntilExpiry(doc.expiryDate);
      if (days <= withinDays) results.push({ vehicle: v, doc });
    }
  }
  return results.sort((a,b) => daysUntilExpiry(a.doc.expiryDate) - daysUntilExpiry(b.doc.expiryDate));
}

export function getOverdueMaintenance(vehicles: VehicleMaster[]) {
  const results: { vehicle: VehicleMaster; record: MaintenanceRecord }[] = [];
  for (const v of vehicles) {
    for (const r of v.maintenance) {
      if (r.status === 'Overdue') results.push({ vehicle: v, record: r });
    }
  }
  return results;
}

/* ── GPS device factory ─────────────────────────────────────────────── */
/* Model/operator arrays removed — data now lives in the LookupItems DB table. */
/* Stub values used only when DB data is unavailable during SSR. */
const _GPS_MODELS_STUB = ['Teltonika FMB920','Queclink GV350MG','Coban GPS303-G'];
const _OPERATORS_STUB  = ['AT&T','Verizon','T-Mobile US'];
const _NETS_STUB: GpsDevice['dataNetwork'][] = ['4G','4G','3G'];

export function getDeviceForVehicle(v: VehicleMaster): GpsDevice {
  const n   = Math.max(1, parseInt(v.id.replace(/\D/g, ''), 10) || 1);
  const pad = (x: number, l: number) => String(Math.abs(Math.floor(x))).padStart(l, '0').slice(0, l);
  return {
    deviceId:     `GT-T${v.tenantId}-${pad(n, 3)}`,
    model:         _GPS_MODELS_STUB[n % _GPS_MODELS_STUB.length],
    imei:         `35${pad(n * 7654321, 13)}`,
    serialNo:     `SN-${pad(n * 98765, 8)}`,
    firmware:     `v${2 + (n % 2)}.${n % 10}.${pad(n % 20, 2)}`,
    batteryPct:    55 + (n * 13 % 40),
    signalBars:    3 + (n % 3),
    iccid:        `89254${pad(n * 123456789, 16)}`.slice(0, 19),
    msisdn:       `+2547${pad(n * 1234567, 8)}`,
    operator:      _OPERATORS_STUB[n % _OPERATORS_STUB.length],
    dataNetwork:   _NETS_STUB[n % _NETS_STUB.length],
    installedDate: v.purchaseDate,
  };
}

/* ── Tenant metadata lookup ─────────────────────────────────────────── */
/*
 * Mutable record — seeded with fallback values so pages that import this
 * constant directly render correctly before the refDataStore has hydrated.
 * refDataStore.loadRefData() calls syncTenantsMetaFromDb() once after
 * fetching /api/v1/tenants/meta, replacing the values in-place.
 */
function _loadTenantsMetaCache(): Record<string, { name: string; country: string; plan: string; color: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('fleetOS_tenantsMeta');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export const TENANTS_META: Record<string, { name: string; country: string; plan: string; color: string }> =
  _loadTenantsMetaCache();

/**
 * Called by refDataStore after fetching /api/v1/tenants/meta.
 * Updates the shared TENANTS_META record in-place so all existing
 * page imports automatically see the DB-sourced data.
 */
export function syncTenantsMetaFromDb(
  dbMeta: Record<string, { name: string; country: string; plan: string; color: string }>,
) {
  for (const [id, m] of Object.entries(dbMeta)) {
    TENANTS_META[id] = m;
  }
  // Remove any stale entries no longer in the DB
  for (const id of Object.keys(TENANTS_META)) {
    if (!dbMeta[id]) delete TENANTS_META[id];
  }
}

/* ── Seed data — all tenants ────────────────────────────────────────── */

/* ── Seed data — loaded from PostgreSQL via /api/v1/vehicles ──────── */
/** Mutable array populated by vehiclesStore on app load. Kept for backward compat. */
export const VEHICLES_MASTER: VehicleMaster[] = [];


/* ── Runtime vehicle registration (persisted to localStorage) ───────── */
const _LS_KEY = 'fleetOS_registered_vehicles';

/** Load any previously registered vehicles from localStorage into VEHICLES_MASTER */
function _loadPersistedVehicles() {
  if (typeof window === 'undefined') return; // SSR guard
  try {
    const raw = localStorage.getItem(_LS_KEY);
    if (!raw) return;
    const saved: VehicleMaster[] = JSON.parse(raw);
    for (const v of saved) {
      if (!VEHICLES_MASTER.find(existing => existing.id === v.id)) {
        VEHICLES_MASTER.push(v);
      }
    }
  } catch { /* ignore corrupt data */ }
}

/** Persist a new vehicle to localStorage */
function _persistVehicle(vehicle: VehicleMaster) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(_LS_KEY);
    const saved: VehicleMaster[] = raw ? JSON.parse(raw) : [];
    saved.push(vehicle);
    localStorage.setItem(_LS_KEY, JSON.stringify(saved));
  } catch { /* ignore quota errors */ }
}

// Hydrate once when the module is first imported on the client
_loadPersistedVehicles();

export interface NewVehicleInput {
  tenantId: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  color: string;
  engineNo?: string;
  vin?: string;
  customerId?: string | null;
  customerName?: string | null;
  department?: string | null;
  ownerType?: OwnerType;
  ownerName?: string;
  ownerIdNo?: string;
  ownerContact?: string;
}

export function addVehicle(input: NewVehicleInput): VehicleMaster {
  const today = new Date().toISOString().slice(0, 10);
  const id = `v-new-${Date.now()}`;
  const vehicle: VehicleMaster = {
    id,
    tenantId:             input.tenantId,
    plate:                input.plate,
    vin:                  input.vin ?? '',
    make:                 input.make,
    model:                input.model,
    year:                 input.year,
    category:             input.category,
    bodyType:             input.category,
    color:                input.color,
    engineNo:             input.engineNo ?? '',
    engineCapacity:       '',
    fuelType:             'Diesel',
    transmission:         'Manual',
    axles:                2,
    grossWeightKg:        0,
    payloadKg:            0,
    seatingCapacity:      1,
    registrationCountry:  'United States',
    registrationDate:     today,
    purchaseDate:         today,
    purchasePrice:        0,
    supplier:             '',
    ownerType:            input.ownerType,
    ownerName:            input.ownerName,
    ownerIdNo:            input.ownerIdNo,
    ownerContact:         input.ownerContact,
    status:               'active',
    odometer:             0,
    fuelLevel:            0,
    customerId:           input.customerId ?? null,
    customerName:         input.customerName ?? null,
    department:           input.department ?? null,
    driverName:           null,
    driverId:             null,
    latitude:             null,
    longitude:            null,
    speedKmh:             null,
    lastSeenAt:           null,
    documents:            [],
    history:              [{ id:`h-${id}-1`, date:today, type:'Onboarding', title:'Vehicle registered', description:`${input.plate} onboarded via registration wizard.`, by:'Fleet Manager' }],
    maintenance:          [],
  };
  VEHICLES_MASTER.push(vehicle);
  _persistVehicle(vehicle);
  return vehicle;
}
