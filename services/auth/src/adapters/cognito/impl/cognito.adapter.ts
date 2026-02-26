import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminDeleteUserCommand,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import type { ICognitoAdapter } from '../interfaces/cognito.adapter.interface';
import type { TokenResult, RefreshResult } from '../../../domain/auth.types';

const USER_POOL_ID = process.env.USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';

class CognitoAdapter implements ICognitoAdapter {
  private readonly client: CognitoIdentityProviderClient;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.REGION || 'us-east-1',
    });
  }

  async adminCreateUser(email: string, tenantId: string, role: string): Promise<void> {
    await this.client.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:tenantId', Value: tenantId },
          { Name: 'custom:role', Value: role },
        ],
        MessageAction: MessageActionType.SUPPRESS,
      }),
    );
  }

  async adminCreateUserWithResend(email: string, tenantId: string, role: string): Promise<void> {
    await this.client.send(
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
  }

  async adminSetUserPassword(email: string, password: string): Promise<void> {
    await this.client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      }),
    );
  }

  async adminInitiateAuth(email: string, password: string): Promise<TokenResult | null> {
    const response = await this.client.send(
      new AdminInitiateAuthCommand({
        UserPoolId: USER_POOL_ID,
        ClientId: USER_POOL_CLIENT_ID,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: { USERNAME: email, PASSWORD: password },
      }),
    );

    if (!response.AuthenticationResult) return null;

    return {
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
      expiresIn: response.AuthenticationResult.ExpiresIn,
    };
  }

  async adminRefreshToken(refreshToken: string): Promise<RefreshResult | null> {
    const response = await this.client.send(
      new AdminInitiateAuthCommand({
        UserPoolId: USER_POOL_ID,
        ClientId: USER_POOL_CLIENT_ID,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: { REFRESH_TOKEN: refreshToken },
      }),
    );

    if (!response.AuthenticationResult) return null;

    return {
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
      expiresIn: response.AuthenticationResult.ExpiresIn,
    };
  }

  async adminDeleteUser(email: string): Promise<void> {
    await this.client.send(
      new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: email }),
    );
  }
}

export const cognitoAdapter = new CognitoAdapter();
