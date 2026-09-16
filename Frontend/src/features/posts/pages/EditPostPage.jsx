import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { setToast } from "../../ui/store/uiSlice";
import { getPostById, updatePost } from "../services/posts.api";
import { postSchema } from "../validators/postSchema";

export default function EditPostPage() {
  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: { title: "", body: "", tags: "" },
  });

  useEffect(() => {
    let active = true;

    getPostById(id)
      .then(({ data }) => {
        if (!active) return;
        const post = data.data.post;
        setValue("title", post.title || "");
        setValue("body", post.body || "");
        setValue("tags", (post.tags || []).join(", "));
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

  const onSubmit = async (values) => {
    setError("");

    try {
      await updatePost(id, {
        title: values.title.trim(),
        body: values.body.trim(),
        tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      dispatch(setToast({ title: "Story updated", message: "Your changes were saved.", type: "success" }));
      navigate(`/posts/${id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update this post.");
      dispatch(setToast({ title: "Update failed", message: err?.response?.data?.message || "Unable to update this post.", type: "error" }));
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

      <form className="editor-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Title
          <input {...register("title")} />
          {errors.title && <span className="field-error">{errors.title.message}</span>}
        </label>

        <label>
          Body
          <textarea {...register("body")} />
          {errors.body && <span className="field-error">{errors.body.message}</span>}
        </label>

        <label>
          Tags
          <input {...register("tags")} placeholder="design, writing, product" />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="button button-dark" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
          <Link className="read-link" to={`/posts/${id}`}>Cancel</Link>
        </div>
      </form>
    </main>
  );
}
