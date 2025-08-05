"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Trash2,
  Bell,
  MessageSquare,
  FileText,
  User,
  Mail,
  Heart,
} from "lucide-react";
import styles from "./NotificationPopup.module.css";
import NotificationItem from "../NotificationItem/NotificationItem";

const NotificationPopup = ({ onClose, onNotificationRead, refreshKey = 0 }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const popupRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/notifications?limit=20");

      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated, this is normal
          setNotifications([]);
          setError("Please log in to view notifications");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Remove the real-time subscription from popup since it's handled by parent NotificationIcon
  // The popup will refresh notifications when it opens and when notifications are marked as read

  useEffect(() => {
    fetchNotifications();
  }, [refreshKey]); // Re-fetch when refreshKey changes (popup opens)

  useEffect(() => {
    const handleClickOutside = (event) => {
      // On mobile, only close if clicking the overlay background, not the popup itself
      if (window.innerWidth <= 768) {
        if (event.target.classList.contains(styles.overlay)) {
          onClose();
        }
      } else {
        // Desktop behavior - close when clicking outside the popup
        if (popupRef.current && !popupRef.current.contains(event.target)) {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, is_read: true }))
        );
        onNotificationRead("mark-all-read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      console.log("🗑️ Clearing all notifications...");

      const response = await fetch("/api/notifications/clear-all", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("🗑️ Clear All API Response:", result);
        console.log(
          `📊 Expected: ${result.expectedCount}, Deleted: ${result.actualDeletedCount}, Remaining: ${result.remainingCount}`
        );

        if (result.fullyCleared) {
          console.log(
            "✅ All notifications successfully cleared from database"
          );
          // Clear notifications locally - this will show "No notifications" immediately
          setNotifications([]);
          // Trigger parent to set unread count to 0
          onNotificationRead("clear-all");
          console.log("✅ Popup should now show 'No notifications'");
        } else {
          console.warn(
            "⚠️ Not all notifications were cleared! Remaining:",
            result.remainingCount
          );
          // Still clear locally but warn about database state
          setNotifications([]);
          onNotificationRead("clear-all");
        }
      } else {
        console.error("❌ Failed to clear notifications:", response.status);
        const errorData = await response.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("❌ Error clearing all notifications:", error);
    }
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
    try {
      // Find the notification to check if it's already read
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification && notification.is_read) {
        // If already read, just navigate to related content if it exists
        if (
          notification.related_content_type &&
          notification.related_content_id
        ) {
          const url = `/${notification.related_content_type}/${notification.related_content_id}`;
          window.open(url, "_blank");
        }
        return;
      }

      const response = await fetch(
        `/api/notifications/${notificationId}/mark-read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
        onNotificationRead("single");

        // Navigate to related content if it exists
        if (
          notification &&
          notification.related_content_type &&
          notification.related_content_id
        ) {
          const url = `/${notification.related_content_type}/${notification.related_content_id}`;
          window.open(url, "_blank");
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className={styles.overlay}>
      <div ref={popupRef} className={styles.popup}>
        <div className={styles.header}>
          <h3>Notifications</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPopup;
