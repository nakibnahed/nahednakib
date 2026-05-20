"use client";

import admin from "@/components/Admin/adminPage.module.css";
import styles from "./SessionHistory.module.css";

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function groupBySection(sessions) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const groups = { Today: [], Yesterday: [], "This week": [], Older: [] };
  for (const s of sessions) {
    if (s.date === today) groups["Today"].push(s);
    else if (s.date === yesterday) groups["Yesterday"].push(s);
    else if (s.date >= weekAgo) groups["This week"].push(s);
    else groups["Older"].push(s);
  }
  return groups;
}

export default function SessionHistory({ sessions, hasMore, onLoadMore }) {
  if (!sessions.length) {
    return (
      <div className={admin.emptyPanel}>
        <p>No sessions yet — start the timer to record your first session.</p>
      </div>
    );
  }

  const groups = groupBySection(sessions);

  return (
    <div className={styles.wrap}>
      {Object.entries(groups).map(([label, rows]) => {
        if (!rows.length) return null;
        return (
          <div key={label} className={styles.group}>
            <p className={styles.groupLabel}>{label}</p>
            <div className={styles.list}>
              {rows.map((s) => {
                const completed = s.duration_seconds >= s.target_minutes * 60;
                const pct = Math.min(Math.round((s.duration_seconds / (s.target_minutes * 60)) * 100), 100);
                return (
                  <div key={s.id} className={styles.item}>
                    <div className={`${styles.itemDot} ${completed ? styles.itemDotDone : styles.itemDotPartial}`} />
                    <div className={styles.itemBody}>
                      <span className={styles.itemDate}>{s.date}</span>
                      <span className={styles.itemDur}>{formatDuration(s.duration_seconds)}</span>
                      <div className={styles.barTrack}>
                        <div className={`${styles.barFill} ${completed ? styles.barDone : styles.barPartial}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`${styles.pill} ${completed ? styles.pillDone : styles.pillPartial}`}>
                        {completed ? "Completed" : "Partial"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button type="button" className={styles.loadMore} onClick={onLoadMore}>
          Load more sessions
        </button>
      )}
    </div>
  );
}
