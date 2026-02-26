import { MonthlyRollupUseCase } from '../monthly-rollup.use-case';
import type { ICostRepository } from '../../repositories/interfaces/cost.repository.interface';
import type { IDailyRollup } from '@ai-platform/shared';

const mockRepo: jest.Mocked<ICostRepository> = {
  getCostEventsByConversation: jest.fn(),
  getCostEventsByTenant: jest.fn(),
  getActiveTenantIdsForDate: jest.fn(),
  putDailyRollup: jest.fn(),
  getDailyRollups: jest.fn(),
  getDailyRollupTenantIds: jest.fn(),
  putMonthlyRollup: jest.fn(),
  getMonthlyRollups: jest.fn(),
  getPricing: jest.fn(),
  putPricing: jest.fn(),
  getAllPricing: jest.fn(),
};

const makeDaily = (overrides: Partial<IDailyRollup> = {}): IDailyRollup => ({
  tenantId: 'tenant-1',
  date: '2024-01-01',
  totalInputTokens: 1000,
  totalOutputTokens: 500,
  totalEstimatedCost: 0.01,
  totalRequests: 10,
  totalConversations: 5,
  byModel: { 'claude-haiku': { inputTokens: 1000, outputTokens: 500, cost: 0.01, requests: 10 } },
  byAssistant: { 'a1': { inputTokens: 1000, outputTokens: 500, cost: 0.01, requests: 10 } },
  createdAt: '2024-01-01T03:00:00.000Z',
  ...overrides,
});

describe('MonthlyRollupUseCase', () => {
  let useCase: MonthlyRollupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new MonthlyRollupUseCase(mockRepo);
  });

  it('sums daily rollups into monthly rollup', async () => {
    const dailies = [
      makeDaily({ totalInputTokens: 1000, totalOutputTokens: 500, totalEstimatedCost: 0.01, totalRequests: 10, totalConversations: 5 }),
      makeDaily({ date: '2024-01-02', totalInputTokens: 2000, totalOutputTokens: 1000, totalEstimatedCost: 0.02, totalRequests: 20, totalConversations: 8 }),
    ];
    mockRepo.getDailyRollups.mockResolvedValue(dailies);

    await useCase.execute('tenant-1', '2024-01', '2024-01-01', '2024-01-31');

    expect(mockRepo.putMonthlyRollup).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        month: '2024-01',
        totalInputTokens: 3000,
        totalOutputTokens: 1500,
        totalEstimatedCost: 0.03,
        totalRequests: 30,
        totalConversations: 13,
      }),
    );
  });

  it('merges byModel breakdowns across daily rollups', async () => {
    const dailies = [
      makeDaily({ byModel: { 'haiku': { inputTokens: 100, outputTokens: 50, cost: 0.001, requests: 5 } } }),
      makeDaily({ byModel: { 'haiku': { inputTokens: 200, outputTokens: 100, cost: 0.002, requests: 10 }, 'sonnet': { inputTokens: 300, outputTokens: 150, cost: 0.005, requests: 3 } } }),
    ];
    mockRepo.getDailyRollups.mockResolvedValue(dailies);

    await useCase.execute('tenant-1', '2024-01', '2024-01-01', '2024-01-31');

    const saved = mockRepo.putMonthlyRollup.mock.calls[0][0];
    expect(saved.byModel?.['haiku'].requests).toBe(15);
    expect(saved.byModel?.['sonnet'].requests).toBe(3);
  });

  it('skips processing when no daily rollups found', async () => {
    mockRepo.getDailyRollups.mockResolvedValue([]);

    await useCase.execute('tenant-1', '2024-01', '2024-01-01', '2024-01-31');

    expect(mockRepo.putMonthlyRollup).not.toHaveBeenCalled();
  });
});
