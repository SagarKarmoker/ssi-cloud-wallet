import { Body, Controller, Get, Param, Post, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/createWallet.dto';

@ApiTags('Wallet Management')
@Controller('/api/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new multi-tenant wallet' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  createWallet(@Body() body: CreateWalletDto) {
    return this.walletService.createWallet(
      body.walletName,
      body.walletKey,
      body.walletLabel,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all wallets (admin only)' })
  @ApiResponse({ status: 200, description: 'Wallets retrieved successfully' })
  listWallets() {
    return this.walletService.listWallets();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wallet details' })
  @ApiResponse({ status: 200, description: 'Wallet details retrieved successfully' })
  getWallet(@Param('id') id: string) {
    return this.walletService.getWallet(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update wallet settings' })
  @ApiResponse({ status: 200, description: 'Wallet updated successfully' })
  updateWallet(
    @Param('id') id: string,
    @Body('label') label?: string,
    @Body('webhook_urls') webhookUrls?: string[],
    @Body('wallet_dispatch_type') dispatchType?: string
  ) {
    return this.walletService.updateWallet(id, { label, webhook_urls: webhookUrls, wallet_dispatch_type: dispatchType });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a wallet' })
  @ApiResponse({ status: 200, description: 'Wallet removed successfully' })
  removeWallet(@Param('id') id: string, @Body('wallet_key') walletKey?: string) {
    return this.walletService.removeWallet(id, walletKey);
  }

  @Post(':id/token')
  @ApiOperation({ summary: 'Get authentication token for wallet' })
  @ApiResponse({ status: 200, description: 'Auth token retrieved successfully' })
  getAuthToken(@Param('id') id: string, @Body('walletKey') walletKey?: string) {
    // walletKey is now optional (require when wallet is not managed)
    return this.walletService.getAuthToken(id, walletKey);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get wallet status and statistics' })
  @ApiResponse({ status: 200, description: 'Wallet status retrieved successfully' })
  getWalletStatus(@Param('id') id: string) {
    return this.walletService.getWalletStatus(id);
  }
}
