import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { withObservability, logger, ok, created, noContent, badRequest, notFound, internalError } from '@ai-platform/shared';
import { promptRepository } from '../repositories/prompt.repository';
import type { IPrompt } from '@ai-platform/shared';

/**
 * Extract {{variable}} patterns from prompt content
 */
const extractVariables = (content: string): string[] => {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
};

const createPromptHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    if (!assistantId) return badRequest('assistantId is required');

    const body = JSON.parse(event.body || '{}');
    const { name, content, modelId, maxOutputTokens, temperature, topP } = body;

    if (!name || !content) {
      return badRequest('name and content are required');
    }

    const now = new Date().toISOString();
    const prompt: IPrompt = {
      assistantId,
      promptId: uuidv4(),
      name,
      content,
      version: 1,
      variables: extractVariables(content),
      isActive: true,
      modelId,
      maxOutputTokens,
      temperature,
      topP,
      createdAt: now,
      updatedAt: now,
    };

    await promptRepository.create(prompt);
    logger.info('Prompt created', { promptId: prompt.promptId, assistantId });

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

    const existing = await promptRepository.get(assistantId, promptId);
    if (!existing) return notFound('Prompt not found');

    const body = JSON.parse(event.body || '{}');
    const now = new Date().toISOString();

    // Create new version
    const updatedPrompt: IPrompt = {
      ...existing,
      ...body,
      assistantId,
      promptId,
      version: existing.version + 1,
      variables: extractVariables(body.content || existing.content),
      updatedAt: now,
    };

    await promptRepository.create(updatedPrompt);
    logger.info('Prompt updated', { promptId, assistantId, version: updatedPrompt.version });

    return ok(updatedPrompt);
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

