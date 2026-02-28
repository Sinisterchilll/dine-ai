export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, restaurants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { restaurant_id, table_id, device_id, customer_name } = await req.json();
    if (!restaurant_id) {
      return NextResponse.json({ error: 'restaurant_id required' }, { status: 400 });
    }

    // Verify restaurant exists and is active
    const [restaurant] = await db.select({ id: restaurants.id, status: restaurants.status })
      .from(restaurants).where(eq(restaurants.id, restaurant_id));
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    if (restaurant.status !== 'active') {
      return NextResponse.json({ error: 'Restaurant is not accepting orders' }, { status: 403 });
    }

    const [session] = await db.insert(sessions).values({
      id: generateId(),
      restaurant_id,
      table_id: table_id || null,
      device_id,
      customer_name: customer_name || null,
    }).returning();
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error('POST session error:', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session_id, customer_name, customer_phone } = await req.json();
    if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    const [session] = await db.update(sessions).set({ customer_name, customer_phone })
      .where(eq(sessions.id, session_id)).returning();
    return NextResponse.json(session);
  } catch (err) {
    console.error('PATCH session error:', err);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
