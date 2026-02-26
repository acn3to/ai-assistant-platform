import { CreatePromptUseCase, extractVariables } from '../create-prompt.use-case';
import type { IPromptRepository } from '../../repositories/interfaces/prompt.repository.interface';

const mockRepo: jest.Mocked<IPromptRepository> = {
  create: jest.fn(),
  get: jest.fn(),
  listByAssistant: jest.fn(),
  listVersions: jest.fn(),
  delete: jest.fn(),
};

describe('extractVariables', () => {
  it('extracts unique variable names from content', () => {
    expect(extractVariables('Hello {{name}}, your id is {{id}}')).toEqual(['name', 'id']);
  });

  it('deduplicates variables', () => {
    expect(extractVariables('{{name}} and {{name}}')).toEqual(['name']);
  });

  it('returns empty array when no variables', () => {
    expect(extractVariables('No variables here')).toEqual([]);
  });
});

describe('CreatePromptUseCase', () => {
  let useCase: CreatePromptUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreatePromptUseCase(mockRepo);
  });

  it('creates prompt with extracted variables and version 1', async () => {
    const result = await useCase.execute({
      assistantId: 'assistant-1',
      name: 'Greeting',
      content: 'Hello {{name}}, welcome to {{company}}.',
    });

    expect(result.version).toBe(1);
    expect(result.variables).toEqual(['name', 'company']);
    expect(result.isActive).toBe(true);
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ assistantId: 'assistant-1' }));
  });

  it('propagates repo errors', async () => {
    mockRepo.create.mockRejectedValue(new Error('DynamoDB error'));

    await expect(
      useCase.execute({ assistantId: 'a', name: 'n', content: 'c' }),
    ).rejects.toThrow('DynamoDB error');
  });
});
