import { Injectable, Logger, HttpException, HttpStatus, ConflictException } from '@nestjs/common';
import axiosInstance from 'src/utils/axiosIntance';

@Injectable()
export class WalletService {
  private readonly ACAPY_ADMIN_URL =
    process.env.ACAPY_ADMIN_URL || 'http://localhost:8031';
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

      this.logger.log(
        `Wallet created successfully: ${response.data.wallet_id}`,
      );

      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to create wallet: ${msg}`);

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 400 && typeof data === 'string' && /already exists/i.test(data)) {
        // Use ConflictException for standard Nest handling
        throw new ConflictException(`Wallet already exists: ${data}`);
      }

      // Fallback: throw a generic HttpException with the remote status if present
      if (status) {
        throw new HttpException(`Failed to create wallet: ${data}`, status);
      }

      throw new HttpException(`Failed to create wallet: ${msg}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getWallet(id: string) {
    try {
      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/multitenancy/wallet/${id}`,
      );

      this.logger.log(`Wallet retrieved successfully: ${id}`);

      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to retrieve wallet: ${msg}`);
      const status = error.response?.status;
      if (status) {
        throw new HttpException(`Failed to retrieve wallet: ${msg}`, status);
      }
      throw new HttpException(`Failed to retrieve wallet: ${msg}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAuthToken(id: string, walletKey?: string) {
    try {
      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/multitenancy/wallet/${id}/token`,
        { wallet_key: walletKey },
      );

      this.logger.log(
        `Auth token retrieved successfully: ${response.data.token}`,
      );

      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to retrieve auth token: ${msg}`);
      const status = error.response?.status;
      if (status) {
        throw new HttpException(`Failed to retrieve auth token: ${msg}`, status);
      }
      throw new HttpException(`Failed to retrieve auth token: ${msg}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
