import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { logger } from '@ai-platform/shared';

const USER_POOL_ID = process.env.USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';

let verifier: any;

const getVerifier = () => {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: USER_POOL_ID,
      tokenUse: 'id',
      clientId: USER_POOL_CLIENT_ID,
    });
  }
  return verifier;
};

const generatePolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: Record<string, string | number | boolean>,
): APIGatewayAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      },
    ],
  },
  context,
});

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const token = event.authorizationToken?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    const payload = await getVerifier().verify(token);

    const tenantId = payload['custom:tenantId'] || '';
    const role = payload['custom:role'] || 'viewer';
    const email = payload.email || '';

    logger.info('Authorization successful', { email, tenantId, role });

    // Use wildcard resource so the cached policy covers all methods/resources
    // in the same API stage (avoids cache misses causing 403 on different endpoints)
    const arnParts = event.methodArn.split('/');
    const wildcardArn = `${arnParts[0]}/*/*`;

    return generatePolicy(email, 'Allow', wildcardArn, {
      tenantId,
      role,
      email,
    });
  } catch (error) {
    logger.error('Authorization failed', { error });
    return generatePolicy('unauthorized', 'Deny', event.methodArn);
  }
};

