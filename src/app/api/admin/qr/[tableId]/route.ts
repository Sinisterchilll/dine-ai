export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tables, restaurants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { generateQRCode } from '@/lib/qr';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tableId: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { tableId } = await params;
  const [table] = await db.select().from(tables).where(
    and(eq(tables.id, parseInt(tableId)), eq(tables.restaurant_id, user.restaurantId!))
  );
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, user.restaurantId!));
  const baseUrl = req.nextUrl.origin;
  const url = `${baseUrl}/r/${restaurant.slug}/t/${table.id}`;
  const buffer = await generateQRCode(url);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="table-${table.table_number}-qr.png"`,
    },
  });
}
