import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import axiosInstance from 'src/utils/axiosIntance';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class CredentialService {
  private readonly ACAPY_ADMIN_URL =
    process.env.ACAPY_ADMIN_URL || 'http://localhost:8031';
  private readonly logger = new Logger(CredentialService.name);

  constructor(private readonly walletService: WalletService) {}

  async listCredentials(walletId: string, wql?: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      let url = `${this.ACAPY_ADMIN_URL}/credentials`;
      if (wql) {
        url += `?wql=${encodeURIComponent(wql)}`;
      }

      const response = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.logger.log(`Retrieved ${response.data.results?.length || 0} credentials for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to list credentials: ${msg}`);
      throw new HttpException(
        `Failed to list credentials: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCredential(walletId: string, credentialId: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/credential/${credentialId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Retrieved credential ${credentialId} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get credential: ${msg}`);
      
      if (error.response?.status === 404) {
        throw new NotFoundException(`Credential ${credentialId} not found`);
      }

      throw new HttpException(
        `Failed to get credential: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCredentialExchangeRecords(walletId: string, state?: string, connectionId?: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      let url = `${this.ACAPY_ADMIN_URL}/issue-credential-2.0/records`;
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      if (connectionId) params.append('connection_id', connectionId);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.logger.log(`Retrieved ${response.data.results?.length || 0} credential exchange records for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get credential exchange records: ${msg}`);
      throw new HttpException(
        `Failed to get credential exchange records: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCredentialExchangeRecord(walletId: string, credExId: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/issue-credential-2.0/records/${credExId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Retrieved credential exchange record ${credExId} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get credential exchange record: ${msg}`);
      
      if (error.response?.status === 404) {
        throw new NotFoundException(`Credential exchange record ${credExId} not found`);
      }

      throw new HttpException(
        `Failed to get credential exchange record: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendCredentialRequest(walletId: string, credExId: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      this.logger.log(`Attempting to send credential request for exchange ${credExId} in wallet ${walletId}`);

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/issue-credential-2.0/records/${credExId}/send-request`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Successfully sent credential request for exchange record ${credExId}. Response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: any) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;
      const errorMessage = error.message;
      
      this.logger.error(`Failed to send credential request for exchange ${credExId}:`);
      this.logger.error(`  Status Code: ${statusCode}`);
      this.logger.error(`  Response Data: ${JSON.stringify(responseData)}`);
      this.logger.error(`  Error Message: ${errorMessage}`);
      
      const msg = responseData?.detail || responseData?.message || responseData || errorMessage || 'Unknown error';
      
      throw new HttpException(
        `Failed to send credential request: ${msg}`,
        statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async storeCredential(walletId: string, credExId: string, credentialId?: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const payload = credentialId ? { credential_id: credentialId } : {};

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/issue-credential-2.0/records/${credExId}/store`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Stored credential from exchange record ${credExId} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to store credential: ${msg}`);
      throw new HttpException(
        `Failed to store credential: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendProblemReport(walletId: string, credExId: string, description: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/issue-credential-2.0/records/${credExId}/problem-report`,
        { description },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Sent problem report for credential exchange record ${credExId} from wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to send problem report: ${msg}`);
      throw new HttpException(
        `Failed to send problem report: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeCredential(walletId: string, credentialId: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.delete(
        `${this.ACAPY_ADMIN_URL}/credential/${credentialId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Removed credential ${credentialId} from wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to remove credential: ${msg}`);
      throw new HttpException(
        `Failed to remove credential: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
