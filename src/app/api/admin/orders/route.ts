export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, sessions, tables } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await db
    .select({
      id: orders.id,
      items: orders.items,
      subtotal: orders.subtotal,
      tax: orders.tax,
      total: orders.total,
      status: orders.status,
      created_at: orders.created_at,
      table_label: tables.label,
      table_number: tables.table_number,
      customer_name: sessions.customer_name,
    })
    .from(orders)
    .leftJoin(sessions, eq(orders.session_id, sessions.id))
    .leftJoin(tables, eq(orders.table_id, tables.id))
    .where(eq(orders.restaurant_id, user.restaurantId!))
    .orderBy(desc(orders.created_at))
    .limit(100);
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, status } = await req.json();
  const [order] = await db.update(orders)
    .set({ status })
    .where(and(eq(orders.id, id), eq(orders.restaurant_id, user.restaurantId!)))
    .returning();
  return NextResponse.json(order);
}
