import { useState, useEffect } from 'react';
import { Button, Card, Loading, Alert } from './components';
import { WalletPage } from './pages/WalletPage';
import { TestApiPage } from './pages/TestApiPage';
import { ConnectionPage } from './pages/ConnectionPage';
import { CredentialPage } from './pages/CredentialPage';
import { ProofPage } from './pages/ProofPage';
import { DIDPage } from './pages/DIDPage';
import { walletService, type Wallet } from './services';

type Page = 'wallets' | 'test' | 'connections' | 'credentials' | 'proofs' | 'dids';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('wallets');
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const response = await walletService.listWallets();
      console.log('Wallet API response:', response);
      console.log('First wallet structure:', response.results[0]);
      setWallets(response.results);
      setError(null);
    } catch (err) {
      setError('Failed to load wallets');
      console.error('Error loading wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigation = [
    { key: 'wallets', label: 'Wallets', icon: '🏦' },
    { key: 'test', label: 'API Test', icon: '🧪' },
    { key: 'connections', label: 'Connections', icon: '🔗' },
    { key: 'credentials', label: 'Credentials', icon: '📄' },
    { key: 'proofs', label: 'Proofs', icon: '✅' },
    { key: 'dids', label: 'DIDs', icon: '🆔' }
  ];

  const renderPage = () => {
    if (currentPage === 'wallets') {
      return <WalletPage />;
    }

    if (currentPage === 'test') {
      return <TestApiPage />;
    }

    if (!selectedWallet) {
      return (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">Please select a wallet first</p>
            <Button 
              className="mt-4"
              onClick={() => setCurrentPage('wallets')}
            >
              Go to Wallets
            </Button>
          </div>
        </Card>
      );
    }

    switch (currentPage) {
      case 'connections':
        return <ConnectionPage walletId={selectedWallet.wallet_id} />;
      case 'credentials':
        return <CredentialPage walletId={selectedWallet.wallet_id} />;
      case 'proofs':
        return <ProofPage walletId={selectedWallet.wallet_id} />;
      case 'dids':
        return <DIDPage walletId={selectedWallet.wallet_id} />;
      default:
        return <WalletPage />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading application..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SSI Cloud Wallet</h1>
            </div>
            
            {/* Wallet Selector */}
            {wallets.length > 0 && (
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Wallet:</label>
                <select
                  value={selectedWallet?.wallet_id || ''}
                  onChange={(e) => {
                    const wallet = wallets.find(w => w.wallet_id === e.target.value);
                    setSelectedWallet(wallet || null);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-48"
                >
                  <option value="" className="text-gray-900">Select a wallet</option>
                  {wallets.map((wallet) => {
                    // Try different possible property names from the API response
                    const displayName = wallet.wallet_name || 
                                       wallet.settings?.['wallet.name'] || 
                                       wallet.settings?.['default_label'] || 
                                       wallet.label || 
                                       wallet.wallet_id;
                    
                    console.log('Wallet display name:', displayName, 'for wallet:', wallet);
                    
                    return (
                      <option key={wallet.wallet_id} value={wallet.wallet_id} className="text-gray-900">
                        {displayName}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar Navigation */}
          <nav className="w-64 mr-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Navigation</h2>
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.key}>
                    <button
                      onClick={() => setCurrentPage(item.key as Page)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === item.key
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1">
            {error && (
              <div className="mb-6">
                <Alert
                  type="error"
                  message={error}
                  onClose={() => setError(null)}
                />
              </div>
            )}
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
