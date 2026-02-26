import { v4 as uuidv4 } from 'uuid';
import { logger } from '@ai-platform/shared';
import type { ITenant, IUser } from '@ai-platform/shared';
import type { ICognitoAdapter } from '../adapters/cognito/interfaces/cognito.adapter.interface';
import type { ITenantRepository } from '../repositories/interfaces/tenant.repository.interface';
import type { IUserRepository } from '../repositories/interfaces/user.repository.interface';
import type { SignupInput, SignupResult } from '../domain/auth.types';

export class SignupUseCase {
  constructor(
    private readonly cognito: ICognitoAdapter,
    private readonly tenantRepo: ITenantRepository,
    private readonly userRepo: IUserRepository,
    private readonly allowedEmails: string[] = [],
  ) {}

  async execute(input: SignupInput): Promise<SignupResult> {
    const { email, password, name, tenantName } = input;

    if (this.allowedEmails.length > 0 && !this.allowedEmails.includes(email.toLowerCase())) {
      throw new Error('EmailNotAllowed');
    }
    const tenantId = uuidv4();
    const now = new Date().toISOString();

    const tenant: ITenant = {
      tenantId,
      name: tenantName,
      plan: 'free',
      status: 'active',
      maxAssistants: 1,
      maxConversationsPerMonth: 100,
      createdAt: now,
      updatedAt: now,
    };

    await this.tenantRepo.create(tenant);
    await this.cognito.adminCreateUser(email, tenantId, 'owner');
    await this.cognito.adminSetUserPassword(email, password);

    const user: IUser = { tenantId, email, name, role: 'owner', createdAt: now, updatedAt: now };
    await this.userRepo.create(user);

    logger.info('Tenant and user created', { tenantId, email });

    const tokens = await this.cognito.adminInitiateAuth(email, password);

    return {
      tenantId,
      user: { email, name, role: 'owner' },
      accessToken: tokens?.accessToken,
      idToken: tokens?.idToken,
      refreshToken: tokens?.refreshToken,
      expiresIn: tokens?.expiresIn,
    };
  }
}

import { cognitoAdapter } from '../adapters/cognito/impl/cognito.adapter';
import { tenantRepository } from '../repositories/impl/tenant.repository';
import { userRepository } from '../repositories/impl/user.repository';

const allowedEmails = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const signupUseCase = new SignupUseCase(cognitoAdapter, tenantRepository, userRepository, allowedEmails);
