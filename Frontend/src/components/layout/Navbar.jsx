import { LogOut, PenLine, ShieldCheck, UserRound } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { logoutUser, selectIsAuthenticated } from "../../features/auth/store/authSlice";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" to="/" aria-label="Inkline home"><span>ink</span>line</Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <NavLink to="/" end>Explore</NavLink>
          {isAuthenticated && <NavLink to="/posts/new"><PenLine size={15} />Write</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin/users"><ShieldCheck size={15} />Admin</NavLink>}
        </nav>
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <Link className="profile-link" to="/profile"><UserRound size={17} />{user?.username || "Profile"}</Link>
              <button className="icon-button" type="button" onClick={handleLogout} title="Log out" aria-label="Log out"><LogOut size={17} /></button>
            </>
          ) : (
            <Link className="button button-dark button-small" to="/login">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
