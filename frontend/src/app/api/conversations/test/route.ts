import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, logBFF } from '@/lib/api-helpers';

const API_BASE_URL = process.env.CONVERSATION_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    const body = await request.json();
    const { assistantId, message, conversationId: existingConversationId } = body;

    if (!assistantId || !message) {
      return NextResponse.json({ error: 'assistantId and message are required' }, { status: 400 });
    }

    // Step 1: create a conversation if we don't have one yet
    let conversationId = existingConversationId;
    if (!conversationId) {
      const startRes = await fetch(`${API_BASE_URL}/v1/conversations`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantId, channel: 'web_test' }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        logBFF('POST', '/api/conversations/test', startRes.status, startRes.status);
        return NextResponse.json(
          { error: startData.message || 'Failed to start conversation' },
          { status: startRes.status },
        );
      }
      conversationId = startData.conversationId;
      logBFF('POST', '/api/conversations/test (startConversation)', 201, startRes.status);
    }

    // Step 2: send the message
    const msgRes = await fetch(`${API_BASE_URL}/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ assistantId, message }),
    });
    const msgData = await msgRes.json();
    if (!msgRes.ok) {
      logBFF('POST', '/api/conversations/test (processMessage)', msgRes.status, msgRes.status);
      return NextResponse.json(
        { error: msgData.message || 'Failed to process message' },
        { status: msgRes.status },
      );
    }

    logBFF('POST', '/api/conversations/test (processMessage)', 200, msgRes.status);
    return NextResponse.json({ conversationId, response: msgData.response, toolCalls: msgData.toolCalls });
  } catch (error) {
    console.error('Test conversation BFF error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
