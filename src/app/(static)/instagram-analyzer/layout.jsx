import { metadata as siteMetadata } from "@/constants/metadata";

const pageTitle =
  "Instagram Follower Analyzer — Find Who Doesn't Follow You Back";
const pageDescription =
  "Free Instagram follower analyzer. Upload your Instagram data export to instantly see who isn't following you back. No login, no tracking — runs 100% in your browser.";
const pageUrl = `${siteMetadata.url}/instagram-analyzer`;
const pageImage = `${siteMetadata.url}/instagram-analyzer.png`;

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  authors: [{ name: siteMetadata.author }],
  creator: siteMetadata.author,
  robots: "index, follow",
  keywords: [
    "instagram follower analyzer",
    "who doesn't follow me back on instagram",
    "instagram unfollow checker",
    "instagram non followers checker",
    "instagram followers vs following",
    "find instagram unfollowers",
    "instagram data export analyzer",
    "free instagram tool",
  ],
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
        alt: "Instagram Follower Analyzer — find who isn't following you back",
        type: "image/png",
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

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Instagram Follower Analyzer",
  description: pageDescription,
  url: pageUrl,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: siteMetadata.author,
    url: siteMetadata.url,
  },
  isPartOf: {
    "@type": "WebSite",
    name: siteMetadata.siteName,
    url: siteMetadata.url,
  },
  featureList: [
    "Compare followers vs following from Instagram data export",
    "Identify accounts not following you back",
    "Mark accounts as unfollowed, kept, or not found",
    "Filter and search results",
    "100% private — no data leaves your browser",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I find out who doesn't follow me back on Instagram?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Download your Instagram data from Settings → Your activity → Download your information. Then upload the followers and following JSON files to this analyzer. It will instantly show everyone you follow who isn't following you back.",
      },
    },
    {
      "@type": "Question",
      name: "Is this Instagram analyzer safe to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — this tool runs entirely in your browser. Your Instagram data files are never uploaded to any server. No login or Instagram credentials are required.",
      },
    },
    {
      "@type": "Question",
      name: "Where do I find my Instagram followers and following JSON files?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Go to Instagram → Settings → Your activity → Download your information → Request a download. Choose JSON format. Once you receive the ZIP file, extract it and look for the followers and following JSON files inside the 'followers_and_following' folder.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use this tool without logging in?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — no login or Instagram account access is needed. You only need the JSON data export files from Instagram.",
      },
    },
  ],
};

export default function InstagramAnalyzerLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
