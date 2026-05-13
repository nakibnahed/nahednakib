"use client";

import styles from "./page.module.css";
import Link from "next/link";
import GridBackground from "@/components/GridBackground/GridBackground";

export default function HomeClient() {
  return (
    <div className={styles.container}>
      <div className={styles.animatedBg}>
        <GridBackground />
      </div>
      <div className={styles.col}>
        <span className={styles.badge}>Runner & Web Developer</span>
        <h1 className={styles.title}>Welcome to Nahed</h1>
        <p className={styles.description}>
          Distance runner and junior web developer. Clean code, clear goals —
          discipline and precision on the web and on the track.
        </p>
        <div className={styles.heroButtons}>
          <Link href="/services" className={styles.button}>
            <span>Explore More</span>
            <span className={styles.arrow}>→</span>
          </Link>
          <Link
            href="/portfolio"
            className={`${styles.button} ${styles.aboutButton}`}
          >
            <span>My Work</span>
            <span className={styles.arrow}>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
