import { PutCommand, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys } from '@ai-platform/shared';
import type { IKBDocument } from '@ai-platform/shared';
import type { IKBDocumentRepository } from '../interfaces/kb-document.repository.interface';

class KBDocumentRepository implements IKBDocumentRepository {
  async create(doc: IKBDocument): Promise<void> {
    const keyAttrs = keys.kbDocument(doc.assistantId, doc.filename);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keyAttrs,
          ...doc,
          entityType: 'KBDocument',
        },
      }),
    );
  }

  async get(assistantId: string, filename: string): Promise<IKBDocument | null> {
    const keyAttrs = keys.kbDocument(assistantId, filename);

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: keyAttrs,
      }),
    );

    return (result.Item as IKBDocument) || null;
  }

  async listByAssistant(assistantId: string): Promise<IKBDocument[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `ASSISTANT#${assistantId}`,
          ':sk': 'DOC#',
        },
      }),
    );

    return (result.Items as IKBDocument[]) || [];
  }

  async delete(assistantId: string, filename: string): Promise<void> {
    const keyAttrs = keys.kbDocument(assistantId, filename);

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: keyAttrs,
      }),
    );
  }
}

export const kbDocumentRepository = new KBDocumentRepository();
