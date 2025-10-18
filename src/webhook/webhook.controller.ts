import { Controller, Post, Body, Req, HttpCode, Logger } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('api/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}
  private readonly logger = new Logger(WebhookController.name);

  // Handle dynamic topics: /api/webhooks/connections, /api/webhooks/proofs, etc.
  @Post(':topic')
  @HttpCode(200) // ACA-Py expects 2xx; don't return 201
  async handleWebhook(@Req() req: any, @Body() payload: any) {
    const topic = req.params.topic;

    this.logger.log(
      `Received webhook [${topic}]:`,
      JSON.stringify(payload, null, 2),
    );

    // Optional: Add logic per topic
    switch (topic) {
      case 'connections':
        await this.handleConnection(payload);
        break;
      case 'issue-credential':
        await this.handleCredential(payload);
        break;
      case 'present-proof':
        await this.handleProof(payload);
        break;
      default:
        this.logger.warn(`Unhandled webhook topic: ${topic}`);
    }

    // Always return 200 quickly
    return { status: 'ok' };
  }

  private async handleConnection(payload: any) {
    // Example: Save connection_id to user profile
    if (payload.state === 'active') {
      this.logger.log(`Connection active: ${payload.connection_id}`);
    }
  }

  private async handleCredential(payload: any) {}

  private async handleProof(payload: any) {
    // Example: Auto-respond to proof requests (if policy allows)
    if (payload.state === 'request-received') {
      this.logger.log(
        `Proof request received: ${payload.presentation_exchange_id}`,
      );
      // You could trigger auto-response here via ACA-Py proxy
    }
  }
}
