import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

/** Legacy barrel for layouts; prefer `@/lib/seo/site` for new code. */
export const metadata = {
  title: siteDefaults.shortTitle,
  description: siteDefaults.description,
  author: siteDefaults.authorName,
  url: getSiteUrl(),
  image: getDefaultOgImageUrl(),
  siteName: `${siteDefaults.authorName} — Running Programmer`,
  type: "website",
  locale: siteDefaults.locale,
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  canonical: getSiteUrl(),
};
