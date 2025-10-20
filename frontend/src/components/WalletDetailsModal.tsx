import React, { useState, useEffect } from 'react';
import { Modal, Button, Loading, Alert } from '../components';
import { walletService, type Wallet, type WalletStatus } from '../services';

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
}

export const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({
  isOpen,
  onClose,
  walletId
}) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [status, setStatus] = useState<WalletStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && walletId) {
      loadWalletDetails();
    }
  }, [isOpen, walletId]);

  const loadWalletDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [walletData, statusData] = await Promise.all([
        walletService.getWallet(walletId),
        walletService.getWalletStatus(walletId).catch(() => null) // Status might not be available
      ]);
      
      setWallet(walletData);
      setStatus(statusData);
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet details');
      console.error('Error loading wallet details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAuthToken = async () => {
    try {
      const tokenData = await walletService.getAuthToken(walletId);
      // Store token in localStorage for future API calls
      localStorage.setItem('walletToken', tokenData.token);
      alert('Authentication token retrieved and stored successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to get auth token');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Wallet Details" size="lg">
      {loading && (
        <div className="flex justify-center py-8">
          <Loading size="lg" text="Loading wallet details..." />
        </div>
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {wallet && !loading && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Wallet ID:</span>
                <p className="font-mono text-xs text-gray-900 break-all">{wallet.wallet_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <p className="text-gray-900">{wallet.wallet_name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Label:</span>
                <p className="text-gray-900">{wallet.label}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-900">{wallet.wallet_type}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Key Management:</span>
                <p className="text-gray-900">{wallet.key_management_mode}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-900">{new Date(wallet.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Updated:</span>
                <p className="text-gray-900">{new Date(wallet.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {status && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{status.statistics.connections_count}</p>
                  <p className="text-sm text-blue-800">Connections</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{status.statistics.credentials_count}</p>
                  <p className="text-sm text-green-800">Credentials</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{status.statistics.dids_count}</p>
                  <p className="text-sm text-purple-800">DIDs</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(status.last_updated).toLocaleString()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleGetAuthToken}
            >
              Get Auth Token
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};