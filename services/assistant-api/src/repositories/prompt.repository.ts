import { PutCommand, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys } from '@ai-platform/shared';
import type { IPrompt } from '@ai-platform/shared';

class PromptRepository {
  async create(prompt: IPrompt): Promise<void> {
    const keyAttrs = keys.prompt(prompt.assistantId, prompt.promptId);
    const gsi1Keys = {
      GSI1PK: `PROMPT#${prompt.promptId}`,
      GSI1SK: `VERSION#${String(prompt.version).padStart(6, '0')}`,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keyAttrs,
          ...gsi1Keys,
          ...prompt,
          entityType: 'Prompt',
        },
      }),
    );
  }

  async get(assistantId: string, promptId: string): Promise<IPrompt | null> {
    const keyAttrs = keys.prompt(assistantId, promptId);

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: keyAttrs,
      }),
    );

    return (result.Item as IPrompt) || null;
  }

  async listByAssistant(assistantId: string): Promise<IPrompt[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `ASSISTANT#${assistantId}`,
          ':sk': 'PROMPT#',
        },
      }),
    );

    return (result.Items as IPrompt[]) || [];
  }

  async listVersions(promptId: string): Promise<IPrompt[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `PROMPT#${promptId}`,
          ':sk': 'VERSION#',
        },
        ScanIndexForward: false,
      }),
    );

    return (result.Items as IPrompt[]) || [];
  }

  async delete(assistantId: string, promptId: string): Promise<void> {
    const keyAttrs = keys.prompt(assistantId, promptId);

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: keyAttrs,
      }),
    );
  }
}

export const promptRepository = new PromptRepository();

