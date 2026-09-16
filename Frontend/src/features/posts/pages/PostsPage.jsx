import { ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Spinner from "../../../components/common/Spinner";
import { getPosts } from "../services/posts.api";

const fallbackPosts = [
  { _id: "sample-1", title: "A quieter way to build things", body: "Notes on making room for focus, better questions, and work that lasts.", tags: ["craft", "process"], author: { username: "Editorial desk" }, createdAt: "2026-09-12" },
  { _id: "sample-2", title: "The shape of a useful interface", body: "Good product design does not ask for attention. It earns trust one clear decision at a time.", tags: ["design"], author: { username: "Mara Chen" }, createdAt: "2026-09-08" },
];

function PostCard({ post }) {
  const excerpt = post.body?.length > 145 ? `${post.body.slice(0, 145)}...` : post.body;
  return <article className="post-card">
    <div className="post-meta"><span>{post.author?.username || "Unknown author"}</span><span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></div>
    <h2><Link to={`/posts/${post.slug || post._id}`}>{post.title}</Link></h2>
    <p>{excerpt}</p>
    <div className="post-card-footer"><div className="tag-row">{post.tags?.map((tag) => <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`} className="tag">{tag}</Link>)}</div><Link className="read-link" to={`/posts/${post.slug || post._id}`}>Read <ArrowRight size={15} /></Link></div>
  </article>;
}

export default function PostsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const search = searchParams.get("search") || "";
  const tag = searchParams.get("tag") || "";
  const page = Number(searchParams.get("page") || 1);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    getPosts({ page, limit: 8, search, tag, sort: "newest" })
      .then(({ data }) => { if (active) { setPosts(data.data.posts || []); setStatus("ready"); } })
      .catch(() => { if (active) { setPosts(fallbackPosts); setStatus("demo"); } });
    return () => { active = false; };
  }, [page, search, tag]);

  const updateSearch = (event) => {
    const value = event.target.value;
    setSearchParams((current) => { value ? current.set("search", value) : current.delete("search"); current.delete("page"); return current; });
  };

  return <main className="page-shell">
    <section className="page-intro"><p className="eyebrow">THE INKLINE JOURNAL</p><h1>Ideas worth<br /><em>lingering over.</em></h1><p className="intro-copy">A small, independent corner for thoughtful writing on technology, culture, and the work of making.</p></section>
    <section className="posts-section" aria-labelledby="posts-heading">
      <div className="section-heading"><div><p className="eyebrow">LATEST NOTES</p><h2 id="posts-heading">From the journal</h2></div><div className="search-wrap"><Search size={17} /><input value={search} onChange={updateSearch} placeholder="Search stories" aria-label="Search stories" /></div></div>
      {tag && <button className="active-filter" type="button" onClick={() => setSearchParams((current) => { current.delete("tag"); return current; })}>Tag: {tag} ×</button>}
      {status === "loading" ? <Spinner label="Finding stories" /> : <div className="post-list">{posts.map((post) => <PostCard key={post._id} post={post} />)}</div>}
      {status === "demo" && <p className="status-note">Showing sample stories while the API is unavailable.</p>}
      <div className="pagination"><button type="button" disabled={page <= 1} onClick={() => setSearchParams((current) => { current.set("page", String(page - 1)); return current; })}>← Newer</button><span>Page {page}</span><button type="button" disabled={posts.length < 8} onClick={() => setSearchParams((current) => { current.set("page", String(page + 1)); return current; })}>Older →</button></div>
    </section>
  </main>;
}
