import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND_URL = 'http://localhost:3000';

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value ?? '';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getToken();
  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}/clients/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ message: 'Erro ao atualizar cliente' }));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getToken();

  const res = await fetch(`${BACKEND_URL}/clients/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await res.json().catch(() => ({ message: 'Erro ao excluir cliente' }));
  return NextResponse.json(data, { status: res.status });
}
