import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

export const metadata = {
  title: "About",
  description:
    "Learn about Nahed Nakib — distance runner, web developer, and the story behind the running programmer approach to building software.",
  alternates: { canonical: `${getSiteUrl()}/about` },
  openGraph: {
    title: `About | ${siteDefaults.authorName}`,
    description:
      "Distance runner and junior web developer combining athletic discipline with high-performance web development.",
    url: `${getSiteUrl()}/about`,
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${siteDefaults.authorName}`,
    images: [getDefaultOgImageUrl()],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

export default function AboutLayout({ children }) {
  return children;
}
