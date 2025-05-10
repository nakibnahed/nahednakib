"use client";
import { useState } from "react";
import styles from "./test.module.css";
import { logoFont } from "@/lib/fonts/fonts.js"; // Import home page font

export default function Test() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX / 50, y: e.clientY / 50 });
  };

  return (
    <div className={styles.container} onMouseMove={handleMouseMove}>
      {/* Animated Background */}
      <div className={styles.animatedBg}></div>

      {/* Floating Element */}
      <div
        className={styles.movingElement}
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
      ></div>

      {/* Page Content */}
      <h1 className={`${styles.title} ${logoFont.className}`}>
        Test Animation Page
      </h1>
      <p className={styles.description}>
        Move your mouse around and see the animation effect.
      </p>
    </div>
  );
}
