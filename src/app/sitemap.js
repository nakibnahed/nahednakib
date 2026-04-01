import { createAnonPublicClient } from "@/lib/supabase/anon-public";
import { getSiteUrl } from "@/lib/seo/site";

export default async function sitemap() {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticPages = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/portfolio", priority: 0.9, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.85, changeFrequency: "weekly" },
    { path: "/about", priority: 0.75, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/info", priority: 0.65, changeFrequency: "monthly" },
    { path: "/training", priority: 0.65, changeFrequency: "weekly" },
    { path: "/showcase", priority: 0.6, changeFrequency: "monthly" },
    { path: "/analytics", priority: 0.55, changeFrequency: "weekly" },
    { path: "/conversation-practice", priority: 0.55, changeFrequency: "weekly" },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  let blogPages = [];
  let portfolioPages = [];

  try {
    const supabase = createAnonPublicClient();

    const { data: blogs } = await supabase
      .from("blogs")
      .select("slug, updated_at, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (blogs?.length) {
      blogPages = blogs.map((blog) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: new Date(blog.updated_at || blog.created_at),
        changeFrequency: "monthly",
        priority: 0.7,
      }));
    }

    const { data: portfolios } = await supabase
      .from("portfolios")
      .select("id, updated_at, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (portfolios?.length) {
      portfolioPages = portfolios.map((p) => ({
        url: `${baseUrl}/portfolio/${p.id}`,
        lastModified: new Date(p.updated_at || p.created_at),
        changeFrequency: "monthly",
        priority: 0.6,
      }));
    }
  } catch (e) {
    console.error("sitemap: Supabase fetch failed", e);
  }

  return [...staticPages, ...blogPages, ...portfolioPages];
}
