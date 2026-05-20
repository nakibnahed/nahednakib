"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

const LS_GOAL_ID = "lt_active_goalId";
const LS_STARTED_AT = "lt_active_startedAt";
const LS_PAUSED_MS = "lt_active_pausedMs";
const LS_RUNNING = "lt_active_running";

export function useLearning(goalId) {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [hasMoreSessions, setHasMoreSessions] = useState(false);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [timerRecovered, setTimerRecovered] = useState(false);

  const offsetRef = useRef(0);
  const lsWriteTimer = useRef(null);

  const clearActiveSession = useCallback(() => {
    localStorage.removeItem(LS_GOAL_ID);
    localStorage.removeItem(LS_STARTED_AT);
    localStorage.removeItem(LS_PAUSED_MS);
    localStorage.removeItem(LS_RUNNING);
  }, []);

  const fetchStats = useCallback(async (gid) => {
    if (!gid) return;
    try {
      const res = await fetch(`/api/learning/stats/${gid}`);
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch {
      /* silently ignore — stats are supplemental */
    }
  }, []);

  const fetchAnalytics = useCallback(async (gid) => {
    if (!gid) return;
    try {
      const res = await fetch(`/api/learning/analytics/${gid}`);
      if (!res.ok) return;
      const data = await res.json();
      setAnalytics(data);
    } catch {
      /* silently ignore */
    }
  }, []);

  const fetchSessions = useCallback(async (gid, reset = false) => {
    if (!gid) return;
    const offset = reset ? 0 : offsetRef.current;
    try {
      setLoading(true);
      const res = await fetch(`/api/learning/sessions?goalId=${gid}&limit=30&offset=${offset}`);
      if (!res.ok) {
        setError("Could not load sessions");
        return;
      }
      const data = await res.json();
      setSessions((prev) => (reset ? data.sessions : [...prev, ...data.sessions]));
      setHasMoreSessions(data.hasMore);
      offsetRef.current = reset ? data.sessions.length : offset + data.sessions.length;
    } catch {
      setError("Could not load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSession = useCallback(async (payload) => {
    const optimistic = { id: `temp-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
    setSessions((prev) => [optimistic, ...prev]);
    try {
      const res = await fetch("/api/learning/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        setSessions((prev) => prev.filter((s) => s.id !== optimistic.id));
        setError(msg || "Failed to save session");
        return { success: false };
      }
      const { session } = await res.json();
      setSessions((prev) => [session, ...prev.filter((s) => s.id !== optimistic.id)]);
      clearActiveSession();
      await fetchStats(payload.goalId);
      return { success: true, session };
    } catch {
      setSessions((prev) => prev.filter((s) => s.id !== optimistic.id));
      setError("Failed to save session");
      return { success: false };
    }
  }, [clearActiveSession, fetchStats]);

  const loadMoreSessions = useCallback(() => {
    if (goalId) fetchSessions(goalId, false);
  }, [goalId, fetchSessions]);

  const refreshAll = useCallback(async (gid) => {
    const id = gid || goalId;
    if (!id) return;
    await Promise.all([fetchStats(id), fetchSessions(id, true)]);
  }, [goalId, fetchStats, fetchSessions]);

  const writeLsDebounced = useCallback((key, value) => {
    if (lsWriteTimer.current) clearTimeout(lsWriteTimer.current);
    lsWriteTimer.current = setTimeout(() => {
      try { localStorage.setItem(key, value); } catch { /* ignore quota */ }
    }, 300);
  }, []);

  useEffect(() => {
    if (!goalId) return;
    offsetRef.current = 0;
    setSessions([]);
    setStats(null);
    setAnalytics(null);
    setError(null);

    const storedGoalId = localStorage.getItem(LS_GOAL_ID);
    if (storedGoalId && storedGoalId === goalId) {
      setTimerRecovered(true);
    } else {
      setTimerRecovered(false);
    }

    fetchSessions(goalId, true);
    fetchStats(goalId);
  }, [goalId, fetchSessions, fetchStats]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") {
        clearActiveSession();
        setSessions([]);
        setStats(null);
        setAnalytics(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearActiveSession]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === LS_GOAL_ID && e.newValue !== goalId) {
        setTimerRecovered(false);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [goalId]);

  return {
    loading,
    sessions,
    hasMoreSessions,
    stats,
    analytics,
    error,
    timerRecovered,
    saveSession,
    loadMoreSessions,
    fetchAnalytics,
    clearActiveSession,
    refreshAll,
    writeLsDebounced,
  };
}
