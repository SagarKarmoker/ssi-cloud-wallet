import api from './api';

export interface DID {
  did: string;
  verkey: string;
  posture: string;
  key_type: string;
  method: string;
}

export interface CreateDIDRequest {
  method?: string;
  options?: {
    key_type?: string;
  };
}

export interface Schema {
  schema_id: string;
  schema_name: string;
  schema_version: string;
  attributes: string[];
  schema: any;
}

export interface CreateSchemaRequest {
  schema_name: string;
  schema_version: string;
  attributes: string[];
}

export interface CredentialDefinition {
  credential_definition_id: string;
  schema_id: string;
  tag: string;
  credential_definition: any;
}

export interface CreateCredentialDefinitionRequest {
  schema_id: string;
  tag?: string;
  support_revocation?: boolean;
  revocation_registry_size?: number;
}

class DIDService {
  async getDIDs(walletId: string, did?: string, verkey?: string, posture?: string): Promise<{ results: DID[] }> {
    const params = new URLSearchParams();
    if (did) params.append('did', did);
    if (verkey) params.append('verkey', verkey);
    if (posture) params.append('posture', posture);
    const queryString = params.toString();
    const response = await api.get(`/did/${walletId}/list${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async createDID(walletId: string, method?: string, options?: any): Promise<DID> {
    const response = await api.post(`/did/${walletId}/create`, { method, options });
    return response.data;
  }

  async setPublicDID(walletId: string, did: string): Promise<DID> {
    const response = await api.post(`/did/${walletId}/public`, { did });
    return response.data;
  }

  async getPublicDID(walletId: string): Promise<DID> {
    const response = await api.get(`/did/${walletId}/public`);
    return response.data;
  }

  async resolveDID(walletId: string, did: string): Promise<any> {
    const response = await api.get(`/did/${walletId}/resolve/${did}`);
    return response.data;
  }

  async getSchemas(walletId: string, schemaIssuerDid?: string, schemaName?: string, schemaVersion?: string): Promise<{ schema_ids: string[] }> {
    const params = new URLSearchParams();
    if (schemaIssuerDid) params.append('schema_issuer_did', schemaIssuerDid);
    if (schemaName) params.append('schema_name', schemaName);
    if (schemaVersion) params.append('schema_version', schemaVersion);
    const queryString = params.toString();
    const response = await api.get(`/did/${walletId}/schemas${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async getSchema(walletId: string, schemaId: string): Promise<Schema> {
    const response = await api.get(`/did/${walletId}/schema/${schemaId}`);
    return response.data;
  }

  async createSchema(walletId: string, data: CreateSchemaRequest): Promise<Schema> {
    const response = await api.post(`/did/${walletId}/schema`, {
      schema_name: data.schema_name,
      schema_version: data.schema_version,
      attributes: data.attributes
    });
    return response.data;
  }

  async getCredentialDefinitions(walletId: string, schemaId?: string): Promise<{ credential_definition_ids: string[] }> {
    const params = new URLSearchParams();
    if (schemaId) params.append('schema_id', schemaId);
    const queryString = params.toString();
    const response = await api.get(`/did/${walletId}/credential-definitions${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async getCredentialDefinition(walletId: string, credDefId: string): Promise<CredentialDefinition> {
    const response = await api.get(`/did/${walletId}/credential-definition/${credDefId}`);
    return response.data;
  }

  async createCredentialDefinition(walletId: string, data: CreateCredentialDefinitionRequest): Promise<CredentialDefinition> {
    const response = await api.post(`/did/${walletId}/credential-definition`, {
      schema_id: data.schema_id,
      tag: data.tag || 'default',
      support_revocation: data.support_revocation || false
    });
    return response.data;
  }
}

export const didService = new DIDService();