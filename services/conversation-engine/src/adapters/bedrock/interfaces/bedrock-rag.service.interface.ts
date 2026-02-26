import type { RAGContext } from '../../../types';

export interface IBedrockRAGService {
  retrieveAndBuildContext(
    query: string,
    systemPrompt: string,
    knowledgeBaseId: string,
    options?: { numberOfResults?: number; category?: string },
  ): Promise<RAGContext>;
}
