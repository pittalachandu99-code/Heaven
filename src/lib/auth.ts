import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'heaven-luxury-perfume-super-secure-jwt-secret-key-2026-99';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const AUTH_COOKIE_NAME = 'heaven_auth_token';

export interface UserJWTPayload {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'DELIVERY_PARTNER';
  fullName: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true };
}

export async function signJWT(payload: UserJWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<UserJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserJWTPayload;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<UserJWTPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyJWT(token);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getServerSession();
  if (!session) return null;
  try {
    return await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        customerProfile: true,
        deliveryProfile: true,
      },
    });
  } catch {
    return null;
  }
}
