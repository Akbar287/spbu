import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({
  allowedRoles,
  userRole,
}: {
  allowedRoles: string[];
  userRole: string;
}) => {
  const location = useLocation();

  if (!userRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAllowed = allowedRoles.includes(userRole);

  return isAllowed ? (
    <Outlet />
  ) : (
    <Navigate to="/unauthorized" state={{ from: location }} replace />
  );
};

export default ProtectedRoute;
