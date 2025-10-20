import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { DidController } from './did.controller';
import { DidService } from './did.service';

@Module({
  imports: [WalletModule],
  controllers: [DidController],
  providers: [DidService],
  exports: [DidService],
})
export class DidModule {}