import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Loading, Alert, Modal } from '../components';
import { 
  didService, 
  type DID, 
  type CreateSchemaRequest,
  type CreateCredentialDefinitionRequest 
} from '../services';

interface DIDPageProps {
  walletId: string;
}

export const DIDPage: React.FC<DIDPageProps> = ({ walletId }) => {
  const [dids, setDIDs] = useState<DID[]>([]);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [credDefs, setCredDefs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showCredDefModal, setShowCredDefModal] = useState(false);
  const [schemaForm, setSchemaForm] = useState<CreateSchemaRequest>({
    schema_name: '',
    schema_version: '1.0',
    attributes: []
  });
  const [credDefForm, setCredDefForm] = useState<CreateCredentialDefinitionRequest>({
    schema_id: '',
    tag: 'default'
  });
  const [attributeInput, setAttributeInput] = useState('');

  useEffect(() => {
    if (walletId) {
      loadData();
    }
  }, [walletId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [didsResponse, schemasResponse, credDefsResponse] = await Promise.all([
        didService.getDIDs(walletId),
        didService.getSchemas(walletId),
        didService.getCredentialDefinitions(walletId)
      ]);
      
      setDIDs(didsResponse.results);
      setSchemas(schemasResponse.schema_ids);
      setCredDefs(credDefsResponse.credential_definition_ids);
      setError(null);
    } catch (err) {
      setError('Failed to load DID data');
      console.error('Error loading DID data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDID = async () => {
    try {
      await didService.createDID(walletId);
      await loadData();
    } catch (err) {
      setError('Failed to create DID');
      console.error('Error creating DID:', err);
    }
  };

  const handleSetPublicDID = async (did: string) => {
    try {
      await didService.setPublicDID(walletId, did);
      await loadData();
    } catch (err) {
      setError('Failed to set public DID');
      console.error('Error setting public DID:', err);
    }
  };

  const handleCreateSchema = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await didService.createSchema(walletId, schemaForm);
      setShowSchemaModal(false);
      setSchemaForm({ schema_name: '', schema_version: '1.0', attributes: [] });
      await loadData();
    } catch (err) {
      setError('Failed to create schema');
      console.error('Error creating schema:', err);
    }
  };

  const handleCreateCredDef = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await didService.createCredentialDefinition(walletId, credDefForm);
      setShowCredDefModal(false);
      setCredDefForm({ schema_id: '', tag: 'default' });
      await loadData();
    } catch (err) {
      setError('Failed to create credential definition');
      console.error('Error creating credential definition:', err);
    }
  };

  const addAttribute = () => {
    if (attributeInput.trim() && !schemaForm.attributes.includes(attributeInput.trim())) {
      setSchemaForm(prev => ({
        ...prev,
        attributes: [...prev.attributes, attributeInput.trim()]
      }));
      setAttributeInput('');
    }
  };

  const removeAttribute = (index: number) => {
    setSchemaForm(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" text="Loading DID data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">DID Management</h1>
        <div className="flex space-x-2">
          <Button onClick={handleCreateDID}>
            Create DID
          </Button>
          <Button variant="outline" onClick={() => setShowSchemaModal(true)}>
            Create Schema
          </Button>
          <Button variant="outline" onClick={() => setShowCredDefModal(true)}>
            Create Cred Def
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

      {/* DIDs Section */}
      <Card title="DIDs" className="mb-6">
        {dids.length > 0 ? (
          <div className="space-y-3">
            {dids.map((did) => (
              <div key={did.did} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-mono text-sm">{did.did}</p>
                  <p className="text-xs text-gray-500">
                    Method: {did.method} | Posture: {did.posture} | Key Type: {did.key_type}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {did.posture !== 'public' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetPublicDID(did.did)}
                    >
                      Set Public
                    </Button>
                  )}
                  {did.posture === 'public' && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Public
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No DIDs created yet.</p>
        )}
      </Card>

      {/* Schemas Section */}
      <Card title="Schemas" className="mb-6">
        {schemas.length > 0 ? (
          <div className="space-y-2">
            {schemas.map((schemaId) => (
              <div key={schemaId} className="p-2 bg-gray-50 rounded">
                <p className="font-mono text-sm">{schemaId}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No schemas created yet.</p>
        )}
      </Card>

      {/* Credential Definitions Section */}
      <Card title="Credential Definitions">
        {credDefs.length > 0 ? (
          <div className="space-y-2">
            {credDefs.map((credDefId) => (
              <div key={credDefId} className="p-2 bg-gray-50 rounded">
                <p className="font-mono text-sm">{credDefId}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No credential definitions created yet.</p>
        )}
      </Card>

      {/* Create Schema Modal */}
      <Modal
        isOpen={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
        title="Create Schema"
      >
        <form onSubmit={handleCreateSchema} className="space-y-4">
          <Input
            label="Schema Name"
            value={schemaForm.schema_name}
            onChange={(e) => setSchemaForm(prev => ({ ...prev, schema_name: e.target.value }))}
            placeholder="Enter schema name"
            required
          />
          <Input
            label="Schema Version"
            value={schemaForm.schema_version}
            onChange={(e) => setSchemaForm(prev => ({ ...prev, schema_version: e.target.value }))}
            placeholder="1.0"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attributes
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={attributeInput}
                onChange={(e) => setAttributeInput(e.target.value)}
                placeholder="Enter attribute name"
                className="flex-1"
              />
              <Button type="button" onClick={addAttribute}>
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {schemaForm.attributes.map((attr, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>{attr}</span>
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSchemaModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Schema
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Credential Definition Modal */}
      <Modal
        isOpen={showCredDefModal}
        onClose={() => setShowCredDefModal(false)}
        title="Create Credential Definition"
      >
        <form onSubmit={handleCreateCredDef} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schema ID
            </label>
            <select
              value={credDefForm.schema_id}
              onChange={(e) => setCredDefForm(prev => ({ ...prev, schema_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select a schema</option>
              {schemas.map((schemaId) => (
                <option key={schemaId} value={schemaId}>
                  {schemaId}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Tag"
            value={credDefForm.tag}
            onChange={(e) => setCredDefForm(prev => ({ ...prev, tag: e.target.value }))}
            placeholder="default"
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCredDefModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Credential Definition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};