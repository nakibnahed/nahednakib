"use client";

import Link from "next/link";
import styles from "./PortfolioCard.module.css";

export default function PortfolioCard({ project }) {
  return (
    <Link href={`/portfolio/${project.slug}`} className={styles.card}>
      <header className={styles.head}>
        <span className={styles.n}>
          {project.month}
          <span className={styles.nSlash}>/</span>
          <span className={styles.nYear}>{project.year}</span>
        </span>
        {project.status && (
          <span className={styles.status}>
            <span className={styles.statusDot} />
            {project.status}
          </span>
        )}
      </header>

      <h2 className={styles.title}>{project.title}</h2>
      {project.category && (
        <span className={styles.cat}>{project.category}</span>
      )}

      <p className={styles.desc}>{project.description}</p>

      {project.tech?.length > 0 && (
        <ul className={styles.chips}>
          {project.tech.map((t, i) => (
            <li
              key={t}
              className={`${styles.chip} ${i === 0 ? styles.chipLead : ""}`}
            >
              {t}
            </li>
          ))}
        </ul>
      )}

      <footer className={styles.foot}>
        <span className={styles.cta}>View project →</span>
      </footer>
    </Link>
  );
}
