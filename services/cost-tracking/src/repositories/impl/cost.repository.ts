import { PutCommand, QueryCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys } from '@ai-platform/shared';
import type { ICostEvent, IDailyRollup, IMonthlyRollup, IPricingConfig } from '@ai-platform/shared';
import type { ICostRepository } from '../interfaces/cost.repository.interface';

class CostRepository implements ICostRepository {
  async getCostEventsByConversation(conversationId: string): Promise<ICostEvent[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `CONV#${conversationId}`, ':sk': 'COST#' },
        ScanIndexForward: true,
      }),
    );
    return (result.Items as ICostEvent[]) || [];
  }

  async getCostEventsByTenant(tenantId: string, startDate: string, endDate: string): Promise<ICostEvent[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':pk': `TENANT#${tenantId}`,
          ':start': `COST#${startDate}`,
          ':end': `COST#${endDate}`,
        },
        ScanIndexForward: true,
      }),
    );
    return (result.Items as ICostEvent[]) || [];
  }

  async getActiveTenantIdsForDate(dateStr: string): Promise<Set<string>> {
    const tenantIds = new Set<string>();
    let lastEvaluatedKey: Record<string, unknown> | undefined;

    do {
      const result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: 'entityType = :et AND begins_with(#ts, :datePrefix)',
          ExpressionAttributeNames: { '#ts': 'timestamp' },
          ExpressionAttributeValues: { ':et': 'CostEvent', ':datePrefix': dateStr },
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

  async putDailyRollup(rollup: IDailyRollup): Promise<void> {
    const keyAttrs = keys.dailyRollup(rollup.tenantId, rollup.date);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keyAttrs,
          ...(rollup.assistantId
            ? { GSI1PK: `ASSISTANT#${rollup.assistantId}`, GSI1SK: `ROLLUP#DAILY#${rollup.date}` }
            : {}),
          ...rollup,
          entityType: 'DailyRollup',
        },
      }),
    );
  }

  async getDailyRollups(tenantId: string, startDate: string, endDate: string): Promise<IDailyRollup[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':pk': `TENANT#${tenantId}`,
          ':start': `ROLLUP#DAILY#${startDate}`,
          ':end': `ROLLUP#DAILY#${endDate}`,
        },
        ScanIndexForward: true,
      }),
    );
    return (result.Items as IDailyRollup[]) || [];
  }

  async getDailyRollupTenantIds(startDate: string, endDate: string): Promise<Set<string>> {
    const tenantIds = new Set<string>();
    let lastEvaluatedKey: Record<string, unknown> | undefined;

    do {
      const result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: 'entityType = :et AND #d BETWEEN :start AND :end',
          ExpressionAttributeNames: { '#d': 'date' },
          ExpressionAttributeValues: { ':et': 'DailyRollup', ':start': startDate, ':end': endDate },
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

  async putMonthlyRollup(rollup: IMonthlyRollup): Promise<void> {
    const keyAttrs = keys.monthlyRollup(rollup.tenantId, rollup.month);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...keyAttrs, ...rollup, entityType: 'MonthlyRollup' },
      }),
    );
  }

  async getMonthlyRollups(tenantId: string, startMonth: string, endMonth: string): Promise<IMonthlyRollup[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':pk': `TENANT#${tenantId}`,
          ':start': `ROLLUP#MONTHLY#${startMonth}`,
          ':end': `ROLLUP#MONTHLY#${endMonth}`,
        },
        ScanIndexForward: true,
      }),
    );
    return (result.Items as IMonthlyRollup[]) || [];
  }

  async getPricing(modelId: string): Promise<IPricingConfig | null> {
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: keys.pricingConfig(modelId) }),
    );
    return (result.Item as IPricingConfig) || null;
  }

  async putPricing(config: IPricingConfig): Promise<void> {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...keys.pricingConfig(config.modelId), ...config, entityType: 'PricingConfig' },
      }),
    );
  }

  async getAllPricing(): Promise<IPricingConfig[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': 'CONFIG', ':sk': 'PRICING#' },
      }),
    );
    return (result.Items as IPricingConfig[]) || [];
  }
}

export const costRepository = new CostRepository();
