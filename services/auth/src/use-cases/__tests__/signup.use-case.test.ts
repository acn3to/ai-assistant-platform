import { SignupUseCase } from '../signup.use-case';
import type { ICognitoAdapter } from '../../adapters/cognito/interfaces/cognito.adapter.interface';
import type { ITenantRepository } from '../../repositories/interfaces/tenant.repository.interface';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface';

const mockCognito: jest.Mocked<ICognitoAdapter> = {
  adminCreateUser: jest.fn(),
  adminCreateUserWithResend: jest.fn(),
  adminSetUserPassword: jest.fn(),
  adminInitiateAuth: jest.fn(),
  adminRefreshToken: jest.fn(),
  adminDeleteUser: jest.fn(),
};

const mockTenantRepo: jest.Mocked<ITenantRepository> = {
  create: jest.fn(),
  get: jest.fn(),
};

const mockUserRepo: jest.Mocked<IUserRepository> = {
  create: jest.fn(),
  get: jest.fn(),
  listByTenant: jest.fn(),
  delete: jest.fn(),
};

describe('SignupUseCase', () => {
  let useCase: SignupUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    useCase = new SignupUseCase(mockCognito, mockTenantRepo, mockUserRepo, []);
  });

  it('creates tenant, cognito user, dynamo user, then auto-logs in', async () => {
    mockCognito.adminInitiateAuth.mockResolvedValue({
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    });

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'Test@1234',
      name: 'Test User',
      tenantName: 'Test Corp',
    });

    expect(mockTenantRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Corp', plan: 'free', status: 'active' }),
    );
    expect(mockCognito.adminCreateUser).toHaveBeenCalledWith('test@example.com', expect.any(String), 'owner');
    expect(mockCognito.adminSetUserPassword).toHaveBeenCalledWith('test@example.com', 'Test@1234');
    expect(mockUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', role: 'owner' }),
    );
    expect(result.user).toEqual({ email: 'test@example.com', name: 'Test User', role: 'owner' });
    expect(result.accessToken).toBe('access-token');
    expect(result.tenantId).toBeDefined();
  });

  it('returns null tokens if cognito auth fails after signup', async () => {
    mockCognito.adminInitiateAuth.mockResolvedValue(null);

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'Test@1234',
      name: 'Test User',
      tenantName: 'Test Corp',
    });

    expect(result.accessToken).toBeUndefined();
    expect(result.idToken).toBeUndefined();
  });

  it('propagates error if tenantRepo.create throws', async () => {
    mockTenantRepo.create.mockRejectedValue(new Error('DynamoDB error'));

    await expect(
      useCase.execute({ email: 'a@b.com', password: 'pass', name: 'name', tenantName: 'corp' }),
    ).rejects.toThrow('DynamoDB error');
  });

  describe('email allowlist', () => {
    it('rejects emails not in the allowlist', async () => {
      useCase = new SignupUseCase(mockCognito, mockTenantRepo, mockUserRepo, ['allowed@example.com']);

      await expect(
        useCase.execute({ email: 'blocked@example.com', password: 'pass', name: 'name', tenantName: 'corp' }),
      ).rejects.toThrow('EmailNotAllowed');

      expect(mockTenantRepo.create).not.toHaveBeenCalled();
      expect(mockCognito.adminCreateUser).not.toHaveBeenCalled();
    });

    it('allows emails in the allowlist (case-insensitive)', async () => {
      mockCognito.adminInitiateAuth.mockResolvedValue({ accessToken: 'tok', idToken: 'id', refreshToken: 'ref', expiresIn: 3600 });
      useCase = new SignupUseCase(mockCognito, mockTenantRepo, mockUserRepo, ['allowed@example.com']);

      await expect(
        useCase.execute({ email: 'ALLOWED@EXAMPLE.COM', password: 'pass', name: 'name', tenantName: 'corp' }),
      ).resolves.toBeDefined();

      expect(mockTenantRepo.create).toHaveBeenCalled();
    });

    it('allows all emails when allowlist is empty', async () => {
      mockCognito.adminInitiateAuth.mockResolvedValue(null);
      useCase = new SignupUseCase(mockCognito, mockTenantRepo, mockUserRepo, []);

      await expect(
        useCase.execute({ email: 'anyone@example.com', password: 'pass', name: 'name', tenantName: 'corp' }),
      ).resolves.toBeDefined();
    });
  });
});
