export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { comparePassword, signJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    const [admin] = await db.select().from(admins).where(eq(admins.email, email.toLowerCase()));
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const valid = await comparePassword(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = await signJwt({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as 'super' | 'restaurant',
      restaurantId: admin.restaurant_id ?? undefined,
    });
    const res = NextResponse.json({ success: true, role: admin.role, name: admin.name });
    res.cookies.set('dineai_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
