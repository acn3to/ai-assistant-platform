import { logger } from '@ai-platform/shared';
import type { IUser } from '@ai-platform/shared';
import type { ICognitoAdapter } from '../adapters/cognito/interfaces/cognito.adapter.interface';
import type { IUserRepository } from '../repositories/interfaces/user.repository.interface';
import type { CreateUserInput } from '../domain/auth.types';

export class CreateUserUseCase {
  constructor(
    private readonly cognito: ICognitoAdapter,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(tenantId: string, input: CreateUserInput): Promise<IUser> {
    const { email, name, role } = input;
    const now = new Date().toISOString();

    await this.cognito.adminCreateUserWithResend(email, tenantId, role);

    const user: IUser = { tenantId, email, name, role, createdAt: now, updatedAt: now };
    await this.userRepo.create(user);

    logger.info('User created', { tenantId, email, role });

    return user;
  }
}

import { cognitoAdapter } from '../adapters/cognito/impl/cognito.adapter';
import { userRepository } from '../repositories/impl/user.repository';

export const createUserUseCase = new CreateUserUseCase(cognitoAdapter, userRepository);
