import { logger } from '@ai-platform/shared';
import type { IPrompt } from '@ai-platform/shared';
import type { IPromptRepository } from '../repositories/interfaces/prompt.repository.interface';
import { promptRepository } from '../repositories/impl/prompt.repository';
import { extractVariables } from './create-prompt.use-case';

interface UpdatePromptInput {
  assistantId: string;
  promptId: string;
  updates: Partial<Pick<IPrompt, 'name' | 'content' | 'modelId' | 'maxOutputTokens' | 'temperature' | 'topP' | 'isActive'>>;
}

export class UpdatePromptUseCase {
  constructor(private readonly repo: IPromptRepository) {}

  async execute(input: UpdatePromptInput): Promise<IPrompt | null> {
    const existing = await this.repo.get(input.assistantId, input.promptId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updatedContent = input.updates.content ?? existing.content;

    const updated: IPrompt = {
      ...existing,
      ...input.updates,
      assistantId: input.assistantId,
      promptId: input.promptId,
      version: existing.version + 1,
      variables: extractVariables(updatedContent),
      updatedAt: now,
    };

    await this.repo.create(updated);
    logger.info('Prompt updated', { promptId: input.promptId, assistantId: input.assistantId, version: updated.version });

    return updated;
  }
}

export const updatePromptUseCase = new UpdatePromptUseCase(promptRepository);
