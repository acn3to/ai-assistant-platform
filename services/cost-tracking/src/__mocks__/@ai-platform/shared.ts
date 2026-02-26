export const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export const docClient = {};
export const TABLE_NAME = 'test-table';
export const keys = {
  dailyRollup: jest.fn((tenantId: string, date: string) => ({ PK: `TENANT#${tenantId}`, SK: `ROLLUP#DAILY#${date}` })),
  monthlyRollup: jest.fn((tenantId: string, month: string) => ({ PK: `TENANT#${tenantId}`, SK: `ROLLUP#MONTHLY#${month}` })),
  pricingConfig: jest.fn((modelId: string) => ({ PK: 'CONFIG', SK: `PRICING#${modelId}` })),
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
