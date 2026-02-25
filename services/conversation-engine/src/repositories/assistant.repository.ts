import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@ai-platform/shared';
import type { IAssistant } from '@ai-platform/shared';

class AssistantRepository {
  /**
   * Get assistant metadata by assistantId using the GSI1 inverted index.
   * This avoids needing the tenantId in the conversation engine.
   */
  async getById(assistantId: string): Promise<IAssistant | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `ASSISTANT#${assistantId}`,
          ':sk': 'METADATA',
        },
        Limit: 1,
      }),
    );

    const items = (result.Items as IAssistant[]) || [];
    return items[0] || null;
  }
}

export const assistantRepository = new AssistantRepository();

