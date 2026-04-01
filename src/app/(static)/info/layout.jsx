import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

export const metadata = {
  title: "Info",
  description:
    "Explore background, skills, and what drives Nahed Nakib as a developer and competitive distance runner.",
  alternates: { canonical: `${getSiteUrl()}/info` },
  openGraph: {
    title: `Info | ${siteDefaults.authorName}`,
    description:
      "Background, skills, and philosophy — building reliable software with the same focus as training for the next race.",
    url: `${getSiteUrl()}/info`,
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Info | ${siteDefaults.authorName}`,
    images: [getDefaultOgImageUrl()],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

export default function InfoLayout({ children }) {
  return children;
}
