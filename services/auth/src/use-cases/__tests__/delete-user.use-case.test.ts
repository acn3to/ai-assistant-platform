import { DeleteUserUseCase } from '../delete-user.use-case';
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

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DeleteUserUseCase(mockCognito, mockUserRepo);
  });

  it('deletes from Cognito and DynamoDB', async () => {
    await useCase.execute('tenant-1', 'user@example.com');

    expect(mockCognito.adminDeleteUser).toHaveBeenCalledWith('user@example.com');
    expect(mockUserRepo.delete).toHaveBeenCalledWith('tenant-1', 'user@example.com');
  });

  it('propagates Cognito error without deleting from DynamoDB', async () => {
    mockCognito.adminDeleteUser.mockRejectedValue(new Error('UserNotFoundException'));

    await expect(useCase.execute('tenant-1', 'user@example.com')).rejects.toThrow('UserNotFoundException');

    expect(mockUserRepo.delete).not.toHaveBeenCalled();
  });
});
