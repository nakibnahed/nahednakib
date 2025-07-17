import styles from "./InfoCard.module.css";

export default function InfoCard({ title, size, Icon, details }) {
  return (
    <div className={`${styles.card} ${styles[size]}`}>
      <div className={styles.headerRow}>
        <span className={styles.icon}>
          <Icon size={24} strokeWidth={1.5} />
        </span>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.details}>{details}</div>
    </div>
  );
}
