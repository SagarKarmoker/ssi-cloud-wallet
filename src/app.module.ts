import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WalletModule } from './wallet/wallet.module';
import { WebhookModule } from './webhook/webhook.module';
import { WebhookController } from './webhook/webhook.controller';

@Module({
  imports: [WalletModule, WebhookModule],
  controllers: [AppController, WebhookController],
  providers: [AppService],
})
export class AppModule {}
