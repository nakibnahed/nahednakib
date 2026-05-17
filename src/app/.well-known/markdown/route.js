import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/seo/site";

export async function GET() {
  const base = getSiteUrl();

  const markdown = `# Nahed Nakib

**Distance runner and junior web developer.** Clean code, clear goals — discipline and precision on the web and on the track.

## About

Nahed Nakib combines athletic discipline with coding expertise to create exceptional digital experiences.

- [Blog](${base}/blog) — articles on running, web development, and technology
- [Portfolio](${base}/portfolio) — selected web development projects
- [About](${base}/about) — background and biography
- [Contact](${base}/contact) — get in touch
- [Training](${base}/training) — running statistics and Strava activity

## APIs

- [Blog API](${base}/api/blog) — blog posts in JSON
- [Portfolio API](${base}/api/portfolio) — portfolio items in JSON
- [Engagement API](${base}/api/engagement) — likes, favorites, and comments

## Agent Discovery

- [API Catalog](${base}/.well-known/api-catalog) — machine-readable API index (RFC 9727)
- [Agent Skills](${base}/.well-known/agent-skills/index.json) — available agent skills
`;

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
