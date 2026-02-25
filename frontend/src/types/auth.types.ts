export interface AuthUser {
  email: string;
  name: string;
  tenantId: string;
  role: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

