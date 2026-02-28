export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, restaurant_configs, admins, tables, menu_items, sessions, token_usage } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuthUser, hashPassword } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'super') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Single query with LEFT JOINs instead of N+1 per-restaurant queries
    const result = await db.select({
      id: restaurants.id,
      name: restaurants.name,
      slug: restaurants.slug,
      logo_emoji: restaurants.logo_emoji,
      cuisine_type: restaurants.cuisine_type,
      status: restaurants.status,
      chatCount: sql<number>`count(distinct ${sessions.id})::int`,
      totalCost: sql<number>`coalesce(sum(${token_usage.cost_usd}), 0)`,
      menuCount: sql<number>`count(distinct ${menu_items.id})::int`,
    })
      .from(restaurants)
      .leftJoin(sessions, eq(sessions.restaurant_id, restaurants.id))
      .leftJoin(token_usage, eq(token_usage.restaurant_id, restaurants.id))
      .leftJoin(menu_items, eq(menu_items.restaurant_id, restaurants.id))
      .groupBy(restaurants.id)
      .orderBy(restaurants.name);

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET super/restaurants error:', err);
    return NextResponse.json({ error: 'Failed to load restaurants' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'super') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { name, description, logo_emoji, address, cuisine_type, currency, admin_email, admin_name, admin_password } = body;

    if (!name?.trim() || !admin_email?.trim() || !admin_name?.trim()) {
      return NextResponse.json({ error: 'name, admin_email, and admin_name are required' }, { status: 400 });
    }

    const slug = generateSlug(name);

    const [restaurant] = await db.insert(restaurants).values({
      name: name.trim(), slug, description, logo_emoji: logo_emoji || '🍽️',
      address, cuisine_type, currency: currency || 'INR',
    }).returning();

    await db.insert(restaurant_configs).values({
      restaurant_id: restaurant.id,
      ai_personality: 'friendly',
      ai_greeting: `Welcome to ${name}! I'm your AI dining assistant. How can I help you today?`,
      languages: '["English"]',
    });

    const hash = await hashPassword(admin_password || 'password123');
    await db.insert(admins).values({
      email: admin_email.toLowerCase().trim(),
      password_hash: hash,
      name: admin_name.trim(),
      role: 'restaurant',
      restaurant_id: restaurant.id,
    });

    return NextResponse.json(restaurant, { status: 201 });
  } catch (err) {
    console.error('POST super/restaurants error:', err);
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 });
  }
}
