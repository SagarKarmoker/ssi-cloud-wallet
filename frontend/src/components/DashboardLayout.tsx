import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Loading } from '../components/Loading';
import { walletService, type Wallet } from '../services';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      setWallets(response.results);
      setError(null);
    } catch (err) {
      setError('Failed to load wallets');
      console.error('Error loading wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { key: 'wallets', label: 'Wallets', icon: '🏦', path: '/' },
    { key: 'connections', label: 'Connections', icon: '🔗', path: '/connections' },
    { key: 'credentials', label: 'Credentials', icon: '📄', path: '/credentials' },
    { key: 'proofs', label: 'Proof Requests', icon: '🎯', path: '/proofs' },
    { key: 'dids', label: 'DIDs', icon: '🆔', path: '/dids' }
  ];

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
            
            <div className="flex items-center space-x-4">
              {/* Wallet Selector */}
              {wallets.length > 0 && (
                <div className="flex items-center space-x-2">
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
                      const displayName = wallet.wallet_name || 
                                         wallet.settings?.['wallet.name'] || 
                                         wallet.settings?.['default_label'] || 
                                         wallet.label || 
                                         wallet.wallet_id;
                      
                      return (
                        <option key={wallet.wallet_id} value={wallet.wallet_id} className="text-gray-900">
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">Welcome, {user?.fullName}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
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
                {navigation.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.key}>
                      <Link
                        to={item.path}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-900'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
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
            <Outlet context={{ selectedWallet, wallets, setSelectedWallet }} />
          </div>
        </div>
      </div>
    </div>
  );
}