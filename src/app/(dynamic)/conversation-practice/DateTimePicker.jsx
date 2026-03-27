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

const DRUM_ITEM_HEIGHT = 36;
const DRUM_HEIGHT = 140;
const DRUM_CENTER_OFFSET = (DRUM_HEIGHT - DRUM_ITEM_HEIGHT) / 2;
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i);

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
  const [hour, setHour] = useState(value ? value.getHours() : today.getHours());
  const [minute, setMinute] = useState(value ? value.getMinutes() : 0);
  const [hourOffset, setHourOffset] = useState(
    (value ? value.getHours() : today.getHours()) * DRUM_ITEM_HEIGHT,
  );
  const [minuteOffset, setMinuteOffset] = useState(
    (value ? value.getMinutes() : 0) * DRUM_ITEM_HEIGHT,
  );

  const ref = useRef(null);
  const dragRef = useRef(null);
  const momentumRef = useRef(null);
  const hourWheelSnapRef = useRef(null);
  const minuteWheelSnapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function commit(day, h, m) {
    const resolvedHour = h ?? hour;
    const resolvedMinute = m ?? minute;
    const result = new Date(day);
    result.setHours(resolvedHour, resolvedMinute, 0, 0);
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

  function stopMomentum() {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
  }

  function clampOffset(offset, maxIndex) {
    const max = maxIndex * DRUM_ITEM_HEIGHT;
    if (offset < 0) return 0;
    if (offset > max) return max;
    return offset;
  }

  function applyOffset(type, nextOffset) {
    if (type === "hour") {
      const clamped = clampOffset(nextOffset, 23);
      setHourOffset(clamped);
      setHour(Math.round(clamped / DRUM_ITEM_HEIGHT));
      return;
    }
    const clamped = clampOffset(nextOffset, 59);
    setMinuteOffset(clamped);
    setMinute(Math.round(clamped / DRUM_ITEM_HEIGHT));
  }

  function snapDrum(type, currentOffset) {
    const maxIndex = type === "hour" ? 23 : 59;
    const clamped = clampOffset(currentOffset, maxIndex);
    const snapped = Math.round(clamped / DRUM_ITEM_HEIGHT) * DRUM_ITEM_HEIGHT;
    applyOffset(type, snapped);
  }

  function startMomentum(type, initialVelocity, startOffset) {
    stopMomentum();
    let v = initialVelocity;
    let offset = startOffset;

    const step = () => {
      offset += v * 16;
      applyOffset(type, offset);
      offset = type === "hour" ? clampOffset(offset, 23) : clampOffset(offset, 59);
      v *= 0.95;

      const hitEdge =
        offset <= 0 ||
        offset >= (type === "hour" ? 23 : 59) * DRUM_ITEM_HEIGHT;
      if (Math.abs(v) < 0.02 || hitEdge) {
        snapDrum(type, offset);
        momentumRef.current = null;
        return;
      }
      momentumRef.current = requestAnimationFrame(step);
    };

    momentumRef.current = requestAnimationFrame(step);
  }

  function startDrag(type, clientY) {
    stopMomentum();
    dragRef.current = {
      type,
      startY: clientY,
      startOffset: type === "hour" ? hourOffset : minuteOffset,
      lastY: clientY,
      lastTime: performance.now(),
      velocity: 0,
    };
  }

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      const now = performance.now();
      const deltaY = e.clientY - drag.startY;
      const nextOffset = drag.startOffset - deltaY;
      applyOffset(drag.type, nextOffset);

      const dt = Math.max(now - drag.lastTime, 1);
      drag.velocity = -(e.clientY - drag.lastY) / dt;
      drag.lastY = e.clientY;
      drag.lastTime = now;
    };

    const onMouseUp = () => {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      const currentOffset = drag.type === "hour" ? hourOffset : minuteOffset;
      const velocity = drag.velocity;
      dragRef.current = null;
      if (Math.abs(velocity) > 0.08) {
        startMomentum(drag.type, velocity, currentOffset);
      } else {
        snapDrum(drag.type, currentOffset);
      }
    };

    const onTouchMove = (e) => {
      if (!dragRef.current || !e.touches?.[0]) return;
      e.preventDefault();
      const touch = e.touches[0];
      const drag = dragRef.current;
      const now = performance.now();
      const deltaY = touch.clientY - drag.startY;
      const nextOffset = drag.startOffset - deltaY;
      applyOffset(drag.type, nextOffset);

      const dt = Math.max(now - drag.lastTime, 1);
      drag.velocity = -(touch.clientY - drag.lastY) / dt;
      drag.lastY = touch.clientY;
      drag.lastTime = now;
    };

    const onTouchEnd = () => {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      const currentOffset = drag.type === "hour" ? hourOffset : minuteOffset;
      const velocity = drag.velocity;
      dragRef.current = null;
      if (Math.abs(velocity) > 0.08) {
        startMomentum(drag.type, velocity, currentOffset);
      } else {
        snapDrum(drag.type, currentOffset);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [hourOffset, minuteOffset]);

  useEffect(() => {
    return () => stopMomentum();
  }, []);

  useEffect(() => {
    return () => {
      if (hourWheelSnapRef.current) clearTimeout(hourWheelSnapRef.current);
      if (minuteWheelSnapRef.current) clearTimeout(minuteWheelSnapRef.current);
    };
  }, []);

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
      <div
        className={`${styles.triggerWrap} ${open ? styles.triggerActive : ""}`}
      >
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
                  {pad(hour)}:{pad(minute)}
                </div>

                <div className={styles.timeRow}>
                  <span className={styles.timeLabel}>Hour</span>
                  <span className={styles.timeLabel}>Minute</span>
                </div>

                <div className={styles.timeRow}>
                  <div
                    className={styles.drum}
                    onMouseDown={(e) => startDrag("hour", e.clientY)}
                    onTouchStart={(e) => {
                      if (e.touches?.[0]) startDrag("hour", e.touches[0].clientY);
                    }}
                    onWheel={(e) => {
                      e.preventDefault();
                      stopMomentum();
                      applyOffset("hour", hourOffset + e.deltaY * 0.5);
                      if (hourWheelSnapRef.current) {
                        clearTimeout(hourWheelSnapRef.current);
                      }
                      hourWheelSnapRef.current = setTimeout(
                        () => snapDrum("hour", hourOffset + e.deltaY * 0.5),
                        70,
                      );
                    }}
                  >
                    <div className={styles.drumSelector} />
                    <div className={styles.drumFadeTop} />
                    <div className={styles.drumFadeBot} />
                    <div
                      className={styles.drumList}
                      style={{
                        transform: `translateY(${DRUM_CENTER_OFFSET - hourOffset}px)`,
                      }}
                    >
                      {HOURS_24.map((h) => (
                        <div
                          key={h}
                          className={`${styles.drumItem} ${h === hour ? styles.drumActive : ""}`}
                        >
                          {pad(h)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className={styles.drum}
                    onMouseDown={(e) => startDrag("minute", e.clientY)}
                    onTouchStart={(e) => {
                      if (e.touches?.[0]) {
                        startDrag("minute", e.touches[0].clientY);
                      }
                    }}
                    onWheel={(e) => {
                      e.preventDefault();
                      stopMomentum();
                      applyOffset("minute", minuteOffset + e.deltaY * 0.5);
                      if (minuteWheelSnapRef.current) {
                        clearTimeout(minuteWheelSnapRef.current);
                      }
                      minuteWheelSnapRef.current = setTimeout(
                        () =>
                          snapDrum("minute", minuteOffset + e.deltaY * 0.5),
                        70,
                      );
                    }}
                  >
                    <div className={styles.drumSelector} />
                    <div className={styles.drumFadeTop} />
                    <div className={styles.drumFadeBot} />
                    <div
                      className={styles.drumList}
                      style={{
                        transform: `translateY(${DRUM_CENTER_OFFSET - minuteOffset}px)`,
                      }}
                    >
                      {MINUTES_60.map((m) => (
                        <div
                          key={m}
                          className={`${styles.drumItem} ${m === minute ? styles.drumActive : ""}`}
                        >
                          {pad(m)}
                        </div>
                      ))}
                    </div>
                  </div>
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
