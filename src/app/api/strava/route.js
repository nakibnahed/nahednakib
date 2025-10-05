import { createClient } from "@/lib/supabase/server";

// Simple in-memory caches (per server instance)
let cachedAccessToken = null;
let accessTokenExpiry = 0; // epoch ms

// Cache activities by key: `${showAllActivities}-${per_page}`
const activitiesCache = new Map();
const ACTIVITIES_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const per_page = searchParams.get("per_page") || 10;

  // Prepare helpers
  const getAccessToken = async () => {
    const now = Date.now();
    if (cachedAccessToken && now < accessTokenExpiry - 5_000) {
      return cachedAccessToken;
    }

    const refreshRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: process.env.STRAVA_REFRESH_TOKEN,
      }),
    });

    const refreshData = await refreshRes.json();
    const token = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 3600; // seconds

    if (!token) {
      throw new Error("No access token from Strava");
    }

    cachedAccessToken = token;
    accessTokenExpiry = Date.now() + expiresIn * 1000;
    return token;
  };

  // Fetch running settings and token in parallel
  let showAllActivities = false;
  try {
    const supabase = await createClient();
    const [settingsResult, token] = await Promise.all([
      supabase
        .from("running_settings")
        .select("show_all_activities")
        .single()
        .then(({ data }) => data)
        .catch(() => null),
      getAccessToken(),
    ]);

    if (settingsResult) {
      showAllActivities = settingsResult.show_all_activities;
    }

    // Try activities cache first
    const cacheKey = `${showAllActivities}-${per_page}`;
    const cached = activitiesCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < ACTIVITIES_TTL_MS) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Cache at the edge and allow stale while revalidating
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      });
    }

    // Fetch from Strava API
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${per_page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const activities = await res.json();

    if (!Array.isArray(activities) || activities.length === 0) {
      activitiesCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      });
    }

    // Filter activities based on settings
    let filteredActivities = activities;
    if (!showAllActivities) {
      filteredActivities = activities.filter((activity) => !activity.private);
    }

    // Save to cache
    activitiesCache.set(cacheKey, {
      data: filteredActivities,
      timestamp: Date.now(),
    });

    return new Response(JSON.stringify(filteredActivities), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Strava API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load activities" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
