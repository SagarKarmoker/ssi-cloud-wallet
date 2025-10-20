import React, { useState, useEffect } from 'react';
import { Card, Button, Loading, Alert } from '../components';
import { credentialService, type Credential } from '../services';

interface CredentialPageProps {
  walletId: string;
}

export const CredentialPage: React.FC<CredentialPageProps> = ({ walletId }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (walletId) {
      loadCredentials();
    }
  }, [walletId]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await credentialService.getCredentials(walletId);
      setCredentials(response.results);
      setError(null);
    } catch (err) {
      setError('Failed to load credentials');
      console.error('Error loading credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCredentialStateColor = (state: string) => {
    switch (state) {
      case 'stored':
        return 'bg-green-100 text-green-800';
      case 'offer_received':
        return 'bg-blue-100 text-blue-800';
      case 'request_sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'credential_issued':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStoreCredential = async (credentialExchangeId: string) => {
    try {
      await credentialService.storeCredential(walletId, credentialExchangeId);
      await loadCredentials();
    } catch (err) {
      setError('Failed to store credential');
      console.error('Error storing credential:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" text="Loading credentials..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
        <Button onClick={loadCredentials}>
          Refresh
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
        {credentials.map((credential) => (
          <Card
            key={credential.credential_id}
            title={`Credential ${credential.credential_id.slice(0, 8)}...`}
          >
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getCredentialStateColor(credential.state)}`}>
                  {credential.state}
                </span>
              </div>
              <p><span className="font-medium">Schema ID:</span> {credential.schema_id.slice(0, 20)}...</p>
              <p><span className="font-medium">Cred Def ID:</span> {credential.cred_def_id.slice(0, 20)}...</p>
              {credential.connection_id && (
                <p><span className="font-medium">Connection:</span> {credential.connection_id.slice(0, 8)}...</p>
              )}
              <p><span className="font-medium">Created:</span> {new Date(credential.created_at).toLocaleDateString()}</p>
              
              {credential.attributes && Object.keys(credential.attributes).length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-gray-700 mb-1">Attributes:</p>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    {Object.entries(credential.attributes).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span className="truncate ml-2">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Button
                size="sm"
                onClick={() => {
                  // Show credential details in an alert for now
                  const details = `Credential Details:\n\nID: ${credential.credential_id}\nSchema: ${credential.schema_id}\nCred Def: ${credential.cred_def_id}\nState: ${credential.state}\n\nAttributes:\n${Object.entries(credential.attributes || {}).map(([key, value]) => `${key}: ${value}`).join('\n')}`;
                  alert(details);
                }}
              >
                View Details
              </Button>
              
              {credential.state === 'credential_issued' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStoreCredential(credential.credential_exchange_id)}
                >
                  Store
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {credentials.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No credentials</h3>
            <p className="mt-1 text-sm text-gray-500">Your credentials will appear here once you receive them.</p>
          </div>
        </Card>
      )}
    </div>
  );
};