import { ListUsersUseCase } from '../list-users.use-case';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface';
import type { IUser } from '@ai-platform/shared';

const mockUserRepo: jest.Mocked<IUserRepository> = {
  create: jest.fn(),
  get: jest.fn(),
  listByTenant: jest.fn(),
  delete: jest.fn(),
};

const makeUser = (email: string): IUser => ({
  tenantId: 'tenant-1',
  email,
  name: 'Test',
  role: 'viewer',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListUsersUseCase(mockUserRepo);
  });

  it('returns all users for the tenant', async () => {
    const users = [makeUser('a@example.com'), makeUser('b@example.com')];
    mockUserRepo.listByTenant.mockResolvedValue(users);

    const result = await useCase.execute('tenant-1');

    expect(mockUserRepo.listByTenant).toHaveBeenCalledWith('tenant-1');
    expect(result).toHaveLength(2);
    expect(result[0].email).toBe('a@example.com');
  });

  it('returns empty array when no users exist', async () => {
    mockUserRepo.listByTenant.mockResolvedValue([]);

    const result = await useCase.execute('tenant-1');

    expect(result).toHaveLength(0);
  });
});
