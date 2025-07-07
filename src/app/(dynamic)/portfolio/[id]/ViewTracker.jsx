"use client";

import { useEffect } from "react";

export default function ViewTracker({ portfolioId }) {
  useEffect(() => {
    const recordView = async () => {
      try {
        await fetch("/api/engagement/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: "portfolio",
            contentId: portfolioId,
          }),
        });
      } catch (error) {
        console.error("Error recording view:", error);
      }
    };

    recordView();
  }, [portfolioId]);

  return null; // This component doesn't render anything
}
