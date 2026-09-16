import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/user.api";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then(({ data }) => {
        if (!active) return;
        setProfile(data.data.user || null);
        setStatus("ready");
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setError(err?.response?.data?.message || "Unable to load profile.");
      });

    return () => {
      active = false;
    };
  }, []);

  return { profile, status, error };
}
