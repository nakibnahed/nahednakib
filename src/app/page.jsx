import HomeClient from "./HomeClient";
import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

export const metadata = {
  title: { absolute: siteDefaults.shortTitle },
  description: siteDefaults.description,
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title: siteDefaults.shortTitle,
    description: siteDefaults.description,
    url: getSiteUrl(),
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [
      {
        url: getDefaultOgImageUrl(),
        width: 1200,
        height: 630,
        alt: siteDefaults.authorName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteDefaults.shortTitle,
    description: siteDefaults.description,
    images: [getDefaultOgImageUrl()],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

export default function HomePage() {
  return <HomeClient />;
}
