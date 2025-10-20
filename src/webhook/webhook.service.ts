import { Injectable, Logger } from '@nestjs/common';

export interface WebhookEvent {
  id: string;
  walletId: string;
  topic: string;
  payload: any;
  timestamp: Date;
  processed: boolean;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private events: WebhookEvent[] = []; // In-memory storage for now

  async storeEvent(topic: string, payload: any): Promise<WebhookEvent> {
    const event: WebhookEvent = {
      id: this.generateEventId(),
      walletId: payload.wallet_id || 'unknown',
      topic,
      payload,
      timestamp: new Date(),
      processed: false,
    };

    this.events.push(event);
    this.logger.log(`Stored event ${event.id} for wallet ${event.walletId}`);
    
    return event;
  }

  async getEvents(walletId: string, topic?: string, limit = 50, offset = 0): Promise<WebhookEvent[]> {
    let filteredEvents = this.events.filter(event => event.walletId === walletId);
    
    if (topic) {
      filteredEvents = filteredEvents.filter(event => event.topic === topic);
    }

    // Sort by timestamp descending (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return filteredEvents.slice(offset, offset + limit);
  }

  async getEvent(walletId: string, eventId: string): Promise<WebhookEvent | null> {
    return this.events.find(event => event.id === eventId && event.walletId === walletId) || null;
  }

  // Notification handlers - these would typically integrate with push notifications, websockets, etc.
  async notifyConnectionActive(payload: any): Promise<void> {
    this.logger.log(`Notification: Connection ${payload.connection_id} is now active for wallet ${payload.wallet_id}`);
    // TODO: Implement actual notification system (WebSocket, push notification, etc.)
  }

  async notifyCredentialOffer(payload: any): Promise<void> {
    this.logger.log(`Notification: Credential offer received for wallet ${payload.wallet_id}`);
    // TODO: Implement actual notification system
  }

  async notifyCredentialReceived(payload: any): Promise<void> {
    this.logger.log(`Notification: Credential received and ready to store for wallet ${payload.wallet_id}`);
    // TODO: Implement actual notification system
  }

  async notifyCredentialStored(payload: any): Promise<void> {
    this.logger.log(`Notification: Credential stored successfully for wallet ${payload.wallet_id}`);
    // TODO: Implement actual notification system
  }

  async notifyProofRequest(payload: any): Promise<void> {
    this.logger.log(`Notification: Proof request received for wallet ${payload.wallet_id}`);
    // TODO: Implement actual notification system
  }

  async notifyProofCompleted(payload: any): Promise<void> {
    this.logger.log(`Notification: Proof presentation completed for wallet ${payload.wallet_id}`);
    // TODO: Implement actual notification system
  }

  async notifyMessage(payload: any): Promise<void> {
    this.logger.log(`Notification: Basic message received for wallet ${payload.wallet_id}`);
    // TODO: Implement actual notification system
  }

  async notifyProblemReport(payload: any): Promise<void> {
    this.logger.warn(`Notification: Problem report received for wallet ${payload.wallet_id}`);
    // TODO: Implement actual notification system
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Legacy method for compatibility
  handleWebhookEvent(event: any) {
    // Process the webhook event
    this.logger.log('Processing webhook event:', event);
  }

  async handleCredential(payload: any) {
    this.logger.log('Handling credential webhook:', payload);
  }
}
