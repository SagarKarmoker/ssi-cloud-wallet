import { Module } from '@nestjs/common';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [ConnectionController],
  providers: [ConnectionService]
})
export class ConnectionModule {}
