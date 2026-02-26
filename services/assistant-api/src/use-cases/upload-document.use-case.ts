import { logger } from '@ai-platform/shared';
import type { IKBDocument } from '@ai-platform/shared';
import type { IS3Adapter } from '../adapters/s3/interfaces/s3.adapter.interface';
import type { IKBDocumentRepository } from '../repositories/interfaces/kb-document.repository.interface';
import { s3Adapter } from '../adapters/s3/impl/s3.adapter';
import { kbDocumentRepository } from '../repositories/impl/kb-document.repository';

interface UploadDocumentInput {
  assistantId: string;
  filename: string;
  content: Buffer;
  contentType: string;
  category?: string;
}

export class UploadDocumentUseCase {
  constructor(
    private readonly s3: IS3Adapter,
    private readonly repo: IKBDocumentRepository,
  ) {}

  async execute(input: UploadDocumentInput): Promise<IKBDocument> {
    const category = input.category || 'general';
    const s3Key = `${input.assistantId}/${category}/${input.filename}`;

    await this.s3.upload(s3Key, input.content, input.contentType, {
      assistantId: input.assistantId,
      category,
      filename: input.filename,
    });

    const now = new Date().toISOString();
    const doc: IKBDocument = {
      assistantId: input.assistantId,
      filename: input.filename,
      category,
      contentType: input.contentType,
      sizeBytes: input.content.length,
      s3Key,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.create(doc);
    logger.info('KB document uploaded', { assistantId: input.assistantId, filename: input.filename, s3Key });

    return doc;
  }
}

export const uploadDocumentUseCase = new UploadDocumentUseCase(s3Adapter, kbDocumentRepository);
