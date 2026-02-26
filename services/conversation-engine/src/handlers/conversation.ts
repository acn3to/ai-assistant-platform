import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { withObservability, logger, ok, created, badRequest, notFound, internalError } from '@ai-platform/shared';
import { conversationRepository } from '../repositories/impl/conversation.repository';
import type { IConversation } from '@ai-platform/shared';

const startConversationHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { assistantId, channel, phoneNumber } = body;

    if (!assistantId) {
      return badRequest('assistantId is required');
    }

    const now = new Date().toISOString();
    const conversation: IConversation = {
      assistantId,
      conversationId: uuidv4(),
      phoneNumber,
      channel: channel || 'web_test',
      status: 'active',
      messageCount: 0,
      totalTokens: 0,
      estimatedCost: 0,
      sessionVars: {},
      createdAt: now,
      updatedAt: now,
    };

    await conversationRepository.create(conversation);
    logger.info('Conversation started', { conversationId: conversation.conversationId, assistantId, channel });

    return created(conversation);
  } catch (error) {
    logger.error('Start conversation failed', { error });
    return internalError('Failed to start conversation');
  }
};

const getConversationHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const conversationId = event.pathParameters?.conversationId;
    const assistantId = event.queryStringParameters?.assistantId;

    if (!conversationId || !assistantId) {
      return badRequest('conversationId and assistantId are required');
    }

    const conversation = await conversationRepository.get(assistantId, conversationId);
    if (!conversation) return notFound('Conversation not found');

    const messages = await conversationRepository.getMessages(conversationId);

    return ok({ conversation, messages });
  } catch (error) {
    logger.error('Get conversation failed', { error });
    return internalError('Failed to get conversation');
  }
};

const listConversationsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    if (!assistantId) return badRequest('assistantId is required');

    const limit = parseInt(event.queryStringParameters?.limit || '50', 10);
    const conversations = await conversationRepository.listByAssistant(assistantId, limit);

    return ok({ conversations });
  } catch (error) {
    logger.error('List conversations failed', { error });
    return internalError('Failed to list conversations');
  }
};

export const startConversation = withObservability(startConversationHandler);
export const getConversation = withObservability(getConversationHandler);
export const listConversations = withObservability(listConversationsHandler);
