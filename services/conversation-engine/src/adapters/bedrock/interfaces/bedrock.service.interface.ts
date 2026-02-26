import type { Message, ToolConfiguration } from '@aws-sdk/client-bedrock-runtime';
import type { ConverseInput, ConverseOutput, ToolUseBlock } from '../../../types';

export interface IBedrockService {
  converse(input: ConverseInput): Promise<ConverseOutput>;
  buildToolConfig(tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>): ToolConfiguration;
  extractText(message: Message): string;
  extractToolUseBlocks(message: Message): ToolUseBlock[];
}
