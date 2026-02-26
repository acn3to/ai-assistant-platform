import type { IAssistant } from '@ai-platform/shared';

export interface IAssistantRepository {
  getById(assistantId: string): Promise<IAssistant | null>;
}
