import { PutCommand, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, keys } from '@ai-platform/shared';
import type { IUser } from '@ai-platform/shared';
import type { IUserRepository } from '../interfaces/user.repository.interface';

class UserRepository implements IUserRepository {
  async create(user: IUser): Promise<void> {
    const keyAttrs = keys.user(user.tenantId, user.email);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keyAttrs,
          GSI1PK: `USER#${user.email}`,
          GSI1SK: `TENANT#${user.tenantId}`,
          ...user,
          entityType: 'User',
        },
      }),
    );
  }

  async get(tenantId: string, email: string): Promise<IUser | null> {
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: keys.user(tenantId, email) }),
    );
    return (result.Item as IUser) || null;
  }

  async listByTenant(tenantId: string): Promise<IUser[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `TENANT#${tenantId}`, ':sk': 'USER#' },
      }),
    );
    return (result.Items as IUser[]) || [];
  }

  async delete(tenantId: string, email: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({ TableName: TABLE_NAME, Key: keys.user(tenantId, email) }),
    );
  }
}

export const userRepository = new UserRepository();
