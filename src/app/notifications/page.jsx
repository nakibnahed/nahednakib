"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  FileText,
  Mail,
  MessageSquare,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/context/NotificationContext";
import {
  getNotificationUrl,
  shouldOpenInNewTab,
} from "@/lib/notificationRouting";
import styles from "./page.module.css";

const STATUS_FILTERS = ["all", "unread", "read"];
const TYPE_FILTERS = [
  "all",
  "blog",
  "portfolio",
  "newsletter",
  "contact",
  "admin",
  "other",
];

function toRelativeTime(dateString) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  return new Date(dateString).toLocaleDateString();
}

function typeToFilter(type) {
  switch (type) {
    case "new_blog_post":
      return "blog";
    case "new_portfolio_post":
      return "portfolio";
    case "newsletter_subscription":
      return "newsletter";
    case "contact_form":
      return "contact";
    case "admin_message":
    case "user_registration":
    case "user_login":
      return "admin";
    case "practice_request":
    case "practice_cancelled":
      return "other";
    default:
      return "other";
  }
}

function iconForType(type) {
  switch (type) {
    case "new_blog_post":
    case "new_portfolio_post":
      return <FileText size={16} />;
    case "newsletter_subscription":
    case "contact_form":
      return <Mail size={16} />;
    case "admin_message":
    case "comment_approved":
    case "comment_reply":
      return <MessageSquare size={16} />;
    case "user_registration":
    case "user_login":
      return <User size={16} />;
    case "practice_request":
    case "practice_cancelled":
      return <Users size={16} />;
    default:
      return <Bell size={16} />;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const {
    notifications,
    hasMore,
    isListLoading,
    actionError,
    fetchNotifications,
    markNotificationRead,
    markAllRead,
    clearAll,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;

      const authenticated = Boolean(session?.user);
      setIsAuthed(authenticated);
      setAuthChecked(true);

      if (!authenticated) {
        router.replace("/login");
        return;
      }
      fetchNotifications({ reset: true });
    })();

    return () => {
      mounted = false;
    };
  }, [fetchNotifications, router]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const statusOk =
        statusFilter === "all"
          ? true
          : statusFilter === "unread"
            ? !n.is_read
            : n.is_read;

      const typeOk =
        typeFilter === "all" ? true : typeToFilter(n.type) === typeFilter;

      return statusOk && typeOk;
    });
  }, [notifications, statusFilter, typeFilter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const grouped = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const ts = todayStart.getTime();
    return {
      today: filtered.filter((n) => new Date(n.created_at).getTime() >= ts),
      earlier: filtered.filter((n) => new Date(n.created_at).getTime() < ts),
    };
  }, [filtered]);

  const renderNotification = (notification) => (
    <div
      key={notification.id}
      className={`${styles.item} ${!notification.is_read ? styles.itemUnread : ""}`}
      onClick={() => handleOpen(notification)}
    >
      <div className={styles.iconWrap}>{iconForType(notification.type)}</div>
      <div className={styles.body}>
        <div className={styles.topLine}>
          <h3 className={styles.itemTitle}>{notification.title}</h3>
          <span className={styles.time}>
            {toRelativeTime(notification.created_at)}
          </span>
        </div>
        <p className={styles.message}>{notification.message}</p>
        <div className={styles.meta}>
          {!notification.is_read ? <span className={styles.dot} /> : null}
          <span>{notification.is_read ? "Read" : "Unread"}</span>
        </div>
      </div>
      <button
        type="button"
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          deleteNotification(notification.id);
        }}
        aria-label="Delete notification"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const handleOpen = async (notification) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
    }
    const url = getNotificationUrl(notification);
    if (shouldOpenInNewTab(notification)) {
      window.open(url, "_blank");
      return;
    }
    router.push(url);
  };

  if (!authChecked || !isAuthed) {
    return (
      <div className={styles.loginNotice}>
        <p>Checking your account...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Notifications
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount}</span>
          )}
        </h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={markAllRead}
          >
            Mark all as read
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={clearAll}
          >
            Clear all
          </button>
        </div>
      </div>

      {actionError ? (
        <div className={styles.errorLine}>{actionError}</div>
      ) : null}

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>Read status</div>
          <div className={styles.chips}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.chip} ${
                  statusFilter === f ? styles.chipActive : ""
                }`}
                onClick={() => setStatusFilter(f)}
              >
                {f === "all" ? "All" : f === "unread" ? "Unread" : "Read"}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>Type</div>
          <div className={styles.chips}>
            {TYPE_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.chip} ${
                  typeFilter === f ? styles.chipActive : ""
                }`}
                onClick={() => setTypeFilter(f)}
              >
                {f === "all"
                  ? "All"
                  : f === "blog"
                    ? "Blog"
                    : f === "portfolio"
                      ? "Portfolio"
                      : f === "newsletter"
                        ? "Newsletter"
                        : f === "contact"
                          ? "Contact"
                          : f === "admin"
                            ? "Admin"
                            : "Other"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            No notifications match your filters.
          </div>
        ) : (
          <>
            {grouped.today.length > 0 && (
              <>
                <div className={styles.groupHeader}>Today</div>
                {grouped.today.map(renderNotification)}
              </>
            )}
            {grouped.earlier.length > 0 && (
              <>
                <div className={styles.groupHeader}>Earlier</div>
                {grouped.earlier.map(renderNotification)}
              </>
            )}
          </>
        )}
      </div>

      {hasMore ? (
        <button
          type="button"
          className={styles.loadMore}
          onClick={() => fetchNotifications({ reset: false })}
          disabled={isListLoading}
        >
          {isListLoading ? "Loading..." : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
