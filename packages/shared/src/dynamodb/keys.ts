/**
 * DynamoDB Single-Table Key Builders
 * Following the pattern from aws-dynamodb skill: keys.entity()
 */
export const keys = {
  tenant: (tenantId: string) => ({
    PK: `TENANT#${tenantId}`,
    SK: 'METADATA',
  }),

  user: (tenantId: string, email: string) => ({
    PK: `TENANT#${tenantId}`,
    SK: `USER#${email}`,
  }),

  assistant: (tenantId: string, assistantId: string) => ({
    PK: `TENANT#${tenantId}`,
    SK: `ASSISTANT#${assistantId}`,
  }),

  prompt: (assistantId: string, promptId: string) => ({
    PK: `ASSISTANT#${assistantId}`,
    SK: `PROMPT#${promptId}`,
  }),

  promptVersion: (promptId: string, version: number) => ({
    GSI1PK: `PROMPT#${promptId}`,
    GSI1SK: `VERSION#${String(version).padStart(6, '0')}`,
  }),

  conversation: (assistantId: string, conversationId: string) => ({
    PK: `ASSISTANT#${assistantId}`,
    SK: `CONV#${conversationId}`,
  }),

  conversationByPhone: (phoneNumber: string, conversationId: string) => ({
    GSI1PK: `PHONE#${phoneNumber}`,
    GSI1SK: `CONV#${conversationId}`,
  }),

  message: (conversationId: string, timestamp: string) => ({
    PK: `CONV#${conversationId}`,
    SK: `MSG#${timestamp}`,
  }),

  kbDocument: (assistantId: string, filename: string) => ({
    PK: `ASSISTANT#${assistantId}`,
    SK: `DOC#${filename}`,
  }),

  dataConnector: (assistantId: string, connectorId: string) => ({
    PK: `ASSISTANT#${assistantId}`,
    SK: `CONNECTOR#${connectorId}`,
  }),

  connectorByTenant: (tenantId: string, connectorId: string) => ({
    GSI1PK: `TENANT#${tenantId}`,
    GSI1SK: `CONNECTOR#${connectorId}`,
  }),

  connectorSecret: (tenantId: string, secretName: string) => ({
    PK: `TENANT#${tenantId}`,
    SK: `SECRET#${secretName}`,
  }),

  connectorLog: (connectorId: string, timestamp: string) => ({
    PK: `CONNECTOR#${connectorId}`,
    SK: `LOG#${timestamp}`,
  }),

  costEvent: (conversationId: string, timestamp: string) => ({
    PK: `CONV#${conversationId}`,
    SK: `COST#${timestamp}`,
  }),

  costEventByTenant: (tenantId: string, timestamp: string) => ({
    GSI1PK: `TENANT#${tenantId}`,
    GSI1SK: `COST#${timestamp}`,
  }),

  dailyRollup: (tenantId: string, date: string) => ({
    PK: `TENANT#${tenantId}`,
    SK: `ROLLUP#DAILY#${date}`,
  }),

  assistantDailyRollup: (assistantId: string, date: string) => ({
    GSI1PK: `ASSISTANT#${assistantId}`,
    GSI1SK: `ROLLUP#DAILY#${date}`,
  }),

  monthlyRollup: (tenantId: string, month: string) => ({
    PK: `TENANT#${tenantId}`,
    SK: `ROLLUP#MONTHLY#${month}`,
  }),

  pricingConfig: (modelId: string) => ({
    PK: 'CONFIG',
    SK: `PRICING#${modelId}`,
  }),
};

