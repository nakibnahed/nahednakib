"use client";

import { useState } from "react";
import { Clock, ExternalLink } from "lucide-react";
import styles from "./NotificationItem.module.css";

export default function NotificationItem({ notification, onClick, icon }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case "admin_message":
        return "var(--primary-color, #ee681a)";
      case "new_blog_post":
        return "#3b82f6";
      case "new_portfolio_post":
        return "#10b981";
      case "user_registration":
        return "#8b5cf6";
      case "user_login":
        return "#8b5cf6";
      case "contact_form":
        return "#3b82f6";
      case "newsletter_subscription":
        return "#3b82f6";
      case "comment_approved":
        return "#10b981";
      case "comment_reply":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const handleClick = () => {
    // Call the onClick handler (which marks as read)
    onClick();
  };

  return (
    <div
      className={`${styles.notificationItem} ${
        !notification.is_read ? styles.unread : ""
      } ${isClicked ? styles.clicked : ""}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={styles.iconContainer}
        style={{
          backgroundColor: `${getNotificationTypeColor(notification.type)}20`,
          borderColor: getNotificationTypeColor(notification.type),
        }}
      >
        <div
          className={styles.icon}
          style={{ color: getNotificationTypeColor(notification.type) }}
        >
          {icon}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h4 className={styles.title}>{notification.title}</h4>
          <div className={styles.time}>
            <Clock size={12} />
            <span>{formatTimeAgo(notification.created_at)}</span>
          </div>
        </div>

        <p className={styles.message}>{notification.message}</p>

        {notification.related_content_type &&
          notification.related_content_id && (
            <div className={styles.relatedContent}>
              <ExternalLink size={12} />
              <span>View {notification.related_content_type}</span>
            </div>
          )}
      </div>

      {!notification.is_read && <div className={styles.unreadIndicator} />}
    </div>
  );
}
