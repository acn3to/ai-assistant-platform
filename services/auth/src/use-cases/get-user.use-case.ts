import type { IUser } from '@ai-platform/shared';
import type { IUserRepository } from '../repositories/interfaces/user.repository.interface';

export class GetUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(tenantId: string, email: string): Promise<IUser | null> {
    return this.userRepo.get(tenantId, email);
  }
}

import { userRepository } from '../repositories/impl/user.repository';

export const getUserUseCase = new GetUserUseCase(userRepository);
