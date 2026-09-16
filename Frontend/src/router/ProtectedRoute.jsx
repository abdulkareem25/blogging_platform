import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Spinner from "../components/common/Spinner";
import { selectIsAuthenticated } from "../features/auth/store/authSlice";

export default function ProtectedRoute() {
  const location = useLocation();
  const { status } = useSelector((state) => state.auth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (status === "loading") return <Spinner label="Restoring session" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
