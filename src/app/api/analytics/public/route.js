import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tryGetServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function GET(request) {
  try {
    // Use the service-role client for these aggregate counts. Several tables
    // (e.g. newsletter_subscribers) are RLS-protected and return 0 for the
    // anonymous server client, even though rows exist. Only aggregate counts
    // are exposed here — never individual rows / PII. Fall back to the cookie
    // client if the service role env is unavailable.
    const supabase = tryGetServiceRoleClient() || (await createClient());

    // Get ALL-TIME totals for everything
    const [
      { count: totalViews },
      { count: totalUserLikes },
      { count: totalComments },
      { count: totalUsers },
      { count: totalBlogs },
      { count: totalPortfolios },
      { count: totalNewsletterSubscribers },
    ] = await Promise.all([
      // All-time views
      supabase.from("user_views").select("*", { count: "exact", head: true }),

      // All-time user likes (blog/portfolio)
      supabase.from("user_likes").select("*", { count: "exact", head: true }),

      // All-time comments
      supabase
        .from("user_comments")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", true),

      // All-time users
      supabase.from("profiles").select("*", { count: "exact", head: true }),

      // All-time blogs
      supabase.from("blogs").select("*", { count: "exact", head: true }),

      // All-time portfolios
      supabase.from("portfolios").select("*", { count: "exact", head: true }),

      // All-time newsletter subscribers
      supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true }),
    ]);

    // Get ALL activity likes (running content) - sum up all counts
    let totalActivityLikes = 0;
    try {
      const { data: activityLikesData, error: activityLikesError } =
        await supabase.from("activity_likes").select("count");

      if (!activityLikesError && activityLikesData) {
        totalActivityLikes = activityLikesData.reduce(
          (sum, row) => sum + (row.count || 0),
          0
        );
      }
    } catch (error) {
      console.log("activity_likes table not available, using 0");
      totalActivityLikes = 0;
    }

    // Calculate TOTAL likes from both sources
    const allLikes = (totalUserLikes || 0) + totalActivityLikes;

    // Build a REAL monthly time series of page views for the last 6 months.
    // Buckets are seeded to 0 so months with no views still appear on the chart.
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-US", { month: "short" }),
        year: d.getFullYear(),
        views: 0,
      });
    }
    const monthIndex = new Map(months.map((m, i) => [m.key, i]));

    const seriesStart = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    ).toISOString();

    const { data: viewRows } = await supabase
      .from("user_views")
      .select("viewed_at")
      .gte("viewed_at", seriesStart);

    if (Array.isArray(viewRows)) {
      for (const row of viewRows) {
        if (!row?.viewed_at) continue;
        const d = new Date(row.viewed_at);
        const idx = monthIndex.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (idx !== undefined) months[idx].views += 1;
      }
    }

    // Build a CUMULATIVE running total so the line always grows and the final
    // point equals the real all-time total (the max). Views that happened
    // before the 6-month window form the starting baseline.
    const windowViews = months.reduce((sum, m) => sum + m.views, 0);
    const baseline = Math.max(0, (totalViews || 0) - windowViews);
    let running = baseline;
    const cumulativeViews = months.map((m) => {
      running += m.views;
      return running;
    });

    return NextResponse.json({
      totals: {
        views: totalViews || 0,
        likes: allLikes, // ALL likes from both user_likes + activity_likes
        comments: totalComments || 0,
        users: totalUsers || 0,
        blogs: totalBlogs || 0,
        portfolios: totalPortfolios || 0,
        newsletterSubscribers: totalNewsletterSubscribers || 0,
      },
      trafficSeries: {
        labels: months.map((m) => m.label),
        years: months.map((m) => m.year),
        views: cumulativeViews, // cumulative total page views per month
        monthly: months.map((m) => m.views), // raw per-month views
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching public analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
