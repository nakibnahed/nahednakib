import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

export const metadata = {
  title: "Services",
  description:
    "Explore what Nahed Nakib offers — custom running coaching plans and modern web development. Tailored training programs for runners and high-quality websites built with Next.js.",
  alternates: { canonical: `${getSiteUrl()}/services` },
  openGraph: {
    title: `Services | ${siteDefaults.authorName}`,
    description:
      "Custom running coaching and professional web development services by Nahed Nakib.",
    url: `${getSiteUrl()}/services`,
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Services | ${siteDefaults.authorName}`,
    images: [getDefaultOgImageUrl()],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

export default function ServicesLayout({ children }) {
  return children;
}
