"use client"; // Needed for state & event handling
import { useState } from "react";
import styles from "./about.module.css";
import { logoFont } from "@/lib/fonts/fonts.js"; // ✅ Correct import path
import Link from "next/link";
import Image from "next/image";
// import BlogImage1 from "/public/images/foto3.jpg";
import BlogImage2 from "/public/images/me.jpg";
// import BlogImage3 from "/public/images/9.jpg";
// import BlogImage4 from "/public/images/3.jpg";

const images = [BlogImage2]; // ✅ Add more images later

export default function About() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className={styles.container}>
      {/* Left Column - Text Section */}
      <div className={`${styles.col} ${styles.about_text}`}>
        <h1 className={`${styles.title} ${logoFont.className}`}>About Nahed</h1>
        <p className={styles.description}>
          I am a professional distance runner and web developer, passionate
          about both sports and technology. From pushing my limits on the track
          to building high-performance websites, I bring dedication, focus, and
          precision to everything I do.
        </p>
        <p className={styles.description}>
          Whether it's designing seamless digital experiences or training for my
          next race, I thrive on challenges and continuous improvement.
        </p>
        <Link href="/info" className={styles.button}>
          <span>More Info</span>
          <span className={styles.arrow}>→</span>
        </Link>
      </div>

      {/* Right Column - Image Grid Section */}
      <div className={styles.col}>
        <div className={styles.imageGrid}>
          {images.map((img, index) => (
            <Image
              key={index}
              src={img}
              alt={`Gallery image ${index + 1}`}
              className={styles.image}
              // ✅ Required height
              onClick={() => setSelectedImage(img)} // ✅ Store full image object
            />
          ))}
        </div>
      </div>

      {/* Lightbox (Full-Screen Image Preview) */}
      {selectedImage && (
        <div className={styles.lightbox} onClick={() => setSelectedImage(null)}>
          <div className={styles.fullImageWrapper}>
            <Image
              src={selectedImage} // ✅ Corrected: Now passing the full image object
              alt="Full view"
              width={500} // ✅ Fixed width
              height={500} // ✅ Fixed height
              className={styles.fullImage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
