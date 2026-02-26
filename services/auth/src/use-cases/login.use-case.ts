import type { ICognitoAdapter } from '../adapters/cognito/interfaces/cognito.adapter.interface';
import type { TokenResult } from '../domain/auth.types';

export class LoginUseCase {
  constructor(private readonly cognito: ICognitoAdapter) {}

  async execute(email: string, password: string): Promise<TokenResult | null> {
    return this.cognito.adminInitiateAuth(email, password);
  }
}

import { cognitoAdapter } from '../adapters/cognito/impl/cognito.adapter';

export const loginUseCase = new LoginUseCase(cognitoAdapter);
