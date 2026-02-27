export const dynamic = 'force-dynamic';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { sessions, menu_items, token_usage, orders, restaurants } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default async function AdminDashboard() {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') redirect('/login');
  const rid = user.restaurantId!;

  const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, rid));
  const [todayChats] = await db.select({ count: sql<number>`count(*)` }).from(sessions)
    .where(sql`${sessions.restaurant_id} = ${rid} AND date(${sessions.created_at}) = date('now')`);
  const [totalChats] = await db.select({ count: sql<number>`count(*)` }).from(sessions).where(eq(sessions.restaurant_id, rid));
  const [tokenStats] = await db.select({
    cost: sql<number>`sum(${token_usage.cost_usd})`,
    tokens: sql<number>`sum(${token_usage.input_tokens} + ${token_usage.output_tokens})`,
  }).from(token_usage).where(eq(token_usage.restaurant_id, rid));
  const [menuCount] = await db.select({ count: sql<number>`count(*)` }).from(menu_items).where(eq(menu_items.restaurant_id, rid));
  const [orderStats] = await db.select({
    count: sql<number>`count(*)`,
    revenue: sql<number>`sum(${orders.total})`,
  }).from(orders).where(eq(orders.restaurant_id, rid));

  const popularItems = await db.select({
    name: menu_items.name,
    price: menu_items.price,
    is_today_special: menu_items.is_today_special,
    in_stock: menu_items.in_stock,
  }).from(menu_items)
    .where(sql`${menu_items.restaurant_id} = ${rid} AND ${menu_items.is_popular} = 1`)
    .limit(5);

  const stats = [
    { title: 'Today\'s Chats', value: todayChats.count.toString(), desc: `${totalChats.count} total` },
    { title: 'Menu Items', value: menuCount.count.toString(), desc: 'Active items' },
    { title: 'Total Orders', value: (orderStats.count || 0).toString(), desc: `Revenue: ${formatCurrency(orderStats.revenue || 0)}` },
    { title: 'AI Cost', value: `$${(tokenStats.cost || 0).toFixed(4)}`, desc: `${(tokenStats.tokens || 0).toLocaleString()} tokens` },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{restaurant?.logo_emoji} {restaurant?.name}</h1>
        <p className="text-muted-foreground mt-1">{restaurant?.address}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <Card key={s.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popular Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {popularItems.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.is_today_special && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Today&apos;s Special</span>
                  )}
                  {!item.in_stock && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Out of Stock</span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
