import { useDashboardContext } from '../hooks/useDashboardContext';
import { CredentialPage } from './CredentialPage';
import { Card, Button } from '../components';

export function CredentialPageWrapper() {
  const { selectedWallet } = useDashboardContext();

  if (!selectedWallet) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-500">Please select a wallet first</p>
          <Button 
            className="mt-4"
            onClick={() => window.location.href = '/'}
          >
            Go to Wallets
          </Button>
        </div>
      </Card>
    );
  }

  return <CredentialPage walletId={selectedWallet.wallet_id} />;
}