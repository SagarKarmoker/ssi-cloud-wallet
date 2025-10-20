import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Loading, Alert, Modal } from '../components';
import { ConnectionDetailsModal } from '../components/ConnectionDetailsModal';
import { connectionService, type Connection, type AcceptInvitationRequest } from '../services';

interface ConnectionPageProps {
  walletId: string;
}

export const ConnectionPage: React.FC<ConnectionPageProps> = ({ walletId }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [invitationUrl, setInvitationUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [acceptData, setAcceptData] = useState<AcceptInvitationRequest>({
    invitationUrl: '',
    alias: ''
  });

  useEffect(() => {
    if (walletId) {
      loadConnections();
    }
  }, [walletId]);

  const loadConnections = async () => {
    if (!walletId) return;
    
    try {
      setLoading(true);
      const response = await connectionService.getConnections(walletId);
      setConnections(response.results);
      setError(null);
    } catch (err) {
      setError('Failed to load connections');
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!walletId) return;
    
    try {
      const response = await connectionService.createInvitation(walletId);
      setInvitationUrl(response.invitation_url);
    } catch (err) {
      setError('Failed to create invitation');
      console.error('Error creating invitation:', err);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) return;
    
    try {
      await connectionService.acceptInvitation(walletId, acceptData);
      setShowAcceptModal(false);
      setAcceptData({ invitationUrl: '', alias: '' });
      await loadConnections();
    } catch (err) {
      setError('Failed to accept invitation');
      console.error('Error accepting invitation:', err);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" text="Loading connections..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <div className="flex space-x-2">
          <Button onClick={() => setShowInviteModal(true)}>
            Create Invitation
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowAcceptModal(true)}
          >
            Accept Invitation
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((connection) => (
          <Card
            key={connection.connection_id}
            title={connection.their_label || connection.alias || 'Unknown'}
          >
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getConnectionStateColor(connection.state)}`}>
                  {connection.state}
                </span>
              </div>
              <p><span className="font-medium">Connection ID:</span> {connection.connection_id.slice(0, 8)}...</p>
              {connection.their_did && (
                <p><span className="font-medium">Their DID:</span> {connection.their_did.slice(0, 20)}...</p>
              )}
              {connection.my_did && (
                <p><span className="font-medium">My DID:</span> {connection.my_did.slice(0, 20)}...</p>
              )}
              <p><span className="font-medium">Created:</span> {new Date(connection.created_at).toLocaleDateString()}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button
                size="sm"
                onClick={() => {
                  setSelectedConnectionId(connection.connection_id);
                  setShowDetailsModal(true);
                }}
              >
                View Details
              </Button>
              {connection.state === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Placeholder for messaging feature
                    alert('Messaging feature will be implemented soon!');
                  }}
                >
                  Messages
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {connections.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No connections</h3>
            <p className="mt-1 text-sm text-gray-500">Create an invitation or accept one to get started.</p>
          </div>
        </Card>
      )}

      {/* Create Invitation Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Create Connection Invitation"
      >
        <div className="space-y-4">
          <Input
            label="Alias (Optional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Enter alias for this connection"
          />
          
          {!invitationUrl ? (
            <Button onClick={handleCreateInvitation} className="w-full">
              Generate Invitation
            </Button>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invitation URL
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md text-sm"
                rows={4}
                value={invitationUrl}
                readOnly
              />
              <div className="mt-2 flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(invitationUrl)}
                >
                  Copy URL
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInvitationUrl('');
                    setAlias('');
                    setShowInviteModal(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Accept Invitation Modal */}
      <Modal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        title="Accept Connection Invitation"
      >
        <form onSubmit={handleAcceptInvitation} className="space-y-4">
          <Input
            label="Invitation URL"
            value={acceptData.invitationUrl}
            onChange={(e) => setAcceptData(prev => ({ ...prev, invitationUrl: e.target.value }))}
            placeholder="Paste invitation URL here"
            required
          />
          <Input
            label="Alias (Optional)"
            value={acceptData.alias}
            onChange={(e) => setAcceptData(prev => ({ ...prev, alias: e.target.value }))}
            placeholder="Enter alias for this connection"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAcceptModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Accept Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Connection Details Modal */}
      {selectedConnectionId && walletId && (
        <ConnectionDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedConnectionId(null);
          }}
          walletId={walletId}
          connectionId={selectedConnectionId}
        />
      )}
    </div>
  );
};