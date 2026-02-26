export const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export const docClient = {};
export const TABLE_NAME = 'test-table';
export const keys = {
  tenant: jest.fn((id: string) => ({ PK: `TENANT#${id}`, SK: 'METADATA' })),
  user: jest.fn((tenantId: string, email: string) => ({ PK: `TENANT#${tenantId}`, SK: `USER#${email}` })),
};

export const ok = jest.fn();
export const created = jest.fn();
export const noContent = jest.fn();
export const badRequest = jest.fn();
export const unauthorized = jest.fn();
export const forbidden = jest.fn();
export const notFound = jest.fn();
export const conflict = jest.fn();
export const internalError = jest.fn();
export const withObservability = jest.fn((fn: unknown) => fn);
