import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WalletModule } from './wallet/wallet.module';
import { WebhookModule } from './webhook/webhook.module';
import { ConnectionModule } from './connection/connection.module';
import { CredentialModule } from './credential/credential.module';
import { ProofModule } from './proof/proof.module';
import { DidModule } from './did/did.module';

@Module({
  imports: [WalletModule, WebhookModule, ConnectionModule, CredentialModule, ProofModule, DidModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
