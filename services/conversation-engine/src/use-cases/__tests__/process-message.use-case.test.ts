import { ProcessMessageUseCase } from '../process-message.use-case';
import type { IConversationRepository } from '../../repositories/interfaces/conversation.repository.interface';
import type { IAssistantRepository } from '../../repositories/interfaces/assistant.repository.interface';
import type { IConnectorRepository } from '../../repositories/interfaces/connector.repository.interface';
import type { IPromptRuntimeRepository } from '../../repositories/interfaces/prompt-runtime.repository.interface';
import type { IBedrockService } from '../../adapters/bedrock/interfaces/bedrock.service.interface';
import type { IBedrockRAGService } from '../../adapters/bedrock/interfaces/bedrock-rag.service.interface';
import type { ICostTracker } from '../../services/cost-tracker.service';
import type { IConversation, IAssistant } from '@ai-platform/shared';

const mockConversationRepo: jest.Mocked<IConversationRepository> = {
  create: jest.fn(),
  get: jest.fn(),
  listByAssistant: jest.fn(),
  addMessage: jest.fn(),
  getMessages: jest.fn(),
  updateStats: jest.fn(),
};

const mockAssistantRepo: jest.Mocked<IAssistantRepository> = {
  getById: jest.fn(),
};

const mockConnectorRepo: jest.Mocked<IConnectorRepository> = {
  getEnabledByAssistant: jest.fn(),
  getSecrets: jest.fn(),
};

const mockPromptRepo: jest.Mocked<IPromptRuntimeRepository> = {
  getActiveForAssistant: jest.fn(),
};

const mockBedrock: jest.Mocked<IBedrockService> = {
  converse: jest.fn(),
  buildToolConfig: jest.fn(),
  extractText: jest.fn(),
  extractToolUseBlocks: jest.fn(),
};

const mockBedrockRAG: jest.Mocked<IBedrockRAGService> = {
  retrieveAndBuildContext: jest.fn(),
};

const mockCostTracker: jest.Mocked<ICostTracker> = {
  trackEvent: jest.fn(),
};

const baseConversation: IConversation = {
  assistantId: 'assistant-1',
  conversationId: 'conv-1',
  channel: 'web_test',
  status: 'active',
  messageCount: 0,
  totalTokens: 0,
  estimatedCost: 0,
  sessionVars: {},
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const baseAssistant: IAssistant = {
  tenantId: 'tenant-1',
  assistantId: 'assistant-1',
  name: 'Test Bot',
  description: '',
  systemPrompt: 'You are a helpful assistant.',
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
  inferenceConfig: { maxTokens: 4096, temperature: 0.7, topP: 0.9 },
  knowledgeBaseEnabled: false,
  status: 'active',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const endTurnResponse = {
  message: { role: 'assistant' as const, content: [{ text: 'Hello!' }] },
  stopReason: 'end_turn',
  usage: { inputTokens: 10, outputTokens: 5 },
};

describe('ProcessMessageUseCase', () => {
  let useCase: ProcessMessageUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConversationRepo.get.mockResolvedValue(baseConversation);
    mockConversationRepo.getMessages.mockResolvedValue([]);
    mockConversationRepo.addMessage.mockResolvedValue();
    mockConversationRepo.updateStats.mockResolvedValue();
    mockAssistantRepo.getById.mockResolvedValue(baseAssistant);
    mockConnectorRepo.getEnabledByAssistant.mockResolvedValue([]);
    mockConnectorRepo.getSecrets.mockResolvedValue({});
    mockPromptRepo.getActiveForAssistant.mockResolvedValue(null);
    mockBedrock.converse.mockResolvedValue(endTurnResponse);
    mockBedrock.extractText.mockReturnValue('Hello!');
    mockBedrock.extractToolUseBlocks.mockReturnValue([]);
    mockCostTracker.trackEvent.mockResolvedValue();

    useCase = new ProcessMessageUseCase(
      mockConversationRepo,
      mockAssistantRepo,
      mockConnectorRepo,
      mockPromptRepo,
      mockBedrock,
      mockBedrockRAG,
      mockCostTracker,
    );
  });

  it('returns response on end_turn', async () => {
    const result = await useCase.execute({
      conversationId: 'conv-1',
      message: 'Hello',
      assistantId: 'assistant-1',
    });

    expect(result).not.toBe('conversation_not_found');
    expect(result).not.toBe('assistant_not_found');
    if (typeof result !== 'string') {
      expect(result.response).toBe('Hello!');
      expect(result.usage.inputTokens).toBe(10);
      expect(result.usage.outputTokens).toBe(5);
    }
    expect(mockBedrock.converse).toHaveBeenCalledTimes(1);
    expect(mockCostTracker.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ requestType: 'converse' }),
    );
  });

  it('returns conversation_not_found when conversation missing', async () => {
    mockConversationRepo.get.mockResolvedValue(null);

    const result = await useCase.execute({
      conversationId: 'missing',
      message: 'Hi',
      assistantId: 'assistant-1',
    });

    expect(result).toBe('conversation_not_found');
    expect(mockBedrock.converse).not.toHaveBeenCalled();
  });

  it('returns assistant_not_found when assistant missing', async () => {
    mockAssistantRepo.getById.mockResolvedValue(null);

    const result = await useCase.execute({
      conversationId: 'conv-1',
      message: 'Hi',
      assistantId: 'assistant-1',
    });

    expect(result).toBe('assistant_not_found');
    expect(mockBedrock.converse).not.toHaveBeenCalled();
  });

  it('tracks kb-retrieve cost event when knowledgeBaseId provided', async () => {
    mockBedrockRAG.retrieveAndBuildContext.mockResolvedValue({
      documents: [],
      contextPrompt: 'augmented prompt',
      averageScore: 0,
    });

    await useCase.execute({
      conversationId: 'conv-1',
      message: 'Hi',
      assistantId: 'assistant-1',
      knowledgeBaseId: 'kb-123',
    });

    expect(mockBedrockRAG.retrieveAndBuildContext).toHaveBeenCalledWith('Hi', expect.any(String), 'kb-123');
    expect(mockCostTracker.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ requestType: 'kb-retrieve' }),
    );
  });

  it('returns graceful response when MAX_TOOL_ROUNDS exceeded', async () => {
    const toolUseResponse = {
      message: { role: 'assistant' as const, content: [] },
      stopReason: 'tool_use',
      usage: { inputTokens: 10, outputTokens: 5 },
    };

    // Always return tool_use to trigger the loop limit
    mockBedrock.converse.mockResolvedValue(toolUseResponse);
    mockBedrock.extractToolUseBlocks.mockReturnValue([]);

    const result = await useCase.execute({
      conversationId: 'conv-1',
      message: 'Hi',
      assistantId: 'assistant-1',
    });

    expect(typeof result).not.toBe('string');
    if (typeof result !== 'string') {
      expect(result.response).toContain('unable to complete');
      expect(result.usage.toolCalls).toBe(6); // MAX_TOOL_ROUNDS + 1
    }
  });

  it('stores user message and assistant reply', async () => {
    await useCase.execute({
      conversationId: 'conv-1',
      message: 'Hello',
      assistantId: 'assistant-1',
    });

    expect(mockConversationRepo.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'user', content: 'Hello' }),
    );
    expect(mockConversationRepo.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'assistant', content: 'Hello!' }),
    );
    expect(mockConversationRepo.updateStats).toHaveBeenCalledWith('assistant-1', 'conv-1', 15, 0);
  });
});
