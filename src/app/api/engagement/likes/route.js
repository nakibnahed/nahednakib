import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fallback to in-memory store if database fails
const fallbackStore = {};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const activity_id = searchParams.get("activity_id");

  if (!activity_id) {
    return new Response(JSON.stringify({ error: "Missing activity_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    console.log(`Fetching like count for activity_id: ${activity_id}`);

    const { data, error } = await supabase
      .from("activity_likes")
      .select("count")
      .eq("activity_id", activity_id)
      .single();

    console.log(`Database response for activity ${activity_id}:`, {
      data,
      error,
    });

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Database error, using fallback:", error);
      return new Response(
        JSON.stringify({ count: fallbackStore[activity_id] || 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const count = data ? data.count : 0;
    console.log(`Returning count for activity ${activity_id}:`, count);

    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching like count:", error);
    return new Response(
      JSON.stringify({ count: fallbackStore[activity_id] || 0 }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request) {
  const { activity_id } = await request.json();

  if (!activity_id) {
    return new Response(JSON.stringify({ error: "Missing activity_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get client IP and user agent for anonymous tracking
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Create a unique identifier for this user (IP + user agent hash)
  const userIdentifier = Buffer.from(`${ip}-${userAgent}`)
    .toString("base64")
    .slice(0, 32);

  try {
    // First, try to update the like count directly (simpler approach)
    const { data: existingCount, error: countError } = await supabase
      .from("activity_likes")
      .select("count")
      .eq("activity_id", activity_id)
      .single();

    if (countError && countError.code !== "PGRST116") {
      console.error("Database error, using fallback:", countError);
      // Use fallback in-memory store
      fallbackStore[activity_id] = (fallbackStore[activity_id] || 0) + 1;
      return new Response(
        JSON.stringify({ count: fallbackStore[activity_id] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (existingCount) {
      // Update existing count
      const { data: updatedCount, error: updateError } = await supabase
        .from("activity_likes")
        .update({ count: existingCount.count + 1 })
        .eq("activity_id", activity_id)
        .select("count")
        .single();

      if (updateError) {
        console.error("Update error, using fallback:", updateError);
        fallbackStore[activity_id] = (fallbackStore[activity_id] || 0) + 1;
        return new Response(
          JSON.stringify({ count: fallbackStore[activity_id] }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ count: updatedCount.count }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Insert new count
      const { data: newCount, error: insertError } = await supabase
        .from("activity_likes")
        .insert({ activity_id, count: 1 })
        .select("count")
        .single();

      if (insertError) {
        console.error("Insert error, using fallback:", insertError);
        fallbackStore[activity_id] = (fallbackStore[activity_id] || 0) + 1;
        return new Response(
          JSON.stringify({ count: fallbackStore[activity_id] }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ count: newCount.count }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error processing like:", error);
    // Use fallback in-memory store
    fallbackStore[activity_id] = (fallbackStore[activity_id] || 0) + 1;
    return new Response(JSON.stringify({ count: fallbackStore[activity_id] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
