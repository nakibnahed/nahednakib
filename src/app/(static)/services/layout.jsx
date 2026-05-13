import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";

const title = "Web Development & Running Plans Services | Nahed Nakib";
const description =
  "Hire Nahed Nakib for custom web development — Next.js websites, full-stack apps, CMS, SEO, and API integrations — or get a personalised running plan built around your goals.";
const url = `${getSiteUrl()}/services`;
const ogImage = {
  url: getDefaultOgImageUrl(),
  width: 1200,
  height: 630,
  alt: "Nahed Nakib — Web Development & Running Plans Services",
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#web-development`,
    name: "Web Development Services",
    description:
      "Custom websites and full-stack web applications built with Next.js, React, and Supabase — including CMS, admin panels, API integrations, and performance optimisation.",
    provider: {
      "@type": "Person",
      "@id": `${getSiteUrl()}#person`,
      name: "Nahed Nakib",
      url: getSiteUrl(),
    },
    serviceType: "Web Development",
    areaServed: "Worldwide",
    url,
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#running-plans`,
    name: "Running Plans",
    description:
      "Personalised distance running plans — custom training plans, race preparation, pacing strategy, and injury prevention for runners of all levels.",
    provider: {
      "@type": "Person",
      "@id": `${getSiteUrl()}#person`,
      name: "Nahed Nakib",
      url: getSiteUrl(),
    },
    serviceType: "Sports Coaching",
    areaServed: "Worldwide",
    url,
  },
];

export const metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

export default function ServicesLayout({ children }) {
  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {children}
    </>
  );
}
