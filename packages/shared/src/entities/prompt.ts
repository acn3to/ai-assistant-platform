export interface IPrompt {
  assistantId: string;
  promptId: string;
  name: string;
  content: string;
  version: number;
  variables: string[];
  isActive: boolean;
  modelId?: string;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  createdAt: string;
  updatedAt: string;
}

