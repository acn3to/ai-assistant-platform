import { DailyRollupUseCase } from '../daily-rollup.use-case';
import type { ICostRepository } from '../../repositories/interfaces/cost.repository.interface';
import type { ICostEvent } from '@ai-platform/shared';

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

const makeEvent = (overrides: Partial<ICostEvent> = {}): ICostEvent => ({
  conversationId: 'conv-1',
  tenantId: 'tenant-1',
  assistantId: 'assistant-1',
  requestType: 'converse',
  modelId: 'claude-haiku',
  inputTokens: 100,
  outputTokens: 50,
  latencyMs: 200,
  estimatedCost: 0.001,
  timestamp: '2024-01-15T10:00:00.000Z',
  ...overrides,
});

describe('DailyRollupUseCase', () => {
  let useCase: DailyRollupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DailyRollupUseCase(mockRepo);
  });

  it('aggregates events by model and assistant', async () => {
    const events = [
      makeEvent({ modelId: 'claude-haiku', assistantId: 'a1', inputTokens: 100, outputTokens: 50, estimatedCost: 0.001 }),
      makeEvent({ modelId: 'claude-haiku', assistantId: 'a1', inputTokens: 200, outputTokens: 100, estimatedCost: 0.002 }),
      makeEvent({ modelId: 'claude-sonnet', assistantId: 'a2', inputTokens: 300, outputTokens: 150, estimatedCost: 0.005 }),
    ];
    mockRepo.getCostEventsByTenant.mockResolvedValue(events);

    await useCase.execute('tenant-1', '2024-01-15');

    expect(mockRepo.putDailyRollup).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        date: '2024-01-15',
        totalInputTokens: 600,
        totalOutputTokens: 300,
        totalRequests: 3,
      }),
    );

    const saved = mockRepo.putDailyRollup.mock.calls[0][0];
    expect(saved.byModel?.['claude-haiku'].requests).toBe(2);
    expect(saved.byModel?.['claude-sonnet'].requests).toBe(1);
    expect(saved.byAssistant?.['a1'].inputTokens).toBe(300);
    expect(saved.byAssistant?.['a2'].inputTokens).toBe(300);
  });

  it('counts unique conversations', async () => {
    const events = [
      makeEvent({ conversationId: 'conv-1' }),
      makeEvent({ conversationId: 'conv-1' }),
      makeEvent({ conversationId: 'conv-2' }),
    ];
    mockRepo.getCostEventsByTenant.mockResolvedValue(events);

    await useCase.execute('tenant-1', '2024-01-15');

    const saved = mockRepo.putDailyRollup.mock.calls[0][0];
    expect(saved.totalConversations).toBe(2);
  });

  it('skips processing when no events found', async () => {
    mockRepo.getCostEventsByTenant.mockResolvedValue([]);

    await useCase.execute('tenant-1', '2024-01-15');

    expect(mockRepo.putDailyRollup).not.toHaveBeenCalled();
  });

  it('rounds cost to 4 decimal places', async () => {
    mockRepo.getCostEventsByTenant.mockResolvedValue([
      makeEvent({ estimatedCost: 0.00123456 }),
      makeEvent({ estimatedCost: 0.00234567 }),
    ]);

    await useCase.execute('tenant-1', '2024-01-15');

    const saved = mockRepo.putDailyRollup.mock.calls[0][0];
    expect(saved.totalEstimatedCost).toBe(0.0036); // rounded to 4 decimals
  });
});
