import api from './api';

export interface Connection {
  connection_id: string;
  state: string;
  their_label?: string;
  their_did?: string;
  my_did?: string;
  created_at: string;
  updated_at: string;
  invitation_key?: string;
  invitation_mode?: string;
  alias?: string;
}

export interface CreateInvitationResponse {
  connection_id: string;
  invitation: any;
  invitation_url: string;
}

export interface AcceptInvitationRequest {
  invitationUrl: string;
  alias?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface Message {
  message_id: string;
  connection_id: string;
  content: string;
  sent_time: string;
  state: string;
}

class ConnectionService {
  async getConnections(walletId: string, state?: string): Promise<{ results: Connection[] }> {
    const params = state ? `?state=${state}` : '';
    const response = await api.get(`/connection/${walletId}/connections${params}`);
    return response.data;
  }

  async getConnection(walletId: string, connectionId: string): Promise<Connection> {
    const response = await api.get(`/connection/${walletId}/connections/${connectionId}`);
    return response.data;
  }

  async createInvitation(walletId: string): Promise<CreateInvitationResponse> {
    const response = await api.post(`/connection/${walletId}/create-invitation`);
    return response.data;
  }

  async acceptInvitation(walletId: string, data: AcceptInvitationRequest): Promise<Connection> {
    const response = await api.post('/connection/accept-invitation', {
      walletId,
      invitation: data.invitationUrl
    });
    return response.data;
  }

  async sendMessage(walletId: string, connectionId: string, data: SendMessageRequest): Promise<void> {
    await api.post(`/connection/${walletId}/connections/${connectionId}/send-message`, {
      content: data.content
    });
  }

  async getMessages(_walletId: string, _connectionId: string): Promise<{ results: Message[] }> {
    // This endpoint doesn't exist in backend yet, return empty for now
    return { results: [] };
  }

  async deleteConnection(_walletId: string, _connectionId: string): Promise<void> {
    // This endpoint doesn't exist in backend yet
    throw new Error('Delete connection not implemented in backend');
  }
}

export const connectionService = new ConnectionService();