import { ScheduledEvent } from 'aws-lambda';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, logger, keys } from '@ai-platform/shared';
import { costRepository } from '../repositories/cost.repository';
import type { ICostEvent, IDailyRollup, IMonthlyRollup, IPricingConfig } from '@ai-platform/shared';

/**
 * Daily cron Lambda that computes cost rollups from raw CostEvents.
 * Runs at 2 AM UTC daily, processing the previous day's events.
 * Follows the event-store-design skill's append-only pattern.
 */
export const dailyRollup = async (_event: ScheduledEvent): Promise<void> => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
  const monthStr = dateStr.substring(0, 7); // YYYY-MM

  logger.info('Starting daily rollup', { date: dateStr });

  try {
    // Step 1: Get all pricing configs for cost recalculation if needed
    const pricingConfigs = await costRepository.getAllPricing();
    const pricingMap = new Map<string, IPricingConfig>();
    for (const config of pricingConfigs) {
      pricingMap.set(config.modelId, config);
    }

    // Step 2: Find all tenants with activity by scanning for cost events from yesterday
    // We use GSI1 which has GSI1PK = TENANT#<id>, GSI1SK = COST#<timestamp>
    // Since we don't maintain a separate active-tenants list in MVP, we scan for
    // distinct tenants from yesterday's cost events using a sparse scan approach.
    const activeTenants = await findActiveTenants(dateStr);

    logger.info('Found active tenants', { count: activeTenants.size, date: dateStr });

    // Step 3: For each tenant, query their cost events and aggregate
    for (const tenantId of activeTenants) {
      try {
        await processTenantDailyRollup(tenantId, dateStr, monthStr);
      } catch (error) {
        logger.error('Failed to process rollup for tenant', { tenantId, error });
        // Continue processing other tenants even if one fails
      }
    }

    logger.info('Daily rollup completed', {
      date: dateStr,
      tenantsProcessed: activeTenants.size,
    });
  } catch (error) {
    logger.error('Daily rollup failed', { error, date: dateStr });
    throw error;
  }
};

/**
 * Monthly rollup cron - runs on the 1st of each month at 3 AM UTC.
 * Aggregates all daily rollups from the previous month into monthly summaries.
 */
export const monthlyRollup = async (_event: ScheduledEvent): Promise<void> => {
  const today = new Date();
  // Get previous month
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const monthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();

  const startDate = `${monthStr}-01`;
  const endDate = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  logger.info('Starting monthly rollup', { month: monthStr });

  try {
    // Find all tenants that had daily rollups in the previous month
    // by scanning daily rollups
    const tenantIds = new Set<string>();
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression:
            'entityType = :et AND #d BETWEEN :start AND :end',
          ExpressionAttributeNames: { '#d': 'date' },
          ExpressionAttributeValues: {
            ':et': 'DailyRollup',
            ':start': startDate,
            ':end': endDate,
          },
          ProjectionExpression: 'tenantId',
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );

      for (const item of result.Items || []) {
        if (item.tenantId) tenantIds.add(item.tenantId as string);
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // For each tenant, aggregate their daily rollups into a monthly rollup
    for (const tenantId of tenantIds) {
      try {
        const dailyRollups = await costRepository.getDailyRollups(tenantId, startDate, endDate);

        if (dailyRollups.length === 0) continue;

        const monthlyData: IMonthlyRollup = {
          tenantId,
          month: monthStr,
          totalInputTokens: dailyRollups.reduce((sum, r) => sum + r.totalInputTokens, 0),
          totalOutputTokens: dailyRollups.reduce((sum, r) => sum + r.totalOutputTokens, 0),
          totalEstimatedCost: dailyRollups.reduce((sum, r) => sum + r.totalEstimatedCost, 0),
          totalRequests: dailyRollups.reduce((sum, r) => sum + r.totalRequests, 0),
          totalConversations: dailyRollups.reduce((sum, r) => sum + r.totalConversations, 0),
          byModel: aggregateByModel(dailyRollups),
          byAssistant: aggregateByAssistant(dailyRollups),
          createdAt: new Date().toISOString(),
        };

        await costRepository.putMonthlyRollup(monthlyData);

        logger.info('Monthly rollup saved for tenant', {
          tenantId,
          month: monthStr,
          totalCost: monthlyData.totalEstimatedCost,
        });
      } catch (error) {
        logger.error('Failed monthly rollup for tenant', { tenantId, error });
      }
    }

    logger.info('Monthly rollup completed', {
      month: monthStr,
      tenantsProcessed: tenantIds.size,
    });
  } catch (error) {
    logger.error('Monthly rollup failed', { error, month: monthStr });
    throw error;
  }
};

/**
 * Find all tenants that had cost events on a given date.
 * Uses a scan with filter on entityType and timestamp range.
 * In production at scale, this would be replaced with a DynamoDB Stream
 * or a separate "active tenants" tracking mechanism.
 */
async function findActiveTenants(dateStr: string): Promise<Set<string>> {
  const tenantIds = new Set<string>();
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
          'entityType = :et AND begins_with(#ts, :datePrefix)',
        ExpressionAttributeNames: { '#ts': 'timestamp' },
        ExpressionAttributeValues: {
          ':et': 'CostEvent',
          ':datePrefix': dateStr,
        },
        ProjectionExpression: 'tenantId',
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );

    for (const item of result.Items || []) {
      if (item.tenantId) tenantIds.add(item.tenantId as string);
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return tenantIds;
}

/**
 * Process daily rollup for a single tenant.
 * Queries all cost events for the tenant on the given date,
 * aggregates them, and writes the rollup record.
 */
async function processTenantDailyRollup(
  tenantId: string,
  dateStr: string,
  monthStr: string,
): Promise<void> {
  const startTimestamp = `${dateStr}T00:00:00.000Z`;
  const endTimestamp = `${dateStr}T23:59:59.999Z`;

  // Query cost events for this tenant on this date via GSI1
  const events = await costRepository.getCostEventsByTenant(
    tenantId,
    startTimestamp,
    endTimestamp,
  );

  if (events.length === 0) return;

  // Aggregate by model
  const modelBreakdown: Record<string, { inputTokens: number; outputTokens: number; cost: number; requests: number }> = {};
  const assistantBreakdown: Record<string, { inputTokens: number; outputTokens: number; cost: number; requests: number }> = {};
  const conversationIds = new Set<string>();

  for (const event of events) {
    // By model
    const modelKey = event.modelId || 'unknown';
    if (!modelBreakdown[modelKey]) {
      modelBreakdown[modelKey] = { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 };
    }
    modelBreakdown[modelKey].inputTokens += event.inputTokens;
    modelBreakdown[modelKey].outputTokens += event.outputTokens;
    modelBreakdown[modelKey].cost += event.estimatedCost;
    modelBreakdown[modelKey].requests += 1;

    // By assistant
    const assistantKey = event.assistantId || 'unknown';
    if (!assistantBreakdown[assistantKey]) {
      assistantBreakdown[assistantKey] = { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 };
    }
    assistantBreakdown[assistantKey].inputTokens += event.inputTokens;
    assistantBreakdown[assistantKey].outputTokens += event.outputTokens;
    assistantBreakdown[assistantKey].cost += event.estimatedCost;
    assistantBreakdown[assistantKey].requests += 1;

    // Track unique conversations
    if (event.conversationId) {
      conversationIds.add(event.conversationId);
    }
  }

  // Build the daily rollup
  const rollup: IDailyRollup = {
    tenantId,
    date: dateStr,
    totalInputTokens: events.reduce((sum, e) => sum + e.inputTokens, 0),
    totalOutputTokens: events.reduce((sum, e) => sum + e.outputTokens, 0),
    totalEstimatedCost: Math.round(
      events.reduce((sum, e) => sum + e.estimatedCost, 0) * 10000,
    ) / 10000,
    totalRequests: events.length,
    totalConversations: conversationIds.size,
    byModel: modelBreakdown,
    byAssistant: assistantBreakdown,
    createdAt: new Date().toISOString(),
  };

  await costRepository.putDailyRollup(rollup);

  logger.info('Daily rollup saved for tenant', {
    tenantId,
    date: dateStr,
    totalCost: rollup.totalEstimatedCost,
    totalRequests: rollup.totalRequests,
    totalConversations: rollup.totalConversations,
  });
}

/**
 * Aggregate byModel data from multiple daily rollups into a single map.
 */
function aggregateByModel(
  rollups: IDailyRollup[],
): Record<string, { inputTokens: number; outputTokens: number; cost: number; requests: number }> {
  const result: Record<string, { inputTokens: number; outputTokens: number; cost: number; requests: number }> = {};

  for (const rollup of rollups) {
    if (!rollup.byModel) continue;
    for (const [model, data] of Object.entries(rollup.byModel)) {
      if (!result[model]) {
        result[model] = { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 };
      }
      result[model].inputTokens += data.inputTokens;
      result[model].outputTokens += data.outputTokens;
      result[model].cost += data.cost;
      result[model].requests += data.requests;
    }
  }

  return result;
}

/**
 * Aggregate byAssistant data from multiple daily rollups into a single map.
 */
function aggregateByAssistant(
  rollups: IDailyRollup[],
): Record<string, { inputTokens: number; outputTokens: number; cost: number; requests: number }> {
  const result: Record<string, { inputTokens: number; outputTokens: number; cost: number; requests: number }> = {};

  for (const rollup of rollups) {
    if (!rollup.byAssistant) continue;
    for (const [assistant, data] of Object.entries(rollup.byAssistant)) {
      if (!result[assistant]) {
        result[assistant] = { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 };
      }
      result[assistant].inputTokens += data.inputTokens;
      result[assistant].outputTokens += data.outputTokens;
      result[assistant].cost += data.cost;
      result[assistant].requests += data.requests;
    }
  }

  return result;
}
