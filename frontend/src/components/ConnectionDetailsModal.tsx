import React, { useState, useEffect } from 'react';
import { Modal, Button, Loading, Alert } from '../components';
import { connectionService, type Connection } from '../services';

interface ConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
  connectionId: string;
}

export const ConnectionDetailsModal: React.FC<ConnectionDetailsModalProps> = ({
  isOpen,
  onClose,
  walletId,
  connectionId
}) => {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && walletId && connectionId) {
      loadConnectionDetails();
    }
  }, [isOpen, walletId, connectionId]);

  const loadConnectionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const connectionData = await connectionService.getConnection(walletId, connectionId);
      setConnection(connectionData);
    } catch (err: any) {
      setError(err.message || 'Failed to load connection details');
      console.error('Error loading connection details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStateColor = (state: string) => {
    switch (state) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'invitation':
        return 'bg-yellow-100 text-yellow-800';
      case 'request':
        return 'bg-blue-100 text-blue-800';
      case 'response':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connection Details" size="lg">
      {loading && (
        <div className="flex justify-center py-8">
          <Loading size="lg" text="Loading connection details..." />
        </div>
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {connection && !loading && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Connection Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Connection ID:</span>
                <p className="font-mono text-xs text-gray-900 break-all">{connection.connection_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">State:</span>
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${getConnectionStateColor(connection.state)}`}>
                  {connection.state}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Their Label:</span>
                <p className="text-gray-900">{connection.their_label || 'Not provided'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Alias:</span>
                <p className="text-gray-900">{connection.alias || 'Not set'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Their DID:</span>
                <p className="font-mono text-xs text-gray-900 break-all">{connection.their_did || 'Not available'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">My DID:</span>
                <p className="font-mono text-xs text-gray-900 break-all">{connection.my_did || 'Not available'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-900">{new Date(connection.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Updated:</span>
                <p className="text-gray-900">{new Date(connection.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Status Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Current State:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConnectionStateColor(connection.state)}`}>
                  {connection.state}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {connection.state === 'active' && 'Connection is established and ready for communication.'}
                {connection.state === 'invitation' && 'Invitation has been created but not yet accepted.'}
                {connection.state === 'request' && 'Connection request has been sent or received.'}
                {connection.state === 'response' && 'Connection response has been processed.'}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {(connection.invitation_key || connection.invitation_mode) && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Invitation Details</h3>
              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                {connection.invitation_key && (
                  <div className="mb-2">
                    <span className="font-medium text-blue-800">Invitation Key:</span>
                    <p className="font-mono text-xs text-blue-900 break-all">{connection.invitation_key}</p>
                  </div>
                )}
                {connection.invitation_mode && (
                  <div>
                    <span className="font-medium text-blue-800">Invitation Mode:</span>
                    <p className="text-blue-900">{connection.invitation_mode}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};