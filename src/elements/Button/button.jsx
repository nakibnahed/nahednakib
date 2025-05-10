"use client";
import styles from "./button.module.css";

export default function button() {
  return (
    <button
      className={styles.logout}
      onClick={() => {
        console.log("Logout");
      }}
    >
      Logout
    </button>
  );
}
