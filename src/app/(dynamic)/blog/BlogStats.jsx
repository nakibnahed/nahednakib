"use client";

import { useEffect, useState } from "react";
import { ThumbsUp, Heart, MessageCircle } from "lucide-react";
import styles from "./page.module.css";

export default function BlogStats({ blogId }) {
  const [likesCount, setLikesCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [likesRes, favRes, commentsRes] = await Promise.all([
          fetch(`/api/engagement/likes?contentType=blog&contentId=${blogId}`),
          fetch(`/api/engagement/favorites?contentType=blog&contentId=${blogId}`),
          fetch(`/api/engagement/comments?contentType=blog&contentId=${blogId}&page=1&limit=1`),
        ]);

        if (likesRes.ok) {
          const data = await likesRes.json();
          setLikesCount(data.likesCount || 0);
        }
        if (favRes.ok) {
          const data = await favRes.json();
          setFavoritesCount(data.favoritesCount || 0);
        }
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setCommentsCount(data.totalCount || 0);
        }
      } catch (error) {
        console.error("Error fetching blog stats:", error);
      }
    };

    fetchStats();
  }, [blogId]);

  return (
    <div className={styles.statsRow}>
      <div className={styles.likesIcon}>
        <ThumbsUp size={16} strokeWidth={2} />
        <span className={styles.iconText}>{likesCount}</span>
      </div>
      <div className={styles.favIcon}>
        <Heart size={16} strokeWidth={2} />
        <span className={styles.iconText}>{favoritesCount}</span>
      </div>
      <div className={styles.commentsIcon}>
        <MessageCircle size={16} strokeWidth={2} />
        <span className={styles.iconText}>{commentsCount}</span>
      </div>
    </div>
  );
}
