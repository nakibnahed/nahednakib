"use client";

import styles from "./AnalyticsCard.module.css";

export default function AnalyticsCard({ label, value, sub, icon }) {
  return (
    <div className={styles.card}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </div>
  );
}
