export type UserRole = 'owner' | 'admin' | 'viewer';

export interface IUser {
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  cognitoSub?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

