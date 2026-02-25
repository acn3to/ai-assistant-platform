export interface IInferenceConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
}

export interface IAssistant {
  tenantId: string;
  assistantId: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelId: string;
  inferenceConfig: IInferenceConfig;
  knowledgeBaseEnabled: boolean;
  knowledgeBaseId?: string;
  whatsappPhoneNumber?: string;
   activeFlowId?: string | null;
  status: 'draft' | 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
}

