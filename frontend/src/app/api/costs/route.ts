import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/api-helpers';

const API_BASE_URL = process.env.COST_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    const { searchParams } = new URL(request.url);

    const period = searchParams.get('period') || '30d';
    const assistantId = searchParams.get('assistantId');

    let url = `${API_BASE_URL}/v1/costs/dashboard?period=${period}`;
    if (assistantId) {
      url += `&assistantId=${assistantId}`;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch cost data' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Costs BFF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

