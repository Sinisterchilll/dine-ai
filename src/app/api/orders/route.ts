export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, sessions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { session_id, restaurant_id, table_id, items, subtotal, tax, total } = await req.json();
  if (!restaurant_id || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const [order] = await db.insert(orders).values({
    session_id: session_id || null,
    restaurant_id,
    table_id: table_id || null,
    items: JSON.stringify(items),
    subtotal,
    tax,
    total,
    status: 'pending',
  }).returning();
  return NextResponse.json(order, { status: 201 });
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) return NextResponse.json([], { status: 200 });
  const result = await db.select().from(orders)
    .where(eq(orders.session_id, sessionId))
    .orderBy(desc(orders.created_at));
  return NextResponse.json(result);
}
