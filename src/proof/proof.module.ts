import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { ProofService } from './proof.service';
import { ProofController } from './proof.controller';

@Module({
  imports: [WalletModule],
  controllers: [ProofController],
  providers: [ProofService],
  exports: [ProofService],
})
export class ProofModule {}