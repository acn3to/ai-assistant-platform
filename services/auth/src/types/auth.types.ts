import type { UserRole } from '@ai-platform/shared';

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  tenantName: string;
}

export interface LoginResult {
  accessToken: string | undefined;
  idToken: string | undefined;
  refreshToken: string | undefined;
  expiresIn: number | undefined;
}

export interface RefreshResult {
  accessToken: string | undefined;
  idToken: string | undefined;
  expiresIn: number | undefined;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
}

