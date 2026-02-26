export const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export const docClient = {};
export const TABLE_NAME = 'test-table';
export const keys = {
  assistant: jest.fn((tenantId: string, assistantId: string) => ({ PK: `TENANT#${tenantId}`, SK: `ASSISTANT#${assistantId}` })),
  prompt: jest.fn((assistantId: string, promptId: string) => ({ PK: `ASSISTANT#${assistantId}`, SK: `PROMPT#${promptId}` })),
  kbDocument: jest.fn((assistantId: string, filename: string) => ({ PK: `ASSISTANT#${assistantId}`, SK: `DOC#${filename}` })),
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
