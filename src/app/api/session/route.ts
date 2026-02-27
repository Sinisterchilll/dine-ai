export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, restaurants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const { restaurant_id, table_id, device_id, customer_name } = await req.json();
  if (!restaurant_id) {
    return NextResponse.json({ error: 'restaurant_id required' }, { status: 400 });
  }
  const [session] = await db.insert(sessions).values({
    id: generateId(),
    restaurant_id,
    table_id: table_id || null,
    device_id,
    customer_name: customer_name || null,
  }).returning();
  return NextResponse.json(session, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { session_id, customer_name, customer_phone } = await req.json();
  const [session] = await db.update(sessions).set({ customer_name, customer_phone })
    .where(eq(sessions.id, session_id)).returning();
  return NextResponse.json(session);
}
