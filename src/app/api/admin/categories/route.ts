export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const cats = await db.select().from(categories)
      .where(eq(categories.restaurant_id, user.restaurantId!))
      .orderBy(asc(categories.sort_order));
    return NextResponse.json(cats);
  } catch (err) {
    console.error('GET categories error:', err);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { name, sort_order } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const [cat] = await db.insert(categories).values({
      restaurant_id: user.restaurantId!,
      name: name.trim(),
      sort_order: sort_order ?? 0,
    }).returning();
    return NextResponse.json(cat, { status: 201 });
  } catch (err) {
    console.error('POST categories error:', err);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id, name, sort_order } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const [cat] = await db.update(categories).set({ name, sort_order })
      .where(and(eq(categories.id, id), eq(categories.restaurant_id, user.restaurantId!)))
      .returning();
    if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(cat);
  } catch (err) {
    console.error('PUT categories error:', err);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(categories)
      .where(and(eq(categories.id, id), eq(categories.restaurant_id, user.restaurantId!)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE categories error:', err);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
