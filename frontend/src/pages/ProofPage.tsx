import React, { useState, useEffect } from 'react';
import { Card, Button, Loading, Alert } from '../components';
import { proofService, type ProofRequest, credentialService } from '../services';

interface ProofPageProps {
  walletId: string;
}

export const ProofPage: React.FC<ProofPageProps> = ({ walletId }) => {
  const [proofRequests, setProofRequests] = useState<ProofRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'all'>('received');

  useEffect(() => {
    if (walletId) {
      loadProofRequests();
    }
  }, [walletId]);

  const loadProofRequests = async () => {
    try {
      setLoading(true);
      const response = await proofService.getProofRequests(walletId);
      console.log("🔥 Proofs: ", response);
      
      // Enhanced logging to show detailed proof request structure and decode base64 attachments
      response.results.forEach((proof: any, index: number) => {
        console.log(`\n🔍 Proof Request ${index + 1} (${proof.pres_ex_id}):`);
        console.log(`  State: ${proof.state}`);
        
        if (proof.pres_request && proof.pres_request['request_presentations~attach']) {
          const attachments = proof.pres_request['request_presentations~attach'];
          if (attachments && attachments.length > 0) {
            const attachment = attachments[0];
            if (attachment.data && attachment.data.base64) {
              try {
                const decodedData = atob(attachment.data.base64);
                const parsedRequest = JSON.parse(decodedData);
                console.log(`  📋 DECODED PROOF REQUEST:`, parsedRequest);
                console.log(`  🎯 REQUESTED ATTRIBUTES:`, parsedRequest.requested_attributes);
                console.log(`  🔢 REQUESTED PREDICATES:`, parsedRequest.requested_predicates);
                
                // Show what specific attributes/names are being requested
                if (parsedRequest.requested_attributes) {
                  Object.entries(parsedRequest.requested_attributes).forEach(([key, attr]: [string, any]) => {
                    console.log(`    - Attribute "${key}": requires "${attr.name || attr.names}" with restrictions:`, attr.restrictions);
                  });
                }
              } catch (e) {
                console.log(`  ❌ Failed to decode attachment: ${e}`);
              }
            }
          }
        }
      });
      
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

  // Helper function to get the exchange ID from various possible field names
  const getExchangeId = (proofRequest: any) => {
    return proofRequest.presentation_exchange_id || 
           proofRequest.pres_ex_id || 
           proofRequest.pres_exchange_id ||
           proofRequest.exchange_id ||
           proofRequest.thread_id ||
           proofRequest.id ||
           null;
  };

  // Manual credential matching function
  const attemptManualCredentialMatching = (proofRequest: any, storedCredentials: any[]) => {
    console.log('🔍 Starting manual credential matching...');
    console.log('Full proof request object:', proofRequest);
    
    // Try different possible field names for presentation request
    let presentationRequest = proofRequest.presentation_request || 
                             proofRequest.pres_request || 
                             proofRequest.proof_request || 
                             proofRequest.request || 
                             proofRequest;
    
    console.log('Initial presentation request object:', presentationRequest);
    console.log('Presentation request keys:', Object.keys(presentationRequest || {}));
    
    // Check if we need to extract from pres_request field
    if (proofRequest.pres_request) {
      console.log('🔍 Found pres_request field:', proofRequest.pres_request);
      presentationRequest = proofRequest.pres_request;
    }
    
    // Check if the request is in attachment format (request_presentations~attach)
    if (presentationRequest['request_presentations~attach']) {
      console.log('🔍 Found request_presentations~attach:', presentationRequest['request_presentations~attach']);
      const attachments = presentationRequest['request_presentations~attach'];
      
      if (Array.isArray(attachments) && attachments.length > 0) {
        const attachment = attachments[0];
        console.log('🔍 First attachment:', attachment);
        
        // Try to decode the attachment data
        if (attachment.data && attachment.data.base64) {
          try {
            const decodedData = atob(attachment.data.base64);
            const parsedRequest = JSON.parse(decodedData);
            console.log('🔍 Decoded attachment data:', parsedRequest);
            presentationRequest = parsedRequest;
          } catch (e) {
            console.log('❌ Failed to decode attachment data:', e);
          }
        } else if (attachment.data && attachment.data.json) {
          console.log('🔍 Found JSON data in attachment:', attachment.data.json);
          presentationRequest = attachment.data.json;
        }
      }
    }
    
    console.log('Final presentation request to use:', presentationRequest);
    const requestedAttributes = presentationRequest?.requested_attributes || {};
    const requestedPredicates = presentationRequest?.requested_predicates || {};
    
    console.log('Proof request requested attributes:', requestedAttributes);
    console.log('Proof request requested predicates:', requestedPredicates);
    console.log('Available stored credentials count:', storedCredentials.length);
    
    // Detailed logging of each stored credential
    console.log('📝 DETAILED STORED CREDENTIALS:');
    storedCredentials.forEach((cred, index) => {
      console.log(`  Credential ${index + 1}:`);
      console.log(`    - Credential ID/Referent: ${cred.referent || cred.cred_id || 'N/A'}`);
      console.log(`    - Schema ID: ${cred.schema_id}`);
      console.log(`    - Credential Definition ID: ${cred.cred_def_id}`);
      console.log(`    - Available Attributes: ${cred.attrs ? Object.keys(cred.attrs).join(', ') : 'N/A'}`);
      console.log(`    - Attribute Values:`, cred.attrs || cred.attribute_values || 'N/A');
      console.log(`    - Full Credential Object:`, cred);
      console.log(`    ---`);
    });
    
    const presentation: any = {
      indy: {
        requested_attributes: {},
        requested_predicates: {},
        self_attested_attributes: {}
      }
    };

    let canFulfill = true;
    const matchingDetails: any[] = [];

    // Check requested attributes
    for (const [attrReferent, attrInfo] of Object.entries(requestedAttributes)) {
      console.log(`\n🔍 Checking attribute: ${attrReferent}`, attrInfo);
      console.log(`   Attribute restrictions:`, (attrInfo as any).restrictions);
      console.log(`   Required names:`, (attrInfo as any).names || (attrInfo as any).name);
      
      const matchingCredential = storedCredentials.find((cred: any, credIndex: number) => {
        const credDefId = cred.cred_def_id;
        const requestedCredDefId = (attrInfo as any).restrictions?.[0]?.cred_def_id;
        
        console.log(`  🔄 Checking credential ${credIndex + 1}:`);
        console.log(`    - Stored cred_def_id: ${credDefId}`);
        console.log(`    - Requested cred_def_id: ${requestedCredDefId}`);
        console.log(`    - Credential attributes: ${cred.attrs ? Object.keys(cred.attrs).join(', ') : 'None'}`);
        
        if (requestedCredDefId && credDefId === requestedCredDefId) {
          console.log(`    ✅ CRED_DEF_ID MATCH! ${credDefId}`);
          return true;
        }
        
        // Also check if the credential has the required attributes
        const requiredNames = (attrInfo as any).names || [(attrInfo as any).name];
        if (requiredNames && Array.isArray(requiredNames)) {
          const hasRequiredAttrs = requiredNames.every((name: string) => 
            cred.attrs && Object.keys(cred.attrs).includes(name)
          );
          
          console.log(`    - Required attribute names: ${requiredNames.join(', ')}`);
          console.log(`    - Has required attributes: ${hasRequiredAttrs}`);
          
          if (hasRequiredAttrs && !requestedCredDefId) {
            console.log(`    ✅ ATTRIBUTE MATCH (no cred_def_id restriction)!`);
            return true;
          }
        }
        
        console.log(`    ❌ No match for this credential`);
        return false;
      });

      if (matchingCredential) {
        const credentialId = matchingCredential.referent || matchingCredential.credential_id || matchingCredential.cred_id;
        console.log(`📌 Using credential ID: ${credentialId} (from referent: ${matchingCredential.referent}, credential_id: ${matchingCredential.credential_id})`);
        
        presentation.indy.requested_attributes[attrReferent] = {
          cred_id: credentialId,
          revealed: true
        };
        matchingDetails.push({
          type: 'attribute',
          referent: attrReferent,
          credential: matchingCredential.cred_def_id,
          credId: matchingCredential.referent
        });
        console.log(`✅ Matched attribute ${attrReferent} with credential ${matchingCredential.cred_def_id}`);
      } else {
        console.log(`❌ Could not match attribute ${attrReferent}`);
        canFulfill = false;
      }
    }

    // Check requested predicates  
    for (const [predReferent, predInfo] of Object.entries(requestedPredicates)) {
      console.log(`\n🔍 Checking predicate: ${predReferent}`, predInfo);
      
      const matchingCredential = storedCredentials.find((cred: any) => {
        const credDefId = cred.cred_def_id;
        const requestedCredDefId = (predInfo as any).restrictions?.[0]?.cred_def_id;
        
        if (requestedCredDefId && credDefId === requestedCredDefId) {
          console.log(`  ✅ Found matching credential def ID for predicate: ${credDefId}`);
          return true;
        }
        
        return false;
      });

      if (matchingCredential) {
        presentation.indy.requested_predicates[predReferent] = {
          cred_id: matchingCredential.referent
        };
        matchingDetails.push({
          type: 'predicate',
          referent: predReferent,
          credential: matchingCredential.cred_def_id,
          credId: matchingCredential.referent
        });
        console.log(`✅ Matched predicate ${predReferent} with credential ${matchingCredential.cred_def_id}`);
      } else {
        console.log(`❌ Could not match predicate ${predReferent}`);
        canFulfill = false;
      }
    }

    console.log('\n📋 MANUAL MATCHING RESULTS:');
    console.log('Can fulfill proof request:', canFulfill);
    console.log('Matching details:', matchingDetails);
    console.log('Built presentation:', presentation);

    return {
      canFulfill,
      presentation,
      matchingDetails
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" text="Loading proof requests..." />
      </div>
    );
  }

  // Debug: Let's see what states we're actually getting
  console.log('All proof requests:', proofRequests);
  console.log('Proof request states:', proofRequests.map(req => req.state));
  console.log('Proof request structure:', proofRequests.map(req => ({
    presentation_exchange_id: req.presentation_exchange_id,
    proof_request_id: req.proof_request_id,
    exchange_id_found: getExchangeId(req),
    all_keys: Object.keys(req)
  })));

  // Filter requests that we've received (requests from verifiers to us)
  const receivedRequests = proofRequests.filter(req => {
    const state = req.state;
    return state === 'request-received' ||  // The actual state we're seeing
           state === 'request_received' ||   // underscore version
           state === 'presentation-sent' ||  // after we send proof
           state === 'presentation_sent';    // underscore version
    // Note: 'abandoned' states are excluded (declined or failed requests)
  });

  const sentRequests = proofRequests.filter(req => {
    const state = req.state;
    return state === 'request-sent' || 
           state === 'request_sent' ||
           state === 'presentation-received' || 
           state === 'presentation_received' ||
           state === 'verified' ||
           state === 'done';
  });

  const formatState = (state: string) => {
    return state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePresentProof = async (presentationExchangeId: string) => {
    try {
      // Get available credentials for this proof request
      console.log('Getting credentials for presentation request:', presentationExchangeId);
      const credentialsResponse = await proofService.getCredentialsForPresentationRequest(walletId, presentationExchangeId);
      console.log('Credentials response:', credentialsResponse);
      console.log('Credentials response type:', typeof credentialsResponse);
      console.log('Credentials response keys:', Object.keys(credentialsResponse || {}));
      
      if (!credentialsResponse || !credentialsResponse.results || credentialsResponse.results.length === 0) {
        // Let's check what stored credentials we have and what the credentials API is returning
        console.log('No matching credentials found. Let\'s debug this...');
        try {
          // Check both the proof credentials API response and our stored credentials
          console.log('Credentials API Response:', credentialsResponse);
          
          // Also check what credentials we have stored in our wallet
          const allCredentialExchanges = await credentialService.getCredentialExchanges(walletId);
          console.log('All credential exchanges:', allCredentialExchanges);
          
          const storedCredentials = (allCredentialExchanges.results || []).filter((cred: any) => 
            cred.state === 'stored' && cred.credential
          );
          console.log('Stored credentials that should be usable:', storedCredentials);
          
          // Also check the actual stored credentials endpoint
          const actualStoredCredentials = await credentialService.getCredentials(walletId);
          console.log('Actual stored credentials from credentials API:', actualStoredCredentials);
          
          const totalStoredCredentials = (actualStoredCredentials.results || actualStoredCredentials || []).length;
          
          // Show detailed comparison for debugging
          console.log('=== DETAILED MISMATCH ANALYSIS ===');
          const currentProofRequest = proofRequests.find(req => getExchangeId(req) === presentationExchangeId);
          if (currentProofRequest?.presentation_request?.requested_attributes) {
            const requestedAttrs = currentProofRequest.presentation_request.requested_attributes;
            console.log('VERIFIER IS REQUESTING:');
            Object.entries(requestedAttrs).forEach(([key, attr]: [string, any]) => {
              console.log(`  - Attribute "${key}":`, {
                name: attr.name,
                names: attr.names,
                restrictions: attr.restrictions
              });
            });
          }
          
          console.log('YOUR STORED CREDENTIALS CONTAIN:');
          (actualStoredCredentials.results || actualStoredCredentials || []).forEach((cred: any, index: number) => {
            console.log(`  Credential ${index + 1}:`, {
              schema_id: cred.schema_id,
              cred_def_id: cred.cred_def_id,
              attributes: Object.keys(cred.attrs || cred.attributes || {}),
              attribute_values: cred.attrs || cred.attributes
            });
          });
          
          if (totalStoredCredentials === 0) {
            setError('❌ You need to have stored credentials first! Go to the Credentials page and accept some credential offers, then return to respond to this proof request.');
          } else {
            setError(`❌ Schema/Attribute Mismatch: You have ${totalStoredCredentials} stored credentials, but none match what the verifier is requesting. Check the console for detailed comparison. This might be due to strict schema matching in ACA-Py.`);
            
            // Manual credential matching - check cred_def_id matches
            console.log('🔧 ATTEMPTING MANUAL CREDENTIAL MATCHING...');
            console.log('Current proof request structure:', currentProofRequest);
            console.log('Looking for presentation_request in:', Object.keys(currentProofRequest || {}));
            console.log('🔍 Checking pres_request field:', (currentProofRequest as any)?.pres_request);
            
            // Get the full presentation exchange record to get detailed request info
            console.log('📋 Fetching full presentation exchange record...');
            try {
              const fullPresentationRecord = await proofService.getPresentationExchangeRecord(walletId, presentationExchangeId);
              console.log('Full presentation exchange record:', fullPresentationRecord);
              
              const manualMatch = attemptManualCredentialMatching(
                fullPresentationRecord, 
                actualStoredCredentials.results || actualStoredCredentials || []
              );
            
              if (manualMatch.canFulfill) {
                console.log('✅ Manual matching found compatible credentials!');
                console.log('Manually built presentation:', manualMatch.presentation);
                
                // Try to send the manually built presentation
                try {
                  console.log('🚀 SENDING PRESENTATION TO ACA-PY:', JSON.stringify(manualMatch.presentation, null, 2));
                  const sendResult = await proofService.sendPresentation(walletId, presentationExchangeId, manualMatch.presentation);
                  console.log('✅ Presentation sent successfully! Result:', sendResult);
                  setError('✅ Proof presentation sent successfully using manual credential matching!');
                  
                  // Wait a bit for the state to update, then reload
                  setTimeout(async () => {
                    await loadProofRequests();
                  }, 1500);
                  return;
                } catch (manualSendError: any) {
                  console.error('❌ Manual presentation failed:', manualSendError);
                  console.error('❌ Full error response:', manualSendError.response?.data);
                  console.error('❌ Error status:', manualSendError.response?.status);
                  console.error('❌ Error message from API:', JSON.stringify(manualSendError.response?.data, null, 2));
                  
                  // Try to extract more detailed error info
                  if (manualSendError.response?.data) {
                    const errorData = manualSendError.response.data;
                    console.error('❌ Detailed API Error:', {
                      message: errorData.message,
                      statusCode: errorData.statusCode,
                      error: errorData.error,
                      details: errorData
                    });
                  }
                  
                  setError(`❌ Sending failed: ${JSON.stringify(manualSendError.response?.data?.message || manualSendError?.message || 'Unknown error')}`);
                }
              } else {
                console.log('❌ Manual matching also failed - no compatible credential definition IDs found');
                setError(`❌ No compatible credentials found. Manual check shows none of your ${totalStoredCredentials} credentials have matching credential definition IDs with what the verifier requires.`);
              }
            } catch (recordFetchError: any) {
              console.error('Failed to fetch presentation exchange record:', recordFetchError);
              
              // Fallback to using the original proof request
              const manualMatch = attemptManualCredentialMatching(
                currentProofRequest, 
                actualStoredCredentials.results || actualStoredCredentials || []
              );
              
              if (manualMatch.canFulfill) {
                console.log('✅ Fallback manual matching found compatible credentials!');
                console.log('Manually built presentation:', manualMatch.presentation);
                
                try {
                  const sendResult = await proofService.sendPresentation(walletId, presentationExchangeId, manualMatch.presentation);
                  console.log('✅ Fallback presentation sent successfully! Result:', sendResult);
                  setError('✅ Proof presentation sent successfully using fallback manual credential matching!');
                  
                  // Wait a bit for the state to update, then reload
                  setTimeout(async () => {
                    await loadProofRequests();
                  }, 1500);
                  return;
                } catch (fallbackSendError: any) {
                  console.error('Fallback manual presentation failed:', fallbackSendError);
                  setError(`❌ Fallback matching found credentials but sending failed: ${fallbackSendError?.message || 'Unknown error'}`);
                }
              } else {
                console.log('❌ Fallback manual matching also failed');
                setError(`❌ No compatible credentials found even with fallback matching.`);
              }
            }
          }
        } catch (credError) {
          console.error('Error checking stored credentials:', credError);
          setError('❌ No matching credentials found for this proof request. Unable to check your stored credentials.');
        }
        return;
      }

      // For simplicity, auto-select the first available credential for each requested attribute
      const proofRequest = proofRequests.find(req => getExchangeId(req) === presentationExchangeId);
      console.log('Found proof request:', proofRequest);
      if (!proofRequest) {
        setError('Proof request not found');
        return;
      }

      console.log('=== PROOF REQUEST ANALYSIS ===');
      console.log('What this proof request is asking for:');
      const requestedAttrs = proofRequest.presentation_request?.requested_attributes;
      const requestedPreds = proofRequest.presentation_request?.requested_predicates;
      console.log('Requested attributes:', requestedAttrs);
      console.log('Requested predicates:', requestedPreds);
      
      // Show what attributes are specifically needed
      if (requestedAttrs) {
        Object.entries(requestedAttrs).forEach(([key, attr]: [string, any]) => {
          console.log(`Required attribute "${key}":`, attr);
        });
      }

      const requestedAttributes = proofRequest.presentation_request?.requested_attributes || {};
      const requestedPredicates = proofRequest.presentation_request?.requested_predicates || {};

      // Build the presentation
      const presentation = {
        presentation_exchange_id: presentationExchangeId,
        requested_credentials: {
          self_attested_attributes: {},
          requested_attributes: {} as any,
          requested_predicates: {} as any
        }
      };

      // Map credentials to requested attributes
      Object.keys(requestedAttributes).forEach(attrKey => {
        const matchingCreds = credentialsResponse.results.filter(cred => {
          const requestedAttr = requestedAttributes[attrKey];
          const attrNames = requestedAttr.names || [requestedAttr.name];
          return attrNames.some((name: string) => cred.attrs && name in cred.attrs);
        });

        if (matchingCreds.length > 0) {
          const selectedCred = matchingCreds[0];
          presentation.requested_credentials.requested_attributes[attrKey] = {
            cred_id: selectedCred.credential_id,
            revealed: true
          };
        }
      });

      // Handle predicates similarly
      Object.keys(requestedPredicates).forEach(predKey => {
        const matchingCreds = credentialsResponse.results.filter(cred => {
          const requestedPred = requestedPredicates[predKey];
          return cred.attrs && requestedPred.name in cred.attrs;
        });

        if (matchingCreds.length > 0) {
          const selectedCred = matchingCreds[0];
          presentation.requested_credentials.requested_predicates[predKey] = {
            cred_id: selectedCred.credential_id
          };
        }
      });

      console.log('Sending presentation:', presentation);
      await proofService.sendPresentation(walletId, presentationExchangeId, presentation);
      setError('Proof presentation sent successfully!');
      await loadProofRequests();
    } catch (err: any) {
      console.error('Error presenting proof:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to send proof presentation: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">🎯 Proof Requests</h1>
        <Button onClick={loadProofRequests}>
          🔄 Refresh
        </Button>
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
            onClick={() => setActiveTab('received')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📥 Received Requests ({receivedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📤 Sent Requests ({sentRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔍 All Requests ({proofRequests.length}) - Debug
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(activeTab === 'received' ? receivedRequests : 
          activeTab === 'sent' ? sentRequests : 
          proofRequests).map((proofRequest) => (
          <Card
            key={proofRequest.proof_request_id || getExchangeId(proofRequest) || Math.random()}
            title={proofRequest.presentation_request?.name || `Proof Request ${proofRequest.proof_request_id?.slice(0, 8) || getExchangeId(proofRequest)?.slice(0, 8) || 'Unknown'}...`}
          >
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getProofStateColor(proofRequest.state)}`}>
                  {formatState(proofRequest.state)}
                </span>
              </div>
              {activeTab === 'all' && (
                <div className="bg-yellow-50 p-2 rounded text-xs">
                  <p><strong>Raw State:</strong> {proofRequest.state}</p>
                  <p><strong>Normalized:</strong> {proofRequest.state?.replace(/-/g, '_')}</p>
                  <p><strong>Proof Request ID:</strong> {proofRequest.proof_request_id || 'undefined'}</p>
                  <p><strong>Presentation Exchange ID:</strong> {getExchangeId(proofRequest) || 'undefined'}</p>
                </div>
              )}
              <p><span className="font-medium">Exchange ID:</span> {getExchangeId(proofRequest)?.slice(0, 8) || 'N/A'}...</p>
              {proofRequest.connection_id && (
                <p><span className="font-medium">Connection:</span> {proofRequest.connection_id?.slice(0, 8)}...</p>
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
                  const requestedAttrs = Object.entries(proofRequest.presentation_request?.requested_attributes || {})
                    .map(([key, attr]: [string, any]) => `${key}: ${attr.name || attr.names?.join(', ')}`).join('\n');
                  const requestedPreds = Object.entries(proofRequest.presentation_request?.requested_predicates || {})
                    .map(([key, pred]: [string, any]) => `${key}: ${pred.name} ${pred.p_type} ${pred.p_value}`).join('\n');
                  
                  const details = `=== PROOF REQUEST DETAILS ===\n\n` +
                    `ID: ${proofRequest.proof_request_id || 'N/A'}\n` +
                    `Exchange ID: ${getExchangeId(proofRequest) || 'N/A'}\n` +
                    `State: ${formatState(proofRequest.state || 'unknown')}\n` +
                    `Verified: ${proofRequest.verified !== undefined ? (proofRequest.verified ? 'Yes' : 'No') : 'N/A'}\n\n` +
                    `=== REQUESTED ATTRIBUTES ===\n${requestedAttrs || 'None'}\n\n` +
                    `=== REQUESTED PREDICATES ===\n${requestedPreds || 'None'}`;
                  alert(details);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                📋 Details
              </Button>
              
              {/* Actions for received requests */}
              {(activeTab === 'received' || activeTab === 'all') && (proofRequest.state === 'request_received' || proofRequest.state === 'request-received') && (
                <Button
                  size="sm"
                  onClick={() => handlePresentProof(getExchangeId(proofRequest))}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  📤 Send Proof
                </Button>
              )}

              {(activeTab === 'received' || activeTab === 'all') && (proofRequest.state === 'request_received' || proofRequest.state === 'request-received') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const exchangeId = getExchangeId(proofRequest);
                      console.log('Declining proof request:', exchangeId);
                      console.log('Full proof request object:', proofRequest);
                      if (!exchangeId) {
                        throw new Error('No exchange ID found in proof request');
                      }
                      await proofService.sendProblemReport(walletId, exchangeId, 'User declined to provide proof');
                      setError('Proof request declined successfully!');
                      await loadProofRequests();
                    } catch (err: any) {
                      console.error('Error declining proof request:', err);
                      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
                      setError(`Failed to decline proof request: ${errorMessage}`);
                    }
                  }}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  ❌ Decline
                </Button>
              )}
              
              {/* Actions for sent requests */}
              {(activeTab === 'sent' || activeTab === 'all') && (proofRequest.state === 'presentation_received' || proofRequest.state === 'presentation-received') && (
                <Button
                  size="sm"
                  onClick={() => handleVerifyPresentation(getExchangeId(proofRequest))}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  ✅ Verify Proof
                </Button>
              )}

              {/* Show verification result */}
              {proofRequest.state === 'verified' && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  proofRequest.verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {proofRequest.verified ? '✅ Verified' : '❌ Invalid'}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty States */}
      {!loading && (
        (activeTab === 'received' && receivedRequests.length === 0) ||
        (activeTab === 'sent' && sentRequests.length === 0) ||
        (activeTab === 'all' && proofRequests.length === 0)
      ) && (
        <Card>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              {activeTab === 'received' ? '📥' : '📤'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab === 'received' ? 'Received' : activeTab === 'sent' ? 'Sent' : ''} Proof Requests
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {activeTab === 'received' 
                ? 'Proof requests from verifiers will appear here when you receive them.'
                : activeTab === 'sent'
                ? 'Proof requests you send to others will appear here.'
                : 'No proof requests found in the system.'
              }
            </p>
            {activeTab === 'received' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">💡 What are Proof Requests?</h4>
                <p className="text-sm text-blue-700">
                  Proof requests allow verifiers to ask you to prove certain claims about yourself using your stored credentials, 
                  without revealing the actual credential data. It's a privacy-preserving way to share information.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Total Summary */}
      {proofRequests.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">🎯 Proof Request Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{proofRequests.length}</div>
              <div className="text-gray-600">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{receivedRequests.length}</div>
              <div className="text-gray-600">Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sentRequests.length}</div>
              <div className="text-gray-600">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {proofRequests.filter(req => req.state === 'verified').length}
              </div>
              <div className="text-gray-600">Verified</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Creating Proof Requests */}
      {activeTab === 'sent' && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => {
              // For now, show a simple alert. In a real app, this would open a modal
              const sampleRequest = {
                name: "Example Proof Request",
                version: "1.0",
                requested_attributes: {
                  "attr1_referent": {
                    "name": "name",
                    "restrictions": []
                  },
                  "attr2_referent": {
                    "name": "age",
                    "restrictions": []
                  }
                },
                requested_predicates: {
                  "pred1_referent": {
                    "name": "age",
                    "p_type": ">=",
                    "p_value": 18,
                    "restrictions": []
                  }
                }
              };
              
              alert(`To create a proof request, you would typically:\n\n1. Select a connection to send the request to\n2. Define what attributes you want to verify\n3. Set any predicates (like age >= 18)\n\nSample request structure:\n${JSON.stringify(sampleRequest, null, 2)}\n\nThis feature requires connection management and would be implemented with a proper form UI.`);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            ➕ Create Request
          </Button>
        </div>
      )}
    </div>
  );
};