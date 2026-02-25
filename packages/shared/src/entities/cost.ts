export type RequestType = 'converse' | 'kb-retrieve' | 'kb-rerank' | 'connector-call';

export interface ICostEvent {
  conversationId: string;
  timestamp: string;
  tenantId: string;
  assistantId: string;
  requestType: RequestType;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCost: number;
}

export interface IRollupBreakdown {
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requests: number;
}

export interface IDailyRollup {
  tenantId: string;
  date: string;
  assistantId?: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCost: number;
  totalRequests: number;
  totalConversations: number;
  byModel?: Record<string, IRollupBreakdown>;
  byAssistant?: Record<string, IRollupBreakdown>;
  costByModel?: Record<string, number>;
  costByRequestType?: Record<string, number>;
  createdAt?: string;
}

export interface IMonthlyRollup {
  tenantId: string;
  month: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCost: number;
  totalRequests: number;
  totalConversations: number;
  avgCostPerConversation?: number;
  byModel?: Record<string, IRollupBreakdown>;
  byAssistant?: Record<string, IRollupBreakdown>;
  costByModel?: Record<string, number>;
  costByRequestType?: Record<string, number>;
  createdAt?: string;
}

export interface IPricingConfig {
  modelId: string;
  inputPricePer1kTokens: number;
  outputPricePer1kTokens: number;
  kbRetrievePricePerCall: number;
  kbRerankPricePerCall: number;
  updatedAt: string;
}
