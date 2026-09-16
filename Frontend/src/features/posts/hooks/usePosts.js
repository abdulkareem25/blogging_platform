import { useEffect, useState } from "react";
import { getPosts } from "../services/posts.api";

export function usePosts(params = {}) {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 8, hasNextPage: false, hasPrevPage: false });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setStatus("loading");
    getPosts(params)
      .then(({ data }) => {
        if (!active) return;
        const payload = data.data;
        setPosts(payload.posts || []);
        setPagination(payload.pagination || pagination);
        setStatus("ready");
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || "Unable to load posts.");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [JSON.stringify(params)]);

  return { posts, pagination, status, error };
}
