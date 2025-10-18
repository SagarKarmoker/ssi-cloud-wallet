import { Injectable } from '@nestjs/common';
import axiosInstance from 'src/utils/axiosIntance';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class CredentialService {
  private readonly ACAPY_ADMIN_URL =
    process.env.ACAPY_ADMIN_URL || 'http://localhost:8021';

  constructor(private readonly walletService: WalletService) {}

  async listCredentials(walletId: any) {
    try {
      const token = await this.walletService.getAuthToken(walletId);
      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/credentials`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data.results;
    } catch (error) {
      throw new Error(`Failed to list credentials: ${error.message}`);
    }
  }
}
