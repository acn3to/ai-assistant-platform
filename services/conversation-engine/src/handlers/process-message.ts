import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Message } from '@aws-sdk/client-bedrock-runtime';
import { withObservability, logger, ok, badRequest, notFound, internalError } from '@ai-platform/shared';
import { bedrockService } from '../services/bedrock.service';
import { bedrockRAGService } from '../services/bedrock-rag.service';
import { connectorRuntime } from '../services/connector-runtime.service';
import { conversationRepository } from '../repositories/conversation.repository';
import { connectorRepository } from '../repositories/connector.repository';
import { costTracker } from '../services/cost-tracker.service';
import { assistantRepository } from '../repositories/assistant.repository';
import { promptRuntimeRepository } from '../repositories/prompt.repository';

const MAX_TOOL_ROUNDS = 5;

const processMessageHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const conversationId = event.pathParameters?.conversationId;
    if (!conversationId) return badRequest('conversationId is required');

    const body = JSON.parse(event.body || '{}');
    const { message, assistantId, tenantId, promptVariables } = body as {
      message?: string;
      assistantId?: string;
      tenantId?: string;
      promptVariables?: Record<string, string>;
      knowledgeBaseId?: string;
      systemPrompt?: string;
      modelId?: string;
      inferenceConfig?: { maxTokens: number; temperature: number };
    };

    if (!message || !assistantId) {
      return badRequest('message and assistantId are required');
    }

    // Get conversation or verify it exists
    const conversation = await conversationRepository.get(assistantId, conversationId);
    if (!conversation) return notFound('Conversation not found');

    // Store user message
    const userTimestamp = new Date().toISOString();
    await conversationRepository.addMessage({
      conversationId,
      timestamp: userTimestamp,
      role: 'user',
      content: message,
    });

    // Load conversation history
    const historyMessages = await conversationRepository.getMessages(conversationId);
    const bedrockMessages: Message[] = historyMessages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: [{ text: msg.content }],
    }));

    // Load assistant configuration from DynamoDB
    const assistant = await assistantRepository.getById(assistantId);
    if (!assistant) {
      return notFound('Assistant not found');
    }

    // Resolve the base system prompt and model/inference config from assistant
    const baseSystemPrompt = assistant.systemPrompt || 'You are a helpful assistant.';
    const modelId = body.modelId || assistant.modelId || 'anthropic.claude-3-haiku-20240307-v1:0';
    const inferenceConfig = body.inferenceConfig || assistant.inferenceConfig || {
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.9,
    };

    // Resolve variables for prompts: conversation sessionVars + optional request overrides
    const templateVars: Record<string, string> = {
      ...(conversation.sessionVars || {}),
      ...(promptVariables || {}),
    };

    const resolveTemplate = (template: string, vars: Record<string, string>): string =>
      template.replace(/\{\{(\w+)\}\}/g, (_match, key) => (key in vars ? vars[key] : `{{${key}}}`));

    // Load active prompt (if any) for this assistant and build the final system prompt
    const activePrompt = await promptRuntimeRepository.getActiveForAssistant(assistantId);
    let systemPrompt = baseSystemPrompt;

    if (activePrompt) {
      const resolvedPromptContent = resolveTemplate(activePrompt.content, templateVars);
      systemPrompt = `${baseSystemPrompt}\n\n${resolvedPromptContent}`;
    }

    // Load enabled connectors and build tool config
    const connectors = await connectorRepository.getEnabledByAssistant(assistantId);
    const secrets = tenantId ? await connectorRepository.getSecrets(tenantId) : {};

    const allTools = connectors.flatMap((c) =>
      c.tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    );

    const toolConfig = allTools.length > 0 ? bedrockService.buildToolConfig(allTools) : undefined;

    // Determine system prompt (with RAG if enabled)
    let finalSystemPrompt = systemPrompt;
    if (body.knowledgeBaseId) {
      const ragContext = await bedrockRAGService.retrieveAndBuildContext(
        message,
        systemPrompt,
        body.knowledgeBaseId,
      );
      finalSystemPrompt = ragContext.contextPrompt;

      await costTracker.trackEvent({
        conversationId,
        tenantId: tenantId || conversation.sessionVars?.tenantId || '',
        assistantId,
        requestType: 'kb-retrieve',
        modelId,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        estimatedCost: 0,
      });
    }

    // Agentic conversation loop
    let messages = [...bedrockMessages];
    let toolCallCount = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    while (true) {
      const startTime = Date.now();

      const response = await bedrockService.converse({
        modelId,
        systemPrompt: finalSystemPrompt,
        messages,
        inferenceConfig,
        toolConfig,
      });

      const latency = Date.now() - startTime;
      totalInputTokens += response.usage.inputTokens;
      totalOutputTokens += response.usage.outputTokens;

      // Track cost event
      await costTracker.trackEvent({
        conversationId,
        tenantId: tenantId || '',
        assistantId,
        requestType: 'converse',
        modelId,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        latencyMs: latency,
        estimatedCost: 0, // Calculated by cost tracking service
      });

      if (response.stopReason === 'end_turn') {
        const assistantText = bedrockService.extractText(response.message);

        // Store assistant response
        await conversationRepository.addMessage({
          conversationId,
          timestamp: new Date().toISOString(),
          role: 'assistant',
          content: assistantText,
          tokenUsage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
          },
        });

        // Update conversation stats
        await conversationRepository.updateStats(
          assistantId,
          conversationId,
          totalInputTokens + totalOutputTokens,
          0,
        );

        return ok({
          conversationId,
          response: assistantText,
          usage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            toolCalls: toolCallCount,
          },
        });
      }

      if (response.stopReason === 'tool_use') {
        toolCallCount++;
        if (toolCallCount > MAX_TOOL_ROUNDS) {
          logger.warn('Max tool call rounds exceeded', { conversationId, toolCallCount });

          return ok({
            conversationId,
            response: 'I apologize, but I was unable to complete the request. Please try again.',
            usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens, toolCalls: toolCallCount },
          });
        }

        const toolUseBlocks = bedrockService.extractToolUseBlocks(response.message);

        logger.info('Tool use requested', {
          conversationId,
          tools: toolUseBlocks.map((t) => t.name),
          round: toolCallCount,
        });

        // Execute all tool calls in parallel
        const toolResults = await Promise.all(
          toolUseBlocks.map((block) =>
            connectorRuntime.executeTool(block, connectors, {
              sessionVars: conversation.sessionVars || {},
              secrets,
            }),
          ),
        );

        // Track connector call costs
        for (const result of toolResults) {
          await costTracker.trackEvent({
            conversationId,
            tenantId: tenantId || '',
            assistantId,
            requestType: 'connector-call',
            modelId,
            inputTokens: 0,
            outputTokens: 0,
            latencyMs: 0,
            estimatedCost: 0,
          });
        }

        // Append assistant message (with tool_use) and user message (with tool_results)
        messages.push(response.message);
        messages.push({
          role: 'user',
          content: toolResults.map((result) => ({
            toolResult: {
              toolUseId: result.toolUseId,
              content: result.content,
              status: result.status,
            },
          })),
        });
      }
    }
  } catch (error) {
    logger.error('Process message failed', { error });
    return internalError('Failed to process message');
  }
};

export const handler = withObservability(processMessageHandler);

