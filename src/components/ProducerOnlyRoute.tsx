import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from './LoadingSpinner';
import { useAdminStatus } from '../hooks/useAdminStatus';

export default function ProducerOnlyRoute({ children }: { children: ReactNode }) {
  const isAdmin = useAdminStatus();

  if (isAdmin === null) {
    return (
      <MainLayout>
        <LoadingSpinner text="Cargando..." />
      </MainLayout>
    );
  }

  if (isAdmin) {
    return <Navigate to="/admin/claims" replace />;
  }

  return <>{children}</>;
}
