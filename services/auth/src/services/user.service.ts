import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '@ai-platform/shared';
import { userRepository } from '../repositories/user.repository';
import type { IUser } from '@ai-platform/shared';
import type { CreateUserInput } from '../types';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.REGION || 'us-east-1',
});

const USER_POOL_ID = process.env.USER_POOL_ID || '';

class UserService {
  async createUser(tenantId: string, input: CreateUserInput): Promise<IUser> {
    const { email, name, role } = input;
    const now = new Date().toISOString();

    // Create Cognito user with temporary password
    await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:tenantId', Value: tenantId },
          { Name: 'custom:role', Value: role },
        ],
        MessageAction: MessageActionType.RESEND,
      }),
    );

    const user: IUser = {
      tenantId,
      email,
      name,
      role,
      createdAt: now,
      updatedAt: now,
    };

    await userRepository.create(user);

    logger.info('User created', { tenantId, email, role });

    return user;
  }

  async listUsers(tenantId: string): Promise<IUser[]> {
    return userRepository.listByTenant(tenantId);
  }

  async getUser(tenantId: string, email: string): Promise<IUser | null> {
    return userRepository.get(tenantId, email);
  }

  async deleteUser(tenantId: string, email: string): Promise<void> {
    await cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      }),
    );

    await userRepository.delete(tenantId, email);

    logger.info('User deleted', { tenantId, email });
  }
}

export const userService = new UserService();

