import { CreateAssistantUseCase } from '../create-assistant.use-case';
import type { IAssistantRepository } from '../../repositories/interfaces/assistant.repository.interface';

const mockRepo: jest.Mocked<IAssistantRepository> = {
  create: jest.fn(),
  get: jest.fn(),
  listByTenant: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('CreateAssistantUseCase', () => {
  let useCase: CreateAssistantUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateAssistantUseCase(mockRepo);
  });

  it('builds assistant entity and saves to repo', async () => {
    const result = await useCase.execute({
      tenantId: 'tenant-1',
      name: 'My Bot',
      systemPrompt: 'You are helpful.',
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        name: 'My Bot',
        systemPrompt: 'You are helpful.',
        status: 'draft',
        knowledgeBaseEnabled: false,
      }),
    );
    expect(result.assistantId).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.inferenceConfig).toEqual({ maxTokens: 4096, temperature: 0.7, topP: 0.9 });
  });

  it('uses provided inferenceConfig', async () => {
    const config = { maxTokens: 1000, temperature: 0.5, topP: 0.8 };
    const result = await useCase.execute({
      tenantId: 'tenant-1',
      name: 'Bot',
      systemPrompt: 'Prompt',
      modelId: 'model',
      inferenceConfig: config,
    });

    expect(result.inferenceConfig).toEqual(config);
  });

  it('propagates repo errors', async () => {
    mockRepo.create.mockRejectedValue(new Error('DynamoDB error'));

    await expect(
      useCase.execute({ tenantId: 't', name: 'n', systemPrompt: 'p', modelId: 'm' }),
    ).rejects.toThrow('DynamoDB error');
  });
});
