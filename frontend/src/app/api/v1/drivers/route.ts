import { NextRequest, NextResponse } from 'next/server';
import { getPool, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';

/* ── Server-side owner→drivers map (vehicle_owner scoping) ───────────
   Persists for the life of the server process.                        */
const ownerDriverMap = new Map<string, Set<string>>(); // ownerId → Set<id>

function addOwnerDriver(ownerId: string, id: string) {
  if (!ownerDriverMap.has(ownerId)) ownerDriverMap.set(ownerId, new Set());
  ownerDriverMap.get(ownerId)!.add(id);
}

/* ── Map a DB row to the Driver DTO ──────────────────────────────── */
function rowToDriver(d: Record<string, unknown>) {
  // Drivers table may use either "Name" or "FirstName"+"LastName"
  const name = (d.Name as string) ||
    `${d.FirstName ?? ''} ${d.LastName ?? ''}`.trim() ||
    '';
  return {
    id:                   d.ShortId || d.Id,
    tenantId:             fromTenantUuid((d.TenantId as string)?.toLowerCase()) ?? d.TenantId,
    name,
    firstName:            d.FirstName ?? '',
    lastName:             d.LastName  ?? '',
    email:                d.Email     ?? '',
    licenseNumber:        d.LicenseNo         ?? d.LicenseNumber  ?? '',
    licenseClass:         d.LicenseClass      ?? 'C',
    status:               d.Status            ?? 'off_duty',
    safetyScore:          Number(d.SafetyScore)   || 80,
    hosDriven:            Number(d.HosDriven)     || 0,
    hosRemaining:         Number(d.HosRemaining)  || 11,
    assignedVehiclePlate: d.AssignedVehiclePlate  ?? null,
    assignedVehicleId:    d.AssignedVehicleId     ?? null,
    phoneNumber:          d.Phone ?? d.PhoneNumber ?? '',
    ownerId:              d.OwnerId               ?? null,
  };
}

/* ── Detect actual Drivers column names once per cold-start ──────── */
let _driverCols: Set<string> | null = null;
async function getDriverCols(db: ReturnType<typeof getPool>): Promise<Set<string>> {
  if (_driverCols) return _driverCols;
  const { rows } = await db.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'Drivers'`,
  );
  _driverCols = new Set(rows.map(r => r.column_name));
  return _driverCols;
}

export async function GET(req: NextRequest) {
  const tenantShort = req.nextUrl.searchParams.get('tenantId');
  const ownerId     = req.nextUrl.searchParams.get('ownerId');
  const db = getPool();
  try {
    const cols = await getDriverCols(db);
    // Order by whichever name column exists
    const orderBy = cols.has('Name') ? '"Name"' : cols.has('FirstName') ? '"FirstName"' : '"Id"';

    const { rows } = tenantShort && toTenantUuid(tenantShort)
      ? await db.query(`SELECT * FROM "Drivers" WHERE "TenantId" = $1 ORDER BY ${orderBy}`, [toTenantUuid(tenantShort)])
      : await db.query(`SELECT * FROM "Drivers" ORDER BY ${orderBy}`);

    let drivers = rows.map(rowToDriver);

    if (ownerId) {
      const owned = ownerDriverMap.get(ownerId);
      if (owned && owned.size > 0) {
        drivers = drivers.filter(d => owned.has(d.id as string));
      } else {
        drivers = drivers.filter(d => d.ownerId === ownerId);
      }
    }

    return NextResponse.json(drivers);
  } catch (err) {
    console.error('[GET /api/v1/drivers]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string>;
  const { name, licenseNumber, licenseClass, phoneNumber, tenantId, ownerId } = body;
  if (!name || !tenantId) return NextResponse.json({ message: 'name and tenantId required' }, { status: 400 });

  const tenantUuid = toTenantUuid(tenantId);
  if (!tenantUuid) return NextResponse.json({ message: 'Unknown tenantId' }, { status: 400 });

  const db = getPool();
  try {
    const cols     = await getDriverCols(db);
    const shortId  = `d-${Date.now()}`;
    const [first, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ');

    /* ── Build INSERT dynamically based on actual schema ──────────── */
    const colNames: string[] = ['"Id"', '"TenantId"'];
    const values: unknown[]  = [undefined, tenantUuid]; // Id placeholder filled below

    // Name column(s)
    if (cols.has('Name')) {
      colNames.push('"Name"');
      values.push(name);
    }
    if (cols.has('FirstName')) {
      colNames.push('"FirstName"');
      values.push(first);
    }
    if (cols.has('LastName')) {
      colNames.push('"LastName"');
      values.push(lastName);
    }

    // ShortId
    if (cols.has('ShortId')) {
      colNames.push('"ShortId"');
      values.push(shortId);
    }

    // License
    if (cols.has('LicenseNo')) {
      colNames.push('"LicenseNo"');
      values.push(licenseNumber ?? '');
    } else if (cols.has('LicenseNumber')) {
      colNames.push('"LicenseNumber"');
      values.push(licenseNumber ?? '');
    }

    if (cols.has('LicenseClass')) {
      colNames.push('"LicenseClass"');
      values.push(licenseClass ?? 'C');
    }

    // Phone
    if (cols.has('Phone')) {
      colNames.push('"Phone"');
      values.push(phoneNumber ?? '');
    } else if (cols.has('PhoneNumber')) {
      colNames.push('"PhoneNumber"');
      values.push(phoneNumber ?? '');
    }

    // Status
    if (cols.has('Status')) {
      colNames.push('"Status"');
      values.push('off_duty');
    }

    // Numeric defaults
    if (cols.has('SafetyScore'))  { colNames.push('"SafetyScore"');  values.push(80); }
    if (cols.has('HosDriven'))    { colNames.push('"HosDriven"');    values.push(0);  }
    if (cols.has('HosRemaining')) { colNames.push('"HosRemaining"'); values.push(11); }

    // OwnerId
    if (cols.has('OwnerId')) {
      colNames.push('"OwnerId"');
      values.push(ownerId ?? null);
    }

    // CreatedAt
    if (cols.has('CreatedAt')) {
      colNames.push('"CreatedAt"');
      values.push(new Date());
    }

    // Replace Id placeholder with gen_random_uuid() expression
    const placeholders = colNames.map((_, i) => {
      if (colNames[i] === '"Id"') return 'gen_random_uuid()';
      return `$${i}`; // will be adjusted below
    });

    // Re-index: skip the "gen_random_uuid()" slot, count only real params
    const paramValues: unknown[] = [];
    const finalPlaceholders: string[] = colNames.map((col) => {
      if (col === '"Id"') return 'gen_random_uuid()';
      paramValues.push(values[colNames.indexOf(col)]);
      return `$${paramValues.length}`;
    });

    const sql = `INSERT INTO "Drivers" (${colNames.join(',')}) VALUES (${finalPlaceholders.join(',')}) RETURNING *`;
    const { rows } = await db.query(sql, paramValues);

    const driver = rowToDriver(rows[0]);
    const returnedId = (driver.id as string) || shortId;
    if (ownerId) addOwnerDriver(ownerId, returnedId);
    // Invalidate column cache so future queries stay accurate
    _driverCols = null;

    return NextResponse.json({ ...driver, ownerId: ownerId ?? null }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/drivers]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
