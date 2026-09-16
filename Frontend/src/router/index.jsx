import { useSelector } from "react-redux";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import AdminUsersPage from "../features/admin/pages/AdminUsersPage";
import LoginPage from "../features/auth/pages/LoginPage";
import NotFoundPage from "../features/auth/pages/NotFoundPage";
import ProfilePage from "../features/auth/pages/ProfilePage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import CreatePostPage from "../features/posts/pages/CreatePostPage";
import PostDetailPage from "../features/posts/pages/PostDetailPage";
import PostsPage from "../features/posts/pages/PostsPage";
import AdminRoute from "./AdminRoute";
import ProtectedRoute from "./ProtectedRoute";

function GuestOnly() {
  const isAuthenticated = useSelector((state) => Boolean(state.auth.accessToken));
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

export default function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<PostsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/posts/new" element={<CreatePostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/posts/:id" element={<PostDetailPage />} />

        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  );
}
