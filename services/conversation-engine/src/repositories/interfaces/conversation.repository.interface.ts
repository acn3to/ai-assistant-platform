import type { IConversation, IMessage } from '@ai-platform/shared';

export interface IConversationRepository {
  create(conversation: IConversation): Promise<void>;
  get(assistantId: string, conversationId: string): Promise<IConversation | null>;
  listByAssistant(assistantId: string, limit?: number): Promise<IConversation[]>;
  addMessage(message: IMessage): Promise<void>;
  getMessages(conversationId: string, limit?: number): Promise<IMessage[]>;
  updateStats(assistantId: string, conversationId: string, tokensDelta: number, costDelta: number): Promise<void>;
}
