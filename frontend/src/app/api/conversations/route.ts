import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, logBFF } from '@/lib/api-helpers';

const API_BASE_URL = process.env.CONVERSATION_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get('assistantId');

    if (!assistantId) {
      return NextResponse.json({ error: 'assistantId is required' }, { status: 400 });
    }
    const url = `${API_BASE_URL}/v1/assistants/${assistantId}/conversations`;

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!response.ok) {
      logBFF('GET', '/api/conversations', response.status, response.status);
      return NextResponse.json(
        { error: data.message || 'Failed to fetch conversations' },
        { status: response.status },
      );
    }

    logBFF('GET', '/api/conversations', 200, response.status);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Conversations BFF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

