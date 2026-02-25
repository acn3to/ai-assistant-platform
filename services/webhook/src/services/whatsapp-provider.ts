import axios from 'axios';
import { logger } from '@ai-platform/shared';
import type { IMessagingProvider, InboundMessage } from '../interfaces/messaging-provider';

/**
 * WhatsApp Cloud API provider implementation.
 * This is the default implementation using Meta's direct API.
 * Can be replaced with Twilio, 360dialog, etc. by implementing IMessagingProvider.
 */
class WhatsAppProvider implements IMessagingProvider {
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  async sendMessage(to: string, content: string): Promise<void> {
    try {
      await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: content },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      logger.info('WhatsApp message sent', { to });
    } catch (error: any) {
      logger.error('Failed to send WhatsApp message', {
        to,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  async sendTemplate(to: string, templateName: string, params: Record<string, string>): Promise<void> {
    try {
      await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: Object.values(params).map((value) => ({
                  type: 'text',
                  text: value,
                })),
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      logger.info('WhatsApp template sent', { to, templateName });
    } catch (error: any) {
      logger.error('Failed to send WhatsApp template', {
        to,
        templateName,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  async registerWebhook(_url: string): Promise<void> {
    // WhatsApp Cloud API webhook registration is done via the Meta Developer Dashboard
    logger.info('WhatsApp webhook registration should be done via Meta Developer Dashboard');
  }

  parseInboundMessage(payload: any): InboundMessage | null {
    try {
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages?.[0]) return null;

      const message = value.messages[0];
      const contact = value.contacts?.[0];

      return {
        from: message.from,
        content: message.text?.body || '',
        messageId: message.id,
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        type: message.type || 'text',
      };
    } catch (error) {
      logger.error('Failed to parse inbound WhatsApp message', { error });
      return null;
    }
  }
}

export const whatsappProvider = new WhatsAppProvider();

