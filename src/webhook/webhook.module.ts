import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService],
  imports: []
})
export class WebhookModule {}
