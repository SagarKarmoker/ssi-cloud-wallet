import { Injectable, NotFoundException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axiosInstance from 'src/utils/axiosIntance';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class ConnectionService {
  private readonly ACAPY_ADMIN_URL =
    process.env.ACAPY_ADMIN_URL || 'http://localhost:8031';
  private readonly logger = new Logger(ConnectionService.name);

  constructor(private readonly walletService: WalletService) {}

  async acceptInvitation(walletId: string, invitation: any) {
    const tokenResponse = await this.walletService.getAuthToken(walletId);
    const token = tokenResponse.token;

    try {
      let invitationData: any;
      let endpoint: string;
      
      // Handle different invitation formats
      if (typeof invitation === 'string') {
        if (invitation.includes('c_i=')) {
          // Legacy connection invitation URL - extract and decode the c_i parameter
          const url = new URL(invitation);
          const ciParam = url.searchParams.get('c_i');
          if (ciParam) {
            try {
              const decoded = Buffer.from(ciParam, 'base64').toString();
              invitationData = JSON.parse(decoded);
              
              // Check if it's a legacy connection invitation
              if (invitationData['@type'] && invitationData['@type'].includes('connections/1.0/invitation')) {
                endpoint = '/connections/receive-invitation';
              } else {
                endpoint = '/out-of-band/receive-invitation';
              }
            } catch (decodeError) {
              this.logger.error('Failed to decode invitation:', decodeError);
              throw new Error('Invalid invitation format - cannot decode c_i parameter');
            }
          } else {
            throw new Error('Invalid invitation URL - missing c_i parameter');
          }
        } else if (invitation.includes('oob=')) {
          // Out-of-band invitation URL
          const url = new URL(invitation);
          const oobParam = url.searchParams.get('oob');
          if (oobParam) {
            try {
              const decoded = Buffer.from(oobParam, 'base64').toString();
              invitationData = JSON.parse(decoded);
              endpoint = '/out-of-band/receive-invitation';
            } catch (decodeError) {
              this.logger.error('Failed to decode out-of-band invitation:', decodeError);
              throw new Error('Invalid invitation format - cannot decode oob parameter');
            }
          } else {
            throw new Error('Invalid invitation URL - missing oob parameter');
          }
        } else {
          // Try to parse as base64 encoded JSON
          try {
            const decoded = Buffer.from(invitation, 'base64').toString();
            invitationData = JSON.parse(decoded);
            // Determine endpoint based on invitation type
            if (invitationData['@type'] && invitationData['@type'].includes('connections/1.0/invitation')) {
              endpoint = '/connections/receive-invitation';
            } else {
              endpoint = '/out-of-band/receive-invitation';
            }
          } catch {
            throw new Error('Invalid invitation format - not a valid URL or base64 encoded JSON');
          }
        }
      } else if (typeof invitation === 'object' && invitation !== null) {
        // It's already an invitation object
        invitationData = invitation;
        // Determine endpoint based on invitation type
        if (invitationData['@type'] && invitationData['@type'].includes('connections/1.0/invitation')) {
          endpoint = '/connections/receive-invitation';
        } else {
          endpoint = '/out-of-band/receive-invitation';
        }
      } else {
        throw new Error('Invalid invitation format');
      }

      this.logger.log(`Processing invitation for wallet ${walletId} using endpoint ${endpoint}`);
      this.logger.log(`Invitation data:`, JSON.stringify(invitationData, null, 2));

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}${endpoint}`,
        invitationData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      this.logger.log(`Invitation accepted for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to accept invitation: ${msg}`);
      
      // Log more details about the error for debugging
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data:`, error.response.data);
      }
      
      throw new HttpException(
        `Failed to accept invitation: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createInvitation(walletId: string) {
    const tokenResponse = await this.walletService.getAuthToken(walletId);
    const token = tokenResponse.token;

    try {
      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/out-of-band/create-invitation`,
        {
          handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
          use_public_did: false,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      this.logger.log(`Invitation created for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to create invitation: ${msg}`);
      throw new HttpException(
        `Failed to create invitation: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getConnections(walletId: string, state?: string) {
    const tokenResponse = await this.walletService.getAuthToken(walletId);
    const token = tokenResponse.token;

    try {
      let url = `${this.ACAPY_ADMIN_URL}/connections`;
      if (state) {
        url += `?state=${encodeURIComponent(state)}`;
      }

      this.logger.log(`Fetching connections from: ${url}`);

      const response = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.logger.log(`Retrieved ${response.data.results?.length || 0} connections for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.logger.error(`Failed to get connections: ${errorMessage}`);
      
      // Log more details for debugging
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data:`, JSON.stringify(error.response.data, null, 2));
      }
      
      throw new HttpException(
        `Failed to get connections: ${errorMessage}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getConnection(walletId: string, connectionId: string) {
    const tokenResponse = await this.walletService.getAuthToken(walletId);
    const token = tokenResponse.token;

    try {
      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/connections/${connectionId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      this.logger.log(`Retrieved connection ${connectionId} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      
      if (error.response?.data) {
        // Handle different error response formats
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.logger.error(`Failed to get connection ${connectionId}: ${errorMessage}`);
      
      // Log more details for debugging
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data:`, JSON.stringify(error.response.data, null, 2));
      }
      
      if (error.response?.status === 404) {
        throw new NotFoundException(`Connection ${connectionId} not found`);
      }
      
      if (error.response?.status === 422) {
        throw new HttpException(
          `Invalid request for connection ${connectionId}: ${errorMessage}`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      
      throw new HttpException(
        `Failed to get connection: ${errorMessage}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendMessage(walletId: string, connectionId: string, content: string) {
    const tokenResponse = await this.walletService.getAuthToken(walletId);
    const token = tokenResponse.token;

    try {
      // First check if the connection exists and is active
      const connectionResponse = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/connections/${connectionId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const connection = connectionResponse.data;
      this.logger.log(`Connection state: ${connection.state}, RFC23 state: ${connection.rfc23_state}`);

      // Check if connection is in a state that allows messaging
      if (connection.state !== 'active' && connection.rfc23_state !== 'completed') {
        throw new HttpException(
          `Connection is not active. Current state: ${connection.state}, RFC23 state: ${connection.rfc23_state}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Send the message using the basic messages endpoint
      const messagePayload = {
        content: content
      };

      this.logger.log(`Sending message to connection ${connectionId}:`, messagePayload);

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/connections/${connectionId}/send-message`,
        messagePayload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      this.logger.log(`Message sent successfully to connection ${connectionId} from wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.logger.error(`Failed to send message to connection ${connectionId}: ${errorMessage}`);
      
      // Log more details for debugging
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data:`, JSON.stringify(error.response.data, null, 2));
        this.logger.error(`Request URL: ${this.ACAPY_ADMIN_URL}/connections/${connectionId}/send-message`);
      }

      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new NotFoundException(`Connection ${connectionId} not found`);
      }
      
      if (error.response?.status === 400) {
        throw new HttpException(
          `Bad request when sending message: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        `Failed to send message: ${errorMessage}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
