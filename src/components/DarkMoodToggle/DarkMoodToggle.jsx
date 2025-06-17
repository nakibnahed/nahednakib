"use client";

import { useContext } from "react";
import styles from "./DarkMoodToggle.module.css";
import { ThemeContext } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function DarkMoodToggle() {
  const { mode, toggle } = useContext(ThemeContext);

  return (
    <button
      className={`${styles.toggleCircle} ${
        mode === "light" ? styles.light : styles.dark
      }`}
      aria-label="Toggle dark/light mode"
      onClick={toggle}
      type="button"
    >
      <span className={styles.iconWrap}>
        <Sun
          className={styles.sun}
          style={{
            opacity: mode === "light" ? 1 : 0,
            transform:
              mode === "light"
                ? "rotate(0deg) scale(1)"
                : "rotate(-90deg) scale(0.5)",
          }}
        />
        <Moon
          className={styles.moon}
          style={{
            opacity: mode === "dark" ? 1 : 0,
            transform:
              mode === "dark"
                ? "rotate(0deg) scale(1)"
                : "rotate(90deg) scale(0.5)",
          }}
        />
      </span>
    </button>
  );
}
