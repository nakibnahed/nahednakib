import styles from "./InfoCard.module.css";

export default function PostBoxCard({ title, size, Icon, children }) {
  return (
    <div className={`${styles.card} ${styles[size]}`}>
      <div className={styles.icon}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.details}>{children}</div>
    </div>
  );
}
