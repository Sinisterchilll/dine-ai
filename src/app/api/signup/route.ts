export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, restaurant_configs, admins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, signJwt } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, logo_emoji, address, cuisine_type, admin_name, admin_email, admin_password } = body;

    if (!name || !admin_email || !admin_password || !admin_name) {
      return NextResponse.json({ error: 'Name, email, password and admin name are required' }, { status: 400 });
    }

    if (admin_password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check email not already taken
    const [existing] = await db.select().from(admins).where(eq(admins.email, admin_email.toLowerCase()));
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Generate unique slug
    let slug = generateSlug(name);
    const [slugConflict] = await db.select().from(restaurants).where(eq(restaurants.slug, slug));
    if (slugConflict) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create restaurant
    const [restaurant] = await db.insert(restaurants).values({
      name,
      slug,
      description: description || null,
      logo_emoji: logo_emoji || '🍽️',
      address: address || null,
      cuisine_type: cuisine_type || null,
      status: 'active',
    }).returning();

    // Create default config
    await db.insert(restaurant_configs).values({
      restaurant_id: restaurant.id,
      ai_personality: 'friendly',
      ai_greeting: `Welcome to ${name}! ${logo_emoji || '🍽️'} I'm your AI dining companion. How can I help you today?`,
      custom_knowledge: null,
      languages: '["English"]',
    });

    // Create admin account
    const passwordHash = await hashPassword(admin_password);
    const [admin] = await db.insert(admins).values({
      email: admin_email.toLowerCase(),
      password_hash: passwordHash,
      name: admin_name,
      role: 'restaurant',
      restaurant_id: restaurant.id,
    }).returning();

    // Issue JWT
    const token = await signJwt({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'restaurant',
      restaurantId: restaurant.id,
    });

    const response = NextResponse.json({ ok: true, restaurant: { id: restaurant.id, slug } });
    response.cookies.set('dineai_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
