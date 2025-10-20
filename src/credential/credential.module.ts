import { Module } from '@nestjs/common';
import { CredentialController } from './credential.controller';
import { CredentialService } from './credential.service';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  controllers: [CredentialController],
  providers: [CredentialService],
  imports: [WalletModule],
})
export class CredentialModule {}
