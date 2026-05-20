"use client";

import { useState } from "react";
import styles from "./LearningHeatmap.module.css";

function intensityLevel(minutes) {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

export default function LearningHeatmap({ heatmap }) {
  const [tooltip, setTooltip] = useState(null);
  if (!heatmap?.length) return null;

  const uniqueDays = heatmap.filter((day, i, arr) => arr.findIndex((d) => d.date === day.date) === i);

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Last 90 days</p>
      <div className={styles.grid}>
        {uniqueDays.map((day, i) => {
          const level = intensityLevel(day.minutes);
          return (
            <div
              key={`${day.date}-${i}`}
              className={`${styles.cell} ${styles[`level${level}`]}`}
              onMouseEnter={() => setTooltip(day)}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </div>

      <p className={styles.tooltip}>
        {tooltip
          ? `${tooltip.date} — ${tooltip.minutes > 0 ? `${tooltip.minutes}m studied` : "No session"}`
          : "Hover a cell to see details"}
      </p>

      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={`${styles.legendCell} ${styles[`level${l}`]}`} />
        ))}
        <span className={styles.legendLabel}>More</span>
      </div>
    </div>
  );
}
