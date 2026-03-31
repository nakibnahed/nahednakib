"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const AUTH_INIT_TIMEOUT_MS = 8000;
const AuthSessionContext = createContext(null);

function clearSupabaseAuthStorageKeys() {
  if (typeof window === "undefined") return;

  const keysToDelete = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;
    const isSupabaseAuthKey =
      key.includes("supabase.auth.token") ||
      (key.startsWith("sb-") && key.includes("-auth-token"));
    if (isSupabaseAuthKey) keysToDelete.push(key);
  }

  keysToDelete.forEach((key) => window.localStorage.removeItem(key));
}

function isSessionValid(session) {
  if (!session) return true;
  const hasUserId = Boolean(session.user?.id);
  const hasAccessToken = typeof session.access_token === "string";
  if (!hasUserId || !hasAccessToken) return false;

  if (typeof session.expires_at === "number") {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (session.expires_at <= nowSeconds) return false;
  }

  return true;
}

export function AuthSessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const timedOutRef = useRef(false);

  useEffect(() => {
    let active = true;
    const initTimeoutId = window.setTimeout(() => {
      if (!active) return;
      timedOutRef.current = true;
      setError("Auth initialization timed out");
      setLoading(false);
      setInitialized(true);
    }, AUTH_INIT_TIMEOUT_MS);

    const recoverInvalidSession = async () => {
      try {
        clearSupabaseAuthStorageKeys();
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        clearSupabaseAuthStorageKeys();
      }
      if (!active) return;
      setSession(null);
      setUser(null);
    };

    const hydrate = async () => {
      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!active || timedOutRef.current) return;

        if (sessionError || !isSessionValid(currentSession)) {
          await recoverInvalidSession();
        } else {
          setSession(currentSession ?? null);
          setUser(currentSession?.user ?? null);
          setError(null);
        }
      } catch {
        if (!active || timedOutRef.current) return;
        await recoverInvalidSession();
      } finally {
        if (!active || timedOutRef.current) return;
        window.clearTimeout(initTimeoutId);
        setLoading(false);
        setInitialized(true);
      }
    };

    hydrate();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!active) return;
        if (!isSessionValid(nextSession)) {
          await recoverInvalidSession();
          return;
        }
        setSession(nextSession ?? null);
        setUser(nextSession?.user ?? null);
        setLoading(false);
        setInitialized(true);
        setError(null);
      },
    );

    return () => {
      active = false;
      window.clearTimeout(initTimeoutId);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      initialized,
      error,
      isAuthenticated: Boolean(user),
    }),
    [error, initialized, loading, session, user],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}
