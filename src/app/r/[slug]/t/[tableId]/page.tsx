export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { restaurants, restaurant_configs, menu_items, categories, tables } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';

export default async function TablePage({ params }: { params: Promise<{ slug: string; tableId: string }> }) {
  const { slug, tableId } = await params;

  const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.slug, slug));
  if (!restaurant || restaurant.status !== 'active') notFound();

  const [table] = await db.select().from(tables).where(
    and(eq(tables.table_number, parseInt(tableId)), eq(tables.restaurant_id, restaurant.id))
  );
  if (!table) notFound();

  const [config] = await db.select().from(restaurant_configs).where(eq(restaurant_configs.restaurant_id, restaurant.id));

  const menuWithCategories = await db
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
    })
    .from(menu_items)
    .leftJoin(categories, eq(menu_items.category_id, categories.id))
    .where(eq(menu_items.restaurant_id, restaurant.id));

  return (
    <ChatInterface
      restaurant={restaurant}
      config={config || null}
      menuItems={menuWithCategories}
      tableId={table.id}
      tableLabel={table.label || `Table ${table.table_number}`}
    />
  );
}
