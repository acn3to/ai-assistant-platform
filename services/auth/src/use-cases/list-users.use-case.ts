import type { IUser } from '@ai-platform/shared';
import type { IUserRepository } from '../repositories/interfaces/user.repository.interface';

export class ListUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(tenantId: string): Promise<IUser[]> {
    return this.userRepo.listByTenant(tenantId);
  }
}

import { userRepository } from '../repositories/impl/user.repository';

export const listUsersUseCase = new ListUsersUseCase(userRepository);
