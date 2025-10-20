import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/createWallet.dto';

@Controller('/api/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('create')
  createWallet(@Body() body: CreateWalletDto) {
    return this.walletService.createWallet(
      body.walletName,
      body.walletKey,
      body.walletLabel,
    );
  }

  @Get(':id')
  getWallet(@Param('id') id: string) {
    return this.walletService.getWallet(id);
  }

  @Post(':id/token')
  getAuthToken(@Param('id') id: string, @Body('walletKey') walletKey?: string) {
    // walletKey is now optional (require when wallet is not managed)
    return this.walletService.getAuthToken(id, walletKey);
  }
}
