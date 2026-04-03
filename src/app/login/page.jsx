"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./Login.module.css";
import {
  getSiteUrl,
  isValidEmail,
  mapAuthError,
  normalizeEmail,
} from "@/utils/authFeedback";
import { showAppToast } from "@/lib/showAppToast";
import { createClient } from "@/lib/supabase/client";

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
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadingMode, setLoadingMode] = useState(null);

  const passwordInputRef = useRef(null);
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed");
  const nextPath = searchParams.get("next");
  const router = useRouter();

  const notify = useCallback((fb) => {
    setFeedback(fb);
    if (fb?.text) {
      showAppToast(fb.text, fb.type === "error" ? "error" : "success");
    }
  }, []);

  useEffect(() => {
    if (confirmed === "1") {
      showAppToast(
        "Email confirmed successfully. You can sign in now.",
        "success",
      );
    }
  }, [confirmed]);

  function resolveSafeNextPath(rawPath) {
    if (!rawPath || typeof rawPath !== "string") return null;
    if (!rawPath.startsWith("/")) return null;
    if (rawPath.startsWith("//")) return null;
    return rawPath;
  }

  const safeNextPath = resolveSafeNextPath(nextPath);
  const forgotHref = safeNextPath
    ? `/forgot-password?next=${encodeURIComponent(safeNextPath)}`
    : "/forgot-password";

  useEffect(() => {
    if (step === "password") {
      const t = setTimeout(() => passwordInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [step]);

  async function handleCheckEmail(e) {
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

    setLoadingMode("check");
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailNorm }),
      });

      if (!res.ok) {
        notify({
          type: "error",
          text: "We could not verify that email. Please try again.",
        });
        setLoadingMode(null);
        return;
      }

      const data = await res.json();

      if (data.status === "not_found") {
        const params = new URLSearchParams();
        params.set("email", emailNorm);
        if (safeNextPath) params.set("next", safeNextPath);
        router.push(`/register?${params.toString()}`);
        setLoadingMode(null);
        return;
      }

      if (data.status === "has_password") {
        setStep("password");
        setLoadingMode(null);
        return;
      }

      if (data.status === "google_only") {
        setStep("google_only");
        setLoadingMode(null);
        return;
      }

      notify({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } catch {
      notify({
        type: "error",
        text: "We could not verify that email. Please try again.",
      });
    }
    setLoadingMode(null);
  }

  async function handlePasswordSubmit(e) {
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
    if (!password) {
      notify({ type: "error", text: "Please enter your password." });
      return;
    }

    setLoadingMode("email");

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password,
    });

    if (error) {
      notify({ type: "error", text: mapAuthError(error, "login") });
      setLoadingMode(null);
      return;
    }

    showAppToast("Signed in successfully.", "success");

    try {
      await fetch("/api/notifications/send-welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch {
      // non-critical
    }

    try {
      const next = resolveSafeNextPath(nextPath);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        router.push(next || "/users/profile");
      } else if (profile?.role === "admin") {
        router.push(next || "/admin/");
      } else {
        router.push(next || "/users/profile");
      }
    } catch (err) {
      console.error("Error checking user role:", err);
      router.push(resolveSafeNextPath(nextPath) || "/users/profile");
    }
    setLoadingMode(null);
  }

  async function handleGoogleLogin() {
    setFeedback(null);
    setLoadingMode("google");
    try {
      const supabase = createClient();
      const safeNext = resolveSafeNextPath(nextPath) || "/users/profile";
      const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
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
          text: "Google login is not available right now. Please use email login.",
        });
      }
    } catch {
      notify({
        type: "error",
        text: "Google login failed. Please try again.",
      });
    } finally {
      setLoadingMode(null);
    }
  }

  function handleUseDifferentEmail() {
    setStep("email");
    setPassword("");
    setFeedback(null);
    setShowPassword(false);
  }

  const subtitle =
    step === "email"
      ? "Enter your email to sign in or create an account."
      : step === "password"
        ? "Enter your password for this email."
        : "This email is linked to Google.";

  return (
    <div className="pageMainContainer">
      <div className={styles.container}>
        <h1 className={styles.title}>Login</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        {feedback && (
          <span
            className={styles.visuallyHidden}
            role="alert"
            aria-live="polite"
          >
            {feedback.text}
          </span>
        )}

        {step === "email" && (
          <form onSubmit={handleCheckEmail} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
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
            <button
              type="submit"
              className={styles.button}
              disabled={Boolean(loadingMode)}
            >
              {loadingMode === "check" ? (
                "Checking..."
              ) : (
                <>
                  <span>Continue</span>
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
        )}

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="login-email-readonly">Email</label>
              <input
                id="login-email-readonly"
                type="email"
                value={email}
                readOnly
                className={styles.input}
                autoComplete="email"
                disabled={Boolean(loadingMode)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="login-password">Password</label>
              <div className={styles.passwordWrap}>
                <input
                  ref={passwordInputRef}
                  id="login-password"
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
                  <span>Sign in</span>
                  <span className={styles.arrow}>→</span>
                </>
              )}
            </button>
            <div className={styles.links}>
              <a href={forgotHref} className={styles.link}>
                Forgot password?
              </a>
              <button
                type="button"
                className={styles.linkButton}
                onClick={handleUseDifferentEmail}
                disabled={Boolean(loadingMode)}
              >
                ← Use a different email
              </button>
            </div>
          </form>
        )}

        {step === "google_only" && (
          <div className={styles.form}>
            <div className={styles.infoBox}>
              This account uses Google sign-in. Continue with Google below, or
              set a password using the link to use email next time.
            </div>
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
            <div className={styles.divider}>
              <span>or</span>
            </div>
            <div className={styles.links}>
              <a href={forgotHref} className={styles.link}>
                Set a password
              </a>
              <button
                type="button"
                className={styles.linkButton}
                onClick={handleUseDifferentEmail}
                disabled={Boolean(loadingMode)}
              >
                ← Use a different email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
