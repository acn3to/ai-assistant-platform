export type MessageRole = 'user' | 'assistant' | 'system';

export interface IMessage {
  conversationId: string;
  timestamp: string;
  role: MessageRole;
  content: string;
  toolUseId?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: Record<string, unknown>;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface IConversation {
  assistantId: string;
  conversationId: string;
  phoneNumber?: string;
  channel: 'whatsapp' | 'web_test';
  status: 'active' | 'closed';
  messageCount: number;
  totalTokens: number;
  estimatedCost: number;
  sessionVars: Record<string, string>;
  ttl?: number;
  createdAt: string;
  updatedAt: string;
}

