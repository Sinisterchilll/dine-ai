export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { menu_items, categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const items = await db
    .select({
      id: menu_items.id,
      name: menu_items.name,
      description: menu_items.description,
      price: menu_items.price,
      veg: menu_items.veg,
      spice_level: menu_items.spice_level,
      calories: menu_items.calories,
      allergens: menu_items.allergens,
      is_popular: menu_items.is_popular,
      is_chef_special: menu_items.is_chef_special,
      is_today_special: menu_items.is_today_special,
      in_stock: menu_items.in_stock,
      category_id: menu_items.category_id,
      category_name: categories.name,
      created_at: menu_items.created_at,
      updated_at: menu_items.updated_at,
    })
    .from(menu_items)
    .leftJoin(categories, eq(menu_items.category_id, categories.id))
    .where(eq(menu_items.restaurant_id, user.restaurantId!));
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const [item] = await db.insert(menu_items).values({
    restaurant_id: user.restaurantId!,
    category_id: body.category_id,
    name: body.name,
    description: body.description,
    price: body.price,
    veg: body.veg,
    spice_level: body.spice_level,
    calories: body.calories,
    allergens: JSON.stringify(body.allergens || []),
    is_popular: body.is_popular || false,
    is_chef_special: body.is_chef_special || false,
    is_today_special: body.is_today_special || false,
    in_stock: body.in_stock !== false,
  }).returning();
  return NextResponse.json(item, { status: 201 });
}
