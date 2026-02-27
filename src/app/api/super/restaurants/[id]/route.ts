export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, restaurant_configs, admins, tables, menu_items, sessions, token_usage } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'super') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const rid = parseInt(id);

  const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, rid));
  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [config] = await db.select().from(restaurant_configs).where(eq(restaurant_configs.restaurant_id, rid));
  const adminList = await db.select({ id: admins.id, name: admins.name, email: admins.email }).from(admins).where(eq(admins.restaurant_id, rid));
  const [menuCount] = await db.select({ count: sql<number>`count(*)` }).from(menu_items).where(eq(menu_items.restaurant_id, rid));
  const [tableCount] = await db.select({ count: sql<number>`count(*)` }).from(tables).where(eq(tables.restaurant_id, rid));
  const [chatCount] = await db.select({ count: sql<number>`count(*)` }).from(sessions).where(eq(sessions.restaurant_id, rid));
  const [tokenStats] = await db.select({
    total_input: sql<number>`sum(${token_usage.input_tokens})`,
    total_output: sql<number>`sum(${token_usage.output_tokens})`,
    total_cost: sql<number>`sum(${token_usage.cost_usd})`,
  }).from(token_usage).where(eq(token_usage.restaurant_id, rid));

  return NextResponse.json({
    restaurant, config, admins: adminList,
    stats: { menuCount: menuCount.count, tableCount: tableCount.count, chatCount: chatCount.count, totalCost: tokenStats.total_cost || 0 },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'super') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const [restaurant] = await db.update(restaurants).set(body).where(eq(restaurants.id, parseInt(id))).returning();
  return NextResponse.json(restaurant);
}
