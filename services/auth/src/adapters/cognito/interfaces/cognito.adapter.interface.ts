import type { TokenResult, RefreshResult } from '../../../domain/auth.types';

export interface ICognitoAdapter {
  adminCreateUser(email: string, tenantId: string, role: string): Promise<void>;
  adminCreateUserWithResend(email: string, tenantId: string, role: string): Promise<void>;
  adminSetUserPassword(email: string, password: string): Promise<void>;
  adminInitiateAuth(email: string, password: string): Promise<TokenResult | null>;
  adminRefreshToken(refreshToken: string): Promise<RefreshResult | null>;
  adminDeleteUser(email: string): Promise<void>;
}
