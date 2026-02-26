import { logger } from '@ai-platform/shared';
import type { ICostEvent, IDailyRollup } from '@ai-platform/shared';
import type { ICostRepository } from '../repositories/interfaces/cost.repository.interface';
import { costRepository } from '../repositories/impl/cost.repository';

type BreakdownEntry = { inputTokens: number; outputTokens: number; cost: number; requests: number };

export class DailyRollupUseCase {
  constructor(private readonly repo: ICostRepository) {}

  async execute(tenantId: string, dateStr: string): Promise<void> {
    const startTimestamp = `${dateStr}T00:00:00.000Z`;
    const endTimestamp = `${dateStr}T23:59:59.999Z`;

    const events = await this.repo.getCostEventsByTenant(tenantId, startTimestamp, endTimestamp);
    if (events.length === 0) return;

    const rollup: IDailyRollup = {
      tenantId,
      date: dateStr,
      totalInputTokens: events.reduce((sum, e) => sum + e.inputTokens, 0),
      totalOutputTokens: events.reduce((sum, e) => sum + e.outputTokens, 0),
      totalEstimatedCost: Math.round(events.reduce((sum, e) => sum + e.estimatedCost, 0) * 10000) / 10000,
      totalRequests: events.length,
      totalConversations: new Set(events.map((e) => e.conversationId).filter(Boolean)).size,
      byModel: this.aggregateByField(events, (e) => e.modelId || 'unknown'),
      byAssistant: this.aggregateByField(events, (e) => e.assistantId || 'unknown'),
      createdAt: new Date().toISOString(),
    };

    await this.repo.putDailyRollup(rollup);

    logger.info('Daily rollup saved for tenant', {
      tenantId,
      date: dateStr,
      totalCost: rollup.totalEstimatedCost,
      totalRequests: rollup.totalRequests,
      totalConversations: rollup.totalConversations,
    });
  }

  private aggregateByField(
    events: ICostEvent[],
    getKey: (e: ICostEvent) => string,
  ): Record<string, BreakdownEntry> {
    const result: Record<string, BreakdownEntry> = {};
    for (const event of events) {
      const key = getKey(event);
      if (!result[key]) result[key] = { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 };
      result[key].inputTokens += event.inputTokens;
      result[key].outputTokens += event.outputTokens;
      result[key].cost += event.estimatedCost;
      result[key].requests += 1;
    }
    return result;
  }
}

export const dailyRollupUseCase = new DailyRollupUseCase(costRepository);
