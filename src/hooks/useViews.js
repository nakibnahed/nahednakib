"use client";

import { useState, useEffect, useCallback } from "react";

export function useViews(contentType, contentId) {
  const [viewsCount, setViewsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch views count
  const fetchViewsCount = useCallback(async () => {
    if (!contentType || !contentId) return;

    try {
      const response = await fetch(
        `/api/engagement/views?contentType=${contentType}&contentId=${contentId}`
      );

      if (!response.ok) {
        console.error("Failed to fetch views:", response.status);
        return;
      }

      const data = await response.json();
      setViewsCount(data.viewsCount || 0);
    } catch (error) {
      console.error("Error fetching views:", error);
    }
  }, [contentType, contentId]);

  // Record a view
  const recordView = useCallback(async () => {
    if (!contentType || !contentId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/engagement/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, contentId }),
      });

      if (!response.ok) {
        console.error("Failed to record view:", response.status);
        return;
      }

      // Optimistically update the count
      setViewsCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error recording view:", error);
    } finally {
      setLoading(false);
    }
  }, [contentType, contentId]);

  useEffect(() => {
    fetchViewsCount();
  }, [fetchViewsCount]);

  return {
    viewsCount,
    loading,
    recordView,
    refreshViews: fetchViewsCount,
  };
}
