import { useEffect, useState } from "react";
import { getPostById } from "../services/posts.api";

export function usePost(id) {
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setStatus("idle");
      return;
    }

    let active = true;

    setStatus("loading");
    getPostById(id)
      .then(({ data }) => {
        if (!active) return;
        setPost(data.data.post || null);
        setStatus("ready");
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setError(err?.response?.data?.message || "Unable to load this post.");
      });

    return () => {
      active = false;
    };
  }, [id]);

  return { post, status, error };
}
