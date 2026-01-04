import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, userRole }: { allowedRoles: string[], userRole: string }) => {
  const location = useLocation();

  // 1. Cek apakah user sudah login
  if (!userRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Cek apakah role user ada dalam daftar role yang diizinkan
  const isAllowed = allowedRoles.includes(userRole);

  return isAllowed
    ? <Outlet />
    : <Navigate to="/unauthorized" state={{ from: location }} replace />;
};

export default ProtectedRoute;