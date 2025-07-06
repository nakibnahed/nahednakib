"use client";

import { useState, useEffect } from "react";
import { Send, Users, Globe, User, MessageSquare, Info } from "lucide-react";
import styles from "./NotificationManagement.module.css";

export default function NotificationManagement() {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserSelector, setShowUserSelector] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "admin_message",
    isGlobal: false,
  });
  const [stats, setStats] = useState({
    totalSent: 0,
    totalRead: 0,
    totalUnread: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
      } else {
        console.error("Error fetching users:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/notifications");

      if (!response.ok) {
        if (response.status === 401) {
          setError("Please log in as admin to manage notifications");
          setNotifications([]);
          return;
        }
        if (response.status === 403) {
          setError("Admin access required");
          setNotifications([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      setError("Please fill in all required fields");
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Please fill in all required fields", "error");
      }
      return;
    }

    // Check if specific users are selected when not sending globally
    if (!formData.isGlobal && selectedUsers.length === 0) {
      setError("Please select at least one user to send the notification to");
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Please select at least one user", "error");
      }
      return;
    }

    try {
      setSending(true);
      setError(null);

      // Prepare the request body
      const requestBody = {
        ...formData,
        recipientIds: formData.isGlobal ? [] : selectedUsers,
      };

      console.log("Sending notification request:", requestBody);

      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Please log in as admin");
          if (typeof window !== "undefined" && window.showToast) {
            window.showToast("Please log in as admin", "error");
          }
          return;
        }
        if (response.status === 403) {
          setError("Admin access required");
          if (typeof window !== "undefined" && window.showToast) {
            window.showToast("Admin access required", "error");
          }
          return;
        }

        // Try to get error details from response
        try {
          const errorData = await response.json();
          const errorMessage =
            errorData.error || `HTTP error! status: ${response.status}`;
          setError(errorMessage);
          if (typeof window !== "undefined" && window.showToast) {
            window.showToast(errorMessage, "error");
          }
        } catch (parseError) {
          const errorMessage = `HTTP error! status: ${response.status}`;
          setError(errorMessage);
          if (typeof window !== "undefined" && window.showToast) {
            window.showToast(errorMessage, "error");
          }
        }
        return;
      }

      const data = await response.json();

      // Reset form
      setFormData({
        title: "",
        message: "",
        type: "admin_message",
        isGlobal: false,
      });
      setSelectedUsers([]);

      // Refresh notifications list
      fetchNotifications();

      // Show success toast
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Notification sent successfully!", "success");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setError("Failed to send notification");

      // Show error toast
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Failed to send notification", "error");
      }
    } finally {
      setSending(false);
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleGlobalToggle = () => {
    setFormData((prev) => ({ ...prev, isGlobal: !prev.isGlobal }));
    setSelectedUsers([]);
  };

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case "admin_message":
        return <Info size={16} />;
      case "new_blog_post":
        return <MessageSquare size={16} />;
      case "new_portfolio_post":
        return <Globe size={16} />;
      case "user_registration":
        return <User size={16} />;
      case "user_login":
        return <User size={16} />;
      case "contact_form":
        return <MessageSquare size={16} />;
      case "newsletter_subscription":
        return <Info size={16} />;
      case "comment_approved":
        return <MessageSquare size={16} />;
      case "comment_reply":
        return <MessageSquare size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading notifications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchNotifications}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Send size={24} />
          Notification Management
        </h1>
        <p className={styles.subtitle}>
          Send notifications to users and track delivery
        </p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Sent</h3>
          <p>{stats.totalSent}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Read</h3>
          <p>{stats.totalRead}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Unread</h3>
          <p>{stats.totalUnread}</p>
        </div>
      </div>

      {/* Send Notification Form */}
      <div className={styles.formSection}>
        <h2>Send New Notification</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Notification title"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="admin_message">Admin Message</option>
                <option value="new_blog_post">Blog Post</option>
                <option value="new_portfolio_post">Portfolio Update</option>
                <option value="user_registration">Welcome</option>
                <option value="contact_form">Contact Form</option>
                <option value="newsletter_subscription">Newsletter</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              placeholder="Notification message"
              rows={4}
              className={styles.textarea}
            />
          </div>

          <div className={styles.recipientSection}>
            <h3>Recipients</h3>

            <div className={styles.recipientOptions}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  checked={formData.isGlobal}
                  onChange={handleGlobalToggle}
                  className={styles.radio}
                />
                <Globe size={16} />
                Send to all users
              </label>

              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  checked={!formData.isGlobal}
                  onChange={() => setFormData({ ...formData, isGlobal: false })}
                  className={styles.radio}
                />
                <Users size={16} />
                Send to specific users
              </label>
            </div>

            {!formData.isGlobal && (
              <div className={styles.userSelector}>
                <button
                  type="button"
                  onClick={() => setShowUserSelector(!showUserSelector)}
                  className={styles.userSelectorButton}
                >
                  <Users size={16} />
                  {selectedUsers.length === 0
                    ? "Select users"
                    : `${selectedUsers.length} user(s) selected`}
                </button>

                {showUserSelector && (
                  <div className={styles.userList}>
                    {users.map((user) => (
                      <label key={user.id} className={styles.userCheckbox}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className={styles.checkbox}
                        />
                        <span>
                          {user.first_name || user.full_name || user.email}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={sending}
            className={styles.sendButton}
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send size={16} />
                Send Notification
              </>
            )}
          </button>
        </form>
      </div>

      {/* Recent Notifications */}
      <div className={styles.recentSection}>
        <h2>Recent Notifications</h2>
        <div className={styles.notificationsList}>
          {notifications.length === 0 ? (
            <p className={styles.emptyMessage}>No notifications sent yet.</p>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <div key={notification.id} className={styles.notificationItem}>
                <div className={styles.notificationHeader}>
                  <div className={styles.notificationIcon}>
                    {getNotificationTypeIcon(notification.type)}
                  </div>
                  <div className={styles.notificationInfo}>
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className={styles.recipientInfo}>
                      To:{" "}
                      {notification.profiles?.full_name ||
                        notification.profiles?.email ||
                        "Unknown"}
                    </span>
                  </div>
                </div>
                <div className={styles.notificationMeta}>
                  <span className={styles.date}>
                    {formatDate(notification.created_at)}
                  </span>
                  <span
                    className={`${styles.status} ${
                      notification.is_read ? styles.read : styles.unread
                    }`}
                  >
                    {notification.is_read ? "Read" : "Unread"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
