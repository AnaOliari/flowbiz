import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({ message: 'Credenciais inválidas' }));
    return NextResponse.json(error, { status: backendRes.status });
  }

  const { accessToken, refreshToken } = await backendRes.json();

  const cookieStore = await cookies();

  cookieStore.set('accessToken', accessToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 60 * 15, // 15 minutos
  });

  cookieStore.set('refreshToken', refreshToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return NextResponse.json({ ok: true });
}
