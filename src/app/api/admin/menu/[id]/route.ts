export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { menu_items } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const [item] = await db.select().from(menu_items).where(
      and(eq(menu_items.id, parseInt(id)), eq(menu_items.restaurant_id, user.restaurantId!))
    );
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error('GET menu item error:', err);
    return NextResponse.json({ error: 'Failed to load item' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const [item] = await db.update(menu_items).set({
      category_id: body.category_id,
      name: body.name,
      description: body.description,
      price: body.price,
      veg: body.veg,
      spice_level: body.spice_level,
      calories: body.calories,
      allergens: JSON.stringify(body.allergens || []),
      is_popular: body.is_popular,
      is_chef_special: body.is_chef_special,
      is_today_special: body.is_today_special,
      in_stock: body.in_stock,
      updated_at: new Date().toISOString(),
    }).where(
      and(eq(menu_items.id, parseInt(id)), eq(menu_items.restaurant_id, user.restaurantId!))
    ).returning();
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error('PUT menu item error:', err);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// PATCH is used for quick toggles from the menu list (in_stock, is_today_special, etc.)
const PATCHABLE_FIELDS = new Set(['in_stock', 'is_popular', 'is_chef_special', 'is_today_special']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of Object.keys(body)) {
      if (PATCHABLE_FIELDS.has(key)) update[key] = body[key];
    }
    const [item] = await db.update(menu_items).set(update).where(
      and(eq(menu_items.id, parseInt(id)), eq(menu_items.restaurant_id, user.restaurantId!))
    ).returning();
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error('PATCH menu item error:', err);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await db.delete(menu_items).where(
      and(eq(menu_items.id, parseInt(id)), eq(menu_items.restaurant_id, user.restaurantId!))
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE menu item error:', err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
