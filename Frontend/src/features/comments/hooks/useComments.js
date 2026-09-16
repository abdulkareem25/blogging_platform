import { useEffect, useState } from "react";
import { getComments } from "../services/comments.api";

export function useComments(postId, params = {}) {
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 20, hasNextPage: false, hasPrevPage: false });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!postId) {
      setStatus("idle");
      return;
    }

    let active = true;

    setStatus("loading");
    getComments(postId, params)
      .then(({ data }) => {
        if (!active) return;
        setComments(data.data.comments || []);
        setPagination(data.data.pagination || pagination);
        setStatus("ready");
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setError(err?.response?.data?.message || "Unable to load comments.");
      });

    return () => {
      active = false;
    };
  }, [postId, JSON.stringify(params)]);

  return { comments, pagination, status, error, setComments };
}
