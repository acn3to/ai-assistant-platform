import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withObservability, logger, ok, badRequest, internalError } from '@ai-platform/shared';
import { costRepository } from '../repositories/cost.repository';

const getDailyCostsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId || event.queryStringParameters?.tenantId;
    const startDate = event.queryStringParameters?.startDate;
    const endDate = event.queryStringParameters?.endDate;

    if (!tenantId || !startDate || !endDate) {
      return badRequest('tenantId, startDate, and endDate are required');
    }

    const rollups = await costRepository.getDailyRollups(tenantId, startDate, endDate);

    const totalCost = rollups.reduce((sum, r) => sum + r.totalEstimatedCost, 0);
    const totalRequests = rollups.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalConversations = rollups.reduce((sum, r) => sum + r.totalConversations, 0);

    return ok({
      rollups,
      summary: {
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalRequests,
        totalConversations,
        avgCostPerDay: rollups.length > 0
          ? Math.round((totalCost / rollups.length) * 10000) / 10000
          : 0,
      },
    });
  } catch (error) {
    logger.error('Get daily costs failed', { error });
    return internalError('Failed to get daily costs');
  }
};

const getMonthlyCostsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId || event.queryStringParameters?.tenantId;
    const startMonth = event.queryStringParameters?.startMonth;
    const endMonth = event.queryStringParameters?.endMonth;

    if (!tenantId || !startMonth || !endMonth) {
      return badRequest('tenantId, startMonth, and endMonth are required');
    }

    const rollups = await costRepository.getMonthlyRollups(tenantId, startMonth, endMonth);

    return ok({ rollups });
  } catch (error) {
    logger.error('Get monthly costs failed', { error });
    return internalError('Failed to get monthly costs');
  }
};

const getConversationCostsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const conversationId = event.pathParameters?.conversationId;
    if (!conversationId) return badRequest('conversationId is required');

    const events = await costRepository.getCostEventsByConversation(conversationId);

    const totalCost = events.reduce((sum, e) => sum + e.estimatedCost, 0);
    const totalInputTokens = events.reduce((sum, e) => sum + e.inputTokens, 0);
    const totalOutputTokens = events.reduce((sum, e) => sum + e.outputTokens, 0);

    return ok({
      events,
      summary: {
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalInputTokens,
        totalOutputTokens,
        totalRequests: events.length,
      },
    });
  } catch (error) {
    logger.error('Get conversation costs failed', { error });
    return internalError('Failed to get conversation costs');
  }
};

export const getDailyCosts = withObservability(getDailyCostsHandler);
export const getMonthlyCosts = withObservability(getMonthlyCostsHandler);
export const getConversationCosts = withObservability(getConversationCostsHandler);

