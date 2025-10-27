import { Module } from '@nestjs/common';
import { WebhookController, LegacyWebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  controllers: [WebhookController, LegacyWebhookController],
  providers: [WebhookService],
  imports: []
})
export class WebhookModule {}
