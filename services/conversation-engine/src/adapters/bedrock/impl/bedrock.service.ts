import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
  ContentBlock,
  ToolConfiguration,
  ToolSpecification,
} from '@aws-sdk/client-bedrock-runtime';
import type { ConverseInput, ConverseOutput, ToolUseBlock } from '../../../types';
import type { IBedrockService } from '../interfaces/bedrock.service.interface';

const BEDROCK_REGION = process.env.BEDROCK_REGION || 'us-east-1';

class BedrockService implements IBedrockService {
  private readonly client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({ region: BEDROCK_REGION });
  }

  async converse(input: ConverseInput): Promise<ConverseOutput> {
    const { modelId, systemPrompt, messages, inferenceConfig, toolConfig } = input;

    const config: Record<string, unknown> = { maxTokens: inferenceConfig.maxTokens };
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
    if (!outputMessage) throw new Error('No output message from Bedrock');

    return {
      message: outputMessage,
      stopReason: response.stopReason || 'end_turn',
      usage: {
        inputTokens: response.usage?.inputTokens || 0,
        outputTokens: response.usage?.outputTokens || 0,
      },
    };
  }

  buildToolConfig(tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>): ToolConfiguration {
    return {
      tools: tools.map((tool) => ({
        toolSpec: {
          name: tool.name,
          description: tool.description,
          inputSchema: { json: tool.inputSchema },
        } as ToolSpecification,
      })),
    };
  }

  extractText(message: Message): string {
    if (!message.content) return '';
    return message.content
      .filter((block): block is ContentBlock.TextMember => 'text' in block)
      .map((block) => block.text)
      .join('');
  }

  extractToolUseBlocks(message: Message): ToolUseBlock[] {
    if (!message.content) return [];
    return message.content
      .filter((block): block is ContentBlock.ToolUseMember => 'toolUse' in block)
      .map((block) => ({
        toolUseId: block.toolUse.toolUseId!,
        name: block.toolUse.name!,
        input: (block.toolUse.input as Record<string, unknown>) || {},
      }));
  }

}

export const bedrockService = new BedrockService();
