import styles from "./InfoCard.module.css";

export default function InfoCard({ title, size, Icon, details, headerEnd }) {
  return (
    <div className={`${styles.card} ${styles[size]}`}>
      <div className={styles.headerRow}>
        <div className={styles.headerTitleBlock}>
          <span className={styles.icon}>
            <Icon size={24} strokeWidth={1.5} />
          </span>
          <h2 className={styles.title}>{title}</h2>
        </div>
        {headerEnd ? (
          <div className={styles.headerEnd}>{headerEnd}</div>
        ) : null}
      </div>
      <div className={styles.details}>{details}</div>
    </div>
  );
}
