import { Link, useParams } from "react-router-dom";

export default function PostDetailPage() {
  const { id } = useParams();
  return <main className="page-shell detail-placeholder"><p className="eyebrow">STORY</p><h1>Post detail is ready for the next feature slice.</h1><p>Route captured: <strong>{id}</strong>. The API service and layout are wired; comments and full post rendering can now be added here.</p><Link className="read-link" to="/">Back to the journal →</Link></main>;
}
