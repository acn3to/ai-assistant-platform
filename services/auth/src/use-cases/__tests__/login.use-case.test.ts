import { LoginUseCase } from '../login.use-case';
import type { ICognitoAdapter } from '../../adapters/cognito/interfaces/cognito.adapter.interface';

const mockCognito: jest.Mocked<ICognitoAdapter> = {
  adminCreateUser: jest.fn(),
  adminCreateUserWithResend: jest.fn(),
  adminSetUserPassword: jest.fn(),
  adminInitiateAuth: jest.fn(),
  adminRefreshToken: jest.fn(),
  adminDeleteUser: jest.fn(),
};

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LoginUseCase(mockCognito);
  });

  it('returns tokens on successful login', async () => {
    mockCognito.adminInitiateAuth.mockResolvedValue({
      accessToken: 'access',
      idToken: 'id',
      refreshToken: 'refresh',
      expiresIn: 3600,
    });

    const result = await useCase.execute('user@example.com', 'password');

    expect(mockCognito.adminInitiateAuth).toHaveBeenCalledWith('user@example.com', 'password');
    expect(result?.accessToken).toBe('access');
  });

  it('returns null on invalid credentials', async () => {
    mockCognito.adminInitiateAuth.mockResolvedValue(null);

    const result = await useCase.execute('user@example.com', 'wrong');

    expect(result).toBeNull();
  });

  it('propagates Cognito errors', async () => {
    mockCognito.adminInitiateAuth.mockRejectedValue(new Error('NotAuthorizedException'));

    await expect(useCase.execute('user@example.com', 'bad')).rejects.toThrow('NotAuthorizedException');
  });
});
