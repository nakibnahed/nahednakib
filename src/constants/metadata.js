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
    icon: [
      { url: "/favicon.ico", rel: "shortcut icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  canonical: getSiteUrl(),
};
