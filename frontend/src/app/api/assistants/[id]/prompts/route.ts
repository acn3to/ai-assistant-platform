import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/api-helpers';

const API_BASE_URL = process.env.ASSISTANT_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const headers = getAuthHeaders(request);
    const response = await fetch(`${API_BASE_URL}/v1/assistants/${id}/prompts`, { headers });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to fetch prompts' }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('List prompts BFF error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const headers = getAuthHeaders(request);
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/v1/assistants/${id}/prompts`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to create prompt' }, { status: response.status });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create prompt BFF error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
