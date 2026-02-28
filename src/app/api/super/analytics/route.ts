export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, sessions, token_usage } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'super') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalRestaurants] = await db.select({ count: sql<number>`count(*)` }).from(restaurants);
    const [totalSessions] = await db.select({ count: sql<number>`count(*)` }).from(sessions);
    const [todaySessions] = await db.select({ count: sql<number>`count(*)` }).from(sessions)
      .where(sql`${sessions.created_at}::date = CURRENT_DATE`);
    const [tokenStats] = await db.select({
      total_cost: sql<number>`sum(${token_usage.cost_usd})`,
      month_cost: sql<number>`sum(case when date_trunc('month', ${token_usage.created_at}) = date_trunc('month', now()) then ${token_usage.cost_usd} else 0 end)`,
      total_tokens: sql<number>`sum(${token_usage.input_tokens} + ${token_usage.output_tokens})`,
    }).from(token_usage);

    const dailyChats = await db.select({
      date: sql<string>`${sessions.created_at}::date`,
      count: sql<number>`count(*)`,
    }).from(sessions)
      .where(sql`${sessions.created_at} >= now() - interval '30 days'`)
      .groupBy(sql`${sessions.created_at}::date`)
      .orderBy(sql`${sessions.created_at}::date`);

    const dailyCost = await db.select({
      date: sql<string>`${token_usage.created_at}::date`,
      cost: sql<number>`sum(${token_usage.cost_usd})`,
    }).from(token_usage)
      .where(sql`${token_usage.created_at} >= now() - interval '30 days'`)
      .groupBy(sql`${token_usage.created_at}::date`)
      .orderBy(sql`${token_usage.created_at}::date`);

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
  } catch (err) {
    console.error('Super analytics error:', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
