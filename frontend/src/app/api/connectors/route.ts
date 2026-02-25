import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, logBFF } from '@/lib/api-helpers';

const API_BASE_URL = process.env.CONNECTOR_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get('assistantId');

    if (!assistantId) {
      return NextResponse.json({ error: 'assistantId is required' }, { status: 400 });
    }
    const url = `${API_BASE_URL}/v1/assistants/${assistantId}/connectors`;

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!response.ok) {
      logBFF('GET', '/api/connectors', response.status, response.status);
      return NextResponse.json(
        { error: data.message || 'Failed to fetch connectors' },
        { status: response.status },
      );
    }

    logBFF('GET', '/api/connectors', 200, response.status);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Connectors BFF error:', error);
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

    const assistantId = body.assistantId;
    const response = await fetch(`${API_BASE_URL}/v1/assistants/${assistantId}/connectors`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      logBFF('POST', '/api/connectors', response.status, response.status);
      return NextResponse.json(
        { error: data.message || 'Failed to create connector' },
        { status: response.status },
      );
    }

    logBFF('POST', '/api/connectors', 201, response.status);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create connector BFF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

