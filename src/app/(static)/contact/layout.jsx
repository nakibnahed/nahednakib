import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

export const metadata = {
  title: "Contact",
  description:
    "Get in touch with Nahed Nakib for web development projects, collaborations, or questions about running and tech.",
  alternates: { canonical: `${getSiteUrl()}/contact` },
  openGraph: {
    title: `Contact | ${siteDefaults.authorName}`,
    description:
      "Reach out for freelance web development, project inquiries, or partnership opportunities.",
    url: `${getSiteUrl()}/contact`,
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Contact | ${siteDefaults.authorName}`,
    images: [getDefaultOgImageUrl()],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

export default function ContactLayout({ children }) {
  return children;
}
