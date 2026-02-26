import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withObservability, logger, ok, created, noContent, badRequest, notFound, internalError } from '@ai-platform/shared';
import { createPromptUseCase } from '../use-cases/create-prompt.use-case';
import { updatePromptUseCase } from '../use-cases/update-prompt.use-case';
import { promptRepository } from '../repositories/impl/prompt.repository';

const createPromptHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    if (!assistantId) return badRequest('assistantId is required');

    const body = JSON.parse(event.body || '{}');
    const { name, content, modelId, maxOutputTokens, temperature, topP } = body;

    if (!name || !content) {
      return badRequest('name and content are required');
    }

    const prompt = await createPromptUseCase.execute({ assistantId, name, content, modelId, maxOutputTokens, temperature, topP });

    return created(prompt);
  } catch (error) {
    logger.error('Create prompt failed', { error });
    return internalError('Failed to create prompt');
  }
};

const listPromptsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    if (!assistantId) return badRequest('assistantId is required');

    const prompts = await promptRepository.listByAssistant(assistantId);
    return ok({ prompts });
  } catch (error) {
    logger.error('List prompts failed', { error });
    return internalError('Failed to list prompts');
  }
};

const getPromptHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    const promptId = event.pathParameters?.promptId;
    if (!assistantId || !promptId) return badRequest('assistantId and promptId are required');

    const prompt = await promptRepository.get(assistantId, promptId);
    if (!prompt) return notFound('Prompt not found');

    return ok(prompt);
  } catch (error) {
    logger.error('Get prompt failed', { error });
    return internalError('Failed to get prompt');
  }
};

const updatePromptHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    const promptId = event.pathParameters?.promptId;
    if (!assistantId || !promptId) return badRequest('assistantId and promptId are required');

    const body = JSON.parse(event.body || '{}');
    const updated = await updatePromptUseCase.execute({ assistantId, promptId, updates: body });

    if (!updated) return notFound('Prompt not found');

    return ok(updated);
  } catch (error) {
    logger.error('Update prompt failed', { error });
    return internalError('Failed to update prompt');
  }
};

const deletePromptHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    const promptId = event.pathParameters?.promptId;
    if (!assistantId || !promptId) return badRequest('assistantId and promptId are required');

    await promptRepository.delete(assistantId, promptId);
    logger.info('Prompt deleted', { promptId, assistantId });

    return noContent();
  } catch (error) {
    logger.error('Delete prompt failed', { error });
    return internalError('Failed to delete prompt');
  }
};

export const createPrompt = withObservability(createPromptHandler);
export const listPrompts = withObservability(listPromptsHandler);
export const getPrompt = withObservability(getPromptHandler);
export const updatePrompt = withObservability(updatePromptHandler);
export const deletePrompt = withObservability(deletePromptHandler);
