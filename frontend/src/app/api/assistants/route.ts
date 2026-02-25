import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, logBFF } from '@/lib/api-helpers';

const API_BASE_URL = process.env.ASSISTANT_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);

    const response = await fetch(`${API_BASE_URL}/v1/assistants`, {
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      logBFF('GET', '/api/assistants', response.status, response.status);
      return NextResponse.json(
        { error: data.message || 'Failed to fetch assistants' },
        { status: response.status },
      );
    }

    logBFF('GET', '/api/assistants', 200, response.status);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Assistants BFF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/v1/assistants`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      logBFF('POST', '/api/assistants', response.status, response.status);
      return NextResponse.json(
        { error: data.message || 'Failed to create assistant' },
        { status: response.status },
      );
    }

    logBFF('POST', '/api/assistants', 201, response.status);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create assistant BFF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

