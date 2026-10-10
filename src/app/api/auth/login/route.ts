import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyPassword,
  validateEmail,
  signJWT,
  AUTH_COOKIE_NAME,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, expectedRole } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both email and password.' },
        { status: 400 }
      );
    }

    if (!validateEmail(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email address format.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    // Check credentials with constant-time comparison feel (generic message)
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid email or password credentials.' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password credentials.' },
        { status: 401 }
      );
    }

    // Role-specific check if expectedRole is passed (Admin portal or Delivery portal)
    if (expectedRole && expectedRole !== user.role) {
      if (expectedRole === 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Administrator privileges required.' },
          { status: 403 }
        );
      }
      if (expectedRole === 'DELIVERY_PARTNER') {
        return NextResponse.json(
          { error: 'Access denied. Delivery partner credentials required.' },
          { status: 403 }
        );
      }
    }

    // Sign session token
    const token = await signJWT({
      id: user.id,
      email: user.email,
      role: user.role as 'CUSTOMER' | 'ADMIN' | 'DELIVERY_PARTNER',
      fullName: user.fullName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });

    // Set secure HTTP-only session cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during sign in. Please try again.' },
      { status: 500 }
    );
  }
}
