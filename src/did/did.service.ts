import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import axiosInstance from 'src/utils/axiosIntance';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class DidService {
  private readonly ACAPY_ADMIN_URL =
    process.env.ACAPY_ADMIN_URL || 'http://localhost:8031';
  private readonly logger = new Logger(DidService.name);

  constructor(private readonly walletService: WalletService) {}

  // DID Management
  async createDid(walletId: string, method?: string, options?: any) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const payload = {
        method: method || 'key',
        options: options || {},
      };

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/wallet/did/create`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Created DID for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to create DID: ${msg}`);
      throw new HttpException(
        `Failed to create DID: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async listDids(walletId: string, did?: string, verkey?: string, posture?: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      let url = `${this.ACAPY_ADMIN_URL}/wallet/did`;
      const params = new URLSearchParams();
      if (did) params.append('did', did);
      if (verkey) params.append('verkey', verkey);
      if (posture) params.append('posture', posture);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.logger.log(`Retrieved ${response.data.results?.length || 0} DIDs for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to list DIDs: ${msg}`);
      throw new HttpException(
        `Failed to list DIDs: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPublicDid(walletId: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/wallet/did/public`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Retrieved public DID for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get public DID: ${msg}`);
      throw new HttpException(
        `Failed to get public DID: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async setPublicDid(walletId: string, did: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/wallet/did/public?did=${encodeURIComponent(did)}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Set public DID ${did} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to set public DID: ${msg}`);
      throw new HttpException(
        `Failed to set public DID: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Schema Management
  async createSchema(walletId: string, schemaName: string, schemaVersion: string, attributes: string[]) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const payload = {
        schema_name: schemaName,
        schema_version: schemaVersion,
        attributes: attributes,
      };

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/anoncreds/schema`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Created schema ${schemaName} v${schemaVersion} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to create schema: ${msg}`);
      throw new HttpException(
        `Failed to create schema: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSchemas(walletId: string, schemaIssuerDid?: string, schemaName?: string, schemaVersion?: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      let url = `${this.ACAPY_ADMIN_URL}/anoncreds/schemas`;
      const params = new URLSearchParams();
      if (schemaIssuerDid) params.append('schema_issuer_did', schemaIssuerDid);
      if (schemaName) params.append('schema_name', schemaName);
      if (schemaVersion) params.append('schema_version', schemaVersion);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.logger.log(`Retrieved schemas for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get schemas: ${msg}`);
      throw new HttpException(
        `Failed to get schemas: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSchema(walletId: string, schemaId: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/anoncreds/schema/${encodeURIComponent(schemaId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Retrieved schema ${schemaId} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get schema: ${msg}`);
      
      if (error.response?.status === 404) {
        throw new NotFoundException(`Schema ${schemaId} not found`);
      }

      throw new HttpException(
        `Failed to get schema: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Credential Definition Management
  async createCredentialDefinition(walletId: string, schemaId: string, tag: string, supportRevocation = false) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const payload = {
        schema_id: schemaId,
        tag: tag,
        support_revocation: supportRevocation,
      };

      const response = await axiosInstance.post(
        `${this.ACAPY_ADMIN_URL}/anoncreds/credential-definition`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Created credential definition for schema ${schemaId} with tag ${tag} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to create credential definition: ${msg}`);
      throw new HttpException(
        `Failed to create credential definition: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCredentialDefinitions(walletId: string, schemaId?: string, schemaIssuerDid?: string, schemaName?: string, schemaVersion?: string, issuerDid?: string, credDefId?: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      let url = `${this.ACAPY_ADMIN_URL}/anoncreds/credential-definitions`;
      const params = new URLSearchParams();
      if (schemaId) params.append('schema_id', schemaId);
      if (schemaIssuerDid) params.append('schema_issuer_did', schemaIssuerDid);
      if (schemaName) params.append('schema_name', schemaName);
      if (schemaVersion) params.append('schema_version', schemaVersion);
      if (issuerDid) params.append('issuer_did', issuerDid);
      if (credDefId) params.append('cred_def_id', credDefId);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.logger.log(`Retrieved credential definitions for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get credential definitions: ${msg}`);
      throw new HttpException(
        `Failed to get credential definitions: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCredentialDefinition(walletId: string, credDefId: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/anoncreds/credential-definition/${encodeURIComponent(credDefId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Retrieved credential definition ${credDefId} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to get credential definition: ${msg}`);
      
      if (error.response?.status === 404) {
        throw new NotFoundException(`Credential definition ${credDefId} not found`);
      }

      throw new HttpException(
        `Failed to get credential definition: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // DID Resolution
  async resolveDid(walletId: string, did: string) {
    try {
      const tokenResponse = await this.walletService.getAuthToken(walletId);
      const token = tokenResponse.token;

      const response = await axiosInstance.get(
        `${this.ACAPY_ADMIN_URL}/resolver/resolve/${encodeURIComponent(did)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      this.logger.log(`Resolved DID ${did} for wallet ${walletId}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data || error.message || 'Unknown error';
      this.logger.error(`Failed to resolve DID: ${msg}`);
      throw new HttpException(
        `Failed to resolve DID: ${msg}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}