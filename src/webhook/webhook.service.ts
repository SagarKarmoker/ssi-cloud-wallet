import { Injectable } from '@nestjs/common';

@Injectable()
export class WebhookService {
  handleWebhookEvent(event: any) {
    // Process the webhook event
  }

  async handleCredential(payload: any) {}
}
