import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/store';

export default function ProtectedRoute() {
  // TEMPORARILY BYPASS AUTH FOR TESTING
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasToken = localStorage.getItem('token');

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

