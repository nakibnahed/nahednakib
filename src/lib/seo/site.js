/**
 * Canonical site URL for metadata, JSON-LD, and sitemaps.
 */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "https://nahednakib.vercel.app";
}

export const SITE_NAME = "Nahed Nakib";

export const siteDefaults = {
  authorName: "Nahed Nakib",
  shortTitle: "Nahed Nakib — Running Programmer & Web Developer",
  description:
    "Nahed Nakib is a professional distance runner and skilled web developer. Discover how this running programmer combines athletic discipline with coding expertise to create exceptional digital experiences.",
  locale: "en_US",
  twitterCreator: "@nahednakib",
  twitterSite: "@nahednakib",
  shareImagePath: "/images/share.jpg",
  googleSiteVerification: "5zi1LXSp9ABxohGs7sj86y3W9GCCwuo2erxRAbMzmNM",
};

export function getMetadataBase() {
  return new URL(getSiteUrl());
}

export function getDefaultOgImageUrl() {
  return `${getSiteUrl()}${siteDefaults.shareImagePath}`;
}
