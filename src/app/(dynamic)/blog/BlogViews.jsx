"use client";

import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import styles from "./page.module.css";

export default function BlogViews({ blogId }) {
  const [viewsCount, setViewsCount] = useState(0);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const response = await fetch(
          `/api/engagement/views?contentType=blog&contentId=${blogId}`
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
  }, [blogId]);

  return (
    <div className={styles.icon}>
      <Eye size={20} strokeWidth={2} />
      <span className={styles.iconText}>{viewsCount}</span>
    </div>
  );
}
