import { v4 as uuidv4 } from 'uuid';
import { logger } from '@ai-platform/shared';
import type { IAssistant } from '@ai-platform/shared';
import type { IAssistantRepository } from '../repositories/interfaces/assistant.repository.interface';
import { assistantRepository } from '../repositories/impl/assistant.repository';

interface CreateAssistantInput {
  tenantId: string;
  name: string;
  description?: string;
  systemPrompt: string;
  modelId: string;
  inferenceConfig?: { maxTokens: number; temperature: number; topP: number };
}

export class CreateAssistantUseCase {
  constructor(private readonly repo: IAssistantRepository) {}

  async execute(input: CreateAssistantInput): Promise<IAssistant> {
    const now = new Date().toISOString();
    const assistant: IAssistant = {
      tenantId: input.tenantId,
      assistantId: uuidv4(),
      name: input.name,
      description: input.description || '',
      systemPrompt: input.systemPrompt,
      modelId: input.modelId,
      inferenceConfig: input.inferenceConfig || { maxTokens: 4096, temperature: 0.7, topP: 0.9 },
      knowledgeBaseEnabled: false,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.create(assistant);
    logger.info('Assistant created', { assistantId: assistant.assistantId, tenantId: input.tenantId });

    return assistant;
  }
}

export const createAssistantUseCase = new CreateAssistantUseCase(assistantRepository);
