import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();

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
