import type { ICognitoAdapter } from '../adapters/cognito/interfaces/cognito.adapter.interface';
import type { RefreshResult } from '../domain/auth.types';

export class RefreshTokenUseCase {
  constructor(private readonly cognito: ICognitoAdapter) {}

  async execute(refreshToken: string): Promise<RefreshResult | null> {
    return this.cognito.adminRefreshToken(refreshToken);
  }
}

import { cognitoAdapter } from '../adapters/cognito/impl/cognito.adapter';

export const refreshTokenUseCase = new RefreshTokenUseCase(cognitoAdapter);
