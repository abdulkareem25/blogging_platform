export default function Textarea({ label, error, ...props }) {
  return (
    <label className="field-group">
      {label && <span>{label}</span>}
      <textarea {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
