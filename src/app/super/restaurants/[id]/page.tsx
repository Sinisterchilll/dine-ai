export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { restaurants, restaurant_configs, admins, tables, menu_items, sessions, token_usage } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rid = parseInt(id);

  const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, rid));
  if (!restaurant) notFound();

  const [config] = await db.select().from(restaurant_configs).where(eq(restaurant_configs.restaurant_id, rid));
  const adminList = await db.select({ id: admins.id, name: admins.name, email: admins.email }).from(admins).where(eq(admins.restaurant_id, rid));
  const [menuCount] = await db.select({ count: sql<number>`count(*)` }).from(menu_items).where(eq(menu_items.restaurant_id, rid));
  const [tableCount] = await db.select({ count: sql<number>`count(*)` }).from(tables).where(eq(tables.restaurant_id, rid));
  const [chatCount] = await db.select({ count: sql<number>`count(*)` }).from(sessions).where(eq(sessions.restaurant_id, rid));
  const [tokenStats] = await db.select({
    total_cost: sql<number>`sum(${token_usage.cost_usd})`,
  }).from(token_usage).where(eq(token_usage.restaurant_id, rid));

  const stats = { menuCount: menuCount.count, tableCount: tableCount.count, chatCount: chatCount.count, totalCost: tokenStats.total_cost || 0 };

  return (
    <div className="p-8">
      <Link href="/super/restaurants" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Restaurants
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl">{restaurant.logo_emoji}</span>
        <div>
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-muted-foreground">{restaurant.cuisine_type} • {restaurant.address}</p>
          <p className="text-xs text-muted-foreground mt-1">slug: {restaurant.slug} • /r/{restaurant.slug}</p>
        </div>
        <Badge variant={restaurant.status === 'active' ? 'default' : 'secondary'} className="ml-auto">
          {restaurant.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Menu Items', value: stats.menuCount },
          { label: 'Tables', value: stats.tableCount },
          { label: 'Total Chats', value: stats.chatCount },
          { label: 'AI Cost', value: `$${stats.totalCost.toFixed(4)}` },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Admin Accounts</CardTitle></CardHeader>
          <CardContent>
            {adminList.length === 0 ? (
              <p className="text-muted-foreground text-sm">No admins</p>
            ) : (
              <div className="space-y-2">
                {adminList.map(a => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">AI Config</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Personality:</span> {config?.ai_personality || 'friendly'}</div>
            <div><span className="text-muted-foreground">Languages:</span> {config?.languages ? JSON.parse(config.languages).join(', ') : 'English'}</div>
            {config?.ai_greeting && (
              <div><span className="text-muted-foreground">Greeting:</span> <span className="text-xs italic">{config.ai_greeting}</span></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
