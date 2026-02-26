import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys } from '@ai-platform/shared';
import type { ITenant } from '@ai-platform/shared';
import type { ITenantRepository } from '../interfaces/tenant.repository.interface';

class TenantRepository implements ITenantRepository {
  async create(tenant: ITenant): Promise<void> {
    const keyAttrs = keys.tenant(tenant.tenantId);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...keyAttrs, ...tenant, entityType: 'Tenant' },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }

  async get(tenantId: string): Promise<ITenant | null> {
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: keys.tenant(tenantId) }),
    );
    return (result.Item as ITenant) || null;
  }
}

export const tenantRepository = new TenantRepository();
