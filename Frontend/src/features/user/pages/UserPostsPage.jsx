import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUserPosts } from "../services/user.api";

export default function UserPostsPage() {
  const { id } = useParams();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    getUserPosts(id)
      .then(({ data }) => {
        if (!active) return;
        setPosts(data.data.posts || []);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (status === "loading") {
    return <main className="page-shell detail-placeholder"><p className="eyebrow">AUTHOR</p><h1>Loading posts…</h1></main>;
  }

  return (
    <main className="page-shell">
      <p className="eyebrow">AUTHOR</p>
      <h1>Recent posts</h1>
      <div className="post-list">
        {posts.length === 0 ? (
          <p className="status-note">No posts yet.</p>
        ) : (
          posts.map((post) => (
            <article key={post._id} className="post-card">
              <h2>
                <Link to={`/posts/${post.slug || post._id}`}>{post.title}</Link>
              </h2>
              <p>{post.body}</p>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
