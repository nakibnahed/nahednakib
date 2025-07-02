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
import styles from "./ActionBar.module.css";

export default function ActionBar({ title, contentType, contentId }) {
  const { engagement, actions } = useEngagement(contentType, contentId);

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      });
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      // Simple alert for now
      alert("Link copied to clipboard!");
    }
  };

  const scrollToComments = () => {
    const commentsSection = document.getElementById("comments-section");
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={styles.actionBar}>
      <button
        className={`${styles.actionBtn} ${
          engagement.likes.userLiked ? styles.active : ""
        }`}
        onClick={actions.toggleLike}
        disabled={engagement.likes.loading}
        title="Like"
      >
        {engagement.likes.userLiked ? (
          <FaThumbsUp size={16} />
        ) : (
          <FaRegThumbsUp size={16} />
        )}
        <span>{engagement.likes.count > 0 && engagement.likes.count}</span>
      </button>

      <button
        className={`${styles.actionBtn} ${
          engagement.favorites.userFavorited ? styles.active : ""
        }`}
        onClick={actions.toggleFavorite}
        disabled={engagement.favorites.loading}
        title="Favorite"
      >
        {engagement.favorites.userFavorited ? (
          <FaHeart size={16} />
        ) : (
          <FaRegHeart size={16} />
        )}
        <span>
          {engagement.favorites.count > 0 && engagement.favorites.count}
        </span>
      </button>

      <button
        className={styles.actionBtn}
        title="Comments"
        onClick={scrollToComments}
      >
        <FaComment size={16} />
        <span>
          {engagement.comments.count > 0 && engagement.comments.count}
        </span>
      </button>

      <button className={styles.actionBtn} title="Share" onClick={handleShare}>
        <FiShare2 size={16} />
      </button>
    </div>
  );
}
