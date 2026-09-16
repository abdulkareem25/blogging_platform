import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="page-shell detail-placeholder">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The page you tried to reach is either missing or no longer available.</p>
      <Link className="read-link" to="/">Back to the journal →</Link>
    </main>
  );
}
