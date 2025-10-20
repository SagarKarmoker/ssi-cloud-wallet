import api from './api';

export interface ProofRequest {
  proof_request_id: string;
  connection_id?: string;
  state: string;
  presentation_exchange_id: string;
  created_at: string;
  updated_at: string;
  presentation_request: any;
  presentation?: any;
  verified?: boolean;
}

export interface CreateProofRequestData {
  connection_id?: string;
  presentation_request: {
    name: string;
    version: string;
    requested_attributes: Record<string, any>;
    requested_predicates?: Record<string, any>;
    non_revoked?: {
      from?: number;
      to?: number;
    };
  };
  comment?: string;
  auto_verify: boolean;
  auto_remove: boolean;
  trace: boolean;
}

export interface PresentationData {
  presentation_exchange_id: string;
  requested_credentials: {
    self_attested_attributes: Record<string, string>;
    requested_attributes: Record<string, any>;
    requested_predicates: Record<string, any>;
  };
}

export interface CredentialForPresentation {
  credential_id: string;
  attrs: Record<string, string>;
  schema_id: string;
  cred_def_id: string;
}

class ProofService {
  async getProofRequests(walletId: string, state?: string, connectionId?: string): Promise<{ results: ProofRequest[] }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (connectionId) params.append('connection_id', connectionId);
    const queryString = params.toString();
    const response = await api.get(`/proof/${walletId}/presentation-exchange${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async getProofRequest(walletId: string, presentationExchangeId: string): Promise<ProofRequest> {
    const response = await api.get(`/proof/${walletId}/presentation-exchange/${presentationExchangeId}`);
    return response.data;
  }

  async sendPresentationRequest(walletId: string, data: CreateProofRequestData): Promise<ProofRequest> {
    const response = await api.post(`/proof/${walletId}/send-presentation-request`, data);
    return response.data;
  }

  async getPresentationExchangeRecord(walletId: string, presentationExchangeId: string): Promise<any> {
    const response = await api.get(`/proof/${walletId}/presentation-exchange/${presentationExchangeId}`);
    return response.data;
  }

  async sendPresentation(walletId: string, presentationExchangeId: string, data: PresentationData): Promise<ProofRequest> {
    const response = await api.post(`/proof/${walletId}/presentation-exchange/${presentationExchangeId}/send-presentation`, data);
    return response.data;
  }

  async verifyPresentation(walletId: string, presentationExchangeId: string): Promise<ProofRequest> {
    const response = await api.post(`/proof/${walletId}/presentation-exchange/${presentationExchangeId}/verify-presentation`);
    return response.data;
  }

  async getCredentialsForPresentationRequest(
    walletId: string, 
    presentationExchangeId: string
  ): Promise<{ results: CredentialForPresentation[] }> {
    const response = await api.get(`/proof/${walletId}/presentation-exchange/${presentationExchangeId}/credentials`);
    return response.data;
  }

  async sendProblemReport(walletId: string, presentationExchangeId: string, explanation: string): Promise<void> {
    await api.post(`/proof/${walletId}/presentation-exchange/${presentationExchangeId}/problem-report`, { description: explanation });
  }

  // Legacy method names for backward compatibility
  async createProofRequest(walletId: string, data: CreateProofRequestData): Promise<ProofRequest> {
    return this.sendPresentationRequest(walletId, data);
  }

  async deleteProofRequest(_walletId: string, _presentationExchangeId: string): Promise<void> {
    // This endpoint doesn't exist in backend
    throw new Error('Delete proof request not implemented in backend');
  }
}

export const proofService = new ProofService();