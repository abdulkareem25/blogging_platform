export default function Button({ children, className = "", variant = "primary", type = "button", ...props }) {
  const variantClass = variant === "secondary" ? "button button-secondary" : "button button-dark";

  return (
    <button type={type} className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
