export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const cats = await db.select().from(categories)
    .where(eq(categories.restaurant_id, user.restaurantId!))
    .orderBy(asc(categories.sort_order));
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, sort_order } = await req.json();
  const [cat] = await db.insert(categories).values({
    restaurant_id: user.restaurantId!,
    name,
    sort_order: sort_order ?? 0,
  }).returning();
  return NextResponse.json(cat, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, name, sort_order } = await req.json();
  const [cat] = await db.update(categories).set({ name, sort_order })
    .where(eq(categories.id, id)).returning();
  return NextResponse.json(cat);
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await req.json();
  await db.delete(categories).where(eq(categories.id, id));
  return NextResponse.json({ success: true });
}
