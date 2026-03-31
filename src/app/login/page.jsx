"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./Login.module.css";
import {
  getSiteUrl,
  isValidEmail,
  mapAuthError,
  normalizeEmail,
} from "@/utils/authFeedback";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12
        s5.373-12 12-12c3.059 0 5.842 1.154 7.953 3.047l5.657-5.657C34.046 6.053 29.27 4 24 4
        12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 19.016 12 24 12c3.059 0 5.842 1.154 7.953 3.047
        l5.657-5.657C34.046 6.053 29.27 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.169 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.152 35.091 26.716 36 24 36
        c-5.201 0-9.617-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.571l.003-.002
        6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadingMode, setLoadingMode] = useState(null);

  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed");
  const nextPath = searchParams.get("next");
  const router = useRouter();

  function resolveSafeNextPath(rawPath) {
    if (!rawPath || typeof rawPath !== "string") return null;
    if (!rawPath.startsWith("/")) return null;
    if (rawPath.startsWith("//")) return null;
    return rawPath;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);
    const emailNorm = normalizeEmail(email);
    if (!isValidEmail(emailNorm)) {
      setFeedback({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    if (!password) {
      setFeedback({ type: "error", text: "Please enter your password." });
      return;
    }

    setLoadingMode("email");

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password,
    });

    if (error) {
      setFeedback({ type: "error", text: mapAuthError(error, "login") });
      setLoadingMode(null);
      return;
    }

    // Send welcome notification for authenticated users
    try {
      console.log("Sending welcome notification for user:", data.user.email);
      const welcomeResponse = await fetch("/api/notifications/send-welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (welcomeResponse.ok) {
        const welcomeData = await welcomeResponse.json();
        console.log("Welcome notification sent successfully:", welcomeData);
      } else {
        const errorData = await welcomeResponse.json();
        console.error("Welcome notification failed:", errorData);
      }
    } catch (error) {
      console.error("Error sending welcome notification:", error);
    }

    // Check user role for routing
    try {
      const safeNextPath = resolveSafeNextPath(nextPath);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        router.push(safeNextPath || "/users/profile");
      } else if (profile?.role === "admin") {
        router.push(safeNextPath || "/admin/");
      } else {
        router.push(safeNextPath || "/users/profile");
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      router.push(resolveSafeNextPath(nextPath) || "/users/profile");
    }
    setLoadingMode(null);
  }

  async function handleGoogleLogin() {
    setFeedback(null);
    setLoadingMode("google");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const safeNextPath = resolveSafeNextPath(nextPath) || "/users/profile";
      const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        setFeedback({
          type: "error",
          text: "Google login is not available right now. Please use email login.",
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        text: "Google login failed. Please try again.",
      });
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <div className="pageMainContainer">
      <div className={styles.container}>
        <h1 className={styles.title}>Login</h1>
        <p className={styles.subtitle}>Welcome back. Sign in to continue.</p>
        {confirmed === "1" && (
          <p className={styles.successBox} role="status" aria-live="polite">
            Email confirmed successfully! You can log in now.
          </p>
        )}
        {feedback && (
          <p
            className={feedback.type === "error" ? styles.errorBox : styles.successBox}
            role={feedback.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {feedback.text}
          </p>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              autoComplete="email"
              disabled={Boolean(loadingMode)}
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <div className={styles.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`${styles.input} ${styles.inputWithToggle}`}
                autoComplete="current-password"
                disabled={Boolean(loadingMode)}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={Boolean(loadingMode)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <p className={styles.hint}>
            Having trouble? You can reset your password anytime.
          </p>

          <button
            type="submit"
            className={styles.button}
            disabled={Boolean(loadingMode)}
          >
            {loadingMode === "email" ? (
              "Logging in..."
            ) : (
              <>
                <span>Login</span>
                <span className={styles.arrow}>→</span>
              </>
            )}
          </button>
          <button
            type="button"
            className={`${styles.secondaryButton} ${styles.googleButton}`}
            onClick={handleGoogleLogin}
            disabled={Boolean(loadingMode)}
          >
            {loadingMode === "google" ? (
              "Connecting..."
            ) : (
              <>
                <span className={styles.googleIconWrap}>
                  <GoogleIcon />
                </span>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </form>
        <div className={styles.links}>
          <a href="/register" className={styles.link}>
            Register now
          </a>
          <a href="/forgot-password" className={styles.link}>
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
