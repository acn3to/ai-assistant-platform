import { ScheduledEvent } from 'aws-lambda';
import { logger } from '@ai-platform/shared';
import { costRepository } from '../repositories/impl/cost.repository';
import { dailyRollupUseCase } from '../use-cases/daily-rollup.use-case';
import { monthlyRollupUseCase } from '../use-cases/monthly-rollup.use-case';

export const dailyRollup = async (_event: ScheduledEvent): Promise<void> => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  logger.info('Starting daily rollup', { date: dateStr });

  try {
    const activeTenants = await costRepository.getActiveTenantIdsForDate(dateStr);
    logger.info('Found active tenants', { count: activeTenants.size, date: dateStr });

    for (const tenantId of activeTenants) {
      try {
        await dailyRollupUseCase.execute(tenantId, dateStr);
      } catch (error) {
        logger.error('Failed to process rollup for tenant', { tenantId, error });
      }
    }

    logger.info('Daily rollup completed', { date: dateStr, tenantsProcessed: activeTenants.size });
  } catch (error) {
    logger.error('Daily rollup failed', { error, date: dateStr });
    throw error;
  }
};

export const monthlyRollup = async (_event: ScheduledEvent): Promise<void> => {
  const today = new Date();
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const monthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
  const startDate = `${monthStr}-01`;
  const endDate = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  logger.info('Starting monthly rollup', { month: monthStr });

  try {
    const tenantIds = await costRepository.getDailyRollupTenantIds(startDate, endDate);

    for (const tenantId of tenantIds) {
      try {
        await monthlyRollupUseCase.execute(tenantId, monthStr, startDate, endDate);
      } catch (error) {
        logger.error('Failed monthly rollup for tenant', { tenantId, error });
      }
    }

    logger.info('Monthly rollup completed', { month: monthStr, tenantsProcessed: tenantIds.size });
  } catch (error) {
    logger.error('Monthly rollup failed', { error, month: monthStr });
    throw error;
  }
};
