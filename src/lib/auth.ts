import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dineai-dev-secret-change-in-production'
);

export interface JWTPayload {
  adminId: number;
  email: string;
  name: string;
  role: 'super' | 'restaurant';
  restaurantId?: number;
}

export async function signJwt(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('dineai_token')?.value;
  if (!token) return null;
  return verifyJwt(token);
}
