import { Message } from '@aws-sdk/client-bedrock-runtime';
import { logger } from '@ai-platform/shared';
import type { ICostEvent } from '@ai-platform/shared';
import type { IBedrockService } from '../adapters/bedrock/interfaces/bedrock.service.interface';
import type { IBedrockRAGService } from '../adapters/bedrock/interfaces/bedrock-rag.service.interface';
import type { IConversationRepository } from '../repositories/interfaces/conversation.repository.interface';
import type { IAssistantRepository } from '../repositories/interfaces/assistant.repository.interface';
import type { IConnectorRepository } from '../repositories/interfaces/connector.repository.interface';
import type { IPromptRuntimeRepository } from '../repositories/interfaces/prompt-runtime.repository.interface';
import type { ICostTracker } from '../services/cost-tracker.service';
import { bedrockService } from '../adapters/bedrock/impl/bedrock.service';
import { bedrockRAGService } from '../adapters/bedrock/impl/bedrock-rag.service';
import { conversationRepository } from '../repositories/impl/conversation.repository';
import { assistantRepository } from '../repositories/impl/assistant.repository';
import { connectorRepository } from '../repositories/impl/connector.repository';
import { promptRuntimeRepository } from '../repositories/impl/prompt-runtime.repository';
import { costTracker } from '../services/cost-tracker.service';
import { connectorRuntime } from '../services/connector-runtime.service';

const MAX_TOOL_ROUNDS = 5;

export interface ProcessMessageInput {
  conversationId: string;
  message: string;
  assistantId: string;
  tenantId?: string;
  promptVariables?: Record<string, string>;
  knowledgeBaseId?: string;
  modelId?: string;
  inferenceConfig?: { maxTokens: number; temperature: number; topP: number };
}

export interface ProcessMessageOutput {
  conversationId: string;
  response: string;
  usage: { inputTokens: number; outputTokens: number; toolCalls: number };
}

type NotFoundReason = 'conversation_not_found' | 'assistant_not_found';

export class ProcessMessageUseCase {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly assistantRepo: IAssistantRepository,
    private readonly connectorRepo: IConnectorRepository,
    private readonly promptRepo: IPromptRuntimeRepository,
    private readonly bedrock: IBedrockService,
    private readonly bedrockRAG: IBedrockRAGService,
    private readonly tracker: ICostTracker,
  ) {}

  async execute(input: ProcessMessageInput): Promise<ProcessMessageOutput | NotFoundReason> {
    const { conversationId, message, assistantId, tenantId, promptVariables, knowledgeBaseId } = input;

    const conversation = await this.conversationRepo.get(assistantId, conversationId);
    if (!conversation) return 'conversation_not_found';

    // Store user message
    const userTimestamp = new Date().toISOString();
    await this.conversationRepo.addMessage({
      conversationId,
      timestamp: userTimestamp,
      role: 'user',
      content: message,
    });

    // Load history and build Bedrock message array
    const historyMessages = await this.conversationRepo.getMessages(conversationId);
    const bedrockMessages: Message[] = historyMessages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: [{ text: msg.content }],
    }));

    // Load assistant config
    const assistant = await this.assistantRepo.getById(assistantId);
    if (!assistant) return 'assistant_not_found';

    const modelId = input.modelId || assistant.modelId || 'anthropic.claude-3-haiku-20240307-v1:0';
    const inferenceConfig = input.inferenceConfig || assistant.inferenceConfig || {
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.9,
    };

    // Resolve template variables
    const templateVars: Record<string, string> = {
      ...(conversation.sessionVars || {}),
      ...(promptVariables || {}),
    };
    const resolveTemplate = (template: string, vars: Record<string, string>): string =>
      template.replace(/\{\{(\w+)\}\}/g, (_match, key) => (key in vars ? vars[key] : `{{${key}}}`));

    // Build system prompt
    const baseSystemPrompt = assistant.systemPrompt || 'You are a helpful assistant.';
    const activePrompt = await this.promptRepo.getActiveForAssistant(assistantId);
    let systemPrompt = baseSystemPrompt;
    if (activePrompt) {
      systemPrompt = `${baseSystemPrompt}\n\n${resolveTemplate(activePrompt.content, templateVars)}`;
    }

    // Build tool config from enabled connectors
    const connectors = await this.connectorRepo.getEnabledByAssistant(assistantId);
    const secrets = tenantId ? await this.connectorRepo.getSecrets(tenantId) : {};
    const allTools = connectors.flatMap((c) =>
      c.tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
    );
    const toolConfig = allTools.length > 0 ? this.bedrock.buildToolConfig(allTools) : undefined;

    // RAG augmentation
    let finalSystemPrompt = systemPrompt;
    if (knowledgeBaseId) {
      const ragContext = await this.bedrockRAG.retrieveAndBuildContext(message, systemPrompt, knowledgeBaseId);
      finalSystemPrompt = ragContext.contextPrompt;

      await this.tracker.trackEvent(this.buildCostEvent(conversationId, tenantId, assistantId, modelId, 'kb-retrieve', 0, 0, 0));
    }

    // Agentic loop
    let messages = [...bedrockMessages];
    let toolCallCount = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    while (true) {
      const startTime = Date.now();
      const response = await this.bedrock.converse({ modelId, systemPrompt: finalSystemPrompt, messages, inferenceConfig, toolConfig });
      const latency = Date.now() - startTime;

      totalInputTokens += response.usage.inputTokens;
      totalOutputTokens += response.usage.outputTokens;

      await this.tracker.trackEvent(
        this.buildCostEvent(conversationId, tenantId, assistantId, modelId, 'converse', response.usage.inputTokens, response.usage.outputTokens, latency),
      );

      if (response.stopReason === 'end_turn') {
        const assistantText = this.bedrock.extractText(response.message);

        await this.conversationRepo.addMessage({
          conversationId,
          timestamp: new Date().toISOString(),
          role: 'assistant',
          content: assistantText,
          tokenUsage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        });

        await this.conversationRepo.updateStats(assistantId, conversationId, totalInputTokens + totalOutputTokens, 0);

        return { conversationId, response: assistantText, usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens, toolCalls: toolCallCount } };
      }

      if (response.stopReason === 'tool_use') {
        toolCallCount++;
        if (toolCallCount > MAX_TOOL_ROUNDS) {
          logger.warn('Max tool call rounds exceeded', { conversationId, toolCallCount });
          return {
            conversationId,
            response: 'I apologize, but I was unable to complete the request. Please try again.',
            usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens, toolCalls: toolCallCount },
          };
        }

        const toolUseBlocks = this.bedrock.extractToolUseBlocks(response.message);
        logger.info('Tool use requested', { conversationId, tools: toolUseBlocks.map((t) => t.name), round: toolCallCount });

        const toolResults = await Promise.all(
          toolUseBlocks.map((block) => connectorRuntime.executeTool(block, connectors, { sessionVars: conversation.sessionVars || {}, secrets })),
        );

        for (const _result of toolResults) {
          await this.tracker.trackEvent(this.buildCostEvent(conversationId, tenantId, assistantId, modelId, 'connector-call', 0, 0, 0));
        }

        messages.push(response.message);
        messages.push({
          role: 'user',
          content: toolResults.map((result) => ({
            toolResult: { toolUseId: result.toolUseId, content: result.content, status: result.status },
          })),
        });
      }
    }
  }

  private buildCostEvent(
    conversationId: string,
    tenantId: string | undefined,
    assistantId: string,
    modelId: string,
    requestType: ICostEvent['requestType'],
    inputTokens: number,
    outputTokens: number,
    latencyMs: number,
  ): Omit<ICostEvent, 'timestamp'> {
    return {
      conversationId,
      tenantId: tenantId || '',
      assistantId,
      requestType,
      modelId,
      inputTokens,
      outputTokens,
      latencyMs,
      estimatedCost: 0,
    };
  }
}

export const processMessageUseCase = new ProcessMessageUseCase(
  conversationRepository,
  assistantRepository,
  connectorRepository,
  promptRuntimeRepository,
  bedrockService,
  bedrockRAGService,
  costTracker,
);
