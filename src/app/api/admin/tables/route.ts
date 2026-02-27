export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tables } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tbs = await db.select().from(tables)
    .where(eq(tables.restaurant_id, user.restaurantId!))
    .orderBy(asc(tables.table_number));
  return NextResponse.json(tbs);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { table_number, label } = await req.json();
  const [table] = await db.insert(tables).values({
    restaurant_id: user.restaurantId!,
    table_number,
    label,
  }).returning();
  return NextResponse.json(table, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await req.json();
  await db.delete(tables).where(eq(tables.id, id));
  return NextResponse.json({ success: true });
}
