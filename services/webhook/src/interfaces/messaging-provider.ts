/**
 * Provider-agnostic messaging interface.
 * Implementations can be swapped for different WhatsApp BSPs
 * (Meta direct, Twilio, 360dialog, etc.)
 */
export interface IMessagingProvider {
  sendMessage(to: string, content: string): Promise<void>;
  sendTemplate(to: string, templateName: string, params: Record<string, string>): Promise<void>;
  registerWebhook(url: string): Promise<void>;
  parseInboundMessage(payload: any): InboundMessage | null;
}

export interface InboundMessage {
  from: string;
  content: string;
  messageId: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'document';
}

