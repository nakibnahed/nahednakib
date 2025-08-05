"use client";

import { useEffect, useState } from "react";
import { Eye, Heart, MessageCircle, ThumbsUp } from "lucide-react";
import styles from "./PortfolioStats.module.css";

export default function PortfolioStats({ portfolioId }) {
  const [viewsCount, setViewsCount] = useState(0);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const response = await fetch(
          `/api/engagement/views?contentType=portfolio&contentId=${portfolioId}`
        );
        if (response.ok) {
          const data = await response.json();
          setViewsCount(data.viewsCount || 0);
        }
      } catch (error) {
        console.error("Error fetching views:", error);
      }
    };

    fetchViews();
  }, [portfolioId]);

  return (
    <>
      {/* Views in corner */}
      <div className={styles.icon}>
        <Eye size={20} strokeWidth={2} />
        <span className={styles.iconText}>{viewsCount}</span>
      </div>
    </>
  );
}

// Separate component for engagement stats row
export function EngagementStats({ portfolioId }) {
  const [likesCount, setLikesCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch likes count
        const likesResponse = await fetch(
          `/api/engagement/likes?contentType=portfolio&contentId=${portfolioId}`
        );
        if (likesResponse.ok) {
          const likesData = await likesResponse.json();
          setLikesCount(likesData.likesCount || 0);
        }

        // Fetch favorites count
        const favoritesResponse = await fetch(
          `/api/engagement/favorites?contentType=portfolio&contentId=${portfolioId}`
        );
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          setFavoritesCount(favoritesData.favoritesCount || 0);
        }

        // Fetch comments count
        const commentsResponse = await fetch(
          `/api/engagement/comments?contentType=portfolio&contentId=${portfolioId}&page=1&limit=1`
        );
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setCommentsCount(commentsData.totalCount || 0);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [portfolioId]);

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
