"use client";
import { FaHeart, FaThumbsUp } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import styles from "./page.module.css";

export default function IconRow({ title }) {
  return (
    <div className={styles.iconRow}>
      <button className={styles.iconBtn} title="Like">
        <FaThumbsUp />
      </button>
      <button className={styles.iconBtn} title="Favorite">
        <FaHeart />
      </button>
      <button
        className={styles.iconBtn}
        title="Share"
        onClick={() => {
          if (typeof window !== "undefined" && navigator.share) {
            navigator.share({
              title,
              url: window.location.href,
            });
          } else if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
          }
        }}
      >
        <FiShare2 />
      </button>
    </div>
  );
}
