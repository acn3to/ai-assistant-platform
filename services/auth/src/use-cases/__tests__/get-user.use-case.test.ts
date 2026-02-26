import { GetUserUseCase } from '../get-user.use-case';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface';
import type { IUser } from '@ai-platform/shared';

const mockUserRepo: jest.Mocked<IUserRepository> = {
  create: jest.fn(),
  get: jest.fn(),
  listByTenant: jest.fn(),
  delete: jest.fn(),
};

const makeUser = (): IUser => ({
  tenantId: 'tenant-1',
  email: 'user@example.com',
  name: 'Test User',
  role: 'viewer',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

describe('GetUserUseCase', () => {
  let useCase: GetUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetUserUseCase(mockUserRepo);
  });

  it('returns user when found', async () => {
    mockUserRepo.get.mockResolvedValue(makeUser());

    const result = await useCase.execute('tenant-1', 'user@example.com');

    expect(mockUserRepo.get).toHaveBeenCalledWith('tenant-1', 'user@example.com');
    expect(result?.email).toBe('user@example.com');
  });

  it('returns null when user not found', async () => {
    mockUserRepo.get.mockResolvedValue(null);

    const result = await useCase.execute('tenant-1', 'missing@example.com');

    expect(result).toBeNull();
  });
});
