"use client";

import { Flame, BookOpen, Clock } from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "./GoalStats.module.css";

export default function GoalStats({ stats }) {
  if (!stats) return null;

  const items = [
    {
      icon: <Flame size={22} strokeWidth={1.75} />,
      value: stats.streak ?? 0,
      label: "Day streak",
      sub: "consecutive days",
    },
    {
      icon: <BookOpen size={22} strokeWidth={1.75} />,
      value: stats.totalSessions ?? 0,
      label: "Total sessions",
      sub: "recorded",
    },
    {
      icon: <Clock size={22} strokeWidth={1.75} />,
      value: `${stats.totalMinutes ?? 0}`,
      label: "Total minutes",
      sub: "studied",
    },
  ];

  return (
    <div className={styles.grid}>
      {items.map((item, i) => (
        <div key={i} className={admin.statCard}>
          <div className={styles.iconBox}>
            {item.icon}
          </div>
          <div>
            <h3>{item.value}</h3>
            <p>{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
