export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tables } from '@/lib/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tbs = await db.select().from(tables)
      .where(eq(tables.restaurant_id, user.restaurantId!))
      .orderBy(asc(tables.table_number));
    return NextResponse.json(tbs);
  } catch (err) {
    console.error('GET tables error:', err);
    return NextResponse.json({ error: 'Failed to load tables' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { table_number, label } = await req.json();
    if (!table_number) return NextResponse.json({ error: 'table_number required' }, { status: 400 });
    const [table] = await db.insert(tables).values({
      restaurant_id: user.restaurantId!,
      table_number,
      label,
    }).returning();
    return NextResponse.json(table, { status: 201 });
  } catch (err) {
    console.error('POST tables error:', err);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(tables)
      .where(and(eq(tables.id, id), eq(tables.restaurant_id, user.restaurantId!)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE tables error:', err);
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 });
  }
}
