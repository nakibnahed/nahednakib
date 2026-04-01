import { getSiteUrl } from "@/lib/seo/site";

export default function robots() {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/private/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
