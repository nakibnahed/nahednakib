"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Users,
  Globe,
  User,
  MessageSquare,
  Info,
  Mail,
  MailOpen,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "./NotificationManagement.module.css";

export default function NotificationManagement() {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [blogOptions, setBlogOptions] = useState([]);
  const [portfolioOptions, setPortfolioOptions] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "admin_message",
    recipient_type: "all_users",
    related_content_type: null,
    related_content_id: null,
  });
  const [stats, setStats] = useState({
    totalSent: 0,
    totalRead: 0,
    totalUnread: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
    fetchBlogs();
    fetchPortfolios();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("id, title, description")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching blogs:", error);
        setBlogOptions([]);
        return;
      }
      setBlogOptions(data || []);
    } catch (error) {
      console.error("Error:", error);
      setBlogOptions([]);
    }
  };

  const fetchPortfolios = async () => {
    try {
      const { data, error } = await supabase
        .from("portfolios")
        .select("id, title, description")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching portfolios:", error);
        setPortfolioOptions([]);
        return;
      }
      setPortfolioOptions(data || []);
    } catch (error) {
      console.error("Error:", error);
      setPortfolioOptions([]);
    }
  };

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
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "type") {
        if (value === "new_blog_post") {
          next.related_content_type = "blog";
          next.related_content_id = null;
        } else if (value === "new_portfolio_post") {
          next.related_content_type = "portfolio";
          next.related_content_id = null;
        } else {
          next.related_content_type = null;
          next.related_content_id = null;
        }
      }

      return next;
    });
  };

  const handleRelatedContentSelect = (e) => {
    const selectedId = e.target.value || null;
    if (!selectedId) {
      setFormData((prev) => ({
        ...prev,
        related_content_id: null,
      }));
      return;
    }

    if (formData.type === "new_blog_post") {
      const selectedBlog = blogOptions.find(
        (item) => String(item.id) === selectedId,
      );
      setFormData((prev) => ({
        ...prev,
        related_content_type: "blog",
        related_content_id: selectedId,
        title: selectedBlog
          ? `New Blog Post: ${selectedBlog.title}`
          : prev.title,
        message: selectedBlog?.description
          ? selectedBlog.description.slice(0, 100)
          : prev.message,
      }));
      return;
    }

    if (formData.type === "new_portfolio_post") {
      const selectedPortfolio = portfolioOptions.find(
        (item) => String(item.id) === selectedId,
      );
      setFormData((prev) => ({
        ...prev,
        related_content_type: "portfolio",
        related_content_id: selectedId,
        title: selectedPortfolio
          ? `New Project: ${selectedPortfolio.title}`
          : prev.title,
      }));
    }
  };

  const handleRecipientTypeChange = (recipientType) => {
    setFormData((prev) => ({
      ...prev,
      recipient_type: recipientType,
      isGlobal: recipientType === "all_users",
    }));
    if (recipientType !== "specific_users") {
      setSelectedUsers([]);
      setShowUserSelector(false);
    }
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
    if (
      formData.recipient_type === "specific_users" &&
      selectedUsers.length === 0
    ) {
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
        recipientIds:
          formData.recipient_type === "specific_users" ? selectedUsers : [],
        isGlobal: formData.recipient_type === "all_users",
        related_content_type: formData.related_content_type || null,
        related_content_id: formData.related_content_id || null,
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
        recipient_type: "all_users",
        related_content_type: null,
        related_content_id: null,
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
        : [...prev, userId],
    );
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
      <div className={`${admin.page} ${styles.container}`}>
        <div className={admin.loadingPanel}>
          <div className={admin.loadingSpinner} aria-hidden />
          <span>Loading notifications…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${admin.page} ${styles.container}`}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchNotifications}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${admin.page} ${styles.container}`}>
      <header className={admin.pageHeader}>
        <p className={admin.eyebrow}>
          <Send size={14} strokeWidth={2} aria-hidden /> Outreach
        </p>
        <h1 className={admin.pageTitle}>Notifications</h1>
        <p className={admin.lead}>
          Send notifications to users and track delivery.
        </p>
      </header>

      <section className={admin.statsSection} aria-label="Summary">
        <div className={admin.statsGrid}>
          <div className={admin.statCard}>
            <Send size={24} aria-hidden />
            <div>
              <h3>{stats.totalSent}</h3>
              <p>Total sent</p>
            </div>
          </div>
          <div className={admin.statCard}>
            <MailOpen size={24} aria-hidden />
            <div>
              <h3>{stats.totalRead}</h3>
              <p>Read</p>
            </div>
          </div>
          <div className={admin.statCard}>
            <Mail size={24} aria-hidden />
            <div>
              <h3>{stats.totalUnread}</h3>
              <p>Unread</p>
            </div>
          </div>
        </div>
      </section>

      <section className={admin.filtersSection} aria-label="Filters" />

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

          {(formData.type === "new_blog_post" ||
            formData.type === "new_portfolio_post") && (
            <div className={styles.formGroup}>
              <label htmlFor="related-content-select">Link to Content</label>
              <select
                id="related-content-select"
                value={formData.related_content_id || ""}
                onChange={handleRelatedContentSelect}
                className={styles.select}
              >
                <option value="">
                  {formData.type === "new_blog_post"
                    ? "Link to a blog post (optional)"
                    : "Link to a portfolio project (optional)"}
                </option>
                {(formData.type === "new_blog_post"
                  ? blogOptions
                  : portfolioOptions
                ).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                  checked={formData.recipient_type === "all_users"}
                  onChange={() => handleRecipientTypeChange("all_users")}
                  className={styles.radio}
                />
                <Globe size={16} />
                Send to all users
              </label>

              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  checked={formData.recipient_type === "newsletter_subscribers"}
                  onChange={() =>
                    handleRecipientTypeChange("newsletter_subscribers")
                  }
                  className={styles.radio}
                />
                <Mail size={16} />
                Newsletter subscribers only
              </label>

              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  checked={formData.recipient_type === "specific_users"}
                  onChange={() => handleRecipientTypeChange("specific_users")}
                  className={styles.radio}
                />
                <Users size={16} />
                Send to specific users
              </label>
            </div>

            {formData.recipient_type === "specific_users" && (
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
