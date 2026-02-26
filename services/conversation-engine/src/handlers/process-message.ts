import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withObservability, logger, ok, badRequest, notFound, internalError } from '@ai-platform/shared';
import { processMessageUseCase } from '../use-cases/process-message.use-case';

const processMessageHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const conversationId = event.pathParameters?.conversationId;
    if (!conversationId) return badRequest('conversationId is required');

    const body = JSON.parse(event.body || '{}');
    const { message, assistantId, tenantId, promptVariables, knowledgeBaseId, modelId, inferenceConfig } = body as {
      message?: string;
      assistantId?: string;
      tenantId?: string;
      promptVariables?: Record<string, string>;
      knowledgeBaseId?: string;
      modelId?: string;
      inferenceConfig?: { maxTokens: number; temperature: number; topP: number };
    };

    if (!message || !assistantId) {
      return badRequest('message and assistantId are required');
    }

    const result = await processMessageUseCase.execute({
      conversationId,
      message,
      assistantId,
      tenantId,
      promptVariables,
      knowledgeBaseId,
      modelId,
      inferenceConfig,
    });

    if (result === 'conversation_not_found') return notFound('Conversation not found');
    if (result === 'assistant_not_found') return notFound('Assistant not found');

    return ok(result);
  } catch (error) {
    logger.error('Process message failed', { error });
    return internalError('Failed to process message');
  }
};

export const handler = withObservability(processMessageHandler);
