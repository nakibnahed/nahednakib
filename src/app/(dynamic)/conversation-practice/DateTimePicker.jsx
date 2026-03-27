"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./DateTimePicker.module.css";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function formatDisplay(d) {
  const day = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} · ${time}`;
}
function pad(n) {
  return String(n).padStart(2, "0");
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  minDate,
  maxDate,
}) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("calendar");

  const [cursor, setCursor] = useState(value ?? today);
  const [selected, setSelected] = useState(value ?? null);
  const [hour, setHour] = useState(value ? value.getHours() % 12 || 12 : 12);
  const [minute, setMinute] = useState(value ? value.getMinutes() : 0);
  const [ampm, setAmpm] = useState(
    value ? (value.getHours() >= 12 ? "PM" : "AM") : "PM",
  );

  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function commit(day, h, m, ap) {
    const resolvedHour = h ?? hour;
    const resolvedMinute = m ?? minute;
    const resolvedAmpm = ap ?? ampm;
    const h24 =
      resolvedAmpm === "PM" ? (resolvedHour % 12) + 12 : resolvedHour % 12;
    const result = new Date(day);
    result.setHours(h24, resolvedMinute, 0, 0);
    setSelected(result);
    onChange?.(result);
  }

  function handleDayClick(day) {
    setSelected(day);
    commit(day);
    setView("time");
  }

  function handleTimeConfirm() {
    if (selected) commit(selected);
    setOpen(false);
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function isDayDisabled(d) {
    if (minDate) {
      const minDay = new Date(
        minDate.getFullYear(),
        minDate.getMonth(),
        minDate.getDate(),
      );
      const thisDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (thisDay < minDay) return true;
    }
    if (maxDate && d > maxDate) return true;
    return false;
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className={styles.root} ref={ref}>
      {/* triggerWrap is a div so we can have two sibling buttons inside —
          nesting <button> inside <button> is invalid HTML */}
      <div className={`${styles.triggerWrap} ${open ? styles.triggerActive : ""}`}>
        <button
          type="button"
          className={styles.trigger}
          onClick={() => {
            setOpen((o) => !o);
            setView("calendar");
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className={styles.triggerText}>
            {selected ? formatDisplay(selected) : placeholder}
          </span>
        </button>
        {selected && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(null);
              onChange?.(null);
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tabBtn} ${view === "calendar" ? styles.tabActive : ""}`}
                onClick={() => setView("calendar")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                </svg>
                Date
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${view === "time" ? styles.tabActive : ""}`}
                onClick={() => setView("time")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
                Time
              </button>
            </div>

            {/* ── Calendar view ── */}
            {view === "calendar" && (
              <div className={styles.calendar}>
                <div className={styles.nav}>
                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={() => setCursor(new Date(year, month - 1, 1))}
                  >
                    ‹
                  </button>
                  <span className={styles.navMonth}>
                    {MONTHS[month]} {year}
                  </span>
                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={() => setCursor(new Date(year, month + 1, 1))}
                  >
                    ›
                  </button>
                </div>

                <div className={styles.gridHead}>
                  {DAYS.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                <div className={styles.grid}>
                  {cells.map((d, i) => {
                    if (!d) return <span key={i} />;
                    const isToday = isSameDay(d, today);
                    const isSelected = selected && isSameDay(d, selected);
                    const disabled = isDayDisabled(d);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={disabled}
                        className={[
                          styles.day,
                          isToday ? styles.dayToday : "",
                          isSelected ? styles.daySelected : "",
                          disabled ? styles.dayDisabled : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => handleDayClick(d)}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Time view ── */}
            {view === "time" && (
              <div className={styles.time}>
                <div className={styles.timeDisplay}>
                  {pad(hour)}:{pad(minute)}{" "}
                  <span className={styles.timeAmpm}>{ampm}</span>
                </div>

                <div className={styles.timeRow}>
                  <span className={styles.timeLabel}>Hour</span>
                  <div className={styles.spin}>
                    <button
                      type="button"
                      className={styles.spinBtn}
                      onClick={() => setHour((h) => (h === 12 ? 1 : h + 1))}
                    >
                      ▲
                    </button>
                    <span className={styles.spinVal}>{pad(hour)}</span>
                    <button
                      type="button"
                      className={styles.spinBtn}
                      onClick={() => setHour((h) => (h === 1 ? 12 : h - 1))}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div className={styles.timeRow}>
                  <span className={styles.timeLabel}>Minute</span>
                  <div className={styles.spin}>
                    <button
                      type="button"
                      className={styles.spinBtn}
                      onClick={() => setMinute((m) => (m + 1) % 60)}
                    >
                      ▲
                    </button>
                    <span className={styles.spinVal}>{pad(minute)}</span>
                    <button
                      type="button"
                      className={styles.spinBtn}
                      onClick={() => setMinute((m) => (m - 1 + 60) % 60)}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div className={styles.ampm}>
                  <button
                    type="button"
                    className={`${styles.ampmBtn} ${ampm === "AM" ? styles.ampmActive : ""}`}
                    onClick={() => setAmpm("AM")}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={`${styles.ampmBtn} ${ampm === "PM" ? styles.ampmActive : ""}`}
                    onClick={() => setAmpm("PM")}
                  >
                    PM
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.confirm}
                  onClick={handleTimeConfirm}
                >
                  Confirm ✓
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
