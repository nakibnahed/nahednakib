"use client";

import { useState, useEffect, useRef } from "react";
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
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const didReset = useRef(false);

  useEffect(() => {
    // Only allow access if arrived via the password reset email link
    const flag = sessionStorage.getItem("pendingPasswordReset");
    if (!flag) {
      // No valid reset session — sign out and redirect
      import("@/lib/supabase/client").then(({ createClient }) => {
        createClient().auth.signOut();
      });
      router.replace("/forgot-password");
      return;
    }
    sessionStorage.removeItem("pendingPasswordReset");
    setValidSession(true);
    setChecking(false);

    // If the user navigates away without resetting, sign them out
    const handleUnload = () => {
      if (!didReset.current) {
        import("@/lib/supabase/client").then(({ createClient }) => {
          createClient().auth.signOut();
        });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
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

    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setFeedback({ type: "error", text: mapAuthError(error, "reset") });
      } else {
        didReset.current = true;
        // Sign out so they must log in with the new password
        await supabase.auth.signOut();
        router.replace("/login?reset=success");
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

  if (checking) return null;
  if (!validSession) return null;

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
        </div>
      </div>
    </div>
  );
}
