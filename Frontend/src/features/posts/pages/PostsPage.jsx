import { ArrowRight, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Spinner from "../../../components/common/Spinner";
import { usePosts } from "../hooks/usePosts";

function PostCard({ post }) {
  const excerpt = post.body?.length > 145 ? `${post.body.slice(0, 145)}...` : post.body;

  return (
    <article className="post-card">
      <div className="post-meta">
        <span>{post.author?.username || "Unknown author"}</span>
        <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>

      <h2>
        <Link to={`/posts/${post.slug || post._id}`}>{post.title}</Link>
      </h2>

      <p>{excerpt}</p>

      <div className="post-card-footer">
        <div className="tag-row">
          {(post.tags || []).map((tag) => (
            <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`} className="tag">
              {tag}
            </Link>
          ))}
        </div>

        <Link className="read-link" to={`/posts/${post.slug || post._id}`}>
          Read <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

export default function PostsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const tag = searchParams.get("tag") || "";
  const page = Number(searchParams.get("page") || 1);
  const { posts, pagination, status, error } = usePosts({ page, limit: 8, search, tag, sort: "newest" });

  const updateSearch = (event) => {
    const value = event.target.value;
    setSearchParams((current) => {
      if (value) {
        current.set("search", value);
      } else {
        current.delete("search");
      }
      current.delete("page");
      return current;
    });
  };

  const handleNextPage = () => {
    if (!pagination.hasNextPage) return;
    setSearchParams((current) => {
      current.set("page", String(page + 1));
      return current;
    });
  };

  const handlePrevPage = () => {
    if (!pagination.hasPrevPage) return;
    setSearchParams((current) => {
      current.set("page", String(Math.max(1, page - 1)));
      return current;
    });
  };

  return (
    <main className="page-shell">
      <section className="page-intro">
        <p className="eyebrow">THE INKLINE JOURNAL</p>
        <h1>
          Ideas worth
          <br />
          <em>lingering over.</em>
        </h1>
        <p className="intro-copy">
          A small, independent corner for thoughtful writing on technology, culture, and the work of making.
        </p>
      </section>

      <section className="posts-section" aria-labelledby="posts-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LATEST NOTES</p>
            <h2 id="posts-heading">From the journal</h2>
          </div>

          <div className="search-wrap">
            <Search size={17} />
            <input value={search} onChange={updateSearch} placeholder="Search stories" aria-label="Search stories" />
          </div>
        </div>

        {tag && (
          <button
            className="active-filter"
            type="button"
            onClick={() => setSearchParams((current) => {
              current.delete("tag");
              return current;
            })}
          >
            Tag: {tag} ×
          </button>
        )}

        {status === "loading" ? (
          <Spinner label="Finding stories" />
        ) : (
          <div className="post-list">{posts.map((post) => <PostCard key={post._id} post={post} />)}</div>
        )}

        {error && <p className="status-note">{error}</p>}

        <div className="pagination">
          <button type="button" disabled={!pagination.hasPrevPage} onClick={handlePrevPage}>
            ← Newer
          </button>
          <span>Page {pagination.currentPage || page}</span>
          <button type="button" disabled={!pagination.hasNextPage} onClick={handleNextPage}>
            Older →
          </button>
        </div>
      </section>
    </main>
  );
}
