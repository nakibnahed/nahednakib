import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

const title = "Learning Tracker";
const description =
  "Track study sessions, set learning goals with daily targets, and monitor your progress with streaks, heatmaps and analytics — all in one private dashboard.";
const url = `${getSiteUrl()}/learning-tracker`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Learning Tracker",
  applicationCategory: "EducationApplication",
  operatingSystem: "Web",
  description,
  url,
  author: {
    "@type": "Person",
    name: siteDefaults.authorName,
    url: getSiteUrl(),
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Pomodoro-style study timer with session recovery",
    "Colour-coded learning goals with daily minute targets",
    "Weekly and monthly analytics dashboard",
    "GitHub-style activity heatmap",
    "Session history with timestamps",
    "Streak tracking",
  ],
};

export const metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    title: `${title} | ${siteDefaults.authorName}`,
    description,
    url,
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${siteDefaults.authorName}`,
    description,
    images: [getDefaultOgImageUrl()],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

export default function LearningTrackerLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
