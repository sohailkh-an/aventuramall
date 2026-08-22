import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function buildProxyResponseHeaders(response: Response) {
  const headers = new Headers();
  headers.set('Content-Type', response.headers.get('Content-Type') || 'application/json');

  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie;
  const setCookies = getSetCookie?.call(response.headers) ?? [];

  for (const cookie of setCookies) {
    headers.append('Set-Cookie', cookie);
  }

  if (setCookies.length === 0) {
    const cookie = response.headers.get('Set-Cookie');
    if (cookie) {
      headers.set('Set-Cookie', cookie);
    }
  }

  return headers;
}

async function handler(req: NextRequest) {
  const path = req.nextUrl.pathname.replace('/api', '');
  const url = new URL(path, API_URL);

  // Forward query parameters
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers(req.headers);
  headers.delete('host');

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = await req.text();
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: buildProxyResponseHeaders(response),
    });
  } catch {
    return NextResponse.json({ error: 'Backend service unavailable' }, { status: 503 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
