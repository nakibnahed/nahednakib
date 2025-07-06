"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./UserManagement.module.css";
import { Edit, Trash2, User, Shield, Eye } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerTerm = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        (user.email && user.email.toLowerCase().includes(lowerTerm)) ||
        (user.role && user.role.toLowerCase().includes(lowerTerm)) ||
        (user.id && user.id.toLowerCase().includes(lowerTerm)) ||
        (user.created_at && user.created_at.toLowerCase().includes(lowerTerm))
    );
  }, [users, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include", // This ensures cookies are sent
      });
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        console.error("Error fetching users:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userToDelete }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.filter((user) => user.id !== userToDelete));
        alert("User deleted successfully");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete user");
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(
          users.map((user) => (user.id === userId ? { ...user, role } : user))
        );
        setEditingUser(null);
        alert("User role updated successfully");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update user role");
    }
  };

  const startEditing = (user) => {
    setEditingUser(user.id);
    setNewRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setNewRole("");
  };

  if (loading) {
    return <div className={styles.loading}>Loading users...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
      </div>

      <div className={styles.controlsRow}>
        <input
          type="text"
          placeholder="Search by email, role, ID or date..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className={styles.idCell} data-label="ID">
                  {user.id.substring(0, 8)}...
                </td>
                <td className={styles.emailCell} data-label="Email">
                  <div className={styles.userInfo}>
                    <User size={16} />
                    {user.email || "No email"}
                  </div>
                </td>
                <td className={styles.roleCell} data-label="Role">
                  {editingUser === user.id ? (
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className={styles.roleSelect}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`${styles.roleBadge} ${styles[user.role]}`}
                    >
                      {user.role === "admin" && <Shield size={12} />}
                      {user.role}
                    </span>
                  )}
                </td>
                <td className={styles.dateCell} data-label="Created">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className={styles.actionsCell} data-label="Actions">
                  {editingUser === user.id ? (
                    <div className={styles.editActions}>
                      <button
                        onClick={() => handleUpdateRole(user.id, newRole)}
                        className={styles.saveBtn}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className={styles.cancelBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <button
                        onClick={() => startEditing(user)}
                        className={styles.editBtn}
                        title="Edit role"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => confirmDeleteUser(user.id)}
                        className={styles.deleteBtn}
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && users.length > 0 ? (
          <div className={styles.noUsers}>
            <User size={48} />
            <p>No users found matching "{searchTerm}"</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.noUsers}>
            <User size={48} />
            <p>No users found</p>
          </div>
        ) : null}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
