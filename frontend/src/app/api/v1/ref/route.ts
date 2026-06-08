import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/pgDb';

/**
 * GET /api/v1/ref              → all reference data grouped by category
 * GET /api/v1/ref?cat=country  → only the requested category
 * GET /api/v1/ref?admin=1      → flat list with Id included (for admin UI)
 */
export async function GET(req: NextRequest) {
  const cat   = req.nextUrl.searchParams.get('cat')   ?? null;
  const admin = req.nextUrl.searchParams.get('admin') === '1';
  const db    = getPool();
  try {
    const { rows } = cat
      ? await db.query(
          `SELECT "Id","Category","Value","Label","Parent","Region","SortOrder"
             FROM "LookupItems"
            WHERE "Category" = $1
            ORDER BY "SortOrder", "Label"`,
          [cat],
        )
      : await db.query(
          `SELECT "Id","Category","Value","Label","Parent","Region","SortOrder"
             FROM "LookupItems"
            ORDER BY "Category", "SortOrder", "Label"`,
        );

    if (admin) {
      return NextResponse.json(rows.map(r => ({
        id:        r.Id,
        category:  r.Category,
        value:     r.Value,
        label:     r.Label,
        parent:    r.Parent    ?? null,
        region:    r.Region    ?? null,
        sortOrder: r.SortOrder ?? 0,
      })));
    }

    if (cat) {
      return NextResponse.json(rows.map(r => ({
        value:  r.Value,
        label:  r.Label,
        parent: r.Parent ?? null,
        region: r.Region ?? null,
      })));
    }

    // Group by category
    const grouped: Record<string, { value: string; label: string; parent: string | null; region: string | null }[]> = {};
    for (const r of rows) {
      if (!grouped[r.Category]) grouped[r.Category] = [];
      grouped[r.Category].push({
        value:  r.Value,
        label:  r.Label,
        parent: r.Parent ?? null,
        region: r.Region ?? null,
      });
    }
    return NextResponse.json(grouped);
  } catch (err) {
    console.error('[GET /api/v1/ref]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/ref
 * Creates a new lookup entry.
 */
export async function POST(req: NextRequest) {
  const db = getPool();
  try {
    const body = await req.json() as {
      category: string; value: string; label?: string;
      parent?: string; region?: string; sortOrder?: number;
    };
    if (!body.category?.trim() || !body.value?.trim()) {
      return NextResponse.json({ message: 'category and value are required' }, { status: 400 });
    }
    const { rows } = await db.query(
      `INSERT INTO "LookupItems" ("Category","Value","Label","Parent","Region","SortOrder")
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING "Id","Category","Value","Label","Parent","Region","SortOrder"`,
      [
        body.category.trim(),
        body.value.trim(),
        (body.label ?? body.value).trim(),
        body.parent  ?? null,
        body.region  ?? null,
        body.sortOrder ?? 0,
      ],
    );
    const r = rows[0];
    return NextResponse.json({
      id: r.Id, category: r.Category, value: r.Value,
      label: r.Label, parent: r.Parent ?? null, region: r.Region ?? null, sortOrder: r.SortOrder,
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/ref]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/ref?id=123
 * Updates a lookup entry by its numeric Id.
 */
export async function PATCH(req: NextRequest) {
  const db = getPool();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 });
  try {
    const body = await req.json() as {
      value?: string; label?: string; parent?: string | null;
      region?: string | null; sortOrder?: number;
    };
    await db.query(
      `UPDATE "LookupItems"
          SET "Value"     = COALESCE($1,"Value"),
              "Label"     = COALESCE($2,"Label"),
              "Parent"    = $3,
              "Region"    = $4,
              "SortOrder" = COALESCE($5,"SortOrder")
        WHERE "Id" = $6`,
      [body.value ?? null, body.label ?? null, body.parent ?? null, body.region ?? null, body.sortOrder ?? null, Number(id)],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/v1/ref]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/ref?id=123
 * Deletes a lookup entry by its numeric Id.
 */
export async function DELETE(req: NextRequest) {
  const db = getPool();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 });
  try {
    await db.query(`DELETE FROM "LookupItems" WHERE "Id" = $1`, [Number(id)]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/v1/ref]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
