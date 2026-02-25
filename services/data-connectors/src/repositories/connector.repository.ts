import { PutCommand, GetCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys } from '@ai-platform/shared';
import type { IDataConnector } from '@ai-platform/shared';

class ConnectorRepository {
  async create(connector: IDataConnector): Promise<void> {
    const keyAttrs = keys.dataConnector(connector.assistantId, connector.connectorId);
    const gsi1Keys = keys.connectorByTenant(connector.tenantId, connector.connectorId);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keyAttrs,
          ...gsi1Keys,
          ...connector,
          entityType: 'DataConnector',
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }

  async get(assistantId: string, connectorId: string): Promise<IDataConnector | null> {
    const keyAttrs = keys.dataConnector(assistantId, connectorId);

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: keyAttrs,
      }),
    );

    return (result.Item as IDataConnector) || null;
  }

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

  async update(assistantId: string, connectorId: string, updates: Partial<IDataConnector>): Promise<IDataConnector> {
    const keyAttrs = keys.dataConnector(assistantId, connectorId);
    const now = new Date().toISOString();

    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionValues: Record<string, any> = { ':updatedAt': now };

    const allowedFields = [
      'name', 'description', 'type', 'baseUrl', 'authType', 'authConfig',
      'tools', 'trigger', 'triggerConfig', 'maxCallsPerConversation',
      'timeoutMs', 'cacheTtlSeconds', 'retryConfig', 'enabled',
      'lastTestedAt', 'lastTestResult',
    ];

    for (const field of allowedFields) {
      if (updates[field as keyof IDataConnector] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionNames[`#${field}`] = field;
        expressionValues[`:${field}`] = updates[field as keyof IDataConnector];
      }
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: keyAttrs,
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );

    return result.Attributes as IDataConnector;
  }

  async delete(assistantId: string, connectorId: string): Promise<void> {
    const keyAttrs = keys.dataConnector(assistantId, connectorId);

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: keyAttrs,
      }),
    );
  }
}

export const connectorRepository = new ConnectorRepository();

