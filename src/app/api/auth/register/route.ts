import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  hashPassword,
  validateEmail,
  validatePasswordStrength,
  signJWT,
  AUTH_COOKIE_NAME,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password, confirmPassword } = body;

    // Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !validateEmail(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password confirmation does not match.' },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // Hash password securely
    const passwordHash = await hashPassword(password);

    // Create user and profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: trimmedEmail,
          fullName: fullName.trim(),
          passwordHash,
          role: 'CUSTOMER', // Strict: public registration only creates customer accounts
          isActive: true,
        },
      });

      await tx.customerProfile.create({
        data: {
          userId: user.id,
        },
      });

      // Also create an empty cart for the customer
      await tx.cart.create({
        data: {
          userId: user.id,
        },
      });

      return user;
    });

    // Sign session JWT
    const token = await signJWT({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role as 'CUSTOMER',
      fullName: newUser.fullName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });

    // Set HTTP-only secure cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
