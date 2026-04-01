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
        <h1 className={styles.title}>Welcome to Nahed</h1>
        <p className={styles.description}>
          Professional distance runner and web developer.
          <br />
          Clean code. Clear goals. Whether on the web or on the track, I bring
          discipline and precision to every step.
        </p>
        <div className={styles.heroButtons}>
          <Link href="/info" className={styles.button}>
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
