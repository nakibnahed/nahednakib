import { metadata as siteMetadata } from "@/constants/metadata";

const pageTitle = "Conversation Practice";
const pageDescription =
  "Find a conversation practice partner at your level. Set your availability, browse classmates who are ready to practice, and schedule a live video meeting — all in one place.";
const pageUrl = `${siteMetadata.url}/conversation-practice`;
const pageImage = `${siteMetadata.url}/images/conversation-practice.jpg`;

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords:
    "conversation practice, speaking practice, language practice partner, find practice partner, video call practice, English speaking practice, schedule practice session",
  authors: [{ name: siteMetadata.author }],
  creator: siteMetadata.author,
  robots: "index, follow",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    siteName: siteMetadata.siteName,
    type: "website",
    locale: siteMetadata.locale,
    images: [
      {
        url: pageImage,
        width: 1200,
        height: 630,
        alt: "Conversation Practice — find a partner and schedule a meeting",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [pageImage],
    creator: "@nahednakib",
    site: "@nahednakib",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: pageTitle,
  description: pageDescription,
  url: pageUrl,
  isPartOf: {
    "@type": "WebSite",
    name: siteMetadata.siteName,
    url: siteMetadata.url,
  },
  author: {
    "@type": "Person",
    name: siteMetadata.author,
    url: siteMetadata.url,
  },
  potentialAction: {
    "@type": "InteractAction",
    name: "Schedule a conversation practice session",
  },
};

export default function ConversationPracticeLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
