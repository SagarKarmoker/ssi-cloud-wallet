import api from './api';

export interface Wallet {
  wallet_id: string;
  wallet_name?: string;
  label?: string;
  created_at: string;
  updated_at: string;
  key_management_mode: string;
  wallet_type?: string;
  settings?: {
    'wallet.name'?: string;
    'default_label'?: string;
    'wallet.type'?: string;
    [key: string]: any;
  };
}

export interface CreateWalletRequest {
  walletName: string;
  walletKey: string;
  walletLabel: string;
}

export interface WalletToken {
  token: string;
}

export interface WalletStatus {
  wallet_info: Wallet;
  statistics: {
    connections_count: number;
    credentials_count: number;
    dids_count: number;
  };
  last_updated: string;
}

class WalletService {
  async createWallet(data: CreateWalletRequest): Promise<Wallet> {
    const response = await api.post('/wallet/create', data);
    return response.data;
  }

  async getWallet(walletId: string): Promise<Wallet> {
    const response = await api.get(`/wallet/${walletId}`);
    return response.data;
  }

  async listWallets(): Promise<{ results: Wallet[] }> {
    const response = await api.get('/wallet');
    return response.data;
  }

  async getAuthToken(walletId: string, walletKey?: string): Promise<WalletToken> {
    const response = await api.post(`/wallet/${walletId}/token`, { walletKey });
    return response.data;
  }

  async getWalletStatus(walletId: string): Promise<WalletStatus> {
    const response = await api.get(`/wallet/${walletId}/status`);
    return response.data;
  }

  async updateWallet(walletId: string, updates: any): Promise<Wallet> {
    const response = await api.put(`/wallet/${walletId}`, updates);
    return response.data;
  }

  async removeWallet(walletId: string, walletKey?: string): Promise<void> {
    await api.delete(`/wallet/${walletId}`, { data: { wallet_key: walletKey } });
  }
}

export const walletService = new WalletService();