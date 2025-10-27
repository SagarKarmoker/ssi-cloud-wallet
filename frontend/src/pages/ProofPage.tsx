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
  
  // New states for credential selection modal
  const [showCredentialSelector, setShowCredentialSelector] = useState(false);
  const [selectedProofRequest, setSelectedProofRequest] = useState<any>(null);
  const [availableCredentials, setAvailableCredentials] = useState<any[]>([]);
  const [selectedCredentials, setSelectedCredentials] = useState<Record<string, string>>({});

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

  // Detect if a presentation request is DIF/JSON-LD based
  const isDifPresentationRequest = (record: any) => {
    const formats = record?.pres_request?.formats || record?.presentation_request?.formats || [];
    if (Array.isArray(formats) && formats.some((f: any) => `${f.format || ''}`.toLowerCase().includes('dif'))) {
      return true;
    }
    const attachments = record?.pres_request?.['request_presentations~attach'] || record?.presentation_request?.['request_presentations~attach'] || [];
    if (attachments.length > 0) {
      const data = attachments[0]?.data;
      const json = data?.json;
      if (json && (json.presentation_definition || json.input_descriptors)) return true;
      if (data?.base64) {
        try {
          const decoded = atob(data.base64);
          const parsed = JSON.parse(decoded);
          if (parsed.presentation_definition || parsed.input_descriptors) return true;
        } catch {}
      }
    }
    return false;
  };

  // Extract presentation definition (DIF) from record
  const extractPresentationDefinition = (record: any) => {
    const attachments = record?.pres_request?.['request_presentations~attach'] || record?.presentation_request?.['request_presentations~attach'] || [];
    if (attachments.length > 0) {
      const data = attachments[0]?.data;
      if (data?.json && (data.json.presentation_definition || data.json.input_descriptors)) {
        return data.json.presentation_definition || { input_descriptors: data.json.input_descriptors, id: data.json.id };
      }
      if (data?.base64) {
        try {
          const decoded = atob(data.base64);
          const parsed = JSON.parse(decoded);
          if (parsed.presentation_definition || parsed.input_descriptors) {
            return parsed.presentation_definition || { input_descriptors: parsed.input_descriptors, id: parsed.id };
          }
        } catch {}
      }
    }
    return null;
  };

  // Manual JSON-LD (DIF) credential matching
  const attemptManualJsonLdMatching = (record: any, storedCredentials: any[]) => {
    const presentationDefinition = extractPresentationDefinition(record);
    console.log('🔍 JSON-LD Presentation Definition:', presentationDefinition);
    
    if (!presentationDefinition || !Array.isArray(presentationDefinition.input_descriptors)) {
      console.error('❌ Invalid or missing presentation definition');
      return { canFulfill: false, presentation: {}, matchingDetails: [] };
    }

    const mappings: { input_descriptor_id: string; record_id: string }[] = [];
    const matchingDetails: any[] = [];

    console.log('📦 Stored W3C credentials to match:', storedCredentials);
    console.log('📦 Raw credentials structure:', JSON.stringify(storedCredentials, null, 2));

    // Normalize stored W3C credentials to extract record_id and helpful metadata
    const normalizeCred = (cred: any, index: number) => {
      console.log(`\n🔍 Processing credential ${index + 1}:`, cred);
      
      // W3C credentials structure from ACA-Py can be:
      // Option 1: { record_id, cred_value: { credential: {...} } }
      // Option 2: Direct credential object
      const recordId = cred.record_id || cred.credential_id || cred.referent || cred.cred_id;
      
      // Try different paths to find the actual credential
      let credential = cred;
      if (cred.cred_value?.credential) {
        credential = cred.cred_value.credential;
      } else if (cred.cred_value) {
        credential = cred.cred_value;
      } else if (cred.credential) {
        credential = cred.credential;
      }
      
      const type = credential.type || credential['@type'] || [];
      const subject = credential.credentialSubject || credential['@credentialSubject'] || {};
      
      console.log(`  📄 Extracted data for credential ${index + 1}:`, {
        recordId,
        type,
        subject,
        subjectKeys: Object.keys(subject),
        hasCredValue: !!cred.cred_value,
        credValueKeys: cred.cred_value ? Object.keys(cred.cred_value) : [],
        topLevelKeys: Object.keys(cred)
      });
      
      return { recordId, type, subject, credential, raw: cred };
    };

    const normalizedCreds = storedCredentials.map(normalizeCred);
    
    console.log(`✅ Normalized ${normalizedCreds.length} W3C credentials`);

    presentationDefinition.input_descriptors.forEach((descriptor: any, index: number) => {
      const id = descriptor.id || `input-${index + 1}`;
      const fields = descriptor.constraints?.fields || [];
      const schemaList = descriptor.schema || descriptor.schemas || [];
      const schemaUris = Array.isArray(schemaList)
        ? schemaList.map((s: any) => s.uri || s.id || s)
        : (schemaList?.uri ? [schemaList.uri] : []);

      console.log(`\n🔍 Looking for match for input descriptor "${id}":`, {
        schemaUris,
        fieldsCount: fields.length,
        fields
      });

      const matches = normalizedCreds.find((cred) => {
        console.log(`  🔍 Trying to match credential:`, {
          recordId: cred.recordId,
          type: cred.type,
          subjectKeys: Object.keys(cred.subject)
        });

        // Try schema/type matching first
        if (schemaUris.length > 0 && Array.isArray(cred.type)) {
          const typeSet = new Set(cred.type.map((t: any) => `${t}`.toLowerCase()));
          const schemaMatch = schemaUris.some((uri: string) => 
            typeSet.has(`${uri}`.toLowerCase()) || 
            `${uri}`.toLowerCase().includes('verifiablecredential')
          );
          if (schemaMatch) {
            console.log(`  ✅ Type match found for ${id}: ${cred.type.join(', ')}`);
            return true;
          }
        }
        
        // Then check constraints.fields paths roughly (credentialSubject keys)
        if (fields.length > 0) {
          if (!cred.subject || typeof cred.subject !== 'object' || Object.keys(cred.subject).length === 0) {
            console.log(`  ⚠️ Credential has no valid subject, skipping field checks`);
          } else {
            const subjectKeys = new Set(Object.keys(cred.subject));
            console.log(`  🔍 Checking ${fields.length} fields against subject keys:`, Array.from(subjectKeys));
            
            const requiredOk = fields.every((f: any) => {
              const pathArr = Array.isArray(f.path) ? f.path : [f.path];
              console.log(`    🔍 Checking field paths:`, pathArr);
              
              // Check simple $.credentialSubject.<attr> paths
              const matched = pathArr.some((p: string) => {
                // Try different path patterns
                const patterns = [
                  /\$\.credentialSubject\.(\w+)/,           // $.credentialSubject.givenName
                  /credentialSubject\.(\w+)/,                // credentialSubject.givenName
                  /^(\w+)$/                                   // givenName (direct property)
                ];
                
                for (const pattern of patterns) {
                  const m = p.match(pattern);
                  if (m && subjectKeys.has(m[1])) {
                    console.log(`    ✅ Field match: ${m[1]} (pattern: ${pattern})`);
                    return true;
                  }
                }
                return false;
              });
              
              if (!matched) {
                console.log(`    ❌ No match for field paths:`, pathArr);
              }
              return matched;
            });
            
            if (requiredOk) {
              console.log(`  ✅ All ${fields.length} fields matched for ${id}`);
              return true;
            } else {
              console.log(`  ❌ Not all fields matched for ${id}`);
            }
          }
        }
        
        // Fallback: if no specific constraints, accept first available VC with record_id
        if (schemaUris.length === 0 && fields.length === 0 && cred.recordId) {
          console.log(`  ⚠️ Using fallback match (no constraints) for ${id}`);
          return true;
        }
        
        console.log(`  ❌ No match criteria satisfied for this credential`);
        return false;
      });

      if (matches && matches.recordId) {
        mappings.push({ input_descriptor_id: id, record_id: matches.recordId });
        matchingDetails.push({ 
          inputDescriptorId: id, 
          recordId: matches.recordId, 
          type: matches.type,
          subjectKeys: Object.keys(matches.subject)
        });
        console.log(`  ✅ Matched descriptor "${id}" to record_id: ${matches.recordId}`);
      } else {
        console.log(`  ❌ No match found for descriptor "${id}"`);
      }
    });

    const canFulfill = mappings.length === presentationDefinition.input_descriptors.length;
    
    // Build presentation spec with record_ids as an object (mapping), not array
    // Format: { "input_descriptor_id": "record_id" }
    const recordIdsMapping: Record<string, string> = {};
    mappings.forEach(m => {
      recordIdsMapping[m.input_descriptor_id] = m.record_id;
    });
    
    const presentation = { 
      dif: { 
        record_ids: recordIdsMapping 
      } 
    };

    console.log('\n📋 JSON-LD matching summary:');
    console.log(`  Required descriptors: ${presentationDefinition.input_descriptors.length}`);
    console.log(`  Matched descriptors: ${mappings.length}`);
    console.log(`  Can fulfill: ${canFulfill ? '✅ YES' : '❌ NO'}`);
    console.log('📋 Matching details:', matchingDetails);
    console.log('🧾 Built DIF presentation spec:', presentation);

    return { canFulfill, presentation, matchingDetails };
  };

  const openCredentialSelector = async (presentationExchangeId: string) => {
    try {
      setLoading(true);
      
      // Get the full presentation record
      const fullPresentationRecord = await proofService.getPresentationExchangeRecord(walletId, presentationExchangeId);
      console.log('📦 Full presentation exchange record:', fullPresentationRecord);
      
      // Check if it's DIF or Indy
      const isDif = isDifPresentationRequest(fullPresentationRecord);
      console.log(`🔍 Proof type detected: ${isDif ? 'DIF/JSON-LD' : 'Indy/AnonCreds'}`);
      
      let credentials: any[] = [];
      let matches: any = {};
      
      if (isDif) {
        // Load W3C credentials
        const w3cCredentialsResponse = await credentialService.getW3cCredentials(walletId);
        credentials = w3cCredentialsResponse.results || w3cCredentialsResponse || [];
        
        console.log(`📋 Loaded ${credentials.length} W3C credentials:`, credentials);
        
        // Get matching details
        const matchResult = attemptManualJsonLdMatching(fullPresentationRecord, credentials);
        matches = matchResult.matchingDetails || [];
        
        console.log('✅ DIF matching result:', {
          canFulfill: matchResult.canFulfill,
          matchesCount: Array.isArray(matches) ? matches.length : 0,
          matches
        });
      } else {
        // Load Indy credentials
        const storedCredentials = await credentialService.getCredentials(walletId);
        credentials = storedCredentials.results || storedCredentials || [];
        
        console.log(`📋 Loaded ${credentials.length} Indy credentials:`, credentials);
        
        // Get matching details
        const matchResult = attemptManualCredentialMatching(fullPresentationRecord, credentials);
        matches = matchResult.matchingDetails || [];
        
        console.log('✅ Indy matching result:', {
          canFulfill: matchResult.canFulfill,
          matchesCount: Array.isArray(matches) ? matches.length : 0,
          matches
        });
      }
      
      // Set state for modal
      setSelectedProofRequest(fullPresentationRecord);
      setAvailableCredentials(credentials);
      
      // Initialize selected credentials with first match for each requirement
      const initialSelection: Record<string, string> = {};
      if (Array.isArray(matches)) {
        matches.forEach((match: any) => {
          if (match.credId && match.referent) {
            initialSelection[match.referent] = match.credId;
          } else if (match.recordId && match.inputDescriptorId) {
            initialSelection[match.inputDescriptorId] = match.recordId;
          }
        });
      }
      setSelectedCredentials(initialSelection);
      
      console.log('🎯 Initial credential selection:', initialSelection);
      
      setShowCredentialSelector(true);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading credentials for selection:', err);
      setError('Failed to load credentials for selection');
      setLoading(false);
    }
  };

  const sendPresentationWithSelectedCredentials = async () => {
    if (!selectedProofRequest) return;
    
    try {
      setLoading(true);
      const presentationExchangeId = getExchangeId(selectedProofRequest);
      const isDif = isDifPresentationRequest(selectedProofRequest);
      
      console.log('🚀 Building presentation to send...');
      console.log('  - Proof type:', isDif ? 'DIF/JSON-LD' : 'Indy/AnonCreds');
      console.log('  - Exchange ID:', presentationExchangeId);
      console.log('  - Selected credentials:', selectedCredentials);
      console.log('  - Full proof request:', selectedProofRequest);
      
      let presentationSpec: any;
      
      if (isDif) {
        console.log('=== DIF PRESENTATION DEBUGGING ===');
        console.log('Selected credentials (record_ids mapping):', selectedCredentials);
        console.log('Number of selected credentials:', Object.keys(selectedCredentials).length);
        
        // Check if selectedCredentials is empty
        if (Object.keys(selectedCredentials).length === 0) {
          console.error('❌ ERROR: No credentials selected! Cannot build presentation.');
          setError('❌ Please select at least one credential to send the presentation.');
          setLoading(false);
          return;
        }
        
        // Log each selected credential mapping
        Object.entries(selectedCredentials).forEach(([descriptorId, recordId]) => {
          console.log(`  Input Descriptor "${descriptorId}" → Record ID: "${recordId}"`);
        });
        
        // Get the actual W3C credentials to verify they exist
        const w3cCredentialsResponse = await credentialService.getW3cCredentials(walletId);
        const w3cCredentials = w3cCredentialsResponse.results || w3cCredentialsResponse || [];
        
        console.log(`=== FULL W3C CREDENTIALS STRUCTURE (${w3cCredentials.length} total) ===`);
        w3cCredentials.forEach((c: any, index: number) => {
          console.log(`\n📋 Credential #${index + 1}:`);
          console.log('  ALL PROPERTIES:', Object.keys(c));
          console.log('  record_id:', c.record_id);
          console.log('  credential_id:', c.credential_id);
          console.log('  cred_id:', c.cred_id);
          console.log('  id:', c.id);
          console.log('  type:', c.type);
          console.log('  types:', c.types);
          console.log('  expanded_types:', c.expanded_types);
          console.log('  issuer:', c.issuer);
          console.log('  issuer_id:', c.issuer_id);
          console.log('  subject_ids:', c.subject_ids);
          console.log('  credential:', c.credential ? 'EXISTS' : 'undefined');
          console.log('  cred:', c.cred ? 'EXISTS' : 'undefined');
          console.log('  Full object:', c);
        });
        
        console.log('\n=== CREDENTIAL ID MAPPING ===');
        console.log('Available W3C credentials in wallet:', w3cCredentials.map((c: any) => ({
          record_id: c.record_id,
          credential_id: c.credential_id,
          cred_id: c.cred_id,
          id: c.id,
          type: c.type,
          issuer: c.issuer
        })));
        
        // Verify that selected record IDs exist in the wallet
        Object.entries(selectedCredentials).forEach(([descriptorId, recordId]) => {
          const credExists = w3cCredentials.find((c: any) => 
            c.record_id === recordId || c.credential_id === recordId || c.cred_id === recordId || c.id === recordId
          );
          if (credExists) {
            console.log(`✅ Credential for "${descriptorId}" exists in wallet: ${recordId}`);
          } else {
            console.error(`❌ Credential for "${descriptorId}" NOT FOUND in wallet: ${recordId}`);
            console.error('Available record IDs:', w3cCredentials.map((c: any) => c.record_id || c.credential_id || c.id));
          }
        });
        
        // Build DIF presentation with selected credentials
        presentationSpec = {
          dif: {
            record_ids: selectedCredentials
          }
        };
        
        console.log('📋 Built DIF presentation spec:', JSON.stringify(presentationSpec, null, 2));
        console.warn('⚠️ KNOWN LIMITATION: ACA-Py may not properly include W3C credentials in DIF presentations.');
        console.warn('⚠️ The presentation might be sent empty even though you selected credentials.');
        console.warn('⚠️ This is a known issue with ACA-Py DIF/JSON-LD implementation.');
        console.warn('⚠️ See: https://github.com/hyperledger/aries-cloudagent-python/issues');
        console.warn('⚠️ TROUBLESHOOTING TIPS:');
        console.warn('   1. Check if the record_ids above match the actual credential IDs in your wallet');
        console.warn('   2. Verify ACA-Py version supports DIF Presentation Exchange v2');
        console.warn('   3. Check ACA-Py logs for detailed error messages');
        console.warn('   4. Consider using Indy/AnonCreds format instead if possible');
      } else {
        // Build Indy presentation with selected credentials
        const presentationRequest = extractPresentationRequest(selectedProofRequest);
        const requestedAttributes = presentationRequest?.requested_attributes || {};
        const requestedPredicates = presentationRequest?.requested_predicates || {};
        
        presentationSpec = {
          indy: {
            requested_attributes: {},
            requested_predicates: {},
            self_attested_attributes: {}
          }
        };
        
        // Map selected credentials to requested attributes
        Object.keys(requestedAttributes).forEach((attrReferent) => {
          if (selectedCredentials[attrReferent]) {
            presentationSpec.indy.requested_attributes[attrReferent] = {
              cred_id: selectedCredentials[attrReferent],
              revealed: true
            };
          }
        });
        
        // Map selected credentials to requested predicates
        Object.keys(requestedPredicates).forEach((predReferent) => {
          if (selectedCredentials[predReferent]) {
            presentationSpec.indy.requested_predicates[predReferent] = {
              cred_id: selectedCredentials[predReferent]
            };
          }
        });
      }
      
      console.log('🚀 Sending presentation with selected credentials:', presentationSpec);
      console.log('📤 API call: POST /proof/:walletId/presentation-exchange/:presExId/send-presentation');
      
      await proofService.sendPresentation(walletId, presentationExchangeId, presentationSpec);
      
      console.log('✅ Presentation sent successfully!');
      
      // Close modal immediately after successful send
      setShowCredentialSelector(false);
      setLoading(false);
      
      // Show success message
      if (isDif) {
        setError('⚠️ DIF presentation sent. Note: ACA-Py may send it empty due to known limitations. Check logs for "abandoned" status.');
      } else {
        setError('✅ Proof presentation sent successfully!');
      }
      
      // Reload proof requests to update UI
      setTimeout(async () => {
        await loadProofRequests();
      }, 1500);
    } catch (err: any) {
      console.error('❌ Error sending presentation:', err);
      console.error('❌ Error response:', err.response?.data);
      
      let errorMessage = `Failed to send presentation: ${err.response?.data?.message || err.message}`;
      
      // Check for specific known errors and provide helpful messages
      if (errorMessage.includes('Unknown DID')) {
        const didMatch = errorMessage.match(/did:[a-z]+:[A-Za-z0-9]+/);
        const did = didMatch ? didMatch[0] : 'unknown';
        errorMessage = `❌ DID Resolution Error: Alice's ACA-Py cannot resolve ${did}.\n\n` +
                      `🔧 FIX: Add this parameter to Alice's ACA-Py startup:\n` +
                      `--endpoint-resolver universal https://dev.uniresolver.io/1.0/identifiers/\n\n` +
                      `See FIXING_UNKNOWN_DID_ERROR.md for detailed instructions.`;
      } else if (errorMessage.includes('record_ids')) {
        errorMessage = `❌ Credential ID Error: ${errorMessage}\n\n` +
                      `🔧 FIX: Check browser console for credential ID debugging information.`;
      }
      
      setError(errorMessage);
      setLoading(false);
      // Keep modal open on error so user can see what went wrong and try again
    }
  };

  const extractPresentationRequest = (proofRequest: any) => {
    console.log('🔍 Extracting presentation request from:', proofRequest);
    
    // Try to get the base request object
    let presentationRequest = proofRequest.presentation_request || 
                             proofRequest.pres_request || 
                             proofRequest.proof_request || 
                             proofRequest.request || 
                             proofRequest;
    
    // Check if we need to extract from by_format (preferred for DIF)
    if (proofRequest.by_format?.pres_request?.dif) {
      console.log('📋 Found DIF format in by_format');
      return proofRequest.by_format.pres_request.dif;
    }
    
    if (proofRequest.by_format?.pres_request?.indy) {
      console.log('📋 Found Indy format in by_format');
      return proofRequest.by_format.pres_request.indy;
    }
    
    // Check for attachments in pres_request
    if (proofRequest.pres_request && proofRequest.pres_request['request_presentations~attach']) {
      const attachments = proofRequest.pres_request['request_presentations~attach'];
      console.log('📎 Found request_presentations~attach:', attachments);
      
      if (Array.isArray(attachments) && attachments.length > 0) {
        const attachment = attachments[0];
        
        // Try base64 first
        if (attachment.data && attachment.data.base64) {
          try {
            const decodedData = atob(attachment.data.base64);
            const parsed = JSON.parse(decodedData);
            console.log('✅ Decoded base64 attachment:', parsed);
            return parsed;
          } catch (e) {
            console.error('❌ Failed to decode base64 attachment:', e);
          }
        }
        
        // Try JSON format
        if (attachment.data && attachment.data.json) {
          console.log('✅ Found JSON attachment:', attachment.data.json);
          return attachment.data.json;
        }
      }
    }
    
    console.log('📄 Using presentation request as-is:', presentationRequest);
    return presentationRequest;
  };

  const handlePresentProof = async (presentationExchangeId: string) => {
    try {
      // Get the full presentation record first to detect format
      const fullPresentationRecord = await proofService.getPresentationExchangeRecord(walletId, presentationExchangeId);
      console.log('Full presentation exchange record:', fullPresentationRecord);

      // If the request is DIF/JSON-LD, build and send a DIF presentation
      if (isDifPresentationRequest(fullPresentationRecord)) {
        console.log('🧩 Detected DIF/JSON-LD proof request. Fetching W3C credentials...');
        
        // Load W3C/JSON-LD credentials specifically for DIF proof requests
        const w3cCredentialsResponse = await credentialService.getW3cCredentials(walletId);
        console.log('W3C/JSON-LD credentials:', w3cCredentialsResponse);
        
        const w3cCredentials = w3cCredentialsResponse.results || w3cCredentialsResponse || [];
        
        if (!w3cCredentials || w3cCredentials.length === 0) {
          setError('❌ No W3C/JSON-LD credentials found in wallet. Cannot fulfill this proof request.');
          console.error('No W3C credentials available for JSON-LD proof request');
          return;
        }

        const manualJsonLd = attemptManualJsonLdMatching(
          fullPresentationRecord,
          w3cCredentials
        );

        if (!manualJsonLd.canFulfill) {
          setError('❌ Unable to satisfy JSON-LD presentation definition with your stored credentials. Check console for details.');
          return;
        }

        try {
          console.log('🚀 Sending DIF presentation:', JSON.stringify(manualJsonLd.presentation, null, 2));
          const sendResult = await proofService.sendPresentation(walletId, presentationExchangeId, manualJsonLd.presentation);
          console.log('✅ JSON-LD presentation sent. Result:', sendResult);
          
          // Warning about known ACA-Py limitation
          console.warn('⚠️ KNOWN ISSUE: ACA-Py may not properly include credentials in DIF presentations using record_ids format.');
          console.warn('⚠️ The presentation may be sent but arrive empty at the verifier.');
          console.warn('⚠️ This is a limitation of ACA-Py\'s DIF/JSON-LD implementation, not this application.');
          console.warn('⚠️ For production use, consider using Indy AnonCreds instead.');
          
          setError('⚠️ JSON-LD presentation sent, but may arrive empty due to ACA-Py limitations. Use Indy proofs for production.');
          setTimeout(async () => { await loadProofRequests(); }, 3000);
          return;
        } catch (difErr: any) {
          console.error('❌ JSON-LD presentation failed:', difErr);
          console.error('❌ API response:', difErr.response?.data);
          setError('❌ Failed to send JSON-LD presentation. See console for details.');
          return;
        }
      }

      // Indy path: use available credentials endpoint
      console.log('Getting credentials for presentation request:', presentationExchangeId);
      
      // Load stored Indy credentials from wallet
      const actualStoredCredentials = await credentialService.getCredentials(walletId);
      console.log('Stored Indy credentials:', actualStoredCredentials);
      
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
          // (already fetched above as actualStoredCredentials)
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
              type: cred.type,
              attributes: Object.keys(cred.attrs || cred.attributes || cred.credential?.credentialSubject || {}),
              attribute_values: cred.attrs || cred.attributes || cred.credential?.credentialSubject
            });
          });
          
          if (totalStoredCredentials === 0) {
            setError('❌ You need to have stored credentials first! Go to the Credentials page and accept some credential offers, then return to respond to this proof request.');
          } else {
            setError(`❌ Schema/Attribute Mismatch: You have ${totalStoredCredentials} stored credentials, but none match what the verifier is requesting. Check the console for detailed comparison. This might be due to strict schema matching in ACA-Py.`);
            
            // Manual credential matching - check cred_def_id matches (Indy)
            console.log('🔧 ATTEMPTING MANUAL CREDENTIAL MATCHING...');
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
                setError('❌ Failed to send manual Indy presentation. See console for details.');
                return;
              }
            }
          }
        } catch (debugErr) {
          console.error('Error during mismatch analysis:', debugErr);
          setError('❌ Error during credential analysis. See console for details.');
        }
      } else {
        // If ACA-Py returned direct matches, try to build a standard indy presentation automatically
        try {
          const matchingCreds = credentialsResponse.results;
          if (Array.isArray(matchingCreds) && matchingCreds.length > 0) {
            console.log('✅ Found matching credentials. Building standard Indy presentation...');
            const presentation: any = { indy: { requested_attributes: {}, requested_predicates: {}, self_attested_attributes: {} } };
            // Naively map by referent if available
            matchingCreds.forEach((mc: any) => {
              const credId = mc.referent || mc.credential_id || mc.record_id;
              if (credId) {
                // We don't have the attribute referents from here; keep as-is or rely on ACA-Py to accept structure.
                // Since auto-building without attribute keys is risky, fall back to manual extraction from full record
              }
            });
            // Fallback to manual if above didn't populate
            const manual = attemptManualCredentialMatching(fullPresentationRecord, actualStoredCredentials.results || actualStoredCredentials || []);
            if (manual.canFulfill) {
              console.log('🚀 SENDING AUTO-BUILT INDY PRESENTATION');
              const sendRes = await proofService.sendPresentation(walletId, presentationExchangeId, manual.presentation);
              console.log('✅ Indy presentation sent. Result:', sendRes);
              setTimeout(async () => { await loadProofRequests(); }, 1500);
              return;
            }
          }
        } catch (autoErr) {
          console.error('Auto-build indy presentation failed:', autoErr);
        }
      }
    } catch (err) {
      setError('Failed to send proof presentation');
      console.error('Error sending presentation:', err);
    }
  };

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
                  onClick={() => openCredentialSelector(getExchangeId(proofRequest))}
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

      {/* Credential Selector Modal */}
      {showCredentialSelector && selectedProofRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  🔐 Select Credentials for Proof
                </h2>
                <button
                  onClick={() => setShowCredentialSelector(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Choose which credentials you want to use to fulfill this proof request
              </p>
            </div>

            <div className="p-6">
              {/* Show what's being requested */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Requested Information</h3>
                {isDifPresentationRequest(selectedProofRequest) ? (
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const presentationRequest = extractPresentationRequest(selectedProofRequest);
                      console.log('📄 Extracted presentation request for display:', presentationRequest);
                      const presentationDefinition = presentationRequest?.presentation_definition;
                      const inputDescriptors = presentationDefinition?.input_descriptors || [];
                      
                      console.log('📝 Input descriptors:', inputDescriptors);
                      
                      return inputDescriptors.map((descriptor: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded border border-blue-100">
                          <div className="font-medium text-blue-800">
                            📌 {descriptor.name || descriptor.id || `Input ${idx + 1}`}
                          </div>
                          {descriptor.purpose && (
                            <div className="text-gray-600 text-xs mt-1 italic">💬 {descriptor.purpose}</div>
                          )}
                          {descriptor.constraints?.fields && descriptor.constraints.fields.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <div className="text-xs font-semibold text-gray-700">Required fields:</div>
                              {descriptor.constraints.fields.map((f: any, fIdx: number) => {
                                const paths = Array.isArray(f.path) ? f.path : [f.path];
                                const fieldNames = paths.map((p: string) => {
                                  // Extract field name from path like $.credentialSubject.familyName
                                  const match = p.match(/\.(\w+)$/);
                                  return match ? match[1] : p;
                                }).join(', ');
                                
                                return (
                                  <div key={fIdx} className="text-xs text-gray-700 ml-3">
                                    • <span className="font-medium">{fieldNames}</span>
                                    {f.purpose && <span className="text-gray-500 ml-1">- {f.purpose}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {descriptor.schema && descriptor.schema.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              Schema: {descriptor.schema.map((s: any) => s.uri || s.id || s).join(', ')}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const presentationRequest = extractPresentationRequest(selectedProofRequest);
                      const requestedAttributes = presentationRequest?.requested_attributes || {};
                      const requestedPredicates = presentationRequest?.requested_predicates || {};
                      
                      return (
                        <>
                          {Object.entries(requestedAttributes).map(([key, attr]: [string, any]) => (
                            <div key={key} className="bg-white p-3 rounded border border-blue-100">
                              <span className="font-medium text-blue-800">
                                {attr.name || attr.names?.join(', ')}
                              </span>
                              {attr.restrictions && attr.restrictions.length > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Schema: {attr.restrictions[0].schema_name || 'Any'}
                                </div>
                              )}
                            </div>
                          ))}
                          {Object.entries(requestedPredicates).map(([key, pred]: [string, any]) => (
                            <div key={key} className="bg-white p-3 rounded border border-blue-100">
                              <span className="font-medium text-blue-800">
                                {pred.name} {pred.p_type} {pred.p_value}
                              </span>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Credential selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">✅ Available Credentials</h3>
                <p className="text-sm text-gray-600">
                  Select which credential(s) to use for this proof request. The system will attempt to match your credentials, but you can choose any credential you think is appropriate.
                </p>
                
                {availableCredentials.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-gray-600">No credentials found in your wallet</p>
                    <p className="text-sm text-gray-500 mt-2">You need to receive and store credentials before you can respond to proof requests.</p>
                  </div>
                ) : isDifPresentationRequest(selectedProofRequest) ? (
                  // DIF/JSON-LD Credential Selection
                  (() => {
                    const presentationRequest = extractPresentationRequest(selectedProofRequest);
                    const presentationDefinition = presentationRequest?.presentation_definition;
                    const inputDescriptors = presentationDefinition?.input_descriptors || [];
                    
                    return inputDescriptors.map((descriptor: any, idx: number) => {
                      const descriptorId = descriptor.id || `input-${idx}`;
                      
                      // RELAXED MATCHING: Show all W3C credentials, let user choose
                      // Only filter if there are very specific schema requirements
                      const matchingCreds = availableCredentials.filter((cred: any) => {
                        // If no schema specified, show all credentials
                        const schemas = descriptor.schema || descriptor.schemas || [];
                        if (schemas.length === 0) {
                          return true; // Show all credentials if no schema restriction
                        }
                        
                        // Try to match by type, but be lenient
                        const credTypes = cred.credential?.type || [];
                        const hasMatch = schemas.some((s: any) => {
                          const schemaUri = s.uri || s.id || s;
                          return credTypes.some((ct: string) => 
                            ct.toLowerCase().includes(schemaUri.toLowerCase()) ||
                            schemaUri.toLowerCase().includes(ct.toLowerCase())
                          );
                        });
                        
                        // If strict match fails, check if credential has any of the required fields
                        if (!hasMatch && descriptor.constraints?.fields) {
                          const credSubject = cred.credential?.credentialSubject || {};
                          const credKeys = Object.keys(credSubject).map(k => k.toLowerCase());
                          
                          // Show credential if it has some of the required fields
                          return descriptor.constraints.fields.some((field: any) => {
                            const paths = Array.isArray(field.path) ? field.path : [field.path];
                            return paths.some((path: string) => {
                              const fieldName = path.match(/\.(\w+)$/)?.[1] || path;
                              return credKeys.includes(fieldName.toLowerCase());
                            });
                          });
                        }
                        
                        return hasMatch || true; // When in doubt, show it
                      });
                      
                      return (
                        <div key={descriptorId} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">
                            {descriptor.name || descriptor.id}
                          </h4>
                          
                          {matchingCreds.length === 0 ? (
                            // FALLBACK: Show all W3C credentials if no matches found
                            <>
                              <p className="text-sm text-yellow-600 mb-2 bg-yellow-50 p-2 rounded">
                                ⚠️ No strict matches found. Showing all available credentials:
                              </p>
                              <div className="space-y-2">
                                {availableCredentials.map((cred: any) => {
                                  // Log the raw credential for debugging
                                  console.log('🔍 Raw W3C credential data:', cred);
                                  
                                  const recordId = cred.record_id || cred.id;
                                  const credential = cred.credential || cred.cred || cred;
                                  const credSubject = credential?.credentialSubject || credential?.subject || {};
                                  const credentialTypes = credential?.type || cred.type || [];
                                  const issuer = credential?.issuer || cred.issuer || 'Unknown Issuer';
                                  const issuanceDate = credential?.issuanceDate || cred.issuanceDate;
                                  
                                  console.log('📋 Extracted credential data:', {
                                    recordId,
                                    credentialTypes,
                                    issuer,
                                    issuanceDate,
                                    credSubject,
                                    hasSubject: Object.keys(credSubject).length > 0
                                  });
                                  
                                  // Get a meaningful name for the credential
                                  const credentialName = credentialTypes.filter((t: string) => t !== 'VerifiableCredential').join(', ') 
                                    || credentialTypes.join(', ') 
                                    || 'W3C Credential';
                                  
                                  return (
                                    <label
                                      key={recordId}
                                      className={`block p-3 border rounded cursor-pointer transition-colors ${
                                        selectedCredentials[descriptorId] === recordId
                                          ? 'border-green-500 bg-green-50'
                                          : 'border-gray-300 hover:border-green-300'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={descriptorId}
                                        value={recordId}
                                        checked={selectedCredentials[descriptorId] === recordId}
                                        onChange={() => {
                                          setSelectedCredentials(prev => ({
                                            ...prev,
                                            [descriptorId]: recordId
                                          }));
                                        }}
                                        className="mr-3"
                                      />
                                      <div className="inline-block w-full">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-900">
                                              🎫 {credentialName}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                              Issued by: {typeof issuer === 'string' ? issuer : issuer?.id || issuer?.name || 'Unknown'}
                                            </div>
                                            {issuanceDate && (
                                              <div className="text-xs text-gray-400">
                                                Date: {new Date(issuanceDate).toLocaleDateString()}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Credential Subject Details */}
                                        {Object.keys(credSubject).length > 0 ? (
                                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                            <div className="font-semibold text-gray-700 mb-1">📋 Attributes:</div>
                                            <div className="grid grid-cols-2 gap-1">
                                              {Object.entries(credSubject).map(([key, value]) => (
                                                <div key={key} className="text-gray-600">
                                                  <span className="font-medium">{key}:</span>{' '}
                                                  <span className="text-gray-800">
                                                    {typeof value === 'object' ? JSON.stringify(value).substring(0, 30) + '...' : String(value)}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="mt-2 p-2 bg-yellow-50 rounded text-xs border border-yellow-200">
                                            <div className="text-yellow-700">⚠️ No credential subject data available</div>
                                            <details className="mt-1">
                                              <summary className="text-xs text-gray-600 cursor-pointer">Show raw data</summary>
                                              <pre className="mt-1 text-xs text-gray-600 overflow-auto max-h-32">
                                                {JSON.stringify(cred, null, 2)}
                                              </pre>
                                            </details>
                                          </div>
                                        )}
                                        
                                        <div className="text-xs text-gray-400 mt-2">
                                          ID: {recordId?.slice(0, 30)}...
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              {matchingCreds.map((cred: any) => {
                                // Log the raw credential for debugging
                                console.log('🔍 Matching W3C credential data:', cred);
                                
                                const recordId = cred.record_id || cred.id;
                                const credential = cred.credential || cred.cred || cred;
                                const credSubject = credential?.credentialSubject || credential?.subject || {};
                                const credentialTypes = credential?.type || cred.type || [];
                                const issuer = credential?.issuer || cred.issuer || 'Unknown Issuer';
                                const issuanceDate = credential?.issuanceDate || cred.issuanceDate;
                                
                                // Get a meaningful name for the credential
                                const credentialName = credentialTypes.filter((t: string) => t !== 'VerifiableCredential').join(', ') 
                                  || credentialTypes.join(', ') 
                                  || 'W3C Credential';
                                
                                return (
                                  <label
                                    key={recordId}
                                    className={`block p-3 border rounded cursor-pointer transition-colors ${
                                      selectedCredentials[descriptorId] === recordId
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-300 hover:border-green-300'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={descriptorId}
                                      value={recordId}
                                      checked={selectedCredentials[descriptorId] === recordId}
                                      onChange={() => {
                                        setSelectedCredentials(prev => ({
                                          ...prev,
                                          [descriptorId]: recordId
                                        }));
                                      }}
                                      className="mr-3"
                                    />
                                    <div className="inline-block w-full">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="font-medium text-sm text-gray-900">
                                            ✅ {credentialName}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            Issued by: {typeof issuer === 'string' ? issuer : issuer?.id || issuer?.name || 'Unknown'}
                                          </div>
                                          {issuanceDate && (
                                            <div className="text-xs text-gray-400">
                                              Date: {new Date(issuanceDate).toLocaleDateString()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Credential Subject Details */}
                                      {Object.keys(credSubject).length > 0 ? (
                                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs border border-blue-100">
                                          <div className="font-semibold text-blue-800 mb-1">📋 Attributes:</div>
                                          <div className="grid grid-cols-2 gap-1">
                                            {Object.entries(credSubject).map(([key, value]) => (
                                              <div key={key} className="text-gray-600">
                                                <span className="font-medium">{key}:</span>{' '}
                                                <span className="text-gray-800">
                                                  {typeof value === 'object' ? JSON.stringify(value).substring(0, 30) + '...' : String(value)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs border border-yellow-200">
                                          <div className="text-yellow-700">⚠️ No credential subject data available</div>
                                          <details className="mt-1">
                                            <summary className="text-xs text-gray-600 cursor-pointer">Show raw data</summary>
                                            <pre className="mt-1 text-xs text-gray-600 overflow-auto max-h-32">
                                              {JSON.stringify(cred, null, 2)}
                                            </pre>
                                          </details>
                                        </div>
                                      )}
                                      
                                      <div className="text-xs text-gray-400 mt-2">
                                        ID: {recordId?.slice(0, 30)}...
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                ) : (
                  // Indy/AnonCreds Credential Selection
                  (() => {
                    const presentationRequest = extractPresentationRequest(selectedProofRequest);
                    const requestedAttributes = presentationRequest?.requested_attributes || {};
                    const requestedPredicates = presentationRequest?.requested_predicates || {};
                    const allRequirements: Record<string, any> = {
                      ...Object.fromEntries(Object.entries(requestedAttributes).map(([k, v]) => [k, { ...(v as any), type: 'attribute' }])),
                      ...Object.fromEntries(Object.entries(requestedPredicates).map(([k, v]) => [k, { ...(v as any), type: 'predicate' }]))
                    };
                    
                    return Object.entries(allRequirements).map(([referent, requirement]: [string, any]) => {
                      // RELAXED MATCHING: Show more credentials, let user decide
                      const matchingCreds = availableCredentials.filter((cred: any) => {
                        // If no attrs object, skip this credential
                        if (!cred.attrs || typeof cred.attrs !== 'object') {
                          return false;
                        }
                        
                        const credDefId = cred.cred_def_id;
                        const requestedCredDefId = requirement.restrictions?.[0]?.cred_def_id;
                        const credKeys = Object.keys(cred.attrs).map(k => k.toLowerCase());
                        
                        // If specific cred_def_id is required, check it first
                        // But don't exclude if restriction is missing
                        if (requestedCredDefId && credDefId !== requestedCredDefId) {
                          // Still check if credential has the required attributes as a fallback
                          const requiredNames = requirement.names || [requirement.name];
                          if (requiredNames && Array.isArray(requiredNames)) {
                            const hasAnyRequiredAttr = requiredNames.some((name: string) => 
                              credKeys.includes(name.toLowerCase())
                            );
                            if (!hasAnyRequiredAttr) {
                              return false; // Strict fail - different cred_def AND missing attributes
                            }
                            // Has required attributes, so show it even with different cred_def
                          } else {
                            return false; // Different cred_def_id and can't verify attributes
                          }
                        }
                        
                        // Check if credential has at least SOME of the required attributes
                        const requiredNames = requirement.names || [requirement.name];
                        if (requiredNames && Array.isArray(requiredNames)) {
                          // RELAXED: Show if it has at least one required attribute
                          return requiredNames.some((name: string) => 
                            credKeys.includes(name.toLowerCase())
                          );
                        } else if (requiredNames) {
                          // Single attribute requirement
                          return credKeys.includes(requiredNames.toLowerCase());
                        }
                        
                        // If no specific requirements, show all credentials
                        return true;
                      });
                      
                      return (
                        <div key={referent} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">
                            {requirement.type === 'attribute' 
                              ? `📝 ${requirement.name || requirement.names?.join(', ')}`
                              : `🔢 ${requirement.name} ${requirement.p_type} ${requirement.p_value}`
                            }
                          </h4>
                          
                          {matchingCreds.length === 0 ? (
                            // FALLBACK: Show all Indy credentials if no matches found
                            <>
                              <p className="text-sm text-yellow-600 mb-2 bg-yellow-50 p-2 rounded">
                                ⚠️ No strict matches found. Showing all available credentials - choose the closest match:
                              </p>
                              <div className="space-y-2">
                                {availableCredentials.filter((c: any) => c.attrs).map((cred: any) => {
                                  const credId = cred.referent || cred.credential_id || cred.cred_id;
                                  const schemaName = cred.schema_id?.split(':')[2] || 'Credential';
                                  const credDefId = cred.cred_def_id;
                                  
                                  return (
                                    <label
                                      key={credId}
                                      className={`block p-3 border rounded cursor-pointer transition-colors ${
                                        selectedCredentials[referent] === credId
                                          ? 'border-green-500 bg-green-50'
                                          : 'border-gray-300 hover:border-green-300'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={referent}
                                        value={credId}
                                        checked={selectedCredentials[referent] === credId}
                                        onChange={() => {
                                          setSelectedCredentials(prev => ({
                                            ...prev,
                                            [referent]: credId
                                          }));
                                        }}
                                        className="mr-3"
                                      />
                                      <div className="inline-block w-full">
                                        <div className="font-medium text-sm text-gray-900">
                                          🎫 {schemaName}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          Schema: {cred.schema_id}
                                        </div>
                                        
                                        {/* Attributes Display */}
                                        {cred.attrs && Object.keys(cred.attrs).length > 0 && (
                                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                            <div className="font-semibold text-gray-700 mb-1">📋 Attributes:</div>
                                            <div className="grid grid-cols-2 gap-1">
                                              {Object.entries(cred.attrs).map(([key, value]) => (
                                                <div key={key} className="text-gray-600">
                                                  <span className="font-medium">{key}:</span>{' '}
                                                  <span className="text-gray-800">{String(value)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        <div className="text-xs text-gray-400 mt-2">
                                          Cred ID: {credId?.slice(0, 30)}...
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          Cred Def: {credDefId?.split(':').slice(-2).join(':') || credDefId}
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              {matchingCreds.map((cred: any) => {
                                const credId = cred.referent || cred.credential_id || cred.cred_id;
                                const schemaName = cred.schema_id?.split(':')[2] || 'Credential';
                                const credDefId = cred.cred_def_id;
                                
                                return (
                                  <label
                                    key={credId}
                                    className={`block p-3 border rounded cursor-pointer transition-colors ${
                                      selectedCredentials[referent] === credId
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-300 hover:border-green-300'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={referent}
                                      value={credId}
                                      checked={selectedCredentials[referent] === credId}
                                      onChange={() => {
                                        setSelectedCredentials(prev => ({
                                          ...prev,
                                          [referent]: credId
                                        }));
                                      }}
                                      className="mr-3"
                                    />
                                    <div className="inline-block w-full">
                                      <div className="font-medium text-sm text-gray-900">
                                        ✅ {schemaName}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Schema: {cred.schema_id}
                                      </div>
                                      
                                      {/* Attributes Display */}
                                      {cred.attrs && Object.keys(cred.attrs).length > 0 && (
                                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs border border-blue-100">
                                          <div className="font-semibold text-blue-800 mb-1">📋 Attributes:</div>
                                          <div className="grid grid-cols-2 gap-1">
                                            {Object.entries(cred.attrs).map(([key, value]) => (
                                              <div key={key} className="text-gray-600">
                                                <span className="font-medium">{key}:</span>{' '}
                                                <span className="text-gray-800">{String(value)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="text-xs text-gray-400 mt-2">
                                        Cred ID: {credId?.slice(0, 30)}...
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        Cred Def: {credDefId?.split(':').slice(-2).join(':') || credDefId}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>

            {/* Footer with actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end space-x-3">
              <Button
                onClick={() => setShowCredentialSelector(false)}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={sendPresentationWithSelectedCredentials}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={loading || Object.keys(selectedCredentials).length === 0}
              >
                {loading ? 'Sending...' : '📤 Send Proof Presentation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};