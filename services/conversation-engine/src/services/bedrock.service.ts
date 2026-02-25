import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
  ContentBlock,
  ToolConfiguration,
  ToolSpecification,
} from '@aws-sdk/client-bedrock-runtime';
import { logger } from '@ai-platform/shared';
import type { ConverseInput, ConverseOutput } from '../types';

const BEDROCK_REGION = process.env.BEDROCK_REGION || 'us-east-1';

class BedrockService {
  private readonly client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({ region: BEDROCK_REGION });
  }

  /**
   * Calls Bedrock Converse API with optional tool_use support.
   * Ported from toro's BedrockServiceImpl, extended with toolConfig.
   */
  async converse(input: ConverseInput): Promise<ConverseOutput> {
    const { modelId, systemPrompt, messages, inferenceConfig, toolConfig } = input;

    const config: Record<string, unknown> = {
      maxTokens: inferenceConfig.maxTokens,
    };
    if (inferenceConfig.temperature !== undefined) config.temperature = inferenceConfig.temperature;
    if (inferenceConfig.topP !== undefined) config.topP = inferenceConfig.topP;

    const command = new ConverseCommand({
      modelId,
      system: [{ text: systemPrompt }],
      messages,
      inferenceConfig: config,
      ...(toolConfig && { toolConfig }),
    });

    const response = await this.client.send(command);

    const outputMessage = response.output?.message;
    if (!outputMessage) {
      throw new Error('No output message from Bedrock');
    }

    return {
      message: outputMessage,
      stopReason: response.stopReason || 'end_turn',
      usage: {
        inputTokens: response.usage?.inputTokens || 0,
        outputTokens: response.usage?.outputTokens || 0,
      },
    };
  }

  /**
   * Build tool configuration from connector tool definitions
   */
  buildToolConfig(tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>): ToolConfiguration {
    return {
      tools: tools.map((tool) => ({
        toolSpec: {
          name: tool.name,
          description: tool.description,
          inputSchema: {
            json: tool.inputSchema,
          },
        } as ToolSpecification,
      })),
    };
  }

  /**
   * Extract text content from a Bedrock message
   */
  extractText(message: Message): string {
    if (!message.content) return '';
    return message.content
      .filter((block): block is ContentBlock.TextMember => 'text' in block)
      .map((block) => block.text)
      .join('');
  }

  /**
   * Extract tool_use blocks from a Bedrock message
   */
  extractToolUseBlocks(message: Message): Array<{ toolUseId: string; name: string; input: Record<string, any> }> {
    if (!message.content) return [];
    return message.content
      .filter((block): block is ContentBlock.ToolUseMember => 'toolUse' in block)
      .map((block) => ({
        toolUseId: block.toolUse.toolUseId!,
        name: block.toolUse.name!,
        input: (block.toolUse.input as Record<string, any>) || {},
      }));
  }
}

export const bedrockService = new BedrockService();

