import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'heaven-luxury-perfume-super-secure-jwt-secret-key-2026-99';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const AUTH_COOKIE_NAME = 'heaven_auth_token';

interface TokenPayload {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'DELIVERY_PARTNER';
  fullName: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let session: TokenPayload | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload as unknown as TokenPayload;
    } catch {
      session = null;
    }
  }

  // 1. Admin Route Protection (/admin/...)
  if (pathname.startsWith('/admin')) {
    // Exclude /admin/login
    if (pathname === '/admin/login') {
      if (session && session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== 'ADMIN') {
      // Reject non-admin users attempting to access admin portal
      return NextResponse.redirect(new URL('/login?error=unauthorized_admin', request.url));
    }

    return NextResponse.next();
  }

  // 2. Delivery Partner Route Protection (/delivery/...)
  if (pathname.startsWith('/delivery')) {
    // Exclude /delivery/login
    if (pathname === '/delivery/login') {
      if (session && session.role === 'DELIVERY_PARTNER') {
        return NextResponse.redirect(new URL('/delivery/dashboard', request.url));
      }
      return NextResponse.next();
    }

    if (!session) {
      const loginUrl = new URL('/delivery/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== 'DELIVERY_PARTNER') {
      // Reject non-delivery users
      return NextResponse.redirect(new URL('/login?error=unauthorized_delivery', request.url));
    }

    return NextResponse.next();
  }

  // 3. Customer Protected Routes
  const customerProtectedPaths = ['/account', '/orders', '/checkout'];
  const isCustomerProtected = customerProtectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isCustomerProtected) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Public Authentication Pages
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      if (session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (session.role === 'DELIVERY_PARTNER') {
        return NextResponse.redirect(new URL('/delivery/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/delivery/:path*',
    '/account/:path*',
    '/orders/:path*',
    '/checkout/:path*',
    '/login',
    '/register',
  ],
};
