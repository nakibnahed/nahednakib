import { getSiteUrl, siteDefaults } from "@/lib/seo/site";
import {
  buildMetaDescription,
  buildTitleSegment,
  mergeKeywordSignals,
} from "@/lib/seo/auto";

/** Non-empty alt for cover / OG: custom alt or project title. */
export function coverImageAltForPortfolio(portfolio) {
  const custom = typeof portfolio.image_alt === "string" ? portfolio.image_alt.trim() : "";
  const title = typeof portfolio.title === "string" ? portfolio.title.trim() : "";
  return custom || title || "Portfolio project";
}

export function buildPortfolioMetadata({ portfolio }) {
  const baseUrl = getSiteUrl();
  const canonical = `${baseUrl}/portfolio/${portfolio.slug || portfolio.id}`;
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
  // Ensure the OG image is always an absolute URL unique to this project.
  // Using ?project=slug on the fallback prevents Google from conflating pages
  // that have no custom cover image (they'd otherwise all resolve to share.png).
  let imageUrl = portfolio.image || "";
  if (imageUrl && !imageUrl.startsWith("http")) {
    imageUrl = `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }
  if (!imageUrl) {
    const slug = encodeURIComponent(portfolio.slug || portfolio.id || "");
    imageUrl = `${baseUrl}/share.png?project=${slug}`;
  }

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
          alt: coverImageAltForPortfolio(portfolio),
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
  let imageUrl = portfolio.image || "";
  if (imageUrl && !imageUrl.startsWith("http")) {
    imageUrl = `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }
  if (!imageUrl) {
    const slug = encodeURIComponent(portfolio.slug || portfolio.id || "");
    imageUrl = `${baseUrl}/share.png?project=${slug}`;
  }
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
    url: `${baseUrl}/portfolio/${portfolio.slug || portfolio.id}`,
    dateCreated: portfolio.created_at,
    dateModified: portfolio.updated_at || portfolio.created_at,
    ...(keywords.length ? { keywords } : {}),
  };
}
