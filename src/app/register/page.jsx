"use client";
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../login/Login.module.css";
import {
  getPasswordChecks,
  getSiteUrl,
  isPasswordStrong,
  isValidEmail,
  mapAuthError,
  normalizeEmail,
} from "@/utils/authFeedback";
import { showAppToast } from "@/lib/showAppToast";

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

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const emailFromQuery = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadingMode, setLoadingMode] = useState(null);

  const notify = useCallback((fb) => {
    setFeedback(fb);
    if (fb?.text) {
      showAppToast(fb.text, fb.type === "error" ? "error" : "success");
    }
  }, []);

  function resolveSafeNextPath(rawPath) {
    if (!rawPath || typeof rawPath !== "string") return null;
    if (!rawPath.startsWith("/")) return null;
    if (rawPath.startsWith("//")) return null;
    return rawPath;
  }

  const safeNextPath = resolveSafeNextPath(nextPath);
  const loginHref = safeNextPath
    ? `/login?next=${encodeURIComponent(safeNextPath)}`
    : "/login";

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);
    const emailNorm = normalizeEmail(email);
    if (!isValidEmail(emailNorm)) {
      notify({
        type: "error",
        text: "Please enter a valid email address.",
      });
      return;
    }
    if (!isPasswordStrong(password)) {
      notify({
        type: "error",
        text: "Password must be at least 8 characters and include letters and numbers.",
      });
      return;
    }
    setLoadingMode("email");

    const { supabase } = await import("@/services/supabaseClient");

    const { data, error } = await supabase.auth.signUp({
      email: emailNorm,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/login?confirmed=1${
          safeNextPath ? `&next=${encodeURIComponent(safeNextPath)}` : ""
        }`,
      },
    });

    if (error) {
      notify({ type: "error", text: mapAuthError(error, "register") });
      setLoadingMode(null);
      return;
    }
    if (
      data?.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      // Existing account: attempt instant login with entered password.
      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: emailNorm,
          password,
        });
      if (loginError) {
        notify({
          type: "error",
          text: "This email is already registered. Enter your current password to log in.",
        });
        setLoadingMode(null);
        return;
      }

      showAppToast("Signed in successfully.", "success");

      const safeNextPath = resolveSafeNextPath(nextPath) || "/users/profile";
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", loginData?.user?.id)
          .single();
        router.push(profile?.role === "admin" ? "/admin/" : safeNextPath);
      } catch (err) {
        router.push(safeNextPath);
      }
      setLoadingMode(null);
      return;
    }

    notify({
      type: "success",
      text: "Account created. Check your inbox and confirm your email before logging in.",
    });
    setPassword("");
    setLoadingMode(null);
  }

  async function handleGoogleSignup() {
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
        notify({
          type: "error",
          text: "Google signup is unavailable right now. Please use email signup.",
        });
      }
    } catch (error) {
      notify({
        type: "error",
        text: "Google signup failed. Please try again.",
      });
    } finally {
      setLoadingMode(null);
    }
  }

  const passwordChecks = getPasswordChecks(password);

  return (
    <div className="pageMainContainer">
      <div className={styles.container}>
        <h1 className={styles.title}>Register</h1>
        <p className={styles.subtitle}>Create your account in less than a minute.</p>
        {feedback && (
          <span
            className={styles.visuallyHidden}
            role={feedback.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {feedback.text}
          </span>
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
                autoComplete="new-password"
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
          <div className={styles.ruleList}>
            <span className={passwordChecks.minLength ? styles.ruleOk : styles.rule}>
              8+ characters
            </span>
            <span className={passwordChecks.hasLetter ? styles.ruleOk : styles.rule}>
              Contains letters
            </span>
            <span className={passwordChecks.hasNumber ? styles.ruleOk : styles.rule}>
              Contains number(s)
            </span>
          </div>
          <button
            type="submit"
            className={styles.button}
            disabled={Boolean(loadingMode)}
          >
            {loadingMode === "email" ? "Registering..." : "Register"}
          </button>
          <button
            type="button"
            className={`${styles.secondaryButton} ${styles.googleButton}`}
            onClick={handleGoogleSignup}
            disabled={Boolean(loadingMode)}
          >
            {loadingMode === "google"
              ? "Connecting..."
              : (
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
          <a href={loginHref} className={styles.link}>
            Already have an account? Login
          </a>
        </div>
      </div>
    </div>
  );
}
