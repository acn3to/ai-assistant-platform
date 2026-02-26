import type { IDataConnector } from '@ai-platform/shared';

export interface IConnectorRepository {
  getEnabledByAssistant(assistantId: string): Promise<IDataConnector[]>;
  getSecrets(tenantId: string): Promise<Record<string, string>>;
}
