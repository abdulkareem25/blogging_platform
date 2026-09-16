import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { updateUser } from "../../auth/store/authSlice";
import { updateCurrentUser } from "../services/user.api";

export default function EditProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [form, setForm] = useState({ username: user?.username || "", bio: user?.bio || "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const { data } = await updateCurrentUser({ username: form.username, bio: form.bio });
      dispatch(updateUser(data.data.user));
      navigate("/profile");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save the profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell form-page">
      <p className="eyebrow">PROFILE</p>
      <h1>Edit {user?.username || "profile"}</h1>

      <form className="editor-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} />
        </label>

        <label>
          Bio
          <textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="button button-dark" disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </button>
          <Link className="read-link" to="/profile">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
