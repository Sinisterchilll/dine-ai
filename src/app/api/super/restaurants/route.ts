export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, restaurant_configs, admins, tables, menu_items, sessions, token_usage } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuthUser, hashPassword } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'super') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rests = await db.select().from(restaurants).orderBy(restaurants.created_at);

  const result = await Promise.all(rests.map(async r => {
    const [chatCount] = await db.select({ count: sql<number>`count(*)` }).from(sessions).where(eq(sessions.restaurant_id, r.id));
    const [costStats] = await db.select({ cost: sql<number>`sum(${token_usage.cost_usd})` }).from(token_usage).where(eq(token_usage.restaurant_id, r.id));
    const [menuCount] = await db.select({ count: sql<number>`count(*)` }).from(menu_items).where(eq(menu_items.restaurant_id, r.id));
    return { ...r, chatCount: chatCount.count, totalCost: costStats.cost || 0, menuCount: menuCount.count };
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'super') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { name, description, logo_emoji, address, cuisine_type, currency, admin_email, admin_name, admin_password } = body;

  const slug = generateSlug(name);

  const [restaurant] = await db.insert(restaurants).values({
    name, slug, description, logo_emoji: logo_emoji || '🍽️', address, cuisine_type, currency: currency || 'INR',
  }).returning();

  await db.insert(restaurant_configs).values({
    restaurant_id: restaurant.id,
    ai_personality: 'friendly',
    ai_greeting: `Welcome to ${name}! I'm your AI dining assistant. How can I help you today?`,
    languages: '["English"]',
  });

  const hash = await hashPassword(admin_password || 'password123');
  await db.insert(admins).values({
    email: admin_email.toLowerCase(),
    password_hash: hash,
    name: admin_name,
    role: 'restaurant',
    restaurant_id: restaurant.id,
  });

  return NextResponse.json(restaurant, { status: 201 });
}
