import { Controller, Post, Body, Req, HttpCode, Logger, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookService, WebhookEvent } from './webhook.service';

@ApiTags('Webhooks')
@Controller('api/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}
  private readonly logger = new Logger(WebhookController.name);

  // Handle dynamic topics: /api/webhooks/connections, /api/webhooks/proofs, etc.
  @Post(':topic')
  @HttpCode(200) // ACA-Py expects 2xx; don't return 201
  @ApiOperation({ summary: 'Handle webhook events from ACA-Py' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(@Req() req: any, @Body() payload: any) {
    const topic = req.params.topic;

    this.logger.log(
      `Received webhook [${topic}] for wallet [${payload.wallet_id || 'unknown'}]:`,
      JSON.stringify(payload, null, 2),
    );

    try {
      // Store the event
      await this.webhookService.storeEvent(topic, payload);

      // Process the webhook based on topic
      await this.processWebhookTopic(topic, payload);

      // Always return 200 quickly
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      // Still return 200 to prevent ACA-Py from retrying
      return { status: 'error', message: error.message };
    }
  }

  private async processWebhookTopic(topic: string, payload: any) {
    switch (topic) {
      case 'connections':
        await this.handleConnection(payload);
        break;
      case 'issue_credential_v2_0':
      case 'issue-credential':
      case 'issue_credential':
        await this.handleCredential(payload);
        break;
      case 'present_proof_v2_0':
      case 'present-proof':
      case 'present_proof':
        await this.handleProof(payload);
        break;
      case 'basicmessages':
      case 'basic_messages':
        await this.handleBasicMessage(payload);
        break;
      case 'problem_report':
        await this.handleProblemReport(payload);
        break;
      default:
        this.logger.warn(`Unhandled webhook topic: ${topic}`);
    }
  }

  @Get('events/:walletId')
  @ApiOperation({ summary: 'Get webhook events for a wallet' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async getEvents(
    @Param('walletId') walletId: string,
    @Query('topic') topic?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<WebhookEvent[]> {
    return this.webhookService.getEvents(walletId, topic, limit, offset);
  }

  @Get('events/:walletId/:eventId')
  @ApiOperation({ summary: 'Get specific webhook event' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  async getEvent(
    @Param('walletId') walletId: string,
    @Param('eventId') eventId: string
  ): Promise<WebhookEvent | null> {
    return this.webhookService.getEvent(walletId, eventId);
  }

  private async handleConnection(payload: any) {
    this.logger.log(`Processing connection event: ${payload.state}`);
    
    switch (payload.state) {
      case 'invitation':
        this.logger.log(`Connection invitation created: ${payload.connection_id}`);
        break;
      case 'request':
        this.logger.log(`Connection request received: ${payload.connection_id}`);
        break;
      case 'response':
        this.logger.log(`Connection response sent/received: ${payload.connection_id}`);
        break;
      case 'active':
        this.logger.log(`Connection established: ${payload.connection_id}`);
        // Notify user that connection is active
        await this.webhookService.notifyConnectionActive(payload);
        break;
      case 'error':
        this.logger.error(`Connection error: ${payload.connection_id}`);
        break;
    }
  }

  private async handleCredential(payload: any) {
    this.logger.log(`Processing credential event: ${payload.state}`);
    
    switch (payload.state) {
      case 'offer-received':
        this.logger.log(`Credential offer received: ${payload.cred_ex_id}`);
        // Notify user of credential offer
        await this.webhookService.notifyCredentialOffer(payload);
        break;
      case 'request-sent':
        this.logger.log(`Credential request sent: ${payload.cred_ex_id}`);
        break;
      case 'credential-received':
        this.logger.log(`Credential received: ${payload.cred_ex_id}`);
        // Notify user that credential is ready to store
        await this.webhookService.notifyCredentialReceived(payload);
        break;
      case 'done':
        this.logger.log(`Credential exchange completed: ${payload.cred_ex_id}`);
        await this.webhookService.notifyCredentialStored(payload);
        break;
      case 'abandoned':
        this.logger.log(`Credential exchange abandoned: ${payload.cred_ex_id}`);
        break;
    }
  }

  private async handleProof(payload: any) {
    this.logger.log(`Processing proof event: ${payload.state}`);
    
    switch (payload.state) {
      case 'request-received':
        this.logger.log(`Proof request received: ${payload.pres_ex_id}`);
        // Notify user of proof request
        await this.webhookService.notifyProofRequest(payload);
        break;
      case 'presentation-sent':
        this.logger.log(`Presentation sent: ${payload.pres_ex_id}`);
        break;
      case 'done':
        this.logger.log(`Proof presentation completed: ${payload.pres_ex_id}`);
        await this.webhookService.notifyProofCompleted(payload);
        break;
      case 'abandoned':
        this.logger.log(`Proof presentation abandoned: ${payload.pres_ex_id}`);
        break;
    }
  }

  private async handleBasicMessage(payload: any) {
    this.logger.log(`Basic message received from connection: ${payload.connection_id}`);
    await this.webhookService.notifyMessage(payload);
  }

  private async handleProblemReport(payload: any) {
    this.logger.warn(`Problem report received: ${payload.description || 'No description'}`);
    await this.webhookService.notifyProblemReport(payload);
  }
}

// Additional controller to handle legacy /topic/ webhook URLs from ACA-Py
@Controller('topic')
export class LegacyWebhookController {
  constructor(private readonly webhookService: WebhookService) {}
  private readonly logger = new Logger('LegacyWebhookController');

  @Post(':topic')
  @HttpCode(200)
  async handleLegacyWebhook(@Req() req: any, @Body() payload: any) {
    const topic = req.params.topic;
    
    this.logger.log(
      `Received LEGACY webhook [/topic/${topic}] - this path is deprecated, use /api/webhooks/${topic}`,
    );
    this.logger.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      // Store the event
      await this.webhookService.storeEvent(topic, payload);

      this.logger.log(`✅ Legacy webhook stored successfully`);

      // Always return 200
      return { status: 'ok', message: 'Legacy webhook processed' };
    } catch (error) {
      this.logger.error(`Error processing legacy webhook: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }
}
