"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./page.module.css";
import { logoFont } from "../lib/fonts/fonts.js";
import Link from "next/link";

const MouseEffect = dynamic(
  () => import("@/components/MouseEffect/MouseEffect"),
  { ssr: false }
);

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={styles.container}>
      {/* ✅ Background Effect (Only on Client) */}
      {isClient && <MouseEffect />}

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
