"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./NotificationIcon.module.css";
import NotificationPopup from "../NotificationPopup/NotificationPopup";

const NotificationIcon = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNewNotification, setIsNewNotification] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("disconnected");
  const [popupRefreshKey, setPopupRefreshKey] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log("Auth check failed:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!isAuthenticated) {
      // Reset real-time status when not authenticated
      setRealtimeStatus("disconnected");
      return;
    }

    const supabase = createClient();
    let subscription = null;
    let retryCount = 0;
    const maxRetries = 3;
    let isComponentMounted = true; // Track if component is still mounted

    const setupRealtimeSubscription = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;
        if (!user || !isComponentMounted) {
          console.log(
            "No user session found for real-time subscription or component unmounted"
          );
          return;
        }

        console.log("Setting up real-time subscription for user:", user.id);

        // Subscribe to new notifications for the current user
        subscription = supabase
          .channel(`notifications-${user.id}-${Date.now()}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("🎉 New notification received:", payload);

              // Only update unread count if the notification is actually unread
              if (!payload.new.is_read) {
                setUnreadCount((prev) => {
                  const newCount = prev + 1;
                  console.log(
                    `📊 Updating unread count: ${prev} → ${newCount}`
                  );
                  return newCount;
                });

                // Trigger animation only for unread notifications
                setIsNewNotification(true);
                setTimeout(() => setIsNewNotification(false), 600);
              } else {
                console.log(
                  "📝 New notification is already read, not updating count"
                );
              }

              // Force a re-render to ensure the badge shows up
              setForceUpdate((prev) => prev + 1);

              // If popup is open, refresh it to show new notification
              setTimeout(() => {
                if (showPopup) {
                  setPopupRefreshKey((prev) => prev + 1);
                }
              }, 100);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("📝 Notification updated:", payload);
              // Refresh count when notification is marked as read
              if (payload.new.is_read && !payload.old.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("🗑️ Notification deleted:", payload);
              console.log(
                "🗑️ Deleted notification was read:",
                payload.old.is_read
              );

              // Decrease unread count if deleted notification was unread
              if (!payload.old.is_read) {
                setUnreadCount((prev) => {
                  const newCount = Math.max(0, prev - 1);
                  console.log(
                    `🗑️ Decreasing unread count: ${prev} → ${newCount}`
                  );
                  return newCount;
                });
              } else {
                console.log(
                  "🗑️ Deleted notification was already read, no count change"
                );
              }

              // If popup is open, refresh it to remove deleted notification
              if (showPopup) {
                setPopupRefreshKey((prev) => prev + 1);
              }
            }
          )
          .subscribe((status) => {
            console.log("🔌 Real-time subscription status:", status);
            setRealtimeStatus(status);

            if (status === "SUBSCRIBED") {
              console.log("✅ Real-time notifications are now active!");
              retryCount = 0; // Reset retry count on success
            } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
              console.error("❌ Real-time subscription failed:", status);
              // Only retry if component is still mounted and user is still authenticated
              if (retryCount < maxRetries && isComponentMounted) {
                retryCount++;
                console.log(
                  `🔄 Retrying real-time subscription (${retryCount}/${maxRetries})...`
                );
                setTimeout(() => {
                  if (subscription && isComponentMounted) {
                    supabase.removeChannel(subscription);
                    setupRealtimeSubscription();
                  }
                }, 2000 * retryCount); // Exponential backoff
              } else if (!isComponentMounted) {
                console.log("🛑 Component unmounted, stopping retry attempts");
              } else {
                console.error(
                  "❌ Max retries reached for real-time subscription"
                );
              }
            }
          });

        return subscription;
      } catch (error) {
        console.error("❌ Error setting up real-time subscription:", error);
        if (retryCount < maxRetries && isComponentMounted) {
          retryCount++;
          console.log(
            `🔄 Retrying real-time subscription after error (${retryCount}/${maxRetries})...`
          );
          setTimeout(() => {
            if (isComponentMounted) {
              setupRealtimeSubscription();
            }
          }, 2000 * retryCount);
        }
        return null;
      }
    };

    setupRealtimeSubscription();

    return () => {
      isComponentMounted = false; // Mark component as unmounted
      if (subscription) {
        console.log("🧹 Cleaning up real-time subscription");
        supabase.removeChannel(subscription);
      }
    };
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/notifications?limit=1");

      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated, this is normal
          setUnreadCount(0);
          setIsAuthenticated(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setError(error.message);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  const calculateButtonPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // Distance from right edge
      });
    }
  };

  const handleIconClick = () => {
    if (isAuthenticated) {
      // Calculate button position before opening popup
      calculateButtonPosition();
      setShowPopup(true);
      setPopupRefreshKey((prev) => prev + 1); // Force refresh when popup opens
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  };

  // Don't render anything if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.notificationIcon}>
      <button
        ref={buttonRef}
        onClick={handleIconClick}
        className={styles.iconButton}
        disabled={isLoading}
        title={`Notifications (Real-time: ${realtimeStatus})`}
      >
        <Bell size={20} />
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
            onNotificationRead={(type = "single") => {
              if (type === "clear-all") {
                setUnreadCount(0);
                // Force refresh count from server after clear-all to ensure accuracy
                setTimeout(() => {
                  fetchUnreadCount();
                }, 1000);
              } else if (type === "mark-all-read") {
                setUnreadCount(0);
              } else {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }}
            refreshKey={popupRefreshKey}
            buttonPosition={buttonPosition}
          />,
          document.body
        )}
    </div>
  );
};

export default NotificationIcon;
