import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setToast } from "../../ui/store/uiSlice";
import { createPost } from "../services/posts.api";
import { postSchema } from "../validators/postSchema";

export default function CreatePostPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: { title: "", body: "", tags: "" },
  });

  const onSubmit = async (values) => {
    setError("");

    try {
      const payload = {
        title: values.title.trim(),
        body: values.body.trim(),
        tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };

      const { data } = await createPost(payload);
      const post = data.data.post;
      dispatch(setToast({ title: "Story published", message: "Your post is live.", type: "success" }));
      navigate(`/posts/${post.slug || post._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to publish the post.");
      dispatch(setToast({ title: "Publish failed", message: setError || "Unable to publish the post.", type: "error" }));
    }
  };

  return (
    <main className="page-shell form-page">
      <p className="eyebrow">WRITE</p>
      <h1>Create a story</h1>

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
            {isSubmitting ? "Publishing..." : "Publish story"}
          </button>
          <Link className="read-link" to="/">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
