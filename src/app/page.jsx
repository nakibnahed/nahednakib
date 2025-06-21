"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "./page.module.css";
import { logoFont } from "../lib/fonts/fonts.js";
import Link from "next/link";
import GridBackground from "@/components/GridBackground/GridBackground";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.animatedBg}>
        <GridBackground />
      </div>
      <div className={styles.col}>
        <h1 className={styles.title}>Welcome to Nahed</h1>
        <p className={styles.description}>
          We create high-quality, scalable, and innovative websites to help
          businesses thrive in the digital world.
        </p>
        <div className={styles.heroButtons}>
          <Link href="/portfolio" className={styles.button}>
            <span>Explore More</span>
            <span className={styles.arrow}>→</span>
          </Link>
          <Link
            href="/about"
            className={`${styles.button} ${styles.aboutButton}`}
          >
            <span>About</span>
            <span className={styles.arrow}>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
