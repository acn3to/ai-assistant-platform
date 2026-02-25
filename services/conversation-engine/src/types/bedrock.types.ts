import type { Message, ToolConfiguration } from '@aws-sdk/client-bedrock-runtime';
import type { IInferenceConfig } from '@ai-platform/shared';

export interface ConverseInput {
  modelId: string;
  systemPrompt: string;
  messages: Message[];
  inferenceConfig: IInferenceConfig;
  toolConfig?: ToolConfiguration;
}

export interface ConverseOutput {
  message: Message;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface RetrievalResult {
  content: string;
  score: number;
  source: string;
  metadata: Record<string, any>;
}

export interface RAGContext {
  documents: RetrievalResult[];
  contextPrompt: string;
  averageScore: number;
}

