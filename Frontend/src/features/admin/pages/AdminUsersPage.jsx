import { Link } from "react-router-dom";

export default function AdminUsersPage() {
  return (
    <main className="page-shell detail-placeholder">
      <p className="eyebrow">ADMIN</p>
      <h1>User management</h1>
      <p>This admin-only page is wired to the role guard and will handle user listing and deletion in the next phase.</p>
      <Link className="read-link" to="/">Back to the journal →</Link>
    </main>
  );
}
