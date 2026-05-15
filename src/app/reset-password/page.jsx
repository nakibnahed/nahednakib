"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../login/Login.module.css";
import {
  getPasswordChecks,
  isPasswordStrong,
  mapAuthError,
} from "@/utils/authFeedback";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guarded, setGuarded] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("pwd_reset_pending")) {
      // Not a legitimate recovery flow — send them to request a new link.
      router.replace("/forgot-password");
      return;
    }

    // Store the recovery tokens then immediately sign the user out so they
    // appear logged-out in the navbar. The tokens are restored at submit time
    // just long enough to call updateUser, then discarded.
    const prepareRecovery = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        sessionStorage.setItem("pwd_reset_access", session.access_token);
        sessionStorage.setItem("pwd_reset_refresh", session.refresh_token);
        // local scope: clears the browser session so the navbar shows logged-out,
        // but does NOT revoke the token server-side — we need it for updateUser.
        await supabase.auth.signOut({ scope: "local" });
      } else {
        // No active session — the recovery link was already used or expired.
        sessionStorage.removeItem("pwd_reset_pending");
        setFeedback({
          type: "error",
          text: "This reset link has expired. Please request a new one.",
        });
      }

      setGuarded(true);
    };

    prepareRecovery();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);

    if (!isPasswordStrong(password)) {
      setFeedback({
        type: "error",
        text: "Password must be at least 8 characters and include letters and numbers.",
      });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ type: "error", text: "Passwords do not match." });
      return;
    }

    const accessToken = sessionStorage.getItem("pwd_reset_access");
    const refreshToken = sessionStorage.getItem("pwd_reset_refresh");

    if (!accessToken || !refreshToken) {
      setFeedback({
        type: "error",
        text: "Reset session expired. Please request a new reset link.",
      });
      return;
    }

    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Restore the recovery session just long enough to update the password.
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setFeedback({
          type: "error",
          text: "Reset session expired. Please request a new reset link.",
        });
        sessionStorage.removeItem("pwd_reset_pending");
        sessionStorage.removeItem("pwd_reset_access");
        sessionStorage.removeItem("pwd_reset_refresh");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setFeedback({ type: "error", text: mapAuthError(error, "reset") });
        // Sign back out since we restored the session above.
        await supabase.auth.signOut();
      } else {
        // Clean up and sign out — user must log in with the new password.
        sessionStorage.removeItem("pwd_reset_pending");
        sessionStorage.removeItem("pwd_reset_access");
        sessionStorage.removeItem("pwd_reset_refresh");
        await supabase.auth.signOut();
        router.replace("/login?reset=1");
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Could not reset password. Please request a new reset link.",
      });
    } finally {
      setLoading(false);
    }
  }

  const checks = getPasswordChecks(password);

  if (!guarded) return null;

  return (
    <div className="pageMainContainer">
      <div className={styles.container}>
        <h1 className={styles.title}>Set New Password</h1>
        <p className={styles.subtitle}>
          Choose a strong password for your account security.
        </p>
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
            <label>New password</label>
            <div className={styles.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`${styles.input} ${styles.inputWithToggle}`}
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label>Confirm new password</label>
            <div className={styles.passwordWrap}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`${styles.input} ${styles.inputWithToggle}`}
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className={styles.ruleList}>
            <span className={checks.minLength ? styles.ruleOk : styles.rule}>
              8+ characters
            </span>
            <span className={checks.hasLetter ? styles.ruleOk : styles.rule}>
              Contains letters
            </span>
            <span className={checks.hasNumber ? styles.ruleOk : styles.rule}>
              Contains number(s)
            </span>
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
        <div className={styles.links}>
          <a href="/forgot-password" className={styles.link}>
            Need a new reset link?
          </a>
          <a href="/login" className={styles.link}>
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
