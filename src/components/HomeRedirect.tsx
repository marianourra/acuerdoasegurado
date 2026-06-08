import { Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from './LoadingSpinner';
import { useAdminStatus } from '../hooks/useAdminStatus';

export default function HomeRedirect() {
  const isAdmin = useAdminStatus();

  if (isAdmin === null) {
    return (
      <MainLayout>
        <LoadingSpinner text="Cargando..." />
      </MainLayout>
    );
  }

  return <Navigate to={isAdmin ? '/admin/claims' : '/dashboard'} replace />;
}
