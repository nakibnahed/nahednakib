import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/seo/site";

export async function GET() {
  const base = getSiteUrl();

  const catalog = {
    linkset: [
      {
        anchor: `${base}/api/blog`,
        "service-doc": [{ href: `${base}/blog`, type: "text/html" }],
        status: [{ href: `${base}/api/blog` }],
      },
      {
        anchor: `${base}/api/portfolio`,
        "service-doc": [{ href: `${base}/portfolio`, type: "text/html" }],
        status: [{ href: `${base}/api/portfolio` }],
      },
      {
        anchor: `${base}/api/contact`,
        "service-doc": [{ href: `${base}/contact`, type: "text/html" }],
      },
      {
        anchor: `${base}/api/newsletter`,
        "service-doc": [{ href: `${base}/contact`, type: "text/html" }],
      },
      {
        anchor: `${base}/api/engagement`,
        "service-doc": [{ href: `${base}/blog`, type: "text/html" }],
      },
      {
        anchor: `${base}/api/strava`,
        "service-doc": [{ href: `${base}/training`, type: "text/html" }],
      },
    ],
  };

  return NextResponse.json(catalog, {
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
