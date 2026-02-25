import { SQSEvent } from 'aws-lambda';
import { logger } from '@ai-platform/shared';
import { whatsappProvider } from '../services/whatsapp-provider';

/**
 * SQS consumer that sends outbound messages via the messaging provider.
 * Processes messages from the outbound queue one at a time for reliable delivery.
 */
export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { to, content, type } = message;

      logger.info('Sending outbound message', { to, type });

      if (type === 'template') {
        await whatsappProvider.sendTemplate(to, message.templateName, message.params);
      } else {
        await whatsappProvider.sendMessage(to, content);
      }

      logger.info('Outbound message sent', { to });
    } catch (error) {
      logger.error('Failed to send outbound message', { error, record: record.body });
      throw error; // SQS will retry
    }
  }
};

