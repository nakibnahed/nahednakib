"use client";
import EngagementSection from "@/components/EngagementSection/EngagementSection";

export default function IconRow({ title, blogId }) {
  return (
    <EngagementSection contentType="blog" contentId={blogId} title={title} />
  );
}
