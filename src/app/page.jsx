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
          Professional distance runner and web developer.
          <br />
          Clean code. Clear goals. Whether on the web or on the track, I bring
          discipline and precision to every step. As a running programmer, I
          combine athletic excellence with coding expertise.
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
