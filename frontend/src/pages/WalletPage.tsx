import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Loading, Alert, Modal } from '../components';
import { WalletDetailsModal } from '../components/WalletDetailsModal';
import { walletService, type Wallet, type CreateWalletRequest } from '../services';

export const WalletPage: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateWalletRequest>({
    walletName: '',
    walletKey: '',
    walletLabel: ''
  });

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const response = await walletService.listWallets();
      setWallets(response.results);
      setError(null);
    } catch (err) {
      setError('Failed to load wallets');
      console.error('Error loading wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await walletService.createWallet(formData);
      setShowCreateModal(false);
      setFormData({ walletName: '', walletKey: '', walletLabel: '' });
      await loadWallets();
    } catch (err) {
      setError('Failed to create wallet');
      console.error('Error creating wallet:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" text="Loading wallets..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Create New Wallet
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => (
          <Card
            key={wallet.wallet_id}
            title={wallet.wallet_name}
            subtitle={wallet.label}
          >
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">ID:</span> {wallet.wallet_id}</p>
              <p><span className="font-medium">Type:</span> {wallet.wallet_type}</p>
              <p><span className="font-medium">Key Management:</span> {wallet.key_management_mode}</p>
              <p><span className="font-medium">Created:</span> {new Date(wallet.created_at).toLocaleDateString()}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button
                size="sm"
                onClick={() => {
                  setSelectedWalletId(wallet.wallet_id);
                  setShowDetailsModal(true);
                }}
              >
                View Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Copy wallet ID to clipboard for management
                  navigator.clipboard.writeText(wallet.wallet_id);
                  alert('Wallet ID copied to clipboard!');
                }}
              >
                Copy ID
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {wallets.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No wallets</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new wallet.</p>
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                Create New Wallet
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Wallet"
      >
        <form onSubmit={handleCreateWallet} className="space-y-4">
          <Input
            label="Wallet Name"
            name="walletName"
            value={formData.walletName}
            onChange={handleInputChange}
            placeholder="Enter wallet name"
            required
          />
          <Input
            label="Wallet Key"
            name="walletKey"
            type="password"
            value={formData.walletKey}
            onChange={handleInputChange}
            placeholder="Enter wallet key"
            helpText="This key will be used to encrypt your wallet"
            required
          />
          <Input
            label="Wallet Label"
            name="walletLabel"
            value={formData.walletLabel}
            onChange={handleInputChange}
            placeholder="Enter wallet label"
            helpText="A friendly name for your wallet"
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Wallet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Wallet Details Modal */}
      {selectedWalletId && (
        <WalletDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedWalletId(null);
          }}
          walletId={selectedWalletId}
        />
      )}
    </div>
  );
};