import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys, logger } from '@ai-platform/shared';
import type { ICostEvent } from '@ai-platform/shared';

class CostTracker {
  /**
   * Track a single cost event (per-request granularity).
   * Appended as an immutable event in DynamoDB.
   */
  async trackEvent(event: Omit<ICostEvent, 'timestamp'>): Promise<void> {
    const timestamp = new Date().toISOString();
    const keyAttrs = keys.costEvent(event.conversationId, timestamp);
    const gsi1Keys = keys.costEventByTenant(event.tenantId, timestamp);

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            ...keyAttrs,
            ...gsi1Keys,
            ...event,
            timestamp,
            entityType: 'CostEvent',
          },
        }),
      );
    } catch (error) {
      // Cost tracking should not fail the main request
      logger.warn('Failed to track cost event', { error, event });
    }
  }
}

export const costTracker = new CostTracker();

