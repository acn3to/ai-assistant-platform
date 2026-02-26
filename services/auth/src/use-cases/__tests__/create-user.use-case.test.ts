import { CreateUserUseCase } from '../create-user.use-case';
import type { ICognitoAdapter } from '../../adapters/cognito/interfaces/cognito.adapter.interface';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface';

const mockCognito: jest.Mocked<ICognitoAdapter> = {
  adminCreateUser: jest.fn(),
  adminCreateUserWithResend: jest.fn(),
  adminSetUserPassword: jest.fn(),
  adminInitiateAuth: jest.fn(),
  adminRefreshToken: jest.fn(),
  adminDeleteUser: jest.fn(),
};

const mockUserRepo: jest.Mocked<IUserRepository> = {
  create: jest.fn(),
  get: jest.fn(),
  listByTenant: jest.fn(),
  delete: jest.fn(),
};

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateUserUseCase(mockCognito, mockUserRepo);
  });

  it('creates cognito user then saves to DynamoDB', async () => {
    const result = await useCase.execute('tenant-1', {
      email: 'member@example.com',
      name: 'Member',
      role: 'viewer',
    });

    expect(mockCognito.adminCreateUserWithResend).toHaveBeenCalledWith('member@example.com', 'tenant-1', 'viewer');
    expect(mockUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', email: 'member@example.com', role: 'viewer' }),
    );
    expect(result.email).toBe('member@example.com');
    expect(result.role).toBe('viewer');
  });

  it('propagates Cognito error without saving to DynamoDB', async () => {
    mockCognito.adminCreateUserWithResend.mockRejectedValue(new Error('UserAlreadyExists'));

    await expect(
      useCase.execute('tenant-1', { email: 'a@b.com', name: 'A', role: 'admin' }),
    ).rejects.toThrow('UserAlreadyExists');

    expect(mockUserRepo.create).not.toHaveBeenCalled();
  });
});
