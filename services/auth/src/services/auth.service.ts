import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminUpdateUserAttributesCommand,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@ai-platform/shared';
import { tenantRepository } from '../repositories/tenant.repository';
import { userRepository } from '../repositories/user.repository';
import type { SignupInput } from '../types';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.REGION || 'us-east-1',
});

const USER_POOL_ID = process.env.USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';

class AuthService {
  async login(email: string, password: string) {
    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult) {
      return null;
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
      expiresIn: response.AuthenticationResult.ExpiresIn,
    };
  }

  async signup(input: SignupInput) {
    const { email, password, name, tenantName } = input;
    const tenantId = uuidv4();
    const now = new Date().toISOString();

    // Create tenant record
    await tenantRepository.create({
      tenantId,
      name: tenantName,
      plan: 'free',
      status: 'active',
      maxAssistants: 1,
      maxConversationsPerMonth: 100,
      createdAt: now,
      updatedAt: now,
    });

    // Create Cognito user
    await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:tenantId', Value: tenantId },
          { Name: 'custom:role', Value: 'owner' },
        ],
        MessageAction: MessageActionType.SUPPRESS,
      }),
    );

    // Set permanent password
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      }),
    );

    // Create user record in DynamoDB
    await userRepository.create({
      tenantId,
      email,
      name,
      role: 'owner',
      createdAt: now,
      updatedAt: now,
    });

    logger.info('Tenant and user created', { tenantId, email });

    // Auto-login
    const tokens = await this.login(email, password);

    return {
      tenantId,
      user: { email, name, role: 'owner' },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult) {
      return null;
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
      expiresIn: response.AuthenticationResult.ExpiresIn,
    };
  }
}

export const authService = new AuthService();

