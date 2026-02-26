import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withObservability, logger, ok, created, noContent, badRequest, internalError } from '@ai-platform/shared';
import { uploadDocumentUseCase } from '../use-cases/upload-document.use-case';
import { deleteDocumentUseCase } from '../use-cases/delete-document.use-case';
import { kbDocumentRepository } from '../repositories/impl/kb-document.repository';

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

    const doc = await uploadDocumentUseCase.execute({
      assistantId,
      filename,
      content: Buffer.from(content, 'base64'),
      contentType: contentType || 'text/plain',
      category,
    });

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

    await deleteDocumentUseCase.execute(assistantId, decodeURIComponent(filename));

    return noContent();
  } catch (error) {
    logger.error('Delete KB document failed', { error });
    return internalError('Failed to delete document');
  }
};

export const listDocuments = withObservability(listDocumentsHandler);
export const uploadDocument = withObservability(uploadDocumentHandler);
export const deleteDocument = withObservability(deleteDocumentHandler);
