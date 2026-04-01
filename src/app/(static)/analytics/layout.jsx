import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

export const metadata = {
  title: "Analytics",
  description:
    "Public analytics and site insights — transparent metrics about content performance and engagement.",
  alternates: { canonical: `${getSiteUrl()}/analytics` },
  openGraph: {
    title: `Analytics | ${siteDefaults.authorName}`,
    description:
      "Explore public analytics dashboards and engagement metrics for this site.",
    url: `${getSiteUrl()}/analytics`,
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Analytics | ${siteDefaults.authorName}`,
    images: [getDefaultOgImageUrl()],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

export default function AnalyticsLayout({ children }) {
  return children;
}
