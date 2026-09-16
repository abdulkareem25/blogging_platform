export default function Input({ label, error, ...props }) {
  return (
    <label className="field-group">
      {label && <span>{label}</span>}
      <input {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
