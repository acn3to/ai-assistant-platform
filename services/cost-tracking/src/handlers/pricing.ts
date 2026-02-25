import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withObservability, logger, ok, badRequest, internalError } from '@ai-platform/shared';
import { costRepository } from '../repositories/cost.repository';
import type { IPricingConfig } from '@ai-platform/shared';

const updatePricingHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { modelId, inputPricePer1kTokens, outputPricePer1kTokens } = body;

    if (!modelId || inputPricePer1kTokens === undefined || outputPricePer1kTokens === undefined) {
      return badRequest('modelId, inputPricePer1kTokens, and outputPricePer1kTokens are required');
    }

    const config: IPricingConfig = {
      modelId,
      inputPricePer1kTokens,
      outputPricePer1kTokens,
      kbRetrievePricePerCall: body.kbRetrievePricePerCall || 0,
      kbRerankPricePerCall: body.kbRerankPricePerCall || 0,
      updatedAt: new Date().toISOString(),
    };

    await costRepository.putPricing(config);
    logger.info('Pricing updated', { modelId });

    return ok(config);
  } catch (error) {
    logger.error('Update pricing failed', { error });
    return internalError('Failed to update pricing');
  }
};

const getPricingHandler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const configs = await costRepository.getAllPricing();
    return ok({ pricing: configs });
  } catch (error) {
    logger.error('Get pricing failed', { error });
    return internalError('Failed to get pricing');
  }
};

export const updatePricing = withObservability(updatePricingHandler);
export const getPricing = withObservability(getPricingHandler);

