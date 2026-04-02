import { getSiteUrl, siteDefaults } from "@/lib/seo/site";
import {
  buildMetaDescription,
  buildTitleSegment,
  mergeKeywordSignals,
} from "@/lib/seo/auto";

export function buildPortfolioMetadata({ portfolio }) {
  const baseUrl = getSiteUrl();
  const canonical = `${baseUrl}/portfolio/${portfolio.id}`;
  const titleSeg = buildTitleSegment({
    title: portfolio.title,
    metaTitle: portfolio.meta_title,
    focusKeyword: portfolio.focus_keyword,
  });
  const description = buildMetaDescription({
    metaDescription: portfolio.meta_description,
    excerpt: portfolio.description,
    htmlContent: portfolio.overview,
    fallback: "Portfolio project by Nahed Nakib.",
  });
  const imageUrl = portfolio.image || `${baseUrl}/images/portfolio.jpg`;

  return {
    title: titleSeg,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title: portfolio.meta_title?.trim() || portfolio.title,
      description,
      url: canonical,
      siteName: siteDefaults.authorName,
      type: "website",
      locale: siteDefaults.locale,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: portfolio.title?.trim() || "Portfolio project",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: portfolio.meta_title?.trim() || portfolio.title,
      description,
      images: [imageUrl],
      creator: siteDefaults.twitterCreator,
      site: siteDefaults.twitterSite,
    },
  };
}

export function buildCreativeWorkJsonLd({ portfolio }) {
  const baseUrl = getSiteUrl();
  const imageUrl = portfolio.image || `${baseUrl}/images/portfolio.jpg`;
  const keywords = mergeKeywordSignals(
    portfolio.technologies,
    portfolio.seo_keywords,
  );

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: portfolio.title,
    description:
      portfolio.meta_description?.trim() ||
      portfolio.description?.trim() ||
      undefined,
    image: imageUrl,
    url: `${baseUrl}/portfolio/${portfolio.id}`,
    dateCreated: portfolio.created_at,
    dateModified: portfolio.updated_at || portfolio.created_at,
    ...(keywords.length ? { keywords } : {}),
  };
}
