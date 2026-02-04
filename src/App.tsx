import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ClaimDetail from './pages/ClaimDetail.tsx';
import MisBeneficios from './pages/MisBeneficios';
import MisPagos from './pages/MisPagos';
import NewClaim from './pages/NewClaim';
import MisDatos from './pages/MisDatos';
import AdminClaims from './pages/AdminClaims';
import AdminProducers from './pages/AdminProducers';
import AdminCompanies from './pages/AdminCompanies';
import AdminTransfers from './pages/AdminTransfers';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/benefits"
        element={
          <ProtectedRoute>
            <MisBeneficios />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <MisPagos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/claims/new"
        element={
          <ProtectedRoute>
            <NewClaim />
          </ProtectedRoute>
        }
      />

      <Route
        path="/claims/:id"
        element={
          <ProtectedRoute>
            <ClaimDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MisDatos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/claims"
        element={
          <ProtectedRoute>
            <AdminClaims />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/producers"
        element={
          <ProtectedRoute>
            <AdminProducers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies"
        element={
          <ProtectedRoute>
            <AdminCompanies />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transfers"
        element={
          <ProtectedRoute>
            <AdminTransfers />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
