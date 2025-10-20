import { useOutletContext } from 'react-router-dom';
import type { Wallet } from '../services';

interface DashboardContextType {
  selectedWallet: Wallet | null;
  wallets: Wallet[];
  setSelectedWallet: (wallet: Wallet | null) => void;
}

export function useDashboardContext() {
  return useOutletContext<DashboardContextType>();
}