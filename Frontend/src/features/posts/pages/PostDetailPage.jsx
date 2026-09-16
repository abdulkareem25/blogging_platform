import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import Spinner from "../../../components/common/Spinner";
import { useComments } from "../../comments/hooks/useComments";
import { usePost } from "../hooks/usePost";
import { deletePost } from "../services/posts.api";

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const { post, status: postStatus, error: postError } = usePost(id);
  const { comments, status: commentsStatus } = useComments(id, { page: 1, limit: 20 });

  const isOwner = currentUser && post && String(currentUser._id) === String(post.author?._id || post.author);
  const canDelete = isOwner || currentUser?.role === "admin";

  const handleDelete = async () => {
    if (!post || !window.confirm("Delete this post? This action cannot be undone.")) return;

    try {
      await deletePost(post._id);
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  if (postStatus === "loading") {
    return <main className="page-shell"><Spinner label="Loading story" /></main>;
  }

  if (postStatus === "error" || !post) {
    return (
      <main className="page-shell detail-placeholder">
        <p className="eyebrow">STORY</p>
        <h1>Story not found</h1>
        <p>{postError || "The post could not be loaded."}</p>
        <Link className="read-link" to="/">Back to the journal →</Link>
      </main>
    );
  }

  return (
    <main className="page-shell post-detail-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} /> Back to journal
      </Link>

      <article className="post-detail-card">
        <div className="post-details-header">
          <div>
            <p className="eyebrow">STORY</p>
            <h1>{post.title}</h1>
          </div>

          {canDelete && (
            <div className="post-actions">
              {isOwner && (
                <Link className="button button-secondary" to={`/posts/${id}/edit`}>
                  <Pencil size={15} /> Edit
                </Link>
              )}
              <button type="button" className="button button-secondary delete-button" onClick={handleDelete}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>

        <div className="post-meta author-row">
          <span>By {post.author?.username || "Unknown author"}</span>
          <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>

        <div className="tag-row detail-tags">
          {(post.tags || []).map((tag) => (
            <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`} className="tag">
              {tag}
            </Link>
          ))}
        </div>

        <div className="post-body">{post.body}</div>
      </article>

      <section className="comments-panel">
        <div className="comment-header">
          <p className="eyebrow">COMMENTS</p>
          <span>{comments.length}</span>
        </div>

        {commentsStatus === "loading" ? (
          <Spinner label="Loading comments" />
        ) : comments.length === 0 ? (
          <p className="status-note">No comments yet. Start the conversation.</p>
        ) : (
          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <div className="comment-meta">
                  <strong>{comment.author?.username || "Reader"}</strong>
                  <span>{new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </div>
                <p>{comment.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
