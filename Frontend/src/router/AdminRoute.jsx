import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import Spinner from "../components/common/Spinner";

export default function AdminRoute() {
  const { user, status } = useSelector((state) => state.auth);

  if (status === "loading") {
    return <Spinner label="Checking access" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === "admin" ? <Outlet /> : <Navigate to="/" replace />;
}
