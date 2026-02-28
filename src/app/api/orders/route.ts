export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, sessions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { session_id, restaurant_id, table_id, items, subtotal, tax, total } = await req.json();
    if (!restaurant_id || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof total !== 'number' || total < 0) {
      return NextResponse.json({ error: 'Invalid total' }, { status: 400 });
    }
    const [order] = await db.insert(orders).values({
      session_id: session_id || null,
      restaurant_id,
      table_id: table_id || null,
      items: JSON.stringify(items),
      subtotal: subtotal || 0,
      tax: tax || 0,
      total,
      status: 'pending',
    }).returning();
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error('POST orders error:', err);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id');
    if (!sessionId) return NextResponse.json([], { status: 200 });
    const result = await db.select().from(orders)
      .where(eq(orders.session_id, sessionId))
      .orderBy(desc(orders.created_at));
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET orders error:', err);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}
