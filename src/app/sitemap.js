// app/sitemap.js
import { createClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/seo/site";

export const revalidate = 60 * 60; // 1 hour cache

// استخدم SERVICE_ROLE_KEY للـ server fetch حتى تتأكد من كل البيانات
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default async function GET() {
  const baseUrl = getSiteUrl();
  const now = new Date();

  // الصفحات الثابتة
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
    {
      path: "/conversation-practice",
      priority: 0.55,
      changeFrequency: "weekly",
    },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now.toISOString(),
    changeFrequency,
    priority,
  }));

  let blogPages = [];
  let portfolioPages = [];

  try {
    // جلب المقالات المنشورة
    const { data: blogs } = await supabase
      .from("blogs")
      .select("slug, updated_at, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (blogs?.length) {
      blogPages = blogs.map((b) => ({
        url: `${baseUrl}/blog/${b.slug}`,
        lastModified: new Date(b.updated_at || b.created_at).toISOString(),
        changeFrequency: "monthly",
        priority: 0.7,
      }));
    }

    // جلب المشاريع المنشورة
    const { data: portfolios } = await supabase
      .from("portfolios")
      .select("id, updated_at, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (portfolios?.length) {
      portfolioPages = portfolios.map((p) => ({
        url: `${baseUrl}/portfolio/${p.id}`,
        lastModified: new Date(p.updated_at || p.created_at).toISOString(),
        changeFrequency: "monthly",
        priority: 0.6,
      }));
    }
  } catch (e) {
    console.error("Sitemap fetch failed:", e);
  }

  const allPages = [...staticPages, ...blogPages, ...portfolioPages];

  // تحويل كل الصفحات إلى XML صالح
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `<url>
  <loc>${p.url}</loc>
  <lastmod>${p.lastModified}</lastmod>
  <changefreq>${p.changeFrequency}</changefreq>
  <priority>${p.priority}</priority>
</url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
