import { logger } from '@ai-platform/shared';
import type { IDailyRollup, IMonthlyRollup } from '@ai-platform/shared';
import type { ICostRepository } from '../repositories/interfaces/cost.repository.interface';
import { costRepository } from '../repositories/impl/cost.repository';

type BreakdownEntry = { inputTokens: number; outputTokens: number; cost: number; requests: number };

export class MonthlyRollupUseCase {
  constructor(private readonly repo: ICostRepository) {}

  async execute(tenantId: string, monthStr: string, startDate: string, endDate: string): Promise<void> {
    const dailyRollups = await this.repo.getDailyRollups(tenantId, startDate, endDate);
    if (dailyRollups.length === 0) return;

    const monthlyData: IMonthlyRollup = {
      tenantId,
      month: monthStr,
      totalInputTokens: dailyRollups.reduce((sum, r) => sum + r.totalInputTokens, 0),
      totalOutputTokens: dailyRollups.reduce((sum, r) => sum + r.totalOutputTokens, 0),
      totalEstimatedCost: dailyRollups.reduce((sum, r) => sum + r.totalEstimatedCost, 0),
      totalRequests: dailyRollups.reduce((sum, r) => sum + r.totalRequests, 0),
      totalConversations: dailyRollups.reduce((sum, r) => sum + r.totalConversations, 0),
      byModel: this.mergeBreakdowns(dailyRollups, 'byModel'),
      byAssistant: this.mergeBreakdowns(dailyRollups, 'byAssistant'),
      createdAt: new Date().toISOString(),
    };

    await this.repo.putMonthlyRollup(monthlyData);

    logger.info('Monthly rollup saved for tenant', {
      tenantId,
      month: monthStr,
      totalCost: monthlyData.totalEstimatedCost,
    });
  }

  private mergeBreakdowns(
    rollups: IDailyRollup[],
    field: 'byModel' | 'byAssistant',
  ): Record<string, BreakdownEntry> {
    const result: Record<string, BreakdownEntry> = {};
    for (const rollup of rollups) {
      const breakdown = rollup[field];
      if (!breakdown) continue;
      for (const [key, data] of Object.entries(breakdown)) {
        if (!result[key]) result[key] = { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 };
        result[key].inputTokens += data.inputTokens;
        result[key].outputTokens += data.outputTokens;
        result[key].cost += data.cost;
        result[key].requests += data.requests;
      }
    }
    return result;
  }
}

export const monthlyRollupUseCase = new MonthlyRollupUseCase(costRepository);
