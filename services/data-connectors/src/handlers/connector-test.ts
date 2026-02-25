import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import { withObservability, logger, ok, badRequest, notFound, internalError } from '@ai-platform/shared';
import { connectorRepository } from '../repositories/connector.repository';

const testConnectorHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    const connectorId = event.pathParameters?.connectorId;
    if (!assistantId || !connectorId) return badRequest('assistantId and connectorId required');

    const connector = await connectorRepository.get(assistantId, connectorId);
    if (!connector) return notFound('Connector not found');

    const body = JSON.parse(event.body || '{}');
    const { toolName, input } = body;

    if (!toolName) {
      return badRequest('toolName is required');
    }

    const tool = connector.tools.find((t) => t.name === toolName);
    if (!tool) {
      return badRequest(`Tool '${toolName}' not found in connector`);
    }

    const startTime = Date.now();

    try {
      // Build a simple test request
      const url = `${connector.baseUrl}${tool.path}`;
      const response = await axios({
        method: tool.method.toLowerCase() as any,
        url,
        data: ['POST', 'PUT', 'PATCH'].includes(tool.method) ? input : undefined,
        params: ['GET', 'DELETE'].includes(tool.method) ? input : undefined,
        timeout: connector.timeoutMs,
        validateStatus: () => true,
      });

      const latency = Date.now() - startTime;

      // Update test result
      await connectorRepository.update(assistantId, connectorId, {
        lastTestedAt: new Date().toISOString(),
        lastTestResult: response.status < 400 ? 'success' : 'failure',
      });

      return ok({
        success: response.status < 400,
        status: response.status,
        latencyMs: latency,
        response: response.data,
        headers: response.headers,
      });
    } catch (error: any) {
      const latency = Date.now() - startTime;

      await connectorRepository.update(assistantId, connectorId, {
        lastTestedAt: new Date().toISOString(),
        lastTestResult: 'failure',
      });

      return ok({
        success: false,
        error: error.message,
        latencyMs: latency,
      });
    }
  } catch (error) {
    logger.error('Test connector failed', { error });
    return internalError('Failed to test connector');
  }
};

export const testConnector = withObservability(testConnectorHandler);

