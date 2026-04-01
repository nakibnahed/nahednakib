import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

export const metadata = {
  title: "Showcase",
  description:
    "Highlighted work, experiments, and demos — a curated showcase of projects and creative builds.",
  alternates: { canonical: `${getSiteUrl()}/showcase` },
  openGraph: {
    title: `Showcase | ${siteDefaults.authorName}`,
    description:
      "Selected projects and experiments showcasing web development craft and product thinking.",
    url: `${getSiteUrl()}/showcase`,
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Showcase | ${siteDefaults.authorName}`,
    images: [getDefaultOgImageUrl()],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

export default function ShowcaseLayout({ children }) {
  return children;
}
