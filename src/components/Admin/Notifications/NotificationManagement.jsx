"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Send,
  Users,
  Globe,
  User,
  MessageSquare,
  Info,
  Mail,
  MailOpen,
  Check,
  X,
  Search,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "./NotificationManagement.module.css";
import AdminListSkeleton from "@/components/Skeletons/AdminListSkeleton";

export default function NotificationManagement() {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [sending, setSending] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
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
  const [stats, setStats] = useState({ totalSent: 0, totalRead: 0, totalUnread: 0 });

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
      setFetchError(null);

      const response = await fetch("/api/admin/notifications");

      if (!response.ok) {
        if (response.status === 401) {
          setFetchError("Please log in as admin to manage notifications");
          setNotifications([]);
          return;
        }
        if (response.status === 403) {
          setFetchError("Admin access required");
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
      setFetchError("Failed to load notifications");
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
      setUserSearch("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || !formData.message.trim()) {
      setFormError("Please fill in all required fields");
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Please fill in all required fields", "error");
      }
      return;
    }

    if (
      formData.recipient_type === "specific_users" &&
      selectedUsers.length === 0
    ) {
      setFormError("Please select at least one user to send the notification to");
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Please select at least one user", "error");
      }
      return;
    }

    try {
      setSending(true);

      const requestBody = {
        ...formData,
        recipientIds:
          formData.recipient_type === "specific_users" ? selectedUsers : [],
        isGlobal: formData.recipient_type === "all_users",
        related_content_type: formData.related_content_type || null,
        related_content_id: formData.related_content_id || null,
      };

      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setFormError("Please log in as admin");
          if (typeof window !== "undefined" && window.showToast) {
            window.showToast("Please log in as admin", "error");
          }
          return;
        }
        if (response.status === 403) {
          setFormError("Admin access required");
          if (typeof window !== "undefined" && window.showToast) {
            window.showToast("Admin access required", "error");
          }
          return;
        }

        try {
          const errorData = await response.json();
          const errorMessage =
            errorData.error || `HTTP error! status: ${response.status}`;
          setFormError(errorMessage);
          if (typeof window !== "undefined" && window.showToast) {
            window.showToast(errorMessage, "error");
          }
        } catch {
          const errorMessage = `HTTP error! status: ${response.status}`;
          setFormError(errorMessage);
          if (typeof window !== "undefined" && window.showToast) {
            window.showToast(errorMessage, "error");
          }
        }
        return;
      }

      setFormData({
        title: "",
        message: "",
        type: "admin_message",
        recipient_type: "all_users",
        related_content_type: null,
        related_content_id: null,
      });
      setSelectedUsers([]);
      setUserSearch("");

      fetchNotifications();

      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Notification sent successfully!", "success");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setFormError("Failed to send notification");

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

  const getUserInitials = (user) => {
    const name = user.first_name || user.full_name || user.email || "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getUserLabel = (user) =>
    user.first_name || user.full_name || user.email || "Unknown";

  // Group batch sends: notifications with same title+message+type within 30s = one "send"
  const groupedNotifications = useMemo(() => {
    if (!notifications.length) return [];
    const used = new Set();
    const result = [];

    for (const notif of notifications) {
      if (used.has(notif.id)) continue;
      used.add(notif.id);

      const t = new Date(notif.created_at).getTime();
      const siblings = notifications.filter(
        (n) =>
          !used.has(n.id) &&
          n.title === notif.title &&
          n.message === notif.message &&
          n.type === notif.type &&
          Math.abs(new Date(n.created_at).getTime() - t) <= 30000,
      );
      siblings.forEach((s) => used.add(s.id));

      const all = [notif, ...siblings];
      result.push({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        created_at: notif.created_at,
        recipientCount: all.length,
        readCount: all.filter((n) => n.is_read).length,
        previewRecipients: all
          .map((n) => n.profile)
          .filter(Boolean)
          .slice(0, 3),
      });
    }

    return result;
  }, [notifications]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        (u.first_name || "").toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case "admin_message": return "Admin";
      case "new_blog_post": return "Blog";
      case "new_portfolio_post": return "Portfolio";
      case "user_registration": return "Sign-up";
      case "user_login": return "Login";
      case "contact_form": return "Contact";
      case "newsletter_subscription": return "Newsletter";
      case "comment_approved": return "Comment";
      case "comment_reply": return "Reply";
      default: return "System";
    }
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
    return <AdminListSkeleton />;
  }

  if (fetchError) {
    return (
      <div className={`${admin.page} ${styles.container}`}>
        <div className={styles.errorPage}>
          <h2>Error</h2>
          <p>{fetchError}</p>
          <button onClick={fetchNotifications}>Try Again</button>
        </div>
      </div>
    );
  }

  const recipientTypes = [
    {
      key: "all_users",
      icon: <Globe size={20} />,
      label: "All Users",
      description: "Send to everyone",
    },
    {
      key: "newsletter_subscribers",
      icon: <Mail size={20} />,
      label: "Newsletter",
      description: "Subscribers only",
    },
    {
      key: "specific_users",
      icon: <Users size={20} />,
      label: "Specific Users",
      description: "Choose recipients",
    },
  ];

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
              <p>Total</p>
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

          {/* Recipients */}
          <div className={styles.recipientSection}>
            <h3>Recipients</h3>

            <div className={styles.recipientCards}>
              {recipientTypes.map(({ key, icon, label, description }) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.recipientCard} ${
                    formData.recipient_type === key
                      ? styles.recipientCardActive
                      : ""
                  }`}
                  onClick={() => handleRecipientTypeChange(key)}
                  aria-pressed={formData.recipient_type === key}
                >
                  <span className={styles.recipientCardIcon}>{icon}</span>
                  <span className={styles.recipientCardLabel}>{label}</span>
                  <span className={styles.recipientCardDesc}>{description}</span>
                  {formData.recipient_type === key && (
                    <span className={styles.recipientCardCheck}>
                      <Check size={12} />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {formData.recipient_type === "specific_users" && (
              <div className={styles.userPicker}>
                {selectedUsers.length > 0 && (
                  <div className={styles.selectedChips}>
                    {selectedUsers.map((id) => {
                      const user = users.find((u) => u.id === id);
                      return (
                        <span key={id} className={styles.chip}>
                          {getUserLabel(user)}
                          <button
                            type="button"
                            className={styles.chipRemove}
                            onClick={() => handleUserToggle(id)}
                            aria-label={`Remove ${getUserLabel(user)}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className={styles.userSearchWrap}>
                  <Search size={15} className={styles.userSearchIcon} />
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className={styles.userSearchInput}
                  />
                  {userSearch && (
                    <button
                      type="button"
                      className={styles.userSearchClear}
                      onClick={() => setUserSearch("")}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className={styles.userGrid}>
                  {filteredUsers.length === 0 ? (
                    <p className={styles.userGridEmpty}>No users found</p>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedUsers.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          className={`${styles.userItem} ${
                            isSelected ? styles.userItemSelected : ""
                          }`}
                          onClick={() => handleUserToggle(user.id)}
                        >
                          <span className={styles.userAvatar}>
                            {getUserInitials(user)}
                          </span>
                          <span className={styles.userItemLabel}>
                            {getUserLabel(user)}
                          </span>
                          {isSelected && (
                            <Check
                              size={14}
                              className={styles.userItemCheck}
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {formError && (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className={styles.sendButton}
          >
            {sending ? (
              "Sending…"
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
          {groupedNotifications.length === 0 ? (
            <p className={styles.emptyMessage}>No notifications yet.</p>
          ) : (
            groupedNotifications.slice(0, 10).map((group) => {
              const allRead = group.readCount === group.recipientCount;
              const noneRead = group.readCount === 0;
              const recipientName =
                group.previewRecipients[0]
                  ? (group.previewRecipients[0].first_name ||
                     group.previewRecipients[0].full_name ||
                     group.previewRecipients[0].email)
                  : null;
              return (
                <div key={group.id} className={styles.notificationItem}>
                  <div className={styles.notificationHeader}>
                    <div className={styles.notificationIcon}>
                      {getNotificationTypeIcon(group.type)}
                    </div>
                    <div className={styles.notificationInfo}>
                      <div className={styles.notificationTitleRow}>
                        <h4>{group.title}</h4>
                        <span className={styles.typeBadge}>
                          {getNotificationTypeLabel(group.type)}
                        </span>
                      </div>
                      <p>{group.message}</p>
                      <div className={styles.recipientRow}>
                        {group.previewRecipients.length > 0 && (
                          <div className={styles.recipientAvatars}>
                            {group.previewRecipients.map((p, i) => (
                              <span
                                key={i}
                                className={styles.recipientAvatar}
                                title={p.full_name || p.first_name || p.email}
                              >
                                {getUserInitials(p)}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className={styles.recipientInfo}>
                          {group.recipientCount === 1
                            ? (recipientName || "1 user")
                            : `${recipientName ? recipientName + (group.recipientCount > 1 ? ` +${group.recipientCount - 1} more` : "") : `${group.recipientCount} users`}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.notificationMeta}>
                    <span className={styles.date}>
                      {formatDate(group.created_at)}
                    </span>
                    {group.recipientCount > 1 && (
                      <span className={styles.readBadge}>
                        {group.readCount}/{group.recipientCount} read
                      </span>
                    )}
                    <span
                      className={`${styles.status} ${
                        allRead
                          ? styles.read
                          : noneRead
                            ? styles.unread
                            : styles.partial
                      }`}
                    >
                      {allRead
                        ? (group.recipientCount > 1 ? "All read" : "Read")
                        : noneRead
                          ? "Unread"
                          : "Partial"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
