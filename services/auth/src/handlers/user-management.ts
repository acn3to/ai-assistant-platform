import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withObservability, logger, ok, created, noContent, badRequest, forbidden, notFound, internalError } from '@ai-platform/shared';
import { createUserUseCase } from '../use-cases/create-user.use-case';
import { listUsersUseCase } from '../use-cases/list-users.use-case';
import { getUserUseCase } from '../use-cases/get-user.use-case';
import { deleteUserUseCase } from '../use-cases/delete-user.use-case';

const createUserHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId;
    const callerRole = event.requestContext.authorizer?.role;

    if (!tenantId) return badRequest('Tenant context is required');
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return forbidden('Only owners and admins can create users');
    }

    const body = JSON.parse(event.body || '{}');
    const { email, name, role } = body;

    if (!email || !name || !role) return badRequest('Email, name, and role are required');

    const user = await createUserUseCase.execute(tenantId, { email, name, role });

    return created(user);
  } catch (error) {
    logger.error('Create user failed', { error });
    return internalError('Failed to create user');
  }
};

const listUsersHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId;
    if (!tenantId) return badRequest('Tenant context is required');

    const users = await listUsersUseCase.execute(tenantId);

    return ok({ users });
  } catch (error) {
    logger.error('List users failed', { error });
    return internalError('Failed to list users');
  }
};

const getUserHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId;
    const email = event.pathParameters?.email;

    if (!tenantId || !email) return badRequest('Tenant context and email are required');

    const user = await getUserUseCase.execute(tenantId, decodeURIComponent(email));

    if (!user) return notFound('User not found');

    return ok(user);
  } catch (error) {
    logger.error('Get user failed', { error });
    return internalError('Failed to get user');
  }
};

const deleteUserHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext.authorizer?.tenantId;
    const callerRole = event.requestContext.authorizer?.role;
    const email = event.pathParameters?.email;

    if (!tenantId || !email) return badRequest('Tenant context and email are required');
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return forbidden('Only owners and admins can delete users');
    }

    await deleteUserUseCase.execute(tenantId, decodeURIComponent(email));

    return noContent();
  } catch (error) {
    logger.error('Delete user failed', { error });
    return internalError('Failed to delete user');
  }
};

export const createUser = withObservability(createUserHandler);
export const listUsers = withObservability(listUsersHandler);
export const getUser = withObservability(getUserHandler);
export const deleteUser = withObservability(deleteUserHandler);
