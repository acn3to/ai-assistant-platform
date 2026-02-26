import { v4 as uuidv4 } from 'uuid';
import { logger } from '@ai-platform/shared';
import type { IPrompt } from '@ai-platform/shared';
import type { IPromptRepository } from '../repositories/interfaces/prompt.repository.interface';
import { promptRepository } from '../repositories/impl/prompt.repository';

export const extractVariables = (content: string): string[] => {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
};

interface CreatePromptInput {
  assistantId: string;
  name: string;
  content: string;
  modelId?: string;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
}

export class CreatePromptUseCase {
  constructor(private readonly repo: IPromptRepository) {}

  async execute(input: CreatePromptInput): Promise<IPrompt> {
    const now = new Date().toISOString();
    const prompt: IPrompt = {
      assistantId: input.assistantId,
      promptId: uuidv4(),
      name: input.name,
      content: input.content,
      version: 1,
      variables: extractVariables(input.content),
      isActive: true,
      modelId: input.modelId,
      maxOutputTokens: input.maxOutputTokens,
      temperature: input.temperature,
      topP: input.topP,
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.create(prompt);
    logger.info('Prompt created', { promptId: prompt.promptId, assistantId: input.assistantId });

    return prompt;
  }
}

export const createPromptUseCase = new CreatePromptUseCase(promptRepository);
