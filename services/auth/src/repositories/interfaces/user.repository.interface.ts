import type { IUser } from '@ai-platform/shared';

export interface IUserRepository {
  create(user: IUser): Promise<void>;
  get(tenantId: string, email: string): Promise<IUser | null>;
  listByTenant(tenantId: string): Promise<IUser[]>;
  delete(tenantId: string, email: string): Promise<void>;
}
