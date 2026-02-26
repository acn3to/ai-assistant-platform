import { UploadDocumentUseCase } from '../upload-document.use-case';
import type { IS3Adapter } from '../../adapters/s3/interfaces/s3.adapter.interface';
import type { IKBDocumentRepository } from '../../repositories/interfaces/kb-document.repository.interface';

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

describe('UploadDocumentUseCase', () => {
  let useCase: UploadDocumentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UploadDocumentUseCase(mockS3, mockRepo);
  });

  it('uploads to S3 then saves metadata to DynamoDB', async () => {
    const content = Buffer.from('file content');

    const result = await useCase.execute({
      assistantId: 'assistant-1',
      filename: 'doc.txt',
      content,
      contentType: 'text/plain',
      category: 'faq',
    });

    expect(mockS3.upload).toHaveBeenCalledWith(
      'assistant-1/faq/doc.txt',
      content,
      'text/plain',
      expect.objectContaining({ assistantId: 'assistant-1', filename: 'doc.txt' }),
    );
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ assistantId: 'assistant-1', filename: 'doc.txt', s3Key: 'assistant-1/faq/doc.txt' }),
    );
    expect(result.syncStatus).toBe('pending');
    expect(result.sizeBytes).toBe(content.length);
  });

  it('defaults category to "general" when not provided', async () => {
    await useCase.execute({
      assistantId: 'assistant-1',
      filename: 'file.txt',
      content: Buffer.from('data'),
      contentType: 'text/plain',
    });

    expect(mockS3.upload).toHaveBeenCalledWith(
      'assistant-1/general/file.txt',
      expect.any(Buffer),
      'text/plain',
      expect.objectContaining({ category: 'general' }),
    );
  });

  it('propagates S3 error without saving to DynamoDB', async () => {
    mockS3.upload.mockRejectedValue(new Error('S3 error'));

    await expect(
      useCase.execute({ assistantId: 'a', filename: 'f', content: Buffer.from('x'), contentType: 'text/plain' }),
    ).rejects.toThrow('S3 error');

    expect(mockRepo.create).not.toHaveBeenCalled();
  });
});
