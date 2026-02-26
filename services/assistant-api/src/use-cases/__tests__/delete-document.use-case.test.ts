import { DeleteDocumentUseCase } from '../delete-document.use-case';
import type { IS3Adapter } from '../../adapters/s3/interfaces/s3.adapter.interface';
import type { IKBDocumentRepository } from '../../repositories/interfaces/kb-document.repository.interface';
import type { IKBDocument } from '@ai-platform/shared';

const mockS3: jest.Mocked<IS3Adapter> = {
  upload: jest.fn(),
  delete: jest.fn(),
};

const mockRepo: jest.Mocked<IKBDocumentRepository> = {
  create: jest.fn(),
  get: jest.fn(),
  listByAssistant: jest.fn(),
  delete: jest.fn(),
};

const makeDoc = (overrides: Partial<IKBDocument> = {}): IKBDocument => ({
  assistantId: 'assistant-1',
  filename: 'doc.txt',
  s3Key: 'assistant-1/general/doc.txt',
  contentType: 'text/plain',
  sizeBytes: 100,
  category: 'general',
  syncStatus: 'synced',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('DeleteDocumentUseCase', () => {
  let useCase: DeleteDocumentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DeleteDocumentUseCase(mockS3, mockRepo);
  });

  it('deletes from S3 then removes metadata from DynamoDB', async () => {
    mockRepo.get.mockResolvedValue(makeDoc());

    await useCase.execute('assistant-1', 'doc.txt');

    expect(mockS3.delete).toHaveBeenCalledWith('assistant-1/general/doc.txt');
    expect(mockRepo.delete).toHaveBeenCalledWith('assistant-1', 'doc.txt');
  });

  it('still deletes from DynamoDB when document not found in repo', async () => {
    mockRepo.get.mockResolvedValue(null);

    await useCase.execute('assistant-1', 'missing.txt');

    expect(mockS3.delete).not.toHaveBeenCalled();
    expect(mockRepo.delete).toHaveBeenCalledWith('assistant-1', 'missing.txt');
  });
});
