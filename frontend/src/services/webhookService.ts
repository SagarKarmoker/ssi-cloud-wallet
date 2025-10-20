import api from './api';

export interface WebhookEvent {
  id: string;
  topic: string;
  state: string;
  wallet_id: string;
  payload: any;
  timestamp: string;
  processed: boolean;
}

export interface WebhookStats {
  total_events: number;
  events_by_topic: Record<string, number>;
  events_by_state: Record<string, number>;
  recent_events: WebhookEvent[];
}

class WebhookService {
  async getEvents(walletId: string, topic?: string, limit?: number, offset?: number): Promise<WebhookEvent[]> {
    const params = new URLSearchParams();
    if (topic) params.append('topic', topic);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const queryString = params.toString();
    const response = await api.get(`/webhooks/events/${walletId}${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async getEvent(walletId: string, eventId: string): Promise<WebhookEvent> {
    const response = await api.get(`/webhooks/events/${walletId}/${eventId}`);
    return response.data;
  }

  async getEventsByTopic(walletId: string, topic: string, limit?: number, offset?: number): Promise<WebhookEvent[]> {
    return this.getEvents(walletId, topic, limit, offset);
  }

  async getStats(_walletId: string): Promise<WebhookStats> {
    // This endpoint doesn't exist in backend yet
    throw new Error('Webhook stats not implemented in backend yet');
  }

  async markEventProcessed(_walletId: string, _eventId: string): Promise<WebhookEvent> {
    // This endpoint doesn't exist in backend yet
    throw new Error('Mark event processed not implemented in backend yet');
  }

  async deleteEvent(_walletId: string, _eventId: string): Promise<void> {
    // This endpoint doesn't exist in backend yet
    throw new Error('Delete event not implemented in backend yet');
  }

  async clearEvents(_walletId: string): Promise<void> {
    // This endpoint doesn't exist in backend yet
    throw new Error('Clear events not implemented in backend yet');
  }
}

export const webhookService = new WebhookService();