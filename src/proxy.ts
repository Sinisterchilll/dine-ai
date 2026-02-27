import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dineai-dev-secret-change-in-production'
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('dineai_token')?.value;

  if (pathname.startsWith('/admin') || pathname.startsWith('/super')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = (payload as Record<string, unknown>).role;
      if (pathname.startsWith('/super') && role !== 'super') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      if (pathname.startsWith('/admin') && role !== 'restaurant') {
        return NextResponse.redirect(new URL('/super/dashboard', req.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (pathname === '/login' && token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = (payload as Record<string, unknown>).role;
      if (role === 'super') {
        return NextResponse.redirect(new URL('/super/dashboard', req.url));
      } else {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
    } catch {}
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/super/:path*', '/login'],
};
