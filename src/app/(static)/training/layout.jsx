import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

export const metadata = {
  title: "Training",
  description:
    "Training insights and running journey — discipline, mileage, and mindset from a distance runner who codes.",
  alternates: { canonical: `${getSiteUrl()}/training` },
  openGraph: {
    title: `Training | ${siteDefaults.authorName}`,
    description:
      "Running-focused updates and training notes from a competitive distance runner and developer.",
    url: `${getSiteUrl()}/training`,
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Training | ${siteDefaults.authorName}`,
    images: [getDefaultOgImageUrl()],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

export default function TrainingLayout({ children }) {
  return children;
}
