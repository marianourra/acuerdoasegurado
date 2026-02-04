import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner text="Cargando..." />
      </MainLayout>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
