import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.AUTH_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Login failed' },
        { status: response.status },
      );
    }

    // Set tokens in httpOnly cookies for security
    const res = NextResponse.json({ user: data.user });

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    // idToken carries custom:tenantId / custom:role claims — used by the Lambda authorizer
    res.cookies.set('idToken', data.idToken, { ...cookieOpts, maxAge: 60 * 60 });
    res.cookies.set('accessToken', data.accessToken, { ...cookieOpts, maxAge: 60 * 60 });
    res.cookies.set('refreshToken', data.refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 });

    return res;
  } catch (error) {
    console.error('Login BFF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

