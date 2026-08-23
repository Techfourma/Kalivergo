import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { env } from '@/config/env';

export async function GET() {
  const cookieStore = await cookies();

  cookieStore.delete('kalivergo_user');

  const response = NextResponse.redirect(
    new URL('/login', env.nextAuthUrl || 'http://localhost:3000'),
    { status: 302 }
  );

  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  response.cookies.set('kalivergo_user', '', {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
    sameSite: 'lax',
  });

  return response;
}