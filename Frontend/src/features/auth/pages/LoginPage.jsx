import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../store/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const error = useSelector((state) => state.auth.error);
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const result = await dispatch(loginUser(form));
    setBusy(false);

    if (!result.error) {
      const redirect = location.state?.from?.pathname || "/";
      navigate(redirect, { replace: true });
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>
          Pick up
          <br />
          <em>where you left off.</em>
        </h1>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="button button-dark" disabled={busy} type="submit">
          {busy ? "Signing in..." : "Sign in"}
        </button>

        <p className="form-foot">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
