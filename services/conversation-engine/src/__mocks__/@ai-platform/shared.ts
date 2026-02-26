export const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export const docClient = {};
export const TABLE_NAME = 'test-table';
export const keys = {
  conversation: jest.fn((assistantId: string, convId: string) => ({ PK: `ASSISTANT#${assistantId}`, SK: `CONV#${convId}` })),
  message: jest.fn((convId: string, ts: string) => ({ PK: `CONV#${convId}`, SK: `MSG#${ts}` })),
  costEvent: jest.fn((convId: string, ts: string) => ({ PK: `CONV#${convId}`, SK: `COST#${ts}` })),
  costEventByTenant: jest.fn((tenantId: string, ts: string) => ({ GSI1PK: `TENANT#${tenantId}`, GSI1SK: `COST#${ts}` })),
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
