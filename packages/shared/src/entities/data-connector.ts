export interface IConnectorTool {
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  inputSchema: Record<string, unknown>;
  requestMapping: {
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    bodyTemplate?: Record<string, unknown>;
    pathParams?: Record<string, string>;
  };
  responseMapping?: {
    extractPath?: string;
    summaryTemplate?: string;
    maxResponseSize?: number;
  };
}

export type AuthType = 'none' | 'api_key' | 'bearer' | 'basic' | 'oauth2' | 'custom_headers';
export type ConnectorType = 'rest_api' | 'graphql' | 'database' | 'webhook';
export type TriggerType = 'on_demand' | 'on_conversation_start' | 'on_keyword';

export interface IAuthConfig {
  apiKey?: string;
  headerName?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
  oauth2?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
  };
  customHeaders?: Record<string, string>;
}

export interface IDataConnector {
  connectorId: string;
  tenantId: string;
  assistantId: string;
  name: string;
  description: string;
  type: ConnectorType;
  baseUrl: string;
  authType: AuthType;
  authConfig: IAuthConfig;
  tools: IConnectorTool[];
  trigger: TriggerType;
  triggerConfig?: {
    keywords?: string[];
    inputMapping?: Record<string, string>;
  };
  maxCallsPerConversation: number;
  timeoutMs: number;
  cacheTtlSeconds?: number;
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
  };
  enabled: boolean;
  lastTestedAt?: string;
  lastTestResult?: 'success' | 'failure';
  createdAt: string;
  updatedAt: string;
}

