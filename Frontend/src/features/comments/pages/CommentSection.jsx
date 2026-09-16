import { useEffect, useState } from "react";
import { addComment, getComments } from "../services/comments.api";

export default function CommentSection({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    getComments(postId)
      .then(({ data }) => {
        if (!active) return;
        setComments(data.data.comments || []);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [postId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    const trimmed = body.trim();
    if (!trimmed) return;

    const { data } = await addComment(postId, { body: trimmed });
    setComments((current) => [...current, data.data.comment]);
    setBody("");
  };

  if (status === "loading") {
    return <section className="comments-panel"><p className="eyebrow">COMMENTS</p><p>Loading comments…</p></section>;
  }

  return (
    <section className="comments-panel">
      <p className="eyebrow">COMMENTS</p>
      <div className="comment-list">
        {comments.length === 0 ? <p>No comments yet.</p> : comments.map((comment) => <div key={comment._id || comment.id} className="comment-item"><strong>{comment.author?.username || "Reader"}</strong><p>{comment.body}</p></div>)}
      </div>
      {user ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a comment" />
          <button type="submit" className="button button-dark">Post comment</button>
        </form>
      ) : (
        <p className="status-note">Sign in to join the conversation.</p>
      )}
    </section>
  );
}
