import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import axiosInstance from 'src/utils/axiosIntance';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class ProofService {
  private readonly ACAPY_ADMIN_URL =
    process.env.ACAPY_ADMIN_URL || 'http://localhost:8031';
  private readonly logger = new Logger(ProofService.name);

  constructor(private readonly walletService: WalletService) {}

  async getPresentationExchangeRecords(walletId: string, state?: string, connectionId?: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      let url = `${this.ACAPY_ADMIN_URL}/present-proof-2.0/records`;
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      if (connectionId) params.append('connection_id', connectionId);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.logger.log(`Retrieved ${response.data.results?.length || 0} presentation exchange records for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get presentation exchange records: ${msg}`);
      throw new HttpException(
        `Failed to get presentation exchange records: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPresentationExchangeRecord(walletId: string, presExId: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/present-proof-2.0/records/${presExId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Retrieved presentation exchange record ${presExId} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get presentation exchange record: ${msg}`);
      
      if (error.response?.status === 404) {
        throw new NotFoundException(`Presentation exchange record ${presExId} not found`);
      }

      throw new HttpException(
        `Failed to get presentation exchange record: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendPresentation(walletId: string, presExId: string, presentationSpec: any) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      this.logger.log(`=== SENDING PRESENTATION ===`);
      this.logger.log(`Wallet ID: ${walletId}`);
      this.logger.log(`Presentation Exchange ID: ${presExId}`);
      this.logger.log(`Presentation Spec: ${JSON.stringify(presentationSpec, null, 2)}`);
      
      // Check if it's DIF or Indy
      const isDif = presentationSpec.dif !== undefined;
      const isIndy = presentationSpec.indy !== undefined;
      
      if (isDif) {
        this.logger.warn('⚠️ DIF presentation detected!');
        this.logger.warn('⚠️ record_ids: ' + JSON.stringify(presentationSpec.dif.record_ids));
        this.logger.warn('⚠️ NOTE: ACA-Py may abandon DIF presentations if record IDs are incorrect');
      }
      
      if (isIndy) {
        this.logger.log('✅ Indy presentation detected');
        this.logger.log('Requested attributes: ' + JSON.stringify(presentationSpec.indy.requested_attributes));
        this.logger.log('Requested predicates: ' + JSON.stringify(presentationSpec.indy.requested_predicates));
      }

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/present-proof-2.0/records/${presExId}/send-presentation`,
        presentationSpec,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`✅ Presentation sent successfully!`);
      this.logger.log(`Response: ${JSON.stringify(response.data)}`);
      return;
    } catch (error: any) {
      const errorDetails = error.response?.data || error.message || 'Unknown error';
      const errorMessage = typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails;
      
      this.logger.error(`❌ Failed to send presentation!`);
      this.logger.error(`Error message: ${errorMessage}`);
      this.logger.error(`Full error response: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`HTTP Status: ${error.response?.status}`);
      
      // Check if it's a DIF-related error
      if (presentationSpec.dif) {
        this.logger.error('⚠️ This is a DIF presentation. Common issues:');
        this.logger.error('  1. record_ids may not match actual W3C credential IDs in ACA-Py wallet');
        this.logger.error('  2. ACA-Py version may not fully support DIF Presentation Exchange v2');
        this.logger.error('  3. W3C credentials may not be properly stored in the wallet');
        this.logger.error('  4. The verifier may not support DIF format');
        this.logger.error('🔧 TROUBLESHOOTING STEPS:');
        this.logger.error('  - Check ACA-Py logs for detailed error messages');
        this.logger.error('  - Verify W3C credentials exist: GET /credentials/w3c');
        this.logger.error('  - Try using Indy/AnonCreds format instead if possible');
        this.logger.error('  - Ensure ACA-Py version >= 0.10.0 for better DIF support');
      }
      
      throw new HttpException(
        `Failed to send presentation: ${errorMessage}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendPresentationRequest(walletId: string, connectionId: string, presentationRequest: any) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      this.logger.log(`Sending presentation request to connection ${connectionId} from wallet ${walletId}. Payload: ${JSON.stringify(presentationRequest)}`);

      const payload = {
        connection_id: connectionId,
        presentation_request: presentationRequest,
      };

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/present-proof-2.0/send-request`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Sent presentation request to connection ${connectionId} from wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to send presentation request: ${msg}`);
      throw new HttpException(
        `Failed to send presentation request: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyPresentation(walletId: string, presExId: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/present-proof-2.0/records/${presExId}/verify-presentation`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Verified presentation for exchange record ${presExId} in wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to verify presentation: ${msg}`);
      throw new HttpException(
        `Failed to verify presentation: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCredentialsForPresentationRequest(walletId: string, presExId: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/present-proof-2.0/records/${presExId}/credentials`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Retrieved credentials for presentation request ${presExId} in wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get credentials for presentation request: ${msg}`);
      throw new HttpException(
        `Failed to get credentials for presentation request: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendProblemReport(walletId: string, presExId: string, description: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/present-proof-2.0/records/${presExId}/problem-report`,
        { description },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Sent problem report for presentation exchange record ${presExId} from wallet ${walletId}`);
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
}