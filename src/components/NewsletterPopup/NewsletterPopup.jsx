"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./NewsletterPopup.module.css";

const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const TIME_GATE_MS = 30_000;       // must spend 30s on page
const EXIT_INTENT_GATE_MS = 15_000; // exit intent fires after 15s
const SCROLL_THRESHOLD = 0.6;      // must scroll 60% of page

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    // Never show if already subscribed
    if (localStorage.getItem("newsletter_subscribed") === "true") return;

    // Respect 30-day dismissal cooldown
    const dismissedUntil = localStorage.getItem("newsletter_popup_dismissed_until");
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    let shown = false;
    let timeReady = false;
    let scrollReady = false;
    const pageEnteredAt = Date.now();

    function show() {
      if (shown) return;
      shown = true;
      setVisible(true);
    }

    // Condition 1: scroll 60% + 30s on page
    function tryEngagementTrigger() {
      if (timeReady && scrollReady) show();
    }

    const timeTimer = setTimeout(() => {
      timeReady = true;
      tryEngagementTrigger();
    }, TIME_GATE_MS);

    function onScroll() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = window.scrollY / scrollable;
      if (pct >= SCROLL_THRESHOLD) {
        scrollReady = true;
        window.removeEventListener("scroll", onScroll);
        tryEngagementTrigger();
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    // Condition 2: exit intent on desktop (mouse leaves top of viewport)
    function onMouseLeave(e) {
      if (
        e.clientY <= 0 &&
        Date.now() - pageEnteredAt >= EXIT_INTENT_GATE_MS
      ) {
        show();
      }
    }
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      clearTimeout(timeTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  // Escape key + auto-focus
  useEffect(() => {
    if (!visible) return;
    inputRef.current?.focus();
    function onKeyDown(e) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  function dismiss() {
    localStorage.setItem(
      "newsletter_popup_dismissed_until",
      String(Date.now() + DISMISS_COOLDOWN_MS),
    );
    setVisible(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to subscribe. Please try again.");
      } else {
        setSuccess(data.message || "Subscribed! Thanks for joining.");
        localStorage.setItem("newsletter_subscribed", "true");
        setTimeout(() => setVisible(false), 3000);
      }
    } catch {
      setError("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={dismiss}
      aria-modal="true"
      role="dialog"
      aria-label="Newsletter subscription"
    >
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Join the Newsletter</h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={dismiss}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>
            Subscribe to get the latest posts delivered straight to your inbox.
          </p>

          {success ? (
            <p className={styles.successMsg}>{success}</p>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                ref={inputRef}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? "Subscribing..." : "Subscribe"}
              </button>
              {error && <p className={styles.errorMsg}>{error}</p>}
            </form>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.note}>No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </div>
  );
}
