import { Injectable, NotFoundException } from '@nestjs/common';
import axiosInstance from 'src/utils/axiosIntance';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class ConnectionService {
  private readonly ACAPY_ADMIN_URL =
    process.env.ACAPY_ADMIN_URL || 'http://localhost:8021';

  constructor(private readonly walletService: WalletService) {}

  async acceptInvitation(walletId: string, invitation: any) {
    const token = await this.walletService.getAuthToken(walletId);

    try {
      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/out-of-band/receive-invitation`,
        invitation,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return response.data;
    } catch (error) {
      // Handle errors appropriately
      throw new NotFoundException(
        `Failed to accept invitation: ${error.message}`,
      );
    }
  }
}
