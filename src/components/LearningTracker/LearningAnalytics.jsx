"use client";

import { Trophy, Zap, CalendarDays, Clock, Target, TrendingUp } from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "./LearningAnalytics.module.css";

function fmtMinutes(m) {
  if (!m) return "0m";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function Bar({ pct, label }) {
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={styles.barPct}>{pct}%</span>
    </div>
  );
}

export default function LearningAnalytics({ analytics }) {
  if (!analytics) return null;

  const {
    weeklyMinutes, monthlyMinutes,
    weeklySessions, monthlySessions,
    weeklyCompletionRate, monthlyCompletionRate,
    currentStreak, longestStreak,
    bestDay, averageSessionMinutes,
    totalHours, totalSessions,
    consistencyScore,
  } = analytics;

  const cards = [
    { icon: <Zap size={22} strokeWidth={1.75} />, value: fmtMinutes(weeklyMinutes), label: "This week", sub: `${weeklySessions} sessions` },
    { icon: <CalendarDays size={22} strokeWidth={1.75} />, value: fmtMinutes(monthlyMinutes), label: "This month", sub: `${monthlySessions} sessions` },
    { icon: <Trophy size={22} strokeWidth={1.75} />, value: `${longestStreak}d`, label: "Longest streak", sub: `Current: ${currentStreak}d` },
    { icon: <Clock size={22} strokeWidth={1.75} />, value: fmtMinutes(averageSessionMinutes), label: "Avg. session", sub: `${totalSessions} total` },
    { icon: <TrendingUp size={22} strokeWidth={1.75} />, value: `${totalHours}h`, label: "Total hours", sub: "overall" },
    { icon: <Target size={22} strokeWidth={1.75} />, value: `${consistencyScore}/100`, label: "Consistency", sub: "score" },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {cards.map((c, i) => (
          <div key={i} className={admin.statCard}>
            <div className={styles.iconBox}>{c.icon}</div>
            <div>
              <h3>{c.value}</h3>
              <p>{c.label}</p>
              {c.sub && <p className={styles.sub}>{c.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.completionBlock}>
        <p className={styles.completionLabel}>Completion rate</p>
        <Bar pct={weeklyCompletionRate} label="This week" />
        <Bar pct={monthlyCompletionRate} label="This month" />
      </div>

      {bestDay && (
        <p className={styles.bestDay}>
          Best day: <strong>{bestDay.date}</strong> — {fmtMinutes(bestDay.minutes)}
        </p>
      )}
    </div>
  );
}
