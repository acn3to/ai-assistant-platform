import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@ai-platform/shared';
import type { IDataConnector } from '@ai-platform/shared';

class ConnectorRepository {
  async listByAssistant(assistantId: string): Promise<IDataConnector[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `ASSISTANT#${assistantId}`,
          ':sk': 'CONNECTOR#',
        },
      }),
    );

    return (result.Items as IDataConnector[]) || [];
  }

  async getEnabledByAssistant(assistantId: string): Promise<IDataConnector[]> {
    const all = await this.listByAssistant(assistantId);
    return all.filter((c) => c.enabled);
  }

  async getSecrets(tenantId: string): Promise<Record<string, string>> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `TENANT#${tenantId}`,
          ':sk': 'SECRET#',
        },
      }),
    );

    const secrets: Record<string, string> = {};
    for (const item of result.Items || []) {
      const name = (item as any).secretName;
      const value = (item as any).secretValue;
      if (name && value) {
        secrets[name] = value;
      }
    }
    return secrets;
  }
}

export const connectorRepository = new ConnectorRepository();

