import type { IPrompt } from '@ai-platform/shared';

export interface IPromptRepository {
  create(prompt: IPrompt): Promise<void>;
  get(assistantId: string, promptId: string): Promise<IPrompt | null>;
  listByAssistant(assistantId: string): Promise<IPrompt[]>;
  listVersions(promptId: string): Promise<IPrompt[]>;
  delete(assistantId: string, promptId: string): Promise<void>;
}
