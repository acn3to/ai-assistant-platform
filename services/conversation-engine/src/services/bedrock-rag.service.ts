import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { logger } from '@ai-platform/shared';
import type { RetrievalResult, RAGContext } from '../types';

const BEDROCK_REGION = process.env.BEDROCK_REGION || 'us-east-1';

class BedrockRAGService {
  private readonly agentClient: BedrockAgentRuntimeClient;

  constructor() {
    this.agentClient = new BedrockAgentRuntimeClient({ region: BEDROCK_REGION });
  }

  /**
   * Retrieve documents from Bedrock Knowledge Base.
   * Ported from toro's BedrockRagServiceImpl.
   */
  async retrieveDocuments(
    query: string,
    knowledgeBaseId: string,
    numberOfResults = 5,
    category?: string,
  ): Promise<RetrievalResult[]> {
    const filter = category
      ? { equals: { key: 'category', value: category } }
      : undefined;

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
      metadata: (result.metadata as Record<string, any>) ?? {},
    }));

    logger.info('RAG document retrieval', {
      query: query.substring(0, 200),
      knowledgeBaseId,
      documentsRetrieved: results.length,
      averageScore: results.length > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length
        : 0,
    });

    return results;
  }

  /**
   * Build context prompt from retrieved documents.
   * Ported from toro's buildContextPrompt.
   */
  buildContextPrompt(
    systemPrompt: string,
    query: string,
    results: RetrievalResult[],
  ): string {
    if (results.length === 0) return systemPrompt;

    const searchResults = results
      .map((result, index) => {
        const filename = typeof result.metadata?.filename === 'string'
          ? result.metadata.filename
          : 'unknown';
        const relevance = result.score.toFixed(3);
        return `[Document ${index + 1}] (relevance: ${relevance}, source: ${filename})\n${result.content}`;
      })
      .join('\n\n---\n\n');

    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    return `${systemPrompt}

## Retrieved Knowledge Base Documents
Average relevance score: ${averageScore.toFixed(3)}

${searchResults}

## User Query
${query}`;
  }

  /**
   * Full RAG pipeline: retrieve then build context
   */
  async retrieveAndBuildContext(
    query: string,
    systemPrompt: string,
    knowledgeBaseId: string,
    options?: { numberOfResults?: number; category?: string },
  ): Promise<RAGContext> {
    const documents = await this.retrieveDocuments(
      query,
      knowledgeBaseId,
      options?.numberOfResults,
      options?.category,
    );

    const contextPrompt = this.buildContextPrompt(systemPrompt, query, documents);
    const averageScore = documents.length > 0
      ? documents.reduce((sum, r) => sum + r.score, 0) / documents.length
      : 0;

    return { documents, contextPrompt, averageScore };
  }
}

export const bedrockRAGService = new BedrockRAGService();

