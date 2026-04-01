import { getSiteUrl, siteDefaults } from "@/lib/seo/site";
import { buildMetaDescription, buildTitleSegment, mergeKeywordSignals } from "@/lib/seo/auto";

export function buildBlogPostMetadata({ blog, authorName }) {
  const baseUrl = getSiteUrl();
  const canonical = `${baseUrl}/blog/${blog.slug}`;
  const titleSeg = buildTitleSegment({
    title: blog.title,
    metaTitle: blog.meta_title,
    focusKeyword: blog.focus_keyword,
  });
  const description = buildMetaDescription({
    metaDescription: blog.meta_description,
    excerpt: blog.description,
    htmlContent: blog.content,
    fallback: "Read this article on Nahed Nakib.",
  });
  const imageUrl = blog.image || `${baseUrl}/images/portfolio.jpg`;

  return {
    title: titleSeg,
    description,
    authors: [{ name: authorName }],
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title: blog.meta_title?.trim() || blog.title,
      description,
      url: canonical,
      siteName: `${siteDefaults.authorName} — Blog`,
      type: "article",
      locale: siteDefaults.locale,
      publishedTime: blog.created_at,
      modifiedTime: blog.updated_at || blog.created_at,
      authors: [authorName],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.meta_title?.trim() || blog.title,
      description,
      images: [imageUrl],
      creator: siteDefaults.twitterCreator,
      site: siteDefaults.twitterSite,
    },
  };
}

export function buildArticleJsonLd({
  blog,
  authorName,
  authorUrl,
  authorSameAs,
}) {
  const baseUrl = getSiteUrl();
  const imageUrl = blog.image || `${baseUrl}/images/portfolio.jpg`;
  const keywords = mergeKeywordSignals(blog.tags, blog.seo_keywords);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description:
      blog.meta_description?.trim() ||
      blog.description?.trim() ||
      undefined,
    datePublished: blog.created_at,
    dateModified: blog.updated_at || blog.created_at,
    image: [imageUrl],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${blog.slug}`,
    },
    author: {
      "@type": "Person",
      name: authorName,
      url: authorUrl,
      ...(authorSameAs?.length ? { sameAs: authorSameAs } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: siteDefaults.authorName,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/share.jpg`,
      },
    },
    ...(keywords.length ? { keywords } : {}),
  };
}
