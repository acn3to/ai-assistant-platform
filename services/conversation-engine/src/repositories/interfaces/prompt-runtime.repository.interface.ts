import type { IPrompt } from '@ai-platform/shared';

export interface IPromptRuntimeRepository {
  getActiveForAssistant(assistantId: string): Promise<IPrompt | null>;
}
