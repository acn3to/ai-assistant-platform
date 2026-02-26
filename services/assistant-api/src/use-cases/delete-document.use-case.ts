import { logger } from '@ai-platform/shared';
import type { IS3Adapter } from '../adapters/s3/interfaces/s3.adapter.interface';
import type { IKBDocumentRepository } from '../repositories/interfaces/kb-document.repository.interface';
import { s3Adapter } from '../adapters/s3/impl/s3.adapter';
import { kbDocumentRepository } from '../repositories/impl/kb-document.repository';

export class DeleteDocumentUseCase {
  constructor(
    private readonly s3: IS3Adapter,
    private readonly repo: IKBDocumentRepository,
  ) {}

  async execute(assistantId: string, filename: string): Promise<void> {
    const doc = await this.repo.get(assistantId, filename);
    if (doc?.s3Key) {
      await this.s3.delete(doc.s3Key);
    }

    await this.repo.delete(assistantId, filename);
    logger.info('KB document deleted', { assistantId, filename });
  }
}

export const deleteDocumentUseCase = new DeleteDocumentUseCase(s3Adapter, kbDocumentRepository);
