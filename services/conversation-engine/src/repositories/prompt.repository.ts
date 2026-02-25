import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@ai-platform/shared';
import type { IPrompt } from '@ai-platform/shared';

class PromptRuntimeRepository {
  /**
   * Get the most relevant active prompt for an assistant.
   *
   * We query all prompts for the assistant and pick:
   * - the most recently updated prompt with isActive === true, if any
   * - otherwise null
   */
  async getActiveForAssistant(assistantId: string): Promise<IPrompt | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `ASSISTANT#${assistantId}`,
          ':sk': 'PROMPT#',
        },
        ScanIndexForward: false, // newest SKs first
      }),
    );

    const items = ((result.Items as IPrompt[]) || []).filter((p) => p.isActive);
    if (items.length === 0) {
      return null;
    }

    // Pick the most recently updated active prompt
    items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
    return items[0];
  }
}

export const promptRuntimeRepository = new PromptRuntimeRepository();

