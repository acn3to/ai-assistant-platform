import { RefreshTokenUseCase } from '../refresh-token.use-case';
import type { ICognitoAdapter } from '../../adapters/cognito/interfaces/cognito.adapter.interface';

const mockCognito: jest.Mocked<ICognitoAdapter> = {
  adminCreateUser: jest.fn(),
  adminCreateUserWithResend: jest.fn(),
  adminSetUserPassword: jest.fn(),
  adminInitiateAuth: jest.fn(),
  adminRefreshToken: jest.fn(),
  adminDeleteUser: jest.fn(),
};

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RefreshTokenUseCase(mockCognito);
  });

  it('returns new tokens on valid refresh token', async () => {
    mockCognito.adminRefreshToken.mockResolvedValue({
      accessToken: 'new-access',
      idToken: 'new-id',
      expiresIn: 3600,
    });

    const result = await useCase.execute('valid-refresh-token');

    expect(mockCognito.adminRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(result?.accessToken).toBe('new-access');
    expect(result?.expiresIn).toBe(3600);
  });

  it('returns null when refresh token is invalid', async () => {
    mockCognito.adminRefreshToken.mockResolvedValue(null);

    const result = await useCase.execute('invalid-token');

    expect(result).toBeNull();
  });
});
