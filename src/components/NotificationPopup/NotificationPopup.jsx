"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Check,
  Trash2,
  Bell,
  MessageSquare,
  FileText,
  User,
  Mail,
} from "lucide-react";
import styles from "./NotificationPopup.module.css";
import NotificationItem from "../NotificationItem/NotificationItem";
import { useNotifications } from "@/context/NotificationContext";
import {
  getNotificationUrl,
  shouldOpenInNewTab,
} from "@/lib/notificationRouting";

const NotificationPopup = ({ onClose, buttonPosition = { top: 60, right: 20 } }) => {
  const router = useRouter();
  const popupRef = useRef(null);
  const {
    notifications,
    hasMore,
    isListLoading,
    error,
    actionError,
    fetchNotifications,
    markAllRead,
    clearAll,
    markNotificationRead,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications({ reset: true });
  }, [fetchNotifications]);

  // Lock background scroll when popup is open
  useEffect(() => {
    // Store current scroll position
    const scrollY = window.scrollY;

    // Add modal class to body and set scroll position
    document.body.classList.add("modal-open");
    document.body.style.top = `-${scrollY}px`;

    return () => {
      // Remove modal class and restore scroll position
      document.body.classList.remove("modal-open");
      document.body.style.top = "";

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close popup when clicking outside the popup content
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onClose]);

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleClearAll = async () => {
    await clearAll();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "admin_message":
        return <MessageSquare size={16} />;
      case "new_blog_post":
        return <FileText size={16} />;
      case "new_portfolio_post":
        return <FileText size={16} />;
      case "user_registration":
        return <User size={16} />;
      case "user_login":
        return <User size={16} />;
      case "contact_form":
        return <Mail size={16} />;
      case "newsletter_subscription":
        return <Mail size={16} />;
      case "comment_approved":
        return <MessageSquare size={16} />;
      case "comment_reply":
        return <MessageSquare size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const handleNotificationRead = async (notificationId) => {
    const notification = notifications.find((n) => n.id === notificationId);
    if (!notification) return;

    if (!notification.is_read) {
      await markNotificationRead(notificationId);
    }

    const url = getNotificationUrl(notification);
    if (shouldOpenInNewTab(notification)) {
      window.open(url, "_blank");
      return;
    }
    onClose();
    router.push(url);
  };

  // Create dynamic styles for desktop positioning
  const overlayStyle = {
    "--popup-top": `${buttonPosition.top}px`,
    "--popup-right": `${buttonPosition.right}px`,
  };

  return (
    <div className={styles.overlay} style={overlayStyle}>
      <div ref={popupRef} className={styles.popup}>
        <div className={styles.header}>
          <h3>Notifications</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        {actionError ? (
          <div style={{ color: "#dc2626", padding: "0 1rem 0.5rem" }}>
            {actionError}
          </div>
        ) : null}

        {isListLoading && notifications.length === 0 ? (
          <div className={styles.loading}>Loading notifications...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>No notifications</div>
        ) : (
          <>
            <div className={styles.actions}>
              <button
                onClick={handleClearAll}
                className={styles.clearAllButton}
              >
                <Trash2 size={14} />
                Clear all
              </button>
              <button
                onClick={handleMarkAllRead}
                className={styles.markAllReadButton}
              >
                <Check size={14} />
                Mark all as read
              </button>
            </div>

            <div className={styles.notificationsList}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  icon={getNotificationIcon(notification.type)}
                  onClick={() => handleNotificationRead(notification.id)}
                />
              ))}
              {hasMore && (
                <button
                  onClick={() => fetchNotifications({ reset: false })}
                  className={styles.markAllReadButton}
                  disabled={isListLoading}
                >
                  {isListLoading ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
            <div className={styles.footer}>
              <button
                onClick={() => {
                  onClose();
                  router.push("/notifications");
                }}
                className={styles.viewAllButton}
              >
                View all notifications →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPopup;
