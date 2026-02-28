export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { restaurants, sessions, token_usage } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function SuperDashboard() {
  const [totalRests] = await db.select({ count: sql<number>`count(*)` }).from(restaurants);
  const [totalSessions] = await db.select({ count: sql<number>`count(*)` }).from(sessions);
  const [todaySessions] = await db.select({ count: sql<number>`count(*)` }).from(sessions)
    .where(sql`${sessions.created_at}::date = CURRENT_DATE`);
  const [costStats] = await db.select({
    total: sql<number>`sum(${token_usage.cost_usd})`,
    month: sql<number>`sum(case when date_trunc('month', ${token_usage.created_at}) = date_trunc('month', now()) then ${token_usage.cost_usd} else 0 end)`,
    tokens: sql<number>`sum(${token_usage.input_tokens} + ${token_usage.output_tokens})`,
  }).from(token_usage);

  const recentRestaurants = await db.select().from(restaurants).orderBy(restaurants.created_at).limit(5);

  const stats = [
    { title: 'Total Restaurants', value: totalRests.count.toString() },
    { title: "Today's Chats", value: todaySessions.count.toString() },
    { title: 'Total Chats', value: totalSessions.count.toString() },
    { title: 'Month AI Cost', value: `$${(costStats.month || 0).toFixed(4)}` },
    { title: 'Total AI Cost', value: `$${(costStats.total || 0).toFixed(4)}` },
    { title: 'Total Tokens', value: (costStats.tokens || 0).toLocaleString() },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform-wide overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <Card key={s.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Restaurants</CardTitle>
          <Link href="/super/restaurants" className="text-sm text-amber-400 hover:underline">View all →</Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRestaurants.map(r => (
              <div key={r.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{r.logo_emoji}</span>
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.cuisine_type} • {r.address}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
