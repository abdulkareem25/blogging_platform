import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPost } from "../services/posts.api";

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", body: "", tags: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };

      const { data } = await createPost(payload);
      const post = data.data.post;
      navigate(`/posts/${post.slug || post._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to publish the post.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell form-page">
      <p className="eyebrow">WRITE</p>
      <h1>Create a story</h1>

      <form className="editor-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
        </label>

        <label>
          Body
          <textarea value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} />
        </label>

        <label>
          Tags
          <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="design, writing, product" />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="button button-dark" disabled={busy}>
            {busy ? "Publishing..." : "Publish story"}
          </button>
          <Link className="read-link" to="/">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
