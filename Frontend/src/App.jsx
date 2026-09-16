import { useSelector } from "react-redux";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/layout/Navbar";
import LoginPage from "./features/auth/pages/LoginPage";
import ProfilePage from "./features/auth/pages/ProfilePage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import PostDetailPage from "./features/posts/pages/PostDetailPage";
import PostsPage from "./features/posts/pages/PostsPage";
import ProtectedRoute from "./router/ProtectedRoute";

function GuestOnly() {
  const isAuthenticated = useSelector((state) => Boolean(state.auth.accessToken));
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

function App() {
  return <><Navbar /><Routes><Route path="/" element={<PostsPage />} /><Route path="/posts/:id" element={<PostDetailPage />} /><Route element={<GuestOnly />}><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /></Route><Route element={<ProtectedRoute />}><Route path="/profile" element={<ProfilePage />} /><Route path="/posts/new" element={<PostDetailPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes><footer className="site-footer">Inkline <span>Independent writing on a changing world.</span></footer></>;
}

export default App;
