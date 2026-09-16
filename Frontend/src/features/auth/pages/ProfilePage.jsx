import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function ProfilePage() { const user = useSelector((state) => state.auth.user); return <main className="page-shell profile-page"><p className="eyebrow">YOUR SPACE</p><h1>{user?.username || "Profile"}</h1><p>{user?.bio || "Your profile is ready for a little context."}</p><Link className="button button-dark" to="/">Return to journal</Link></main>; }
