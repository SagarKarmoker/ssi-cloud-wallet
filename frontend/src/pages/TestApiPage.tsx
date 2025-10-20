import React, { useEffect, useState } from 'react';
import { walletService } from '../services';

export const TestApiPage: React.FC = () => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('Testing API connection...');
        const response = await walletService.listWallets();
        console.log('API Response:', response);
        setWallets(response.results);
        setError(null);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Failed to connect to API');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      {loading && <p>Testing API connection...</p>}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <h3 className="text-red-800 font-medium">API Error:</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <h3 className="text-green-800 font-medium">✅ API Connected Successfully!</h3>
          <p className="text-green-600">Found {wallets.length} wallets</p>
        </div>
      )}
      
      {wallets.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Wallets:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(wallets, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};