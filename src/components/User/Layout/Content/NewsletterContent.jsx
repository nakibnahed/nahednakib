"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import styles from "../../../../app/users/profile/Profile.module.css";
import be from "@/app/admin/blogs/BlogEditor.module.css";
import admin from "@/components/Admin/adminPage.module.css";

export default function NewsletterContent({ user }) {
  const [subscribed, setSubscribed] = useState(null); // null = loading
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    fetch("/api/newsletter/me")
      .then((r) => r.json())
      .then((d) => setSubscribed(d.subscribed ?? false))
      .catch(() => setSubscribed(false));
  }, [user]);

  async function toggle() {
    const action = subscribed ? "unsubscribe" : "subscribe";
    setWorking(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await fetch("/api/newsletter/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error || "Something went wrong.", type: "error" });
      } else {
        setSubscribed(action === "subscribe");
        setMsg({ text: data.message, type: "success" });
      }
    } catch {
      setMsg({ text: "Something went wrong.", type: "error" });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className={be.pageRoot}>
      <header className={be.hero}>
        <div className={be.heroBack}>
          <Link href="/users/profile" className={admin.backNav}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
            Back to dashboard
          </Link>
        </div>
        <div className={be.heroMeta}>
          <p className={admin.eyebrow}>Email</p>
          <span className={be.metaChip}>Newsletter</span>
        </div>
        <h1 className={admin.pageTitle}>Newsletter</h1>
        <p className={admin.lead}>Manage your newsletter subscription.</p>
      </header>

      <div className={be.formFlow}>
        <section className={be.section} aria-labelledby="newsletter-heading">
          <div className={be.sectionHead}>
            <div className={be.sectionIcon} aria-hidden>
              <Mail size={20} strokeWidth={1.75} />
            </div>
            <div className={be.sectionHeadText}>
              <p className={be.sectionKicker}>Subscription</p>
              <h2 id="newsletter-heading" className={be.sectionTitle}>
                Email updates
              </h2>
              <p className={be.sectionLead}>
                Get notified when new articles are published.
              </p>
            </div>
          </div>

          <div className={styles.settingsForm}>
            <div className={styles.settingsFormBody}>
              <div className={styles.settingsBlock}>
                <p className={styles.settingsBlockKicker}>Status</p>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <div className={styles.readOnlyField} style={{ marginBottom: 12 }}>
                    {subscribed === null
                      ? "Checking…"
                      : subscribed
                      ? "You are subscribed to the newsletter."
                      : "You are not subscribed to the newsletter."}
                  </div>

                  {subscribed !== null && (
                    <button
                      type="button"
                      disabled={working}
                      onClick={toggle}
                      className={subscribed ? styles.deleteButton : styles.saveButton}
                      style={{ borderRadius: 50, padding: "10px 24px" }}
                    >
                      {working
                        ? "Please wait…"
                        : subscribed
                        ? "Unsubscribe"
                        : "Subscribe"}
                    </button>
                  )}

                  {msg.text && (
                    <p
                      className={msg.type === "error" ? styles.error : styles.success}
                      style={{ marginTop: 12, marginBottom: 0 }}
                    >
                      {msg.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
