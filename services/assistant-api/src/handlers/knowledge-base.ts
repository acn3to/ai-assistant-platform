import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { withObservability, logger, ok, created, noContent, badRequest, internalError } from '@ai-platform/shared';
import { kbDocumentRepository } from '../repositories/kb-document.repository';
import type { IKBDocument } from '@ai-platform/shared';

const s3Client = new S3Client({ region: process.env.REGION || 'us-east-1' });
const KB_BUCKET_NAME = process.env.KB_BUCKET_NAME || '';

const listDocumentsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    if (!assistantId) return badRequest('assistantId is required');

    const documents = await kbDocumentRepository.listByAssistant(assistantId);
    return ok({ documents });
  } catch (error) {
    logger.error('List KB documents failed', { error });
    return internalError('Failed to list documents');
  }
};

const uploadDocumentHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    if (!assistantId) return badRequest('assistantId is required');

    const body = JSON.parse(event.body || '{}');
    const { filename, content, contentType, category } = body;

    if (!filename || !content) {
      return badRequest('filename and content are required');
    }

    const s3Key = `${assistantId}/${category || 'general'}/${filename}`;
    const contentBuffer = Buffer.from(content, 'base64');

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: KB_BUCKET_NAME,
        Key: s3Key,
        Body: contentBuffer,
        ContentType: contentType || 'text/plain',
        Metadata: {
          assistantId,
          category: category || 'general',
          filename,
        },
      }),
    );

    const now = new Date().toISOString();
    const doc: IKBDocument = {
      assistantId,
      filename,
      category: category || 'general',
      contentType: contentType || 'text/plain',
      sizeBytes: contentBuffer.length,
      s3Key,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await kbDocumentRepository.create(doc);
    logger.info('KB document uploaded', { assistantId, filename, s3Key });

    return created(doc);
  } catch (error) {
    logger.error('Upload KB document failed', { error });
    return internalError('Failed to upload document');
  }
};

const deleteDocumentHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const assistantId = event.pathParameters?.assistantId;
    const filename = event.pathParameters?.filename;
    if (!assistantId || !filename) return badRequest('assistantId and filename are required');

    const doc = await kbDocumentRepository.get(assistantId, decodeURIComponent(filename));
    if (doc?.s3Key) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: KB_BUCKET_NAME,
          Key: doc.s3Key,
        }),
      );
    }

    await kbDocumentRepository.delete(assistantId, decodeURIComponent(filename));
    logger.info('KB document deleted', { assistantId, filename });

    return noContent();
  } catch (error) {
    logger.error('Delete KB document failed', { error });
    return internalError('Failed to delete document');
  }
};

export const listDocuments = withObservability(listDocumentsHandler);
export const uploadDocument = withObservability(uploadDocumentHandler);
export const deleteDocument = withObservability(deleteDocumentHandler);

