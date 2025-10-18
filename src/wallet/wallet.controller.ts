import { Body, Controller, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('/api/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('/create')
  createWallet(
    @Body()
    body: {
      walletName: string;
      walletKey: string;
      walletLabel: string;
    },
  ) {
    return this.walletService.createWallet(
      body.walletName,
      body.walletKey,
      body.walletLabel,
    );
  }
}
