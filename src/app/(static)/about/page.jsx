"use client";
import styles from "./about.module.css";
import { logoFont } from "@/lib/fonts/fonts.js";
import Link from "next/link";
import Image from "next/image";
import BlogImage2 from "/public/images/me.jpg";

export default function About() {
  return (
    <div className={styles.container}>
      {/* Left Column - Text Section */}
      <div className={`${styles.col} ${styles.about_text}`}>
        <h1 className={`${styles.title} ${logoFont.className}`}>About Nahed</h1>
        <p className={styles.description}>
          I am Nahed Nakib, a professional distance runner and web developer,
          passionate about both sports and technology. As a running programmer,
          I bring the same dedication, focus, and precision from the track to
          building high-performance websites.
        </p>
        <p className={styles.description}>
          Whether it's designing seamless digital experiences or training for my
          next race, I thrive on challenges and continuous improvement. My
          unique combination of athletic discipline and coding expertise sets me
          apart as a developer who understands both performance and precision.
        </p>
        <Link href="/info" className={styles.button}>
          <span>More Info</span>
          <span className={styles.arrow}>→</span>
        </Link>
      </div>

      {/* Right Column - Single Responsive Image */}
      <div className={styles.col}>
        <div className={styles.imageGrid}>
          <Image
            src={BlogImage2}
            alt="Nahed Nakib - Running Programmer"
            className={styles.image}
            width={800}
            height={500}
            priority
          />
        </div>
      </div>
    </div>
  );
}
