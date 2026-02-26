import type { IKBDocument } from '@ai-platform/shared';

export interface IKBDocumentRepository {
  create(doc: IKBDocument): Promise<void>;
  get(assistantId: string, filename: string): Promise<IKBDocument | null>;
  listByAssistant(assistantId: string): Promise<IKBDocument[]>;
  delete(assistantId: string, filename: string): Promise<void>;
}
