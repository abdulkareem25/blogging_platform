import { useEffect, useState } from "react";
import { getAllUsers } from "../services/admin.api";

export function useAdminUsers(params = {}) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10, hasNextPage: false, hasPrevPage: false });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setStatus("loading");
    getAllUsers(params)
      .then(({ data }) => {
        if (!active) return;
        const payload = data.data;
        setUsers(payload.users || []);
        setPagination(payload.pagination || pagination);
        setStatus("ready");
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || "Unable to load users.");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [JSON.stringify(params)]);

  return { users, pagination, status, error };
}
