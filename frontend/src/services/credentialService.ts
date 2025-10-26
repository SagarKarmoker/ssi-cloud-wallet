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

// For credential exchange records from ACA-Py
export interface CredentialExchangeRecord {
  cred_ex_record: {
    state: string;
    created_at: string;
    updated_at: string;
    trace: boolean;
    cred_ex_id: string;
    connection_id?: string;
    thread_id: string;
    initiator: string;
    role: string;
    cred_offer?: any;
    by_format?: any;
    auto_offer: boolean;
    auto_issue: boolean;
    auto_remove: boolean;
  };
  indy?: any;
  ld_proof?: any;
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

  async getW3cCredentials(walletId: string): Promise<{ results: any[] }> {
    const response = await api.get(`/credential/${walletId}/credentials/w3c`);
    return response.data;
  }

  async getCredential(walletId: string, credentialId: string): Promise<Credential> {
    const response = await api.get(`/credential/${walletId}/credentials/${credentialId}`);
    return response.data;
  }

  async getCredentialExchanges(walletId: string, state?: string, connectionId?: string): Promise<{ results: any[] }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (connectionId) params.append('connection_id', connectionId);
    const queryString = params.toString();
    const response = await api.get(`/credential/${walletId}/credential-exchange${queryString ? `?${queryString}` : ''}`);
    
    // Transform the data to match our interface
    if (response.data.results) {
      response.data.results = response.data.results.map((item: CredentialExchangeRecord) => {
        if (item.cred_ex_record) {
          // Extract credential preview attributes if available
          let attributes = {};
          if (item.cred_ex_record.cred_offer?.credential_preview?.attributes) {
            attributes = item.cred_ex_record.cred_offer.credential_preview.attributes.reduce((acc: any, attr: any) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {});
          }

          return {
            credential_exchange_id: item.cred_ex_record.cred_ex_id,
            state: item.cred_ex_record.state,
            created_at: item.cred_ex_record.created_at,
            updated_at: item.cred_ex_record.updated_at,
            connection_id: item.cred_ex_record.connection_id,
            thread_id: item.cred_ex_record.thread_id,
            schema_id: item.cred_ex_record.by_format?.cred_offer?.indy?.schema_id,
            cred_def_id: item.cred_ex_record.by_format?.cred_offer?.indy?.cred_def_id,
            attributes: attributes,
            credential_id: item.cred_ex_record.cred_ex_id, // Use exchange ID as fallback
          };
        }
        return item;
      });
    }
    
    return response.data;
  }

  async getCredentialExchange(walletId: string, credExId: string): Promise<any> {
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

  async sendCredentialRequest(walletId: string, credentialExchangeId: string): Promise<Credential> {
    const response = await api.post(`/credential/${walletId}/credential-exchange/${credentialExchangeId}/send-request`, {});
    return response.data;
  }

  async storeCredential(walletId: string, credentialExchangeId: string): Promise<Credential> {
    const response = await api.post(`/credential/${walletId}/credential-exchange/${credentialExchangeId}/store`, {});
    return response.data;
  }

  async sendProblemReport(walletId: string, credentialExchangeId: string, description: string): Promise<void> {
    await api.post(`/credential/${walletId}/credential-exchange/${credentialExchangeId}/problem-report`, {
      description
    });
  }

  async deleteCredential(walletId: string, credentialId: string): Promise<void> {
    await api.delete(`/credential/${walletId}/credentials/${credentialId}`);
  }
}

export const credentialService = new CredentialService();