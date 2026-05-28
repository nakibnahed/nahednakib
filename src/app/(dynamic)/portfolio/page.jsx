export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, siteDefaults, getDefaultOgImageUrl } from "@/lib/seo/site";
import styles from "./page.module.css";
import PortfolioCard from "@/components/PortfolioCard/PortfolioCard";

export const metadata = {
  title: "Portfolio",
  description:
    "Selected web development projects — full-stack apps, interfaces, and production-ready builds by Nahed Nakib.",
  alternates: { canonical: `${getSiteUrl()}/portfolio` },
  openGraph: {
    title: `Portfolio | ${siteDefaults.authorName}`,
    description:
      "Explore case studies, tech stacks, and outcomes from real-world client and personal projects.",
    url: `${getSiteUrl()}/portfolio`,
    siteName: siteDefaults.authorName,
    locale: siteDefaults.locale,
    type: "website",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Portfolio | ${siteDefaults.authorName}`,
    images: [getDefaultOgImageUrl()],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
};

function projectYear(portfolio) {
  if (portfolio.project_date) return portfolio.project_date.split("-")[0];
  return new Date(portfolio.created_at).getFullYear().toString();
}

function projectMonth(portfolio) {
  if (portfolio.project_date) {
    const [year, month] = portfolio.project_date.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString("en-US", { month: "short" });
  }
  return new Date(portfolio.created_at).toLocaleString("en-US", { month: "short" });
}

export default async function Portfolio() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const isLoggedIn = !!user;

    let query = supabase
      .from("portfolios")
      .select(
        `
        id,
        title,
        description,
        created_at,
        project_date,
        category,
        technologies,
        status,
        slug
        `,
      )
      .eq("publish_status", "published");

    if (!isLoggedIn) {
      query = query.eq("visibility", "public");
    }

    const { data: portfolios, error } = await query
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error.message);
      return <p>Failed to load portfolios</p>;
    }

    if (!portfolios || portfolios.length === 0) {
      return <p>No portfolios available</p>;
    }

    return (
      <div className="pageMainContainer">
        <div className={styles.container}>
          <header className={styles.header}>
            <span className={styles.eyebrow}>My Work</span>
            <h1 className={styles.pageTitle}>Crafted with Passion</h1>
          </header>
          <div className={styles.grid}>
            {portfolios.map((portfolio) => (
              <PortfolioCard
                key={portfolio.id}
                project={{
                  slug: portfolio.slug,
                  title: portfolio.title,
                  category: portfolio.category,
                  year: projectYear(portfolio),
                  month: projectMonth(portfolio),
                  description: portfolio.description,
                  tech: (portfolio.technologies || "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                  status: portfolio.status || null,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in Portfolio component:", error);
    return <p>Failed to load portfolios</p>;
  }
}
