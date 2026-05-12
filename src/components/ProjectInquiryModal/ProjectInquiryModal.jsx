"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import styles from "./ProjectInquiryModal.module.css";
import { logoFont } from "@/lib/fonts/fonts.js";

const PROJECT_TYPES = [
  "Website",
  "Web Application",
  "Full-Stack App",
  "CMS / Admin Panel",
  "E-Commerce",
  "API Integration",
  "Other",
];

const BUDGET_OPTIONS = [
  "Under $500",
  "$500 – $1,500",
  "$1,500 – $3,000",
  "$3,000 – $5,000",
  "$5,000+",
  "Let's discuss",
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
  budget: "",
  timeline: "",
  notes: "",
};

export default function ProjectInquiryModal({ isOpen, onClose }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => firstInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleBackdropClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  function handleClose() {
    onClose();
    setSuccess(false);
    setError("");
    setForm(INITIAL_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/project-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit. Please try again.");
      } else {
        setSuccess(true);
        setForm(INITIAL_FORM);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleBackdropClick}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Web Development</p>
            <h2
              id="inquiry-modal-title"
              className={`${styles.title} ${logoFont.className}`}
            >
              Start a Project
            </h2>
          </div>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h3 className={styles.successTitle}>Brief received!</h3>
            <p className={styles.successText}>
              Thanks for reaching out — I&apos;ll review your project details
              and get back to you as soon as possible.
            </p>
            <button className={styles.submitBtn} onClick={handleClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="inq-name" className={styles.label}>
                  Your Name <span className={styles.required}>*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="inq-name"
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
                <label htmlFor="inq-email" className={styles.label}>
                  Email Address <span className={styles.required}>*</span>
                </label>
                <input
                  id="inq-email"
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

            <div className={styles.field}>
              <label htmlFor="inq-type" className={styles.label}>
                Project Type <span className={styles.required}>*</span>
              </label>
              <select
                id="inq-type"
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
              <label htmlFor="inq-desc" className={styles.label}>
                What do you want to build?{" "}
                <span className={styles.required}>*</span>
              </label>
              <textarea
                id="inq-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                placeholder="Describe your project — what it is, who it's for, and what problem it solves..."
                className={styles.textarea}
                rows={4}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="inq-features" className={styles.label}>
                Key Features{" "}
                <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="inq-features"
                name="features"
                value={form.features}
                onChange={handleChange}
                placeholder="List the main features you need — e.g. user auth, dashboard, payments, real-time updates..."
                className={styles.textarea}
                rows={3}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="inq-budget" className={styles.label}>
                  Budget Range{" "}
                  <span className={styles.optional}>(optional)</span>
                </label>
                <select
                  id="inq-budget"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Select a budget range...</option>
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="inq-timeline" className={styles.label}>
                  Timeline{" "}
                  <span className={styles.optional}>(optional)</span>
                </label>
                <select
                  id="inq-timeline"
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
            </div>

            <div className={styles.field}>
              <label htmlFor="inq-notes" className={styles.label}>
                Anything else?{" "}
                <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="inq-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="References, design preferences, existing tech stack, or any other context..."
                className={styles.textarea}
                rows={3}
              />
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.footer}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? "Sending..." : "Send Brief →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
