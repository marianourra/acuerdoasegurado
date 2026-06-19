import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProducerOnlyRoute from './components/ProducerOnlyRoute';
import HomeRedirect from './components/HomeRedirect';
import ClaimDetail from './pages/ClaimDetail.tsx';
// Oculto temporalmente
// import MisBeneficios from './pages/MisBeneficios';
// import MisPagos from './pages/MisPagos';
import NewClaim from './pages/NewClaim';
import MisDatos from './pages/MisDatos';
import ProducerStatistics from './pages/ProducerStatistics';
import AdminClaims from './pages/AdminClaims';
import AdminNewClaim from './pages/AdminNewClaim';
import AdminProducers from './pages/AdminProducers';
import AdminCompanies from './pages/AdminCompanies';
import AdminFees from './pages/AdminFees';
import AdminAsistentes from './pages/AdminAsistentes';
import AssistantClaims from './pages/AssistantClaims';
import AssistantNewClaim from './pages/AssistantNewClaim';
// Oculto temporalmente
// import AdminTransfers from './pages/AdminTransfers';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProducerOnlyRoute>
              <Dashboard />
            </ProducerOnlyRoute>
          </ProtectedRoute>
        }
      />

      {/* Oculto temporalmente
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
      */}

      <Route
        path="/claims/new"
        element={
          <ProtectedRoute>
            <ProducerOnlyRoute>
              <NewClaim />
            </ProducerOnlyRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/claims/:id"
        element={
          <ProtectedRoute>
            <ProducerOnlyRoute>
              <ClaimDetail />
            </ProducerOnlyRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/statistics"
        element={
          <ProtectedRoute>
            <ProducerOnlyRoute>
              <ProducerStatistics />
            </ProducerOnlyRoute>
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
        path="/admin/claims/new"
        element={
          <ProtectedRoute>
            <AdminNewClaim />
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
        path="/admin/asistentes"
        element={
          <ProtectedRoute>
            <AdminAsistentes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fees"
        element={
          <ProtectedRoute>
            <AdminFees />
          </ProtectedRoute>
        }
      />

      <Route
        path="/asistente/claims"
        element={
          <ProtectedRoute>
            <AssistantClaims />
          </ProtectedRoute>
        }
      />
      <Route
        path="/asistente/claims/new"
        element={
          <ProtectedRoute>
            <AssistantNewClaim />
          </ProtectedRoute>
        }
      />
      {/* Oculto temporalmente
      <Route
        path="/admin/transfers"
        element={
          <ProtectedRoute>
            <AdminTransfers />
          </ProtectedRoute>
        }
      />
      */}

      <Route path="/" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />
      <Route path="*" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />
    </Routes>
  );
}
