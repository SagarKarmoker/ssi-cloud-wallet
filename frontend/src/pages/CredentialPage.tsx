import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Loading, Alert } from '../components';
import { DebugCredential } from '../components/DebugCredential';
import { credentialService, type Credential } from '../services';

interface CredentialPageProps {
  walletId: string;
}

export const CredentialPage: React.FC<CredentialPageProps> = ({ walletId }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialExchanges, setCredentialExchanges] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stored' | 'pending'>('pending');
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (walletId) {
      loadCredentialsAndExchanges();

      // Set up polling to check for new credentials every 30 seconds
      const interval = setInterval(() => {
        loadCredentialsAndExchanges();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [walletId]);

  const loadCredentialsAndExchanges = async () => {
    try {
      setLoading(true);
      
      // Load both stored credentials and credential exchanges in parallel
      const [credentialsResponse, exchangesResponse] = await Promise.all([
        credentialService.getCredentials(walletId),
        credentialService.getCredentialExchanges(walletId)
      ]);
      
      setCredentials(credentialsResponse.results);
      setCredentialExchanges(exchangesResponse.results);
      setError(null);
    } catch (err) {
      setError('Failed to load credentials');
      console.error('Error loading credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCredentialStateColor = (state: string | undefined) => {
    if (!state) return 'bg-gray-100 text-gray-800';
    
    // Normalize state by replacing hyphens with underscores for comparison
    const normalizedState = state.replace(/-/g, '_');
    
    switch (normalizedState) {
      case 'stored':
        return 'bg-green-100 text-green-800';
      case 'offer_received':
        return 'bg-blue-100 text-blue-800';
      case 'request_sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'credential_issued':
        return 'bg-purple-100 text-purple-800';
      case 'credential_acked':
        return 'bg-green-100 text-green-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'abandoned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExchangeTitle = (state: string | undefined) => {
    if (!state) return 'Credential Exchange';
    
    // Normalize state by replacing hyphens with underscores for comparison
    const normalizedState = state.replace(/-/g, '_');
    
    switch (normalizedState) {
      case 'offer_received':
        return 'Credential Offer';
      case 'request_sent':
        return 'Credential Request';
      case 'credential_issued':
        return 'Credential Issued';
      case 'credential_acked':
        return 'Credential Accepted';
      case 'done':
        return 'Credential Complete';
      case 'abandoned':
        return 'Abandoned Offer';
      default:
        return 'Credential Exchange';
    }
  };

  const formatState = (state: string | undefined) => {
    if (!state) return 'Unknown';
    return state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleAcceptCredential = async (credentialExchangeId: string, currentState: string) => {
    try {
      const normalizedState = currentState?.replace(/-/g, '_');
      console.log('Processing credential with state:', currentState, 'normalized:', normalizedState);
      
      if (normalizedState === 'offer_received') {
        // First step: Send credential request to accept the offer
        console.log('Sending credential request for exchange:', credentialExchangeId);
        await credentialService.sendCredentialRequest(walletId, credentialExchangeId);
        setError('Credential request sent successfully! Waiting for issuer to issue credential...');
        
        // Check status after sending request to catch any immediate issues
        setTimeout(async () => {
          try {
            console.log('Checking credential exchange status after request...');
            const detailedStatus = await credentialService.getCredentialExchange(walletId, credentialExchangeId);
            console.log('Detailed credential exchange status:', detailedStatus);
            
            if (detailedStatus.state === 'abandoned') {
              console.error('Credential exchange went to abandoned state!');
              console.error('Error details:', detailedStatus.error_msg);
              setError(`Credential exchange failed: ${detailedStatus.error_msg || 'Went to abandoned state'}`);
            }
            
            loadCredentialsAndExchanges();
          } catch (statusError) {
            console.error('Error checking credential exchange status:', statusError);
            loadCredentialsAndExchanges();
          }
        }, 3000);
        
      } else if (normalizedState === 'credential_issued') {
        // Second step: Store the issued credential
        console.log('Storing credential for exchange:', credentialExchangeId);
        await credentialService.storeCredential(walletId, credentialExchangeId);
        setError('Credential stored successfully!');
      } else {
        console.warn('Unexpected credential state for accept action:', currentState);
        setError(`Cannot accept credential in state: ${currentState}`);
      }
      
      await loadCredentialsAndExchanges();
      setTimeout(() => setError(null), 5000); // Extended timeout for better visibility
    } catch (err: any) {
      console.error('Detailed error processing credential:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Failed to process credential';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data) {
        errorMessage = JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(`Failed to process credential: ${errorMessage}`);
      
      // Refresh to see the current state
      await loadCredentialsAndExchanges();
    }
  };

  const handleRejectCredential = async (credentialExchangeId: string) => {
    try {
      await credentialService.sendProblemReport(walletId, credentialExchangeId, 'User rejected credential offer');
      await loadCredentialsAndExchanges();
      setError('Credential offer rejected');
      setTimeout(() => setError(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reject credential';
      setError(`Failed to reject credential: ${errorMessage}`);
      console.error('Error rejecting credential:', err);
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
        <div className="flex space-x-2">
          <Button onClick={() => setShowDebug(!showDebug)} variant="outline" size="sm">
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </Button>
          <Button onClick={loadCredentialsAndExchanges}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          type={error.includes('success') ? "success" : "error"}
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Credentials ({credentialExchanges.filter(c => {
              if (!c || !c.state) return false;
              const normalizedState = c.state.replace(/-/g, '_');
              return normalizedState !== 'stored' && normalizedState !== 'abandoned';
            }).length})
          </button>
          <button
            onClick={() => setActiveTab('stored')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stored'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stored Credentials ({credentials.length})
          </button>
        </nav>
      </div>

      {/* Debug Information */}
      {showDebug && (
        <Card title="Debug Information">
          <div className="space-y-2 text-sm">
            <p><strong>Credential Exchanges:</strong> {credentialExchanges.length} total</p>
            <p><strong>Stored Credentials:</strong> {credentials.length} total</p>
            <p><strong>Pending Count:</strong> {credentialExchanges.filter(c => {
              if (!c || !c.state) return false;
              const normalizedState = c.state.replace(/-/g, '_');
              return normalizedState !== 'stored' && normalizedState !== 'abandoned';
            }).length}</p>
            <p><strong>Abandoned (Hidden):</strong> {credentialExchanges.filter(c => {
              if (!c || !c.state) return false;
              const normalizedState = c.state.replace(/-/g, '_');
              return normalizedState === 'abandoned';
            }).length}</p>
            
            {credentialExchanges.length > 0 && (
              <details className="mt-4">
                <summary className="font-bold cursor-pointer">Exchange Records</summary>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {credentialExchanges.map((exchange, index) => (
                    <DebugCredential key={index} credential={exchange} type="exchange" />
                  ))}
                </div>
              </details>
            )}

            {credentials.length > 0 && (
              <details className="mt-4">
                <summary className="font-bold cursor-pointer">Stored Credentials</summary>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {credentials.map((credential, index) => (
                    <DebugCredential key={index} credential={credential} type="stored" />
                  ))}
                </div>
              </details>
            )}
          </div>
        </Card>
      )}

      {/* Credential Summary */}
      {activeTab === 'stored' && credentials.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📄 Credential Wallet Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{credentials.length}</div>
              <div className="text-gray-600">Total Stored</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {credentials.filter(c => c.state === 'stored' || !c.state).length}
              </div>
              <div className="text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(credentials.map(c => c.schema_id)).size}
              </div>
              <div className="text-gray-600">Credential Types</div>
            </div>
          </div>
        </div>
      )}

      {/* Credential Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'pending' 
          ? credentialExchanges
              .filter(exchange => {
                if (!exchange || !exchange.state) return false;
                const normalizedState = exchange.state.replace(/-/g, '_');
                // Hide stored and abandoned offers
                return normalizedState !== 'stored' && normalizedState !== 'abandoned';
              }) // Show non-stored, non-abandoned exchanges
              .map((exchange) => (
                <Card
                  key={exchange.credential_exchange_id}
                  title={`${getExchangeTitle(exchange.state)}`}
                >
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getCredentialStateColor(exchange.state)}`}>
                        {formatState(exchange.state)}
                      </span>
                    </div>
                    <p><span className="font-medium">Exchange ID:</span> {exchange.credential_exchange_id?.slice(0, 20) || 'N/A'}...</p>
                    {exchange.schema_id && (
                      <p><span className="font-medium">Schema ID:</span> {exchange.schema_id.slice(0, 20)}...</p>
                    )}
                    {exchange.cred_def_id && (
                      <p><span className="font-medium">Cred Def ID:</span> {exchange.cred_def_id.slice(0, 20)}...</p>
                    )}
                    {exchange.connection_id && (
                      <p><span className="font-medium">Connection:</span> {exchange.connection_id.slice(0, 8)}...</p>
                    )}
                    <p><span className="font-medium">Created:</span> {exchange.created_at ? new Date(exchange.created_at).toLocaleDateString() : 'Unknown'}</p>
                    
                    {exchange.attributes && Object.keys(exchange.attributes).length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-gray-700 mb-1">Attributes:</p>
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          {Object.entries(exchange.attributes).map(([key, value]) => (
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
                        const details = `Credential Exchange Details:\n\nExchange ID: ${exchange.credential_exchange_id}\nSchema: ${exchange.schema_id || 'N/A'}\nCred Def: ${exchange.cred_def_id || 'N/A'}\nState: ${exchange.state}\n\nAttributes:\n${Object.entries(exchange.attributes || {}).map(([key, value]) => `${key}: ${value}`).join('\n')}`;
                        alert(details);
                      }}
                    >
                      View Details
                    </Button>
                    
                    {exchange.credential_exchange_id && (() => {
                      const normalizedState = exchange.state?.replace(/-/g, '_');
                      return normalizedState === 'offer_received' || normalizedState === 'credential_issued';
                    })() && (
                      <Button
                        size="sm"
                        onClick={() => handleAcceptCredential(exchange.credential_exchange_id, exchange.state)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {(() => {
                          const normalizedState = exchange.state?.replace(/-/g, '_');
                          return normalizedState === 'offer_received' ? 'Accept Offer' : 'Store Credential';
                        })()}
                      </Button>
                    )}
                    
                    {exchange.credential_exchange_id && (() => {
                      const normalizedState = exchange.state?.replace(/-/g, '_');
                      return normalizedState === 'offer_received';
                    })() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectCredential(exchange.credential_exchange_id)}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </Card>
              ))
          : credentials.filter(credential => credential && credential.credential_id).map((credential) => {
              // Try to get a meaningful title from attributes
              const getCredentialTitle = (cred: any) => {
                if (cred.attributes) {
                  // Common attribute names that might make a good title
                  const titleFields = ['name', 'full_name', 'fullName', 'title', 'degree', 'certificate_name', 'course_name'];
                  for (const field of titleFields) {
                    if (cred.attributes[field]) {
                      return cred.attributes[field];
                    }
                  }
                  // If no title field, use the first attribute
                  const firstAttribute = Object.entries(cred.attributes)[0];
                  if (firstAttribute) {
                    return `${firstAttribute[0]}: ${firstAttribute[1]}`;
                  }
                }
                return `Credential ${cred.credential_id?.slice(0, 8)}...`;
              };

              return (
                <Card
                  key={credential.credential_id}
                  title={getCredentialTitle(credential)}
                >
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${'bg-green-100 text-green-800'}`}>
                        ✓ Stored
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <p><span className="font-medium">ID:</span> <span className="font-mono text-xs">{credential.credential_id?.slice(0, 12)}...</span></p>
                      {credential.created_at && (
                        <p><span className="font-medium">Received:</span> {new Date(credential.created_at).toLocaleString()}</p>
                      )}
                    </div>
                    
                    {credential.attributes && Object.keys(credential.attributes).length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-gray-700 mb-2">Credential Data:</p>
                        <div className="bg-gray-50 p-3 rounded-md border">
                          <div className="space-y-2">
                            {Object.entries(credential.attributes).map(([key, value]) => (
                              <div key={key} className="flex flex-col sm:flex-row sm:justify-between">
                                <span className="font-medium text-gray-700 capitalize">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                </span>
                                <span className="text-gray-900 sm:text-right sm:max-w-[60%] break-words">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Technical Details (Collapsible) */}
                    <details className="mt-3">
                      <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                        Technical Details
                      </summary>
                      <div className="mt-2 text-xs text-gray-500 space-y-1 pl-4">
                        <p><span className="font-medium">Schema ID:</span> <span className="font-mono break-all">{credential.schema_id}</span></p>
                        <p><span className="font-medium">Credential Definition:</span> <span className="font-mono break-all">{credential.cred_def_id}</span></p>
                        {credential.connection_id && (
                          <p><span className="font-medium">Connection ID:</span> <span className="font-mono">{credential.connection_id}</span></p>
                        )}
                      </div>
                    </details>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const details = `=== CREDENTIAL DETAILS ===\n\n` +
                          `Title: ${getCredentialTitle(credential)}\n` +
                          `ID: ${credential.credential_id}\n` +
                          `Status: ${credential.state || 'Stored'}\n` +
                          `Created: ${credential.created_at ? new Date(credential.created_at).toLocaleString() : 'Unknown'}\n\n` +
                          `=== CREDENTIAL DATA ===\n` +
                          `${Object.entries(credential.attributes || {}).map(([key, value]) => `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}`).join('\n')}\n\n` +
                          `=== TECHNICAL INFO ===\n` +
                          `Schema ID: ${credential.schema_id}\n` +
                          `Credential Definition: ${credential.cred_def_id}\n` +
                          `Connection ID: ${credential.connection_id || 'N/A'}`;
                        alert(details);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      📋 Full Details
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Copy credential data as JSON to clipboard
                        const credentialData = {
                          id: credential.credential_id,
                          attributes: credential.attributes,
                          schema_id: credential.schema_id,
                          cred_def_id: credential.cred_def_id,
                          created_at: credential.created_at
                        };
                        navigator.clipboard.writeText(JSON.stringify(credentialData, null, 2))
                          .then(() => setError('Credential data copied to clipboard!'))
                          .catch(() => setError('Failed to copy to clipboard'));
                      }}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      📄 Copy JSON
                    </Button>
                  </div>
                </Card>
              );
            })
        }
      </div>

      {/* Empty State */}
      {!loading && (
        (activeTab === 'pending' && credentialExchanges.filter(c => {
          if (!c || !c.state) return false;
          const normalizedState = c.state.replace(/-/g, '_');
          return normalizedState !== 'stored' && normalizedState !== 'abandoned';
        }).length === 0) ||
        (activeTab === 'stored' && credentials.length === 0)
      ) && (
        <Card>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {activeTab === 'pending' ? 'No pending credentials' : 'No stored credentials'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'pending' 
                ? 'Incoming credential offers from issuers will appear here.' 
                : 'Your accepted and stored credentials will appear here.'
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};