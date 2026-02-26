import type { IAssistant } from '@ai-platform/shared';

export interface IAssistantRepository {
  create(assistant: IAssistant): Promise<void>;
  get(tenantId: string, assistantId: string): Promise<IAssistant | null>;
  listByTenant(tenantId: string): Promise<IAssistant[]>;
  update(tenantId: string, assistantId: string, updates: Partial<IAssistant>): Promise<IAssistant>;
  delete(tenantId: string, assistantId: string): Promise<void>;
}
