import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys } from '@ai-platform/shared';
import type { IConversation, IMessage } from '@ai-platform/shared';
import type { IConversationRepository } from '../interfaces/conversation.repository.interface';

class ConversationRepository implements IConversationRepository {
  async create(conversation: IConversation): Promise<void> {
    const keyAttrs = keys.conversation(conversation.assistantId, conversation.conversationId);
    const gsi1Keys = conversation.phoneNumber
      ? {
          GSI1PK: `PHONE#${conversation.phoneNumber}`,
          GSI1SK: `CONV#${conversation.conversationId}`,
        }
      : {};

    const ttlHours = conversation.channel === 'web_test' ? 24 : 168;
    const ttl = Math.floor(Date.now() / 1000) + ttlHours * 3600;

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...keyAttrs, ...gsi1Keys, ...conversation, ttl, entityType: 'Conversation' },
      }),
    );
  }

  async get(assistantId: string, conversationId: string): Promise<IConversation | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: keys.conversation(assistantId, conversationId),
      }),
    );
    return (result.Item as IConversation) || null;
  }

  async listByAssistant(assistantId: string, limit = 50): Promise<IConversation[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `ASSISTANT#${assistantId}`, ':sk': 'CONV#' },
        Limit: limit,
        ScanIndexForward: false,
      }),
    );
    return (result.Items as IConversation[]) || [];
  }

  async addMessage(message: IMessage): Promise<void> {
    const keyAttrs = keys.message(message.conversationId, message.timestamp);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...keyAttrs, ...message, entityType: 'Message' },
      }),
    );
  }

  async getMessages(conversationId: string, limit = 100): Promise<IMessage[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `CONV#${conversationId}`, ':sk': 'MSG#' },
        Limit: limit,
        ScanIndexForward: true,
      }),
    );
    return (result.Items as IMessage[]) || [];
  }

  async updateStats(assistantId: string, conversationId: string, tokensDelta: number, costDelta: number): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: keys.conversation(assistantId, conversationId),
        UpdateExpression:
          'SET messageCount = messageCount + :one, totalTokens = totalTokens + :tokens, estimatedCost = estimatedCost + :cost, updatedAt = :now',
        ExpressionAttributeValues: {
          ':one': 1,
          ':tokens': tokensDelta,
          ':cost': costDelta,
          ':now': new Date().toISOString(),
        },
      }),
    );
  }
}

export const conversationRepository = new ConversationRepository();
