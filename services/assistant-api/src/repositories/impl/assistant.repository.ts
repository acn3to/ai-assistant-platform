import { PutCommand, GetCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys } from '@ai-platform/shared';
import type { IAssistant } from '@ai-platform/shared';
import type { IAssistantRepository } from '../interfaces/assistant.repository.interface';

class AssistantRepository implements IAssistantRepository {
  async create(assistant: IAssistant): Promise<void> {
    const keyAttrs = keys.assistant(assistant.tenantId, assistant.assistantId);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keyAttrs,
          GSI1PK: `ASSISTANT#${assistant.assistantId}`,
          GSI1SK: 'METADATA',
          ...assistant,
          entityType: 'Assistant',
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }

  async get(tenantId: string, assistantId: string): Promise<IAssistant | null> {
    const keyAttrs = keys.assistant(tenantId, assistantId);

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: keyAttrs,
      }),
    );

    return (result.Item as IAssistant) || null;
  }

  async listByTenant(tenantId: string): Promise<IAssistant[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `TENANT#${tenantId}`,
          ':sk': 'ASSISTANT#',
        },
      }),
    );

    return (result.Items as IAssistant[]) || [];
  }

  async update(tenantId: string, assistantId: string, updates: Partial<IAssistant>): Promise<IAssistant> {
    const keyAttrs = keys.assistant(tenantId, assistantId);
    const now = new Date().toISOString();

    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionValues: Record<string, unknown> = { ':updatedAt': now };

    const allowedFields = [
      'name', 'description', 'systemPrompt', 'modelId',
      'inferenceConfig', 'knowledgeBaseEnabled', 'knowledgeBaseId',
      'whatsappPhoneNumber', 'status',
    ];

    for (const field of allowedFields) {
      if (updates[field as keyof IAssistant] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionNames[`#${field}`] = field;
        expressionValues[`:${field}`] = updates[field as keyof IAssistant];
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

    return result.Attributes as IAssistant;
  }

  async delete(tenantId: string, assistantId: string): Promise<void> {
    const keyAttrs = keys.assistant(tenantId, assistantId);

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: keyAttrs,
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }
}

export const assistantRepository = new AssistantRepository();
