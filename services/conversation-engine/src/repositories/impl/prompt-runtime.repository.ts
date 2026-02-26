import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@ai-platform/shared';
import type { IPrompt } from '@ai-platform/shared';
import type { IPromptRuntimeRepository } from '../interfaces/prompt-runtime.repository.interface';

class PromptRuntimeRepository implements IPromptRuntimeRepository {
  async getActiveForAssistant(assistantId: string): Promise<IPrompt | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `ASSISTANT#${assistantId}`, ':sk': 'PROMPT#' },
        ScanIndexForward: false,
      }),
    );

    const items = ((result.Items as IPrompt[]) || []).filter((p) => p.isActive);
    if (items.length === 0) return null;
    items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
    return items[0];
  }
}

export const promptRuntimeRepository = new PromptRuntimeRepository();
