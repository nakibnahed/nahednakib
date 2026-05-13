"use client";

import NewsletterContent from "@/components/User/Layout/Content/NewsletterContent";
import { useProfileShell } from "@/components/User/Layout/ProfileShellContext";

export default function NewsletterPage() {
  const shell = useProfileShell();
  if (!shell?.user) return null;
  return <NewsletterContent user={shell.user} />;
}
