import React from 'react';

interface DebugCredentialProps {
  credential: any;
  type: 'exchange' | 'stored';
}

export const DebugCredential: React.FC<DebugCredentialProps> = ({ credential, type }) => {
  return (
    <details className="border p-2 rounded mb-2 text-xs">
      <summary className="font-bold cursor-pointer">
        Debug {type} credential: {credential?.credential_id || credential?.credential_exchange_id || 'Unknown ID'}
      </summary>
      <pre className="mt-2 bg-gray-50 p-2 rounded overflow-auto">
        {JSON.stringify(credential, null, 2)}
      </pre>
    </details>
  );
};