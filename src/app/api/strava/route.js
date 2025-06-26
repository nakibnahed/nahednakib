export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const per_page = searchParams.get("per_page") || 10;

  // Refresh the access token using your refresh token
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
  const access_token = refreshData.access_token;

  if (!access_token) {
    return new Response(JSON.stringify({ error: "No access token" }), {
      status: 500,
    });
  }

  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?per_page=${per_page}`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );
  const activities = await res.json();

  if (!Array.isArray(activities) || activities.length === 0) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  return new Response(JSON.stringify(activities), { status: 200 });
}
