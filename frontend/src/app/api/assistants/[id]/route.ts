import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/api-helpers';

const API_BASE_URL = process.env.ASSISTANT_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const headers = getAuthHeaders(request);
    const response = await fetch(`${API_BASE_URL}/v1/assistants/${id}`, { headers });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to fetch assistant' }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get assistant BFF error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const headers = getAuthHeaders(request);
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/v1/assistants/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to update assistant' }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update assistant BFF error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const headers = getAuthHeaders(request);
    const response = await fetch(`${API_BASE_URL}/v1/assistants/${id}`, { method: 'DELETE', headers });
    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ error: data.message || 'Failed to delete assistant' }, { status: response.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete assistant BFF error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
