import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withObservability, logger, ok, created, badRequest, internalError, unauthorized, forbidden } from '@ai-platform/shared';
import { signupUseCase } from '../use-cases/signup.use-case';
import { loginUseCase } from '../use-cases/login.use-case';
import { refreshTokenUseCase } from '../use-cases/refresh-token.use-case';

const loginHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) return badRequest('Email and password are required');

    const result = await loginUseCase.execute(email, password);

    if (!result) return unauthorized('Invalid credentials');

    return ok(result);
  } catch (error) {
    logger.error('Login failed', { error });
    return internalError('Authentication failed');
  }
};

const signupHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, name, tenantName } = body;

    if (!email || !password || !name || !tenantName) {
      return badRequest('Email, password, name, and tenantName are required');
    }

    const result = await signupUseCase.execute({ email, password, name, tenantName });

    return created(result);
  } catch (error: unknown) {
    logger.error('Signup failed', { error });
    if (error instanceof Error && error.message === 'EmailNotAllowed') {
      return forbidden('Registration is by invitation only');
    }
    if (error instanceof Error && error.name === 'UsernameExistsException') {
      return badRequest('User already exists');
    }
    return internalError('Registration failed');
  }
};

const refreshTokenHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { refreshToken } = body;

    if (!refreshToken) return badRequest('Refresh token is required');

    const result = await refreshTokenUseCase.execute(refreshToken);

    if (!result) return unauthorized('Invalid refresh token');

    return ok(result);
  } catch (error) {
    logger.error('Token refresh failed', { error });
    return internalError('Token refresh failed');
  }
};

export const login = withObservability(loginHandler);
export const signup = withObservability(signupHandler);
export const refreshToken = withObservability(refreshTokenHandler);
