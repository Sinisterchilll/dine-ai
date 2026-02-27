export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, restaurant_configs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, user.restaurantId!));
  const [config] = await db.select().from(restaurant_configs).where(eq(restaurant_configs.restaurant_id, user.restaurantId!));
  return NextResponse.json({ restaurant, config });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { name, description, logo_emoji, address, cuisine_type, currency, ai_personality, ai_greeting, custom_knowledge, languages } = body;

  await db.update(restaurants).set({
    name, description, logo_emoji, address, cuisine_type, currency,
  }).where(eq(restaurants.id, user.restaurantId!));

  await db.update(restaurant_configs).set({
    ai_personality, ai_greeting, custom_knowledge,
    languages: Array.isArray(languages) ? JSON.stringify(languages) : languages,
    updated_at: new Date().toISOString(),
  }).where(eq(restaurant_configs.restaurant_id, user.restaurantId!));

  return NextResponse.json({ success: true });
}
