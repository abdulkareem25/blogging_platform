import { useEffect, useState } from "react";
import { deleteUserByAdmin, getAllUsers } from "../services/admin.api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      const { data } = await getAllUsers({ page: 1, limit: 50 });
      setUsers(data.data.users || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load the user list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user account?")) return;

    try {
      await deleteUserByAdmin(userId);
      setUsers((current) => current.filter((user) => user._id !== userId));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete this user.");
    }
  };

  return (
    <main className="page-shell admin-page">
      <p className="eyebrow">ADMIN</p>
      <h1>User management</h1>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading users…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button type="button" className="button button-secondary" onClick={() => handleDelete(user._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
