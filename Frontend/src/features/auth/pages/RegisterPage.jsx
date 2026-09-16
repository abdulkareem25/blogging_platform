import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../store/authSlice";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const result = await dispatch(registerUser(form));
    setBusy(false);

    if (result.error) {
      setError(result.error.message || "Registration failed");
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <main className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">JOIN THE JOURNAL</p>
        <h1>
          Make space
          <br />
          <em>for your ideas.</em>
        </h1>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <label>
          Username
          <input
            required
            minLength="3"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          />
        </label>

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
            minLength="8"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="button button-dark" disabled={busy} type="submit">
          {busy ? "Creating..." : "Create account"}
        </button>

        <p className="form-foot">
          Already a member? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
