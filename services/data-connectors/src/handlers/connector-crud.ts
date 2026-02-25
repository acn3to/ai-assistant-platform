import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { withObservability, logger, ok, created, noContent, badRequest, notFound, internalError } from '@ai-platform/shared';
import { connectorRepository } from '../repositories/connector.repository';
import type { IDataConnector } from '@ai-platform/shared';

const createConnectorHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    const tenantId = event.requestContext.authorizer?.tenantId;
    if (!assistantId || !tenantId) return badRequest('assistantId and tenant context required');

    const body = JSON.parse(event.body || '{}');
    const { name, description, type, baseUrl, authType, authConfig, tools, trigger } = body;

    if (!name || !baseUrl || !tools || tools.length === 0) {
      return badRequest('name, baseUrl, and at least one tool are required');
    }

    const now = new Date().toISOString();
    const connector: IDataConnector = {
      connectorId: uuidv4(),
      tenantId,
      assistantId,
      name,
      description: description || '',
      type: type || 'rest_api',
      baseUrl,
      authType: authType || 'none',
      authConfig: authConfig || {},
      tools,
      trigger: trigger || 'on_demand',
      triggerConfig: body.triggerConfig,
      maxCallsPerConversation: body.maxCallsPerConversation || 10,
      timeoutMs: body.timeoutMs || 15000,
      cacheTtlSeconds: body.cacheTtlSeconds,
      retryConfig: body.retryConfig,
      enabled: false,
      createdAt: now,
      updatedAt: now,
    };

    await connectorRepository.create(connector);
    logger.info('Connector created', { connectorId: connector.connectorId, assistantId });

    return created(connector);
  } catch (error) {
    logger.error('Create connector failed', { error });
    return internalError('Failed to create connector');
  }
};

const listConnectorsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    if (!assistantId) return badRequest('assistantId is required');

    const connectors = await connectorRepository.listByAssistant(assistantId);
    return ok({ connectors });
  } catch (error) {
    logger.error('List connectors failed', { error });
    return internalError('Failed to list connectors');
  }
};

const getConnectorHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    const connectorId = event.pathParameters?.connectorId;
    if (!assistantId || !connectorId) return badRequest('assistantId and connectorId required');

    const connector = await connectorRepository.get(assistantId, connectorId);
    if (!connector) return notFound('Connector not found');

    return ok(connector);
  } catch (error) {
    logger.error('Get connector failed', { error });
    return internalError('Failed to get connector');
  }
};

const updateConnectorHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    const connectorId = event.pathParameters?.connectorId;
    if (!assistantId || !connectorId) return badRequest('assistantId and connectorId required');

    const body = JSON.parse(event.body || '{}');
    const updated = await connectorRepository.update(assistantId, connectorId, body);

    logger.info('Connector updated', { connectorId, assistantId });
    return ok(updated);
  } catch (error) {
    logger.error('Update connector failed', { error });
    return internalError('Failed to update connector');
  }
};

const deleteConnectorHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    const connectorId = event.pathParameters?.connectorId;
    if (!assistantId || !connectorId) return badRequest('assistantId and connectorId required');

    await connectorRepository.delete(assistantId, connectorId);
    logger.info('Connector deleted', { connectorId, assistantId });

    return noContent();
  } catch (error) {
    logger.error('Delete connector failed', { error });
    return internalError('Failed to delete connector');
  }
};

export const createConnector = withObservability(createConnectorHandler);
export const listConnectors = withObservability(listConnectorsHandler);
export const getConnector = withObservability(getConnectorHandler);
export const updateConnector = withObservability(updateConnectorHandler);
export const deleteConnector = withObservability(deleteConnectorHandler);

