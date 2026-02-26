import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withObservability, logger, ok, created, noContent, badRequest, notFound, internalError } from '@ai-platform/shared';
import { createAssistantUseCase } from '../use-cases/create-assistant.use-case';
import { assistantRepository } from '../repositories/impl/assistant.repository';

const createAssistantHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId;
    if (!tenantId) return badRequest('Tenant context required');

    const body = JSON.parse(event.body || '{}');
    const { name, description, systemPrompt, modelId, inferenceConfig } = body;

    if (!name || !systemPrompt || !modelId) {
      return badRequest('name, systemPrompt, and modelId are required');
    }

    const assistant = await createAssistantUseCase.execute({ tenantId, name, description, systemPrompt, modelId, inferenceConfig });

    return created(assistant);
  } catch (error) {
    logger.error('Create assistant failed', { error });
    return internalError('Failed to create assistant');
  }
};

const listAssistantsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId;
    if (!tenantId) return badRequest('Tenant context required');

    const assistants = await assistantRepository.listByTenant(tenantId);
    return ok({ assistants });
  } catch (error) {
    logger.error('List assistants failed', { error });
    return internalError('Failed to list assistants');
  }
};

const getAssistantHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId;
    const assistantId = event.pathParameters?.assistantId;
    if (!tenantId || !assistantId) return badRequest('Tenant context and assistantId required');

    const assistant = await assistantRepository.get(tenantId, assistantId);
    if (!assistant) return notFound('Assistant not found');

    return ok(assistant);
  } catch (error) {
    logger.error('Get assistant failed', { error });
    return internalError('Failed to get assistant');
  }
};

const updateAssistantHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId;
    const assistantId = event.pathParameters?.assistantId;
    if (!tenantId || !assistantId) return badRequest('Tenant context and assistantId required');

    const body = JSON.parse(event.body || '{}');
    const updated = await assistantRepository.update(tenantId, assistantId, body);

    logger.info('Assistant updated', { assistantId, tenantId });
    return ok(updated);
  } catch (error) {
    logger.error('Update assistant failed', { error });
    return internalError('Failed to update assistant');
  }
};

const deleteAssistantHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId;
    const assistantId = event.pathParameters?.assistantId;
    if (!tenantId || !assistantId) return badRequest('Tenant context and assistantId required');

    await assistantRepository.delete(tenantId, assistantId);
    logger.info('Assistant deleted', { assistantId, tenantId });

    return noContent();
  } catch (error) {
    logger.error('Delete assistant failed', { error });
    return internalError('Failed to delete assistant');
  }
};

export const createAssistant = withObservability(createAssistantHandler);
export const listAssistants = withObservability(listAssistantsHandler);
export const getAssistant = withObservability(getAssistantHandler);
export const updateAssistant = withObservability(updateAssistantHandler);
export const deleteAssistant = withObservability(deleteAssistantHandler);
