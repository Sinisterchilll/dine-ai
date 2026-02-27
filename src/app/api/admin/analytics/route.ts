export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, orders, token_usage } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rid = user.restaurantId!;

  const [totalChats] = await db.select({ count: sql<number>`count(*)` }).from(sessions).where(eq(sessions.restaurant_id, rid));
  const [todayChats] = await db.select({ count: sql<number>`count(*)` }).from(sessions)
    .where(sql`${sessions.restaurant_id} = ${rid} AND date(${sessions.created_at}) = date('now')`);
  const [tokenStats] = await db.select({
    total_input: sql<number>`sum(${token_usage.input_tokens})`,
    total_output: sql<number>`sum(${token_usage.output_tokens})`,
    total_cost: sql<number>`sum(${token_usage.cost_usd})`,
  }).from(token_usage).where(eq(token_usage.restaurant_id, rid));

  const [orderStats] = await db.select({
    count: sql<number>`count(*)`,
    revenue: sql<number>`sum(${orders.total})`,
  }).from(orders).where(eq(orders.restaurant_id, rid));

  const dailyChats = await db.select({
    date: sql<string>`date(${sessions.created_at})`,
    count: sql<number>`count(*)`,
  }).from(sessions)
    .where(sql`${sessions.restaurant_id} = ${rid} AND ${sessions.created_at} >= datetime('now', '-30 days')`)
    .groupBy(sql`date(${sessions.created_at})`)
    .orderBy(sql`date(${sessions.created_at})`);

  const dailyCost = await db.select({
    date: sql<string>`date(${token_usage.created_at})`,
    cost: sql<number>`sum(${token_usage.cost_usd})`,
  }).from(token_usage)
    .where(sql`${token_usage.restaurant_id} = ${rid} AND ${token_usage.created_at} >= datetime('now', '-30 days')`)
    .groupBy(sql`date(${token_usage.created_at})`)
    .orderBy(sql`date(${token_usage.created_at})`);

  return NextResponse.json({
    totalChats: totalChats.count,
    todayChats: todayChats.count,
    totalTokens: (tokenStats.total_input || 0) + (tokenStats.total_output || 0),
    totalCost: tokenStats.total_cost || 0,
    totalOrders: orderStats.count,
    totalRevenue: orderStats.revenue || 0,
    dailyChats,
    dailyCost,
  });
}
