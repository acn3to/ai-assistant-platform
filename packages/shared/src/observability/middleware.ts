import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export interface IObservabilityOptions {
  logEvent?: boolean;
  clearState?: boolean;
}

const shouldLogEvent = (customValue?: boolean): boolean => {
  if (customValue !== undefined) return customValue;
  const stage = process.env.STAGE || 'local';
  return stage !== 'prd';
};

const requestIdMiddleware = (): middy.MiddlewareObj => ({
  before: async (request) => {
    const requestId = uuidv4();
    logger.appendKeys({ requestId });

    // Extract tenantId from authorizer context if available
    const tenantId = request.event?.requestContext?.authorizer?.tenantId;
    if (tenantId) {
      logger.appendKeys({ tenantId });
    }
  },
});

export const withObservability = <TEvent = any, TResult = any>(
  handler: (event: TEvent, context: any) => Promise<TResult>,
  options?: IObservabilityOptions,
): any => {
  const { logEvent = shouldLogEvent(), clearState = true } = options || {};

  return middy(handler)
    .use(requestIdMiddleware())
    .use(
      injectLambdaContext(logger, {
        logEvent,
        clearState,
      }),
    );
};

