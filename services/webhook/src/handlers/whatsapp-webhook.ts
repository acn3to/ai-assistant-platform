import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { withObservability, logger, ok, badRequest, internalError } from '@ai-platform/shared';
import { whatsappProvider } from '../services/whatsapp-provider';

const snsClient = new SNSClient({ region: process.env.REGION || 'us-east-1' });
const INBOUND_TOPIC_ARN = process.env.INBOUND_TOPIC_ARN || '';
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';

const webhookHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // GET = webhook verification
  if (event.httpMethod === 'GET') {
    const mode = event.queryStringParameters?.['hub.mode'];
    const token = event.queryStringParameters?.['hub.verify_token'];
    const challenge = event.queryStringParameters?.['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.info('Webhook verified');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: challenge || '',
      };
    }

    return badRequest('Verification failed');
  }

  // POST = inbound message
  try {
    const payload = JSON.parse(event.body || '{}');
    const message = whatsappProvider.parseInboundMessage(payload);

    if (!message) {
      // WhatsApp sends status updates too, which we can ignore
      return ok({ status: 'ignored' });
    }

    logger.info('Inbound WhatsApp message', {
      from: message.from,
      type: message.type,
      messageId: message.messageId,
    });

    // Publish to SNS for async processing
    await snsClient.send(
      new PublishCommand({
        TopicArn: INBOUND_TOPIC_ARN,
        Message: JSON.stringify({
          source: 'whatsapp',
          ...message,
        }),
        MessageAttributes: {
          source: { DataType: 'String', StringValue: 'whatsapp' },
          from: { DataType: 'String', StringValue: message.from },
        },
      }),
    );

    return ok({ status: 'received' });
  } catch (error) {
    logger.error('Webhook processing failed', { error });
    return internalError('Webhook processing failed');
  }
};

export const handler = withObservability(webhookHandler);

