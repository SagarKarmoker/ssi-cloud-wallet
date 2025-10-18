import { Injectable, Logger } from '@nestjs/common';
import axiosInstance from 'src/utils/axiosIntance';

@Injectable()
export class WalletService {
  private readonly ACAPY_ADMIN_URL =
    process.env.ACAPY_ADMIN_URL || 'http://localhost:8021';
  private readonly webhookUrl = (
    process.env.WALLET_WEBHOOK_URL ||
    'https://eaabc87e3568.ngrok-free.app/api/webhooks'
  ).trim();
  private readonly logger = new Logger(WalletService.name);

  async createWallet(
    walletName: string,
    walletKey: string,
    walletLabel: string,
  ) {
    try {
      const payload = {
        wallet_name: walletName,
        wallet_key: walletKey,
        key_management_mode: 'managed',
        wallet_type: 'askar',
        label: walletLabel,
        wallet_webhook_urls: [this.webhookUrl],
        wallet_dispatch_type: 'default',
      };

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/multitenancy/wallet`,
        payload,
      );

      this.logger.log(`Wallet created successfully: ${response.data.wallet_id}`);

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to create wallet: ${error.response?.data || error.message}`,
      );
      throw new Error(
        `Failed to create wallet: ${error.response?.data || error.message}`,
      );
    }
  }
}
