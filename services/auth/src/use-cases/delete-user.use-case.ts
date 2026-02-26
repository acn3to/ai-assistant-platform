import { logger } from '@ai-platform/shared';
import type { ICognitoAdapter } from '../adapters/cognito/interfaces/cognito.adapter.interface';
import type { IUserRepository } from '../repositories/interfaces/user.repository.interface';

export class DeleteUserUseCase {
  constructor(
    private readonly cognito: ICognitoAdapter,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(tenantId: string, email: string): Promise<void> {
    await this.cognito.adminDeleteUser(email);
    await this.userRepo.delete(tenantId, email);
    logger.info('User deleted', { tenantId, email });
  }
}

import { cognitoAdapter } from '../adapters/cognito/impl/cognito.adapter';
import { userRepository } from '../repositories/impl/user.repository';

export const deleteUserUseCase = new DeleteUserUseCase(cognitoAdapter, userRepository);
