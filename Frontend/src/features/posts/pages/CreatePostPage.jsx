import { Link } from "react-router-dom";

export default function CreatePostPage() {
  return (
    <main className="page-shell detail-placeholder">
      <p className="eyebrow">WRITE</p>
      <h1>Create a post</h1>
      <p>The post form and API wiring are next in the feature sequence. This route is protected and ready for Phase 8.</p>
      <Link className="read-link" to="/">Back to the journal →</Link>
    </main>
  );
}
