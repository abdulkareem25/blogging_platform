import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearToast } from "../../features/ui/store/uiSlice";

export default function Toast() {
  const dispatch = useDispatch();
  const toast = useSelector((state) => state.ui.toast);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      dispatch(clearToast());
    }, toast.duration ?? 3000);

    return () => window.clearTimeout(timeout);
  }, [dispatch, toast]);

  if (!toast) return null;

  const Icon = toast.type === "error" ? CircleAlert : CheckCircle2;

  return (
    <div className={`toast toast-${toast.type || "info"}`} role="status" aria-live="polite">
      <div className="toast-icon">
        <Icon size={18} />
      </div>

      <div className="toast-copy">
        <strong>{toast.title}</strong>
        {toast.message && <span>{toast.message}</span>}
      </div>

      <button type="button" className="toast-close" onClick={() => dispatch(clearToast())} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  );
}
