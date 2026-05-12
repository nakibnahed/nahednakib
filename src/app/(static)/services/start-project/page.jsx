"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./start-project.module.css";
import { logoFont } from "@/lib/fonts/fonts.js";

const PROJECT_TYPES = [
  "Portfolio Website",
  "Business Website",
  "Blog",
  "E-Commerce Store",
  "Real Estate Website",
  "NGO / Non-Profit Website",
  "Learning / E-Learning Platform",
  "WordPress Website",
  "Next.js Website / App",
  "Full-Stack Web App",
  "CMS & Admin Panel",
  "Other",
];

const TIMELINE_OPTIONS = [
  "ASAP",
  "Within 1 month",
  "1 – 3 months",
  "3 – 6 months",
  "No rush / flexible",
];

const INITIAL_FORM = {
  name: "",
  email: "",
  projectType: "",
  description: "",
  features: "",
  timeline: "",
  notes: "",
};

export default function StartAProjectPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/project-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        window.showToast(data.error || "Failed to submit. Please try again.", "error");
      } else {
        setSuccess(true);
        setForm(INITIAL_FORM);
        window.showToast("Project brief sent successfully!", "success");
      }
    } catch {
      window.showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={`${styles.successTitle} ${logoFont.className}`}>
            Brief Received!
          </h1>
          <p className={styles.successText}>
            Thanks for reaching out — I&apos;ll review your project details and
            get back to you as soon as possible.
          </p>
          <div className={styles.successActions}>
            <Link href="/portfolio" className={styles.primaryBtn}>
              <span>View Portfolio</span>
              <span className={styles.arrow}>→</span>
            </Link>
            <Link href="/services" className={styles.secondaryBtn}>
              Back to Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.back}>
        <Link href="/services" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Services
        </Link>
      </div>

      <div className={styles.hero}>
        <p className={styles.eyebrow}>Web Development</p>
        <h1 className={`${styles.title} ${logoFont.className}`}>
          Start a Project
        </h1>
        <p className={styles.subtitle}>
          Tell me what you want to build. The more detail you share, the better
          I can scope the project and put together a realistic plan.
        </p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>About You</h2>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="sap-name" className={styles.label}>
                  Your Name <span className={styles.required}>*</span>
                </label>
                <input
                  id="sap-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="sap-email" className={styles.label}>
                  Email Address <span className={styles.required}>*</span>
                </label>
                <input
                  id="sap-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Project</h2>

            <div className={styles.field}>
              <label htmlFor="sap-type" className={styles.label}>
                Project Type <span className={styles.required}>*</span>
              </label>
              <select
                id="sap-type"
                name="projectType"
                value={form.projectType}
                onChange={handleChange}
                required
                className={styles.select}
              >
                <option value="">Select a project type...</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="sap-desc" className={styles.label}>
                What do you want to build?{" "}
                <span className={styles.required}>*</span>
              </label>
              <p className={styles.hint}>
                Describe the project — what it is, who it&apos;s for, and what
                problem it solves.
              </p>
              <textarea
                id="sap-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                placeholder="e.g. A portfolio website for a photographer with a gallery, contact form, and blog..."
                className={styles.textarea}
                rows={5}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="sap-features" className={styles.label}>
                Key Features{" "}
                <span className={styles.optional}>(optional)</span>
              </label>
              <p className={styles.hint}>
                List the main features you need — user auth, dashboard,
                payments, real-time updates, etc.
              </p>
              <textarea
                id="sap-features"
                name="features"
                value={form.features}
                onChange={handleChange}
                placeholder="- User login and profiles&#10;- Admin dashboard&#10;- Stripe payments&#10;- Email notifications"
                className={styles.textarea}
                rows={4}
              />
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Timeline & Details</h2>
            <div className={styles.field}>
              <label htmlFor="sap-timeline" className={styles.label}>
                Timeline{" "}
                <span className={styles.optional}>(optional)</span>
              </label>
              <select
                id="sap-timeline"
                name="timeline"
                value={form.timeline}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">Select a timeline...</option>
                {TIMELINE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="sap-notes" className={styles.label}>
                Anything else?{" "}
                <span className={styles.optional}>(optional)</span>
              </label>
              <p className={styles.hint}>
                References, design preferences, existing tech stack, or any
                other context that would help.
              </p>
              <textarea
                id="sap-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="e.g. We already have a Figma design. The backend should use Supabase. Inspired by..."
                className={styles.textarea}
                rows={4}
              />
            </div>
          </div>

          <div className={styles.formFooter}>
            <p className={styles.footerNote}>
              Fields marked <span className={styles.required}>*</span> are
              required. I&apos;ll reply within 1–2 business days.
            </p>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? "Sending..." : "Send Brief →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
