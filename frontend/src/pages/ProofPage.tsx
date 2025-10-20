import React, { useState, useEffect } from 'react';
import { Card, Button, Loading, Alert } from '../components';
import { proofService, type ProofRequest } from '../services';

interface ProofPageProps {
  walletId: string;
}

export const ProofPage: React.FC<ProofPageProps> = ({ walletId }) => {
  const [proofRequests, setProofRequests] = useState<ProofRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (walletId) {
      loadProofRequests();
    }
  }, [walletId]);

  const loadProofRequests = async () => {
    try {
      setLoading(true);
      const response = await proofService.getProofRequests(walletId);
      setProofRequests(response.results);
      setError(null);
    } catch (err) {
      setError('Failed to load proof requests');
      console.error('Error loading proof requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProofStateColor = (state: string) => {
    switch (state) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'presentation_sent':
        return 'bg-blue-100 text-blue-800';
      case 'presentation_received':
        return 'bg-purple-100 text-purple-800';
      case 'request_sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'request_received':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVerifyPresentation = async (presentationExchangeId: string) => {
    try {
      await proofService.verifyPresentation(walletId, presentationExchangeId);
      await loadProofRequests();
    } catch (err) {
      setError('Failed to verify presentation');
      console.error('Error verifying presentation:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" text="Loading proof requests..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Proof Requests</h1>
        <Button onClick={loadProofRequests}>
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
        {proofRequests.map((proofRequest) => (
          <Card
            key={proofRequest.proof_request_id}
            title={proofRequest.presentation_request?.name || `Proof Request ${proofRequest.proof_request_id.slice(0, 8)}...`}
          >
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getProofStateColor(proofRequest.state)}`}>
                  {proofRequest.state}
                </span>
              </div>
              <p><span className="font-medium">Exchange ID:</span> {proofRequest.presentation_exchange_id.slice(0, 8)}...</p>
              {proofRequest.connection_id && (
                <p><span className="font-medium">Connection:</span> {proofRequest.connection_id.slice(0, 8)}...</p>
              )}
              <p><span className="font-medium">Created:</span> {new Date(proofRequest.created_at).toLocaleDateString()}</p>
              
              {proofRequest.verified !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Verified:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    proofRequest.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {proofRequest.verified ? 'Yes' : 'No'}
                  </span>
                </div>
              )}

              {proofRequest.presentation_request?.requested_attributes && (
                <div className="mt-3">
                  <p className="font-medium text-gray-700 mb-1">Requested Attributes:</p>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    {Object.entries(proofRequest.presentation_request.requested_attributes).map(([key, attr]: [string, any]) => (
                      <div key={key} className="mb-1">
                        <span className="font-medium">{key}:</span>
                        <span className="ml-1">{attr.name || attr.names?.join(', ')}</span>
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
                  // Show proof details in an alert for now
                  const details = `Proof Request Details:\n\nID: ${proofRequest.proof_request_id}\nExchange ID: ${proofRequest.presentation_exchange_id}\nState: ${proofRequest.state}\nVerified: ${proofRequest.verified || 'N/A'}\n\nRequested Attributes:\n${Object.entries(proofRequest.presentation_request?.requested_attributes || {}).map(([key, attr]: [string, any]) => `${key}: ${attr.name || attr.names?.join(', ')}`).join('\n')}`;
                  alert(details);
                }}
              >
                View Details
              </Button>
              
              {proofRequest.state === 'presentation_received' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVerifyPresentation(proofRequest.presentation_exchange_id)}
                >
                  Verify
                </Button>
              )}
              
              {proofRequest.state === 'request_received' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    // Placeholder for send presentation feature
                    alert('Send Presentation feature will be implemented soon!');
                  }}
                >
                  Send Presentation
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {proofRequests.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No proof requests</h3>
            <p className="mt-1 text-sm text-gray-500">Proof requests will appear here when you receive them.</p>
          </div>
        </Card>
      )}
    </div>
  );
};