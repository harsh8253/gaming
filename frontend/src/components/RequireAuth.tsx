import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthBootstrap } from '../hooks/useAuthBootstrap';
import { useAppSelector } from '../store';

export function RequireAuth() {
  const location = useLocation();
  const bootstrapped = useAuthBootstrap();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-soft">
        Loading session…
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
