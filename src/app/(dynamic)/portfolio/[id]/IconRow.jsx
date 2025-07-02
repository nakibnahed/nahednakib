"use client";
import EngagementSection from "@/components/EngagementSection/EngagementSection";

export default function IconRow({ title, portfolioId }) {
  return (
    <EngagementSection
      contentType="portfolio"
      contentId={portfolioId}
      title={title}
    />
  );
}
