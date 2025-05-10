"use client"; // ✅ Ensures this is a client component

import { useState, useEffect } from "react";
import styles from "./mouseEffect.module.css"; // ✅ Import CSS Module

export default function MouseEffect({ active = true }) {
  const [hydrated, setHydrated] = useState(false); // ✅ Prevent hydration mismatch
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setHydrated(true); // ✅ Mark component as hydrated

    if (!active) return; // ✅ Only run effect if active is true

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX - 800, y: e.clientY - 400 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [active]);

  // ✅ Prevent rendering before hydration OR when inactive
  if (!hydrated || !active) return null;

  return (
    <>
      <div className={styles.animatedBg}></div> {/* ✅ Background */}
      <div
        className={styles.lightSpot}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`, // ✅ Follow mouse
        }}
      ></div>
    </>
  );
}
