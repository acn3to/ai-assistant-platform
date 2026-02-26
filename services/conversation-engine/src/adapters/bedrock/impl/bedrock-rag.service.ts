import { BedrockAgentRuntimeClient, RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { logger } from '@ai-platform/shared';
import type { RetrievalResult, RAGContext } from '../../../types';
import type { IBedrockRAGService } from '../interfaces/bedrock-rag.service.interface';

const BEDROCK_REGION = process.env.BEDROCK_REGION || 'us-east-1';

class BedrockRAGService implements IBedrockRAGService {
  private readonly agentClient: BedrockAgentRuntimeClient;

  constructor() {
    this.agentClient = new BedrockAgentRuntimeClient({ region: BEDROCK_REGION });
  }

  async retrieveAndBuildContext(
    query: string,
    systemPrompt: string,
    knowledgeBaseId: string,
    options?: { numberOfResults?: number; category?: string },
  ): Promise<RAGContext> {
    const documents = await this.retrieveDocuments(query, knowledgeBaseId, options?.numberOfResults, options?.category);
    const contextPrompt = this.buildContextPrompt(systemPrompt, query, documents);
    const averageScore = documents.length > 0
      ? documents.reduce((sum, r) => sum + r.score, 0) / documents.length
      : 0;

    return { documents, contextPrompt, averageScore };
  }

  private async retrieveDocuments(
    query: string,
    knowledgeBaseId: string,
    numberOfResults = 5,
    category?: string,
  ): Promise<RetrievalResult[]> {
    const filter = category ? { equals: { key: 'category', value: category } } : undefined;

    const command = new RetrieveCommand({
      knowledgeBaseId,
      retrievalQuery: { text: query },
      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults,
          ...(filter && { filter }),
        },
      },
    });

    const response = await this.agentClient.send(command);

    const results = (response.retrievalResults || []).map((result) => ({
      content: result.content?.text ?? '',
      score: result.score ?? 0,
      source: result.location?.s3Location?.uri ?? 'unknown',
      metadata: (result.metadata as Record<string, unknown>) ?? {},
    }));

    logger.info('RAG document retrieval', {
      query: query.substring(0, 200),
      knowledgeBaseId,
      documentsRetrieved: results.length,
    });

    return results;
  }

  private buildContextPrompt(systemPrompt: string, query: string, results: RetrievalResult[]): string {
    if (results.length === 0) return systemPrompt;

    const searchResults = results
      .map((result, index) => {
        const filename = typeof result.metadata?.filename === 'string' ? result.metadata.filename : 'unknown';
        return `[Document ${index + 1}] (relevance: ${result.score.toFixed(3)}, source: ${filename})\n${result.content}`;
      })
      .join('\n\n---\n\n');

    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    return `${systemPrompt}\n\n## Retrieved Knowledge Base Documents\nAverage relevance score: ${averageScore.toFixed(3)}\n\n${searchResults}\n\n## User Query\n${query}`;
  }
}

export const bedrockRAGService = new BedrockRAGService();
