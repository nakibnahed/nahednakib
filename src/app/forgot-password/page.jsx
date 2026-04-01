"use client";
import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import styles from "../login/Login.module.css";
import {
  getSiteUrl,
  isValidEmail,
  mapAuthError,
  normalizeEmail,
} from "@/utils/authFeedback";
import { showAppToast } from "@/lib/showAppToast";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    const { supabase } = await import("@/services/supabaseClient");
    const { error } = await supabase.auth.resetPasswordForEmail(emailNorm, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
    });

    if (error) {
      notify({ type: "error", text: mapAuthError(error, "forgot") });
    } else {
      notify({
        type: "success",
        text: "Reset email sent. Check your inbox and open the link to set a new password.",
      });
    }

    setLoading(false);
  }

  return (
    <div className="pageMainContainer">
      <div className={styles.container}>
        <h1 className={styles.title}>Forgot Password</h1>
        <p className={styles.subtitle}>
          Enter your email and we will send you a secure reset link.
        </p>
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
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>
        <div className={styles.links}>
          <a href={loginHref} className={styles.link}>
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
