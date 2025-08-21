import { createClient } from "@/lib/supabase/server";

export default async function sitemap() {
  const baseUrl = "https://nahednakib.vercel.app";

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/analytics`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/showcase`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/training`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/info`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Dynamic blog posts
  let blogPages = [];
  try {
    const supabase = await createClient();
    const { data: blogs } = await supabase
      .from("blogs")
      .select("slug, updated_at, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (blogs) {
      blogPages = blogs.map((blog) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: new Date(blog.updated_at || blog.created_at),
        changeFrequency: "monthly",
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error);
  }

  // Dynamic portfolio items
  let portfolioPages = [];
  try {
    const supabase = await createClient();
    const { data: portfolios } = await supabase
      .from("portfolios")
      .select("id, updated_at, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (portfolios) {
      portfolioPages = portfolios.map((portfolio) => ({
        url: `${baseUrl}/portfolio/${portfolio.id}`,
        lastModified: new Date(portfolio.updated_at || portfolio.created_at),
        changeFrequency: "monthly",
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error("Error fetching portfolio items for sitemap:", error);
  }

  return [...staticPages, ...blogPages, ...portfolioPages];
}
