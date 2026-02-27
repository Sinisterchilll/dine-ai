export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, sessions, token_usage, orders } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'super') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [totalRestaurants] = await db.select({ count: sql<number>`count(*)` }).from(restaurants);
  const [totalSessions] = await db.select({ count: sql<number>`count(*)` }).from(sessions);
  const [todaySessions] = await db.select({ count: sql<number>`count(*)` }).from(sessions)
    .where(sql`date(${sessions.created_at}) = date('now')`);
  const [tokenStats] = await db.select({
    total_cost: sql<number>`sum(${token_usage.cost_usd})`,
    month_cost: sql<number>`sum(case when strftime('%Y-%m', ${token_usage.created_at}) = strftime('%Y-%m', 'now') then ${token_usage.cost_usd} else 0 end)`,
    total_tokens: sql<number>`sum(${token_usage.input_tokens} + ${token_usage.output_tokens})`,
  }).from(token_usage);

  const dailyChats = await db.select({
    date: sql<string>`date(${sessions.created_at})`,
    count: sql<number>`count(*)`,
  }).from(sessions)
    .where(sql`${sessions.created_at} >= datetime('now', '-30 days')`)
    .groupBy(sql`date(${sessions.created_at})`)
    .orderBy(sql`date(${sessions.created_at})`);

  const dailyCost = await db.select({
    date: sql<string>`date(${token_usage.created_at})`,
    cost: sql<number>`sum(${token_usage.cost_usd})`,
  }).from(token_usage)
    .where(sql`${token_usage.created_at} >= datetime('now', '-30 days')`)
    .groupBy(sql`date(${token_usage.created_at})`)
    .orderBy(sql`date(${token_usage.created_at})`);

  return NextResponse.json({
    totalRestaurants: totalRestaurants.count,
    totalSessions: totalSessions.count,
    todaySessions: todaySessions.count,
    totalCost: tokenStats.total_cost || 0,
    monthCost: tokenStats.month_cost || 0,
    totalTokens: tokenStats.total_tokens || 0,
    dailyChats,
    dailyCost,
  });
}
