import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';

function rowToCustomer(c: Record<string, unknown>) {
  return {
    id:                c.ShortId || c.Id,
    tenantId:          fromTenantUuid((c.TenantId as string)?.toLowerCase()) ?? c.TenantId,
    parentId:          c.ParentId ?? null,
    name:              c.Name,
    type:              c.Type              ?? 'Company',
    status:            c.Status            ?? 'Active',
    industry:          c.Industry          ?? '',
    country:           c.Country           ?? '',
    city:              c.City              ?? '',
    address:           c.Address           ?? '',
    phone:             c.Phone             ?? '',
    email:             c.Email             ?? '',
    website:           c.Website           ?? '',
    taxId:             c.TaxId             ?? '',
    creditLimit:       Number(c.CreditLimit) || 0,
    complianceStatus:  c.ComplianceStatus  ?? 'Compliant',
    complianceNotes:   c.ComplianceNotes   ?? '',
    vehiclesAssigned:  Number(c.VehiclesAssigned) || 0,
    activeContracts:   Number(c.ActiveContracts)  || 0,
    contacts:          [],
    notes:             c.Notes             ?? '',
    createdAt:         c.CreatedAt ? new Date(c.CreatedAt as string).toISOString().slice(0, 10) : '',
    accountManager:    c.AccountManager    ?? '',
  };
}

export async function GET(req: NextRequest) {
  const tenantShort = req.nextUrl.searchParams.get('tenantId');
  const db = getPool();
  try {
    const { rows } = tenantShort && toTenantUuid(tenantShort)
      ? await db.query(`SELECT * FROM "Customers" WHERE "TenantId" = $1 ORDER BY "Name"`, [toTenantUuid(tenantShort)])
      : await db.query(`SELECT * FROM "Customers" ORDER BY "Name"`);
    return NextResponse.json(rows.map(rowToCustomer));
  } catch (err) {
    console.error('[GET /api/v1/customers]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string>;
  const { name, tenantId, type, industry, country, city, address, phone, email,
          website, taxId, creditLimit, notes, accountManager, parentShortId } = body;

  if (!name || !tenantId) return NextResponse.json({ message: 'name and tenantId required' }, { status: 400 });
  const tenantUuid = toTenantUuid(tenantId);
  if (!tenantUuid) return NextResponse.json({ message: 'Unknown tenantId' }, { status: 400 });

  const db = getPool();
  try {
    // Resolve parentShortId → parentUuid if provided
    let parentUuid: string | null = null;
    if (parentShortId) {
      const { rows: pr } = await db.query(`SELECT "Id" FROM "Customers" WHERE "ShortId"=$1`, [parentShortId]);
      if (pr.length > 0) parentUuid = pr[0].Id as string;
    }

    const shortId = `c-${Date.now()}`;
    await db.query(
      `INSERT INTO "Customers"
         ("Id","ShortId","TenantId","ParentId","Name","Type","Status",
          "Industry","Country","City","Address","Phone","Email","Website",
          "TaxId","CreditLimit","ComplianceStatus","ComplianceNotes",
          "VehiclesAssigned","ActiveContracts","Notes","AccountManager","CreatedAt")
       VALUES
         (gen_random_uuid(),$1,$2,$3,$4,$5,'Prospect',
          $6,$7,$8,$9,$10,$11,$12,
          $13,$14,'Pending Review','Newly onboarded — compliance documents requested.',
          0,0,$15,$16,NOW())`,
      [
        shortId, tenantUuid, parentUuid, name, type ?? 'Company',
        industry ?? 'Logistics', country ?? 'Kenya', city ?? '', address ?? '',
        phone ?? '', email ?? '', website ?? '',
        taxId ?? '', parseInt(creditLimit ?? '0') || 0,
        notes ?? '', accountManager ?? '',
      ],
    );
    const { rows } = await db.query(`SELECT * FROM "Customers" WHERE "ShortId"=$1`, [shortId]);
    return NextResponse.json(rowToCustomer(rows[0]), { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/customers]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
