import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@ai-platform/shared';
import type { IDataConnector } from '@ai-platform/shared';
import type { IConnectorRepository } from '../interfaces/connector.repository.interface';

class ConnectorRepository implements IConnectorRepository {
  async getEnabledByAssistant(assistantId: string): Promise<IDataConnector[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `ASSISTANT#${assistantId}`, ':sk': 'CONNECTOR#' },
      }),
    );
    const all = (result.Items as IDataConnector[]) || [];
    return all.filter((c) => c.enabled);
  }

  async getSecrets(tenantId: string): Promise<Record<string, string>> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `TENANT#${tenantId}`, ':sk': 'SECRET#' },
      }),
    );

    const secrets: Record<string, string> = {};
    for (const item of result.Items || []) {
      const name = (item as Record<string, unknown>).secretName as string;
      const value = (item as Record<string, unknown>).secretValue as string;
      if (name && value) secrets[name] = value;
    }
    return secrets;
  }
}

export const connectorRepository = new ConnectorRepository();
