export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, orders, token_usage } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rid = user.restaurantId!;

    const [totalChats] = await db.select({ count: sql<number>`count(*)` }).from(sessions).where(eq(sessions.restaurant_id, rid));
    const [todayChats] = await db.select({ count: sql<number>`count(*)` }).from(sessions)
      .where(sql`${sessions.restaurant_id} = ${rid} AND ${sessions.created_at}::date = CURRENT_DATE`);
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
      date: sql<string>`${sessions.created_at}::date`,
      count: sql<number>`count(*)`,
    }).from(sessions)
      .where(sql`${sessions.restaurant_id} = ${rid} AND ${sessions.created_at} >= now() - interval '30 days'`)
      .groupBy(sql`${sessions.created_at}::date`)
      .orderBy(sql`${sessions.created_at}::date`);

    const dailyCost = await db.select({
      date: sql<string>`${token_usage.created_at}::date`,
      cost: sql<number>`sum(${token_usage.cost_usd})`,
    }).from(token_usage)
      .where(sql`${token_usage.restaurant_id} = ${rid} AND ${token_usage.created_at} >= now() - interval '30 days'`)
      .groupBy(sql`${token_usage.created_at}::date`)
      .orderBy(sql`${token_usage.created_at}::date`);

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
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
