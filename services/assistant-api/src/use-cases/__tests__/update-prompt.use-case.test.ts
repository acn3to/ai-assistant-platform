import { UpdatePromptUseCase } from '../update-prompt.use-case';
import type { IPromptRepository } from '../../repositories/interfaces/prompt.repository.interface';
import type { IPrompt } from '@ai-platform/shared';

const mockRepo: jest.Mocked<IPromptRepository> = {
  create: jest.fn(),
  get: jest.fn(),
  listByAssistant: jest.fn(),
  listVersions: jest.fn(),
  delete: jest.fn(),
};

const basePrompt: IPrompt = {
  assistantId: 'assistant-1',
  promptId: 'prompt-1',
  name: 'Original',
  content: 'Hello {{name}}',
  version: 1,
  variables: ['name'],
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('UpdatePromptUseCase', () => {
  let useCase: UpdatePromptUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdatePromptUseCase(mockRepo);
  });

  it('increments version and re-extracts variables from new content', async () => {
    mockRepo.get.mockResolvedValue(basePrompt);

    const result = await useCase.execute({
      assistantId: 'assistant-1',
      promptId: 'prompt-1',
      updates: { content: 'Hello {{name}}, welcome to {{company}}.' },
    });

    expect(result?.version).toBe(2);
    expect(result?.variables).toEqual(['name', 'company']);
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ version: 2 }));
  });

  it('returns null when prompt not found', async () => {
    mockRepo.get.mockResolvedValue(null);

    const result = await useCase.execute({
      assistantId: 'assistant-1',
      promptId: 'not-found',
      updates: { name: 'New name' },
    });

    expect(result).toBeNull();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('keeps existing variables when content is not updated', async () => {
    mockRepo.get.mockResolvedValue(basePrompt);

    const result = await useCase.execute({
      assistantId: 'assistant-1',
      promptId: 'prompt-1',
      updates: { name: 'Updated Name' },
    });

    expect(result?.variables).toEqual(['name']);
    expect(result?.name).toBe('Updated Name');
  });
});
