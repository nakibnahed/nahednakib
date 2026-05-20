"use client";

import { useState } from "react";
import { X, BookOpen, Code2, Music, Languages, FlaskConical, Palette } from "lucide-react";
import styles from "./GoalForm.module.css";

const TARGET_OPTIONS = [
  { value: 30, label: "30m" },
  { value: 60, label: "1h" },
  { value: 120, label: "2h" },
  { value: 180, label: "3h" },
  { value: 240, label: "4h" },
];

const COLOR_OPTIONS = ["orange", "blue", "green", "purple", "red"];

const ICON_OPTIONS = [
  { value: "book",     Icon: BookOpen,     label: "Reading"  },
  { value: "code",     Icon: Code2,        label: "Coding"   },
  { value: "music",    Icon: Music,        label: "Music"    },
  { value: "language", Icon: Languages,    label: "Language" },
  { value: "science",  Icon: FlaskConical, label: "Science"  },
  { value: "art",      Icon: Palette,      label: "Art"      },
];

export default function GoalForm({ onSubmit, onClose, initialData }) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [target, setTarget] = useState(initialData?.daily_target_minutes ?? 60);
  const [color, setColor] = useState(initialData?.color ?? "orange");
  const [icon, setIcon] = useState(initialData?.icon ?? "book");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) { setFieldError("Goal name is required"); return; }
    if (trimmed.length > 100) { setFieldError("Goal name must be 100 characters or fewer"); return; }
    setFieldError("");
    setSubmitting(true);
    try {
      await onSubmit({ title: trimmed, daily_target_minutes: target, color, icon });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Goal form">
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>{initialData ? "Edit goal" : "New goal"}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="goal-title">What do you want to learn?</label>
            <input
              id="goal-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Learn JavaScript"
              maxLength={100}
              autoFocus
            />
            {fieldError && <p className={styles.fieldError}>{fieldError}</p>}
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Daily target</span>
            <div className={styles.pillRow}>
              {TARGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.pill} ${target === opt.value ? styles.pillActive : ""}`}
                  onClick={() => setTarget(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Color</span>
            <div className={styles.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorDot} ${styles[`color-${c}`]} ${color === c ? styles.colorDotActive : ""}`}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Icon</span>
            <div className={styles.iconRow}>
              {ICON_OPTIONS.map(({ value, Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.iconBtn} ${icon === value ? styles.iconBtnActive : ""}`}
                  onClick={() => setIcon(value)}
                  aria-label={label}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span className={styles.iconLabel}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Saving…" : initialData ? "Save changes" : "Create goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
