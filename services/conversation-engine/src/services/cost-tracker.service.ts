import { logger } from '@ai-platform/shared';
import type { ICostEvent } from '@ai-platform/shared';
import type { ICostEventRepository } from '../repositories/interfaces/cost-event.repository.interface';
import { costEventRepository } from '../repositories/impl/cost-event.repository';

export interface ICostTracker {
  trackEvent(event: Omit<ICostEvent, 'timestamp'>): Promise<void>;
}

class CostTracker implements ICostTracker {
  constructor(private readonly repo: ICostEventRepository) {}

  async trackEvent(event: Omit<ICostEvent, 'timestamp'>): Promise<void> {
    const timestamp = new Date().toISOString();
    try {
      await this.repo.save({ ...event, timestamp });
    } catch (error) {
      // Cost tracking must not fail the main request
      logger.warn('Failed to track cost event', { error, event });
    }
  }
}

export const costTracker = new CostTracker(costEventRepository);
