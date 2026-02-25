import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys } from '@ai-platform/shared';
import type { ICostEvent, IDailyRollup, IMonthlyRollup, IPricingConfig } from '@ai-platform/shared';

class CostRepository {
  // Cost Events
  async getCostEventsByConversation(conversationId: string): Promise<ICostEvent[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `CONV#${conversationId}`,
          ':sk': 'COST#',
        },
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

  // Daily Rollups
  async putDailyRollup(rollup: IDailyRollup): Promise<void> {
    const keyAttrs = keys.dailyRollup(rollup.tenantId, rollup.date);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keyAttrs,
          ...(rollup.assistantId
            ? {
                GSI1PK: `ASSISTANT#${rollup.assistantId}`,
                GSI1SK: `ROLLUP#DAILY#${rollup.date}`,
              }
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

  // Monthly Rollups
  async putMonthlyRollup(rollup: IMonthlyRollup): Promise<void> {
    const keyAttrs = keys.monthlyRollup(rollup.tenantId, rollup.month);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keyAttrs,
          ...rollup,
          entityType: 'MonthlyRollup',
        },
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

  // Pricing Config
  async getPricing(modelId: string): Promise<IPricingConfig | null> {
    const keyAttrs = keys.pricingConfig(modelId);

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: keyAttrs,
      }),
    );
    return (result.Item as IPricingConfig) || null;
  }

  async putPricing(config: IPricingConfig): Promise<void> {
    const keyAttrs = keys.pricingConfig(config.modelId);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keyAttrs,
          ...config,
          entityType: 'PricingConfig',
        },
      }),
    );
  }

  async getAllPricing(): Promise<IPricingConfig[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': 'CONFIG',
          ':sk': 'PRICING#',
        },
      }),
    );
    return (result.Items as IPricingConfig[]) || [];
  }
}

export const costRepository = new CostRepository();

