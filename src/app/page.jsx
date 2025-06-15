"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic"; // ✅ you can delete this if not used anymore
import styles from "./page.module.css";
import { logoFont } from "../lib/fonts/fonts.js";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* ✅ Background directly here */}
      <div className={styles.animatedBg}></div>

      {/* ✅ Main Content */}
      <div className={`${styles.col} ${styles.hero_text}`}>
        <h1 className={`${styles.title} ${logoFont.className}`}>
          Welcome to Nahed
        </h1>
        <p className={`${styles.description} ${logoFont.className}`}>
          We create high-quality, scalable, and innovative websites to help
          businesses thrive in the digital world.
        </p>
        <Link
          href="/portfolio"
          className={`${styles.button} ${logoFont.className}`}
        >
          <span>Explore More</span>
          <span className={styles.arrow}>→</span>
        </Link>
      </div>
    </div>
  );
}
