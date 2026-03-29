"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

const NOTIFICATION_PAGE_SIZE = 20;
const UNREAD_REVALIDATE_MS = 15_000;

const NotificationContext = createContext(null);

function mergeUniqueById(items) {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
}

export function NotificationProvider({ children }) {
  const supabase = useMemo(() => createClient(), []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isUnreadLoading, setIsUnreadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState("disconnected");

  const unreadCacheRef = useRef({ value: 0, fetchedAt: 0 });
  const realtimeChannelRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const nextCursorRef = useRef(null);

  const refreshUnreadCount = useCallback(
    async ({ force = false } = {}) => {
      if (!isAuthenticated) {
        unreadCacheRef.current = { value: 0, fetchedAt: Date.now() };
        setUnreadCount(0);
        return 0;
      }

      const now = Date.now();
      if (
        !force &&
        now - unreadCacheRef.current.fetchedAt < UNREAD_REVALIDATE_MS
      ) {
        return unreadCacheRef.current.value;
      }

      try {
        setIsUnreadLoading(true);
        const response = await fetch("/api/notifications?limit=1", {
          cache: "no-store",
        });

        if (response.status === 401) {
          setIsAuthenticated(false);
          unreadCacheRef.current = { value: 0, fetchedAt: now };
          setUnreadCount(0);
          return 0;
        }

        if (!response.ok) {
          throw new Error(`Failed to refresh unread count (${response.status})`);
        }

        const payload = await response.json();
        const nextUnread = payload.unreadCount || 0;
        unreadCacheRef.current = { value: nextUnread, fetchedAt: now };
        setUnreadCount(nextUnread);
        return nextUnread;
      } catch {
        return unreadCacheRef.current.value || 0;
      } finally {
        setIsUnreadLoading(false);
      }
    },
    [isAuthenticated],
  );

  const fetchNotifications = useCallback(
    async ({ reset = false } = {}) => {
      if (!currentUserIdRef.current) {
        setNotifications([]);
        setHasMore(false);
        setNextCursor(null);
        nextCursorRef.current = null;
        return;
      }

      const cursor = reset ? null : nextCursorRef.current;
      const query = new URLSearchParams({
        limit: String(NOTIFICATION_PAGE_SIZE),
      });
      if (cursor) query.set("cursor", cursor);

      try {
        setIsListLoading(true);
        setError(null);

        const response = await fetch(`/api/notifications?${query.toString()}`, {
          cache: "no-store",
        });

        if (response.status === 401) {
          setIsAuthenticated(false);
          setNotifications([]);
          setHasMore(false);
          setNextCursor(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch notifications (${response.status})`);
        }

        const payload = await response.json();
        const incoming = payload.notifications || [];

        setNotifications((prev) => {
          if (reset) return incoming;
          return mergeUniqueById([...prev, ...incoming]);
        });
        setHasMore(Boolean(payload.hasMore));
        const next = payload.nextCursor || null;
        setNextCursor(next);
        nextCursorRef.current = next;

        const nextUnread = payload.unreadCount || 0;
        unreadCacheRef.current = { value: nextUnread, fetchedAt: Date.now() };
        setUnreadCount(nextUnread);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to load notifications");
      } finally {
        setIsListLoading(false);
      }
    },
    [],
  );

  const markNotificationRead = useCallback(
    async (notificationId) => {
      setActionError(null);
      const target = notifications.find((n) => n.id === notificationId);
      const wasUnread = Boolean(target && !target.is_read);

      if (wasUnread) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
        );
        setUnreadCount((prev) => {
          const next = Math.max(0, prev - 1);
          unreadCacheRef.current = { value: next, fetchedAt: Date.now() };
          return next;
        });
      }

      try {
        const response = await fetch(
          `/api/notifications/${notificationId}/mark-read`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
        );
        if (!response.ok) {
          throw new Error(`Mark read failed (${response.status})`);
        }
      } catch {
        if (wasUnread) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, is_read: false } : n,
            ),
          );
          setUnreadCount((prev) => {
            const next = prev + 1;
            unreadCacheRef.current = { value: next, fetchedAt: Date.now() };
            return next;
          });
        }
        setActionError("Something went wrong, please try again");
        await refreshUnreadCount({ force: true });
      }
    },
    [notifications, refreshUnreadCount],
  );

  const markAllRead = useCallback(async () => {
    setActionError(null);
    const previousNotifications = notifications;
    const previousUnread = unreadCount;
    const unreadBefore = notifications.filter((n) => !n.is_read).length;
    if (unreadBefore > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
    unreadCacheRef.current = { value: 0, fetchedAt: Date.now() };
    setUnreadCount(0);

    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Mark all failed (${response.status})`);
    } catch {
      setNotifications(previousNotifications);
      unreadCacheRef.current = { value: previousUnread, fetchedAt: Date.now() };
      setUnreadCount(previousUnread);
      setActionError("Something went wrong, please try again");
    }
  }, [notifications, unreadCount]);

  const clearAll = useCallback(async () => {
    setActionError(null);
    const previousNotifications = notifications;
    const previousUnread = unreadCount;
    setNotifications([]);
    setHasMore(false);
    setNextCursor(null);
    nextCursorRef.current = null;
    unreadCacheRef.current = { value: 0, fetchedAt: Date.now() };
    setUnreadCount(0);

    try {
      const response = await fetch("/api/notifications/clear-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Clear all failed (${response.status})`);
    } catch {
      setNotifications(previousNotifications);
      unreadCacheRef.current = { value: previousUnread, fetchedAt: Date.now() };
      setUnreadCount(previousUnread);
      setActionError("Something went wrong, please try again");
    }
  }, [notifications, unreadCount]);

  const deleteNotification = useCallback(
    async (notificationId) => {
      setActionError(null);
      const target = notifications.find((n) => n.id === notificationId);
      if (!target) return;

      const previousNotifications = notifications;
      const previousUnread = unreadCount;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (!target.is_read) {
        setUnreadCount((prev) => {
          const next = Math.max(0, prev - 1);
          unreadCacheRef.current = { value: next, fetchedAt: Date.now() };
          return next;
        });
      }

      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Delete failed (${response.status})`);
        }
      } catch {
        setNotifications(previousNotifications);
        unreadCacheRef.current = { value: previousUnread, fetchedAt: Date.now() };
        setUnreadCount(previousUnread);
        setActionError("Something went wrong, please try again");
      }
    },
    [notifications, unreadCount],
  );

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;

      const nextUserId = session?.user?.id || null;
      currentUserIdRef.current = nextUserId;
      setIsAuthenticated(Boolean(nextUserId));

      if (nextUserId) {
        fetchNotifications({ reset: true });
      } else {
        setNotifications([]);
        unreadCacheRef.current = { value: 0, fetchedAt: Date.now() };
        nextCursorRef.current = null;
        setUnreadCount(0);
      }
    };

    bootstrapAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const nextUserId = session?.user?.id || null;
        currentUserIdRef.current = nextUserId;
        setIsAuthenticated(Boolean(nextUserId));

        if (nextUserId) {
          await fetchNotifications({ reset: true });
        } else {
          setNotifications([]);
          unreadCacheRef.current = { value: 0, fetchedAt: Date.now() };
          setUnreadCount(0);
          setHasMore(false);
          setNextCursor(null);
          nextCursorRef.current = null;
          setRealtimeStatus("disconnected");
        }
      },
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [fetchNotifications, supabase]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserIdRef.current) {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      setRealtimeStatus("disconnected");
      return;
    }

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const userId = currentUserIdRef.current;

    const channel = supabase
      .channel(`global-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new;
          setNotifications((prev) => mergeUniqueById([incoming, ...prev]));
          if (!incoming.is_read) {
            setUnreadCount((prev) => {
              const next = prev + 1;
              unreadCacheRef.current = { value: next, fetchedAt: Date.now() };
              return next;
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n)),
          );

          if (payload.old.is_read !== payload.new.is_read) {
            setUnreadCount((prev) => {
              if (payload.old.is_read && !payload.new.is_read) {
                const next = prev + 1;
                unreadCacheRef.current = { value: next, fetchedAt: Date.now() };
                return next;
              }
              if (!payload.old.is_read && payload.new.is_read)
                {
                  const next = Math.max(0, prev - 1);
                  unreadCacheRef.current = { value: next, fetchedAt: Date.now() };
                  return next;
                }
              return prev;
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          if (!payload.old.is_read) {
            setUnreadCount((prev) => {
              const next = Math.max(0, prev - 1);
              unreadCacheRef.current = { value: next, fetchedAt: Date.now() };
              return next;
            });
          }
        },
      )
      .subscribe((status) => {
        setRealtimeStatus(status);
      });

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [isAuthenticated, supabase]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      unreadCount,
      notifications,
      hasMore,
      isListLoading,
      isUnreadLoading,
      error,
      actionError,
      realtimeStatus,
      refreshUnreadCount,
      fetchNotifications,
      markNotificationRead,
      markAllRead,
      clearAll,
      deleteNotification,
    }),
    [
      clearAll,
      error,
      actionError,
      fetchNotifications,
      hasMore,
      isAuthenticated,
      isListLoading,
      isUnreadLoading,
      markAllRead,
      markNotificationRead,
      notifications,
      realtimeStatus,
      refreshUnreadCount,
      unreadCount,
      deleteNotification,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return context;
}
