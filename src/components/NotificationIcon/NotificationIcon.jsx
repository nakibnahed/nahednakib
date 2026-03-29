"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import styles from "./NotificationIcon.module.css";
import NotificationPopup from "../NotificationPopup/NotificationPopup";
import { useNotifications } from "@/context/NotificationContext";

const NotificationIcon = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [isNewNotification, setIsNewNotification] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const prevUnreadCountRef = useRef(0);
  const {
    isAuthenticated,
    unreadCount,
    realtimeStatus,
    isUnreadLoading,
    refreshUnreadCount,
  } = useNotifications();

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setIsNewNotification(true);
      const timer = setTimeout(() => {
        setIsNewNotification(false);
      }, 600);
      prevUnreadCountRef.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const calculateButtonPosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setButtonPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  };

  const handleIconClick = async () => {
    if (!isAuthenticated) return;

    calculateButtonPosition();
    setShowPopup(true);
  };

  const handlePopupClose = async () => {
    setShowPopup(false);
    if (isAuthenticated) {
      await refreshUnreadCount({ force: true });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.notificationIcon}>
      <button
        ref={buttonRef}
        onClick={handleIconClick}
        className={styles.iconButton}
        disabled={isUnreadLoading}
        title={`Notifications (Real-time: ${realtimeStatus})`}
      >
        <Bell size={26} />
        {unreadCount > 0 && (
          <span
            className={`${styles.badge} ${
              isNewNotification ? styles.newNotification : ""
            }`}
          >
            {unreadCount}
          </span>
        )}
        {/* Real-time status indicator */}
        <div
          className={`${styles.realtimeIndicator} ${
            realtimeStatus === "SUBSCRIBED"
              ? styles.connected
              : realtimeStatus === "CHANNEL_ERROR" ||
                realtimeStatus === "CLOSED"
              ? styles.error
              : styles.connecting
          }`}
          title={`Real-time: ${realtimeStatus}`}
        />
      </button>

      {showPopup &&
        typeof document !== "undefined" &&
        createPortal(
          <NotificationPopup
            onClose={handlePopupClose}
            buttonPosition={buttonPosition}
          />,
          document.body
        )}
    </div>
  );
};

export default NotificationIcon;
