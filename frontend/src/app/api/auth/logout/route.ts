import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };

  res.cookies.set('idToken', '', cookieOpts);
  res.cookies.set('accessToken', '', cookieOpts);
  res.cookies.set('refreshToken', '', cookieOpts);

  return res;
}

