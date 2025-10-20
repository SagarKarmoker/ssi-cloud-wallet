import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WalletPage } from './pages/WalletPage';
import { ConnectionPageWrapper } from './pages/ConnectionPageWrapper';
import { CredentialPageWrapper } from './pages/CredentialPageWrapper';
import { ProofPageWrapper } from './pages/ProofPageWrapper';
import { DIDPageWrapper } from './pages/DIDPageWrapper';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<WalletPage />} />
            <Route path="connections" element={<ConnectionPageWrapper />} />
            <Route path="credentials" element={<CredentialPageWrapper />} />
            <Route path="proofs" element={<ProofPageWrapper />} />
            <Route path="dids" element={<DIDPageWrapper />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
