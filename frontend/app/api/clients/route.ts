import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND_URL = 'http://localhost:3000';

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value ?? '';
}

export async function GET() {
  const token = await getToken();

  const res = await fetch(`${BACKEND_URL}/clients`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => ({ message: 'Erro ao buscar clientes' }));
  return NextResponse.json(body, { status: res.status });
}

export async function POST(request: NextRequest) {
  const token = await getToken();
  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ message: 'Erro ao criar cliente' }));
  return NextResponse.json(data, { status: res.status });
}
