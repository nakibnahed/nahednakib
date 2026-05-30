"use client";
import {
  FaHeart,
  FaThumbsUp,
  FaComment,
  FaRegHeart,
  FaRegThumbsUp,
} from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { useEngagement } from "@/hooks/useEngagement";
import { showAppToast } from "@/lib/showAppToast";
import styles from "./ActionBar.module.css";

export default function ActionBar({ title, contentType, contentId, variant = "segment" }) {
  const { engagement, actions } = useEngagement(contentType, contentId);

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({ title, url: window.location.href });
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showAppToast("Link copied to clipboard.", "success");
    }
  };

  const scrollToComments = () => {
    const el = document.getElementById("comments-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const isInline = variant === "inline";
  const barClass = isInline ? styles.inlineBar : styles.actionBar;
  const btnBase = isInline ? styles.inlineBtn : styles.actionBtn;

  return (
    <div className={barClass}>
      <button
        className={`${btnBase} ${engagement.likes.userLiked ? styles.active : ""}`}
        onClick={actions.toggleLike}
        disabled={engagement.likes.loading}
        aria-label="Like"
      >
        <span className={styles.btnIcon}>
          {engagement.likes.userLiked
            ? <FaThumbsUp size={isInline ? 15 : 17} />
            : <FaRegThumbsUp size={isInline ? 15 : 17} />}
        </span>
        {!isInline && <span className={styles.btnLabel}>Like</span>}
      </button>

      <button
        className={`${btnBase} ${engagement.favorites.userFavorited ? styles.active : ""}`}
        onClick={actions.toggleFavorite}
        disabled={engagement.favorites.loading}
        aria-label="Favorite"
      >
        <span className={styles.btnIcon}>
          {engagement.favorites.userFavorited
            ? <FaHeart size={isInline ? 15 : 17} />
            : <FaRegHeart size={isInline ? 15 : 17} />}
        </span>
        {!isInline && <span className={styles.btnLabel}>Save</span>}
      </button>

      <button
        className={btnBase}
        onClick={scrollToComments}
        aria-label="Jump to comments"
      >
        <span className={styles.btnIcon}>
          <FaComment size={isInline ? 15 : 17} />
        </span>
        {!isInline && <span className={styles.btnLabel}>Comment</span>}
      </button>

      <button
        className={btnBase}
        onClick={handleShare}
        aria-label="Share"
      >
        <span className={styles.btnIcon}>
          <FiShare2 size={isInline ? 15 : 17} />
        </span>
        {!isInline && <span className={styles.btnLabel}>Share</span>}
      </button>
    </div>
  );
}
