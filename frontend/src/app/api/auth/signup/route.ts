import { NextRequest, NextResponse } from 'next/server';
import { logBFF } from '@/lib/api-helpers';

const API_BASE_URL = process.env.AUTH_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      logBFF('POST', '/api/auth/signup', response.status, response.status);
      return NextResponse.json(
        { error: data.message || 'Registration failed' },
        { status: response.status },
      );
    }

    logBFF('POST', '/api/auth/signup', 201, response.status);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Signup BFF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

