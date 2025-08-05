"use client";

import { useEffect, useRef } from "react";

export default function ViewTracker({ blogId }) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent duplicate tracking in React Strict Mode
    if (hasTracked.current) return;

    const recordView = async () => {
      try {
        hasTracked.current = true;
        await fetch("/api/engagement/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: "blog",
            contentId: blogId,
          }),
        });
      } catch (error) {
        console.error("Error recording view:", error);
        hasTracked.current = false; // Reset on error so it can retry
      }
    };

    recordView();
  }, [blogId]);

  return null; // This component doesn't render anything
}
