import api from './api';

export interface Credential {
  credential_id: string;
  schema_id: string;
  cred_def_id: string;
  connection_id?: string;
  state: string;
  thread_id: string;
  created_at: string;
  updated_at: string;
  attributes: Record<string, any>;
  credential_exchange_id: string;
}

export interface CredentialOffer {
  credential_offer: any;
  credential_definition_id: string;
  schema_id: string;
  connection_id?: string;
  comment?: string;
  auto_issue: boolean;
  auto_remove: boolean;
  trace: boolean;
}

export interface CredentialRequest {
  credential_exchange_id: string;
}

class CredentialService {
  async getCredentials(walletId: string, wql?: string): Promise<{ results: Credential[] }> {
    const params = wql ? `?wql=${encodeURIComponent(wql)}` : '';
    const response = await api.get(`/credential/${walletId}/credentials${params}`);
    return response.data;
  }

  async getCredential(walletId: string, credentialId: string): Promise<Credential> {
    const response = await api.get(`/credential/${walletId}/credentials/${credentialId}`);
    return response.data;
  }

  async getCredentialExchanges(walletId: string, state?: string, connectionId?: string): Promise<{ results: Credential[] }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (connectionId) params.append('connection_id', connectionId);
    const queryString = params.toString();
    const response = await api.get(`/credential/${walletId}/credential-exchange${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async getCredentialExchange(walletId: string, credExId: string): Promise<Credential> {
    const response = await api.get(`/credential/${walletId}/credential-exchange/${credExId}`);
    return response.data;
  }

  async offerCredential(_walletId: string, _data: CredentialOffer): Promise<Credential> {
    // This endpoint needs to be implemented in backend
    throw new Error('Offer credential not implemented in backend yet');
  }

  async requestCredential(_walletId: string, _data: CredentialRequest): Promise<Credential> {
    // This endpoint needs to be implemented in backend
    throw new Error('Request credential not implemented in backend yet');
  }

  async issueCredential(_walletId: string, _credentialExchangeId: string): Promise<Credential> {
    // This endpoint needs to be implemented in backend
    throw new Error('Issue credential not implemented in backend yet');
  }

  async storeCredential(walletId: string, credentialExchangeId: string): Promise<Credential> {
    const response = await api.post(`/credential/${walletId}/credential-exchange/${credentialExchangeId}/store`);
    return response.data;
  }

  async deleteCredential(walletId: string, credentialId: string): Promise<void> {
    await api.delete(`/credential/${walletId}/credentials/${credentialId}`);
  }
}

export const credentialService = new CredentialService();