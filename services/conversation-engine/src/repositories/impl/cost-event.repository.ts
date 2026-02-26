import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys } from '@ai-platform/shared';
import type { ICostEvent } from '@ai-platform/shared';
import type { ICostEventRepository } from '../interfaces/cost-event.repository.interface';

class CostEventRepository implements ICostEventRepository {
  async save(event: ICostEvent): Promise<void> {
    const keyAttrs = keys.costEvent(event.conversationId, event.timestamp);
    const gsi1Keys = keys.costEventByTenant(event.tenantId, event.timestamp);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keyAttrs,
          ...gsi1Keys,
          ...event,
          entityType: 'CostEvent',
        },
      }),
    );
  }
}

export const costEventRepository = new CostEventRepository();
