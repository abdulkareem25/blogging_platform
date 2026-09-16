import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPostById, updatePost } from "../services/posts.api";

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", body: "", tags: "" });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    getPostById(id)
      .then(({ data }) => {
        if (!active) return;
        const post = data.data.post;
        setForm({
          title: post.title,
          body: post.body,
          tags: (post.tags || []).join(", "),
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load this post for editing.");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await updatePost(id, {
        title: form.title.trim(),
        body: form.body.trim(),
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      navigate(`/posts/${id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update this post.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return <main className="page-shell detail-placeholder"><p className="eyebrow">EDIT</p><h1>Loading post…</h1></main>;
  }

  if (status === "error") {
    return <main className="page-shell detail-placeholder"><p className="eyebrow">ERROR</p><h1>Unable to edit this post.</h1><p>{error}</p><Link className="read-link" to="/">Back to the journal →</Link></main>;
  }

  return (
    <main className="page-shell form-page">
      <p className="eyebrow">EDIT</p>
      <h1>Update your story</h1>

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
            {busy ? "Saving..." : "Save changes"}
          </button>
          <Link className="read-link" to={`/posts/${id}`}>Cancel</Link>
        </div>
      </form>
    </main>
  );
}
