import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fallback to in-memory store if database fails
const fallbackStore = {};

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Check if this is for running activities (activity_id) or portfolio/blog (contentType + contentId)
  const activity_id = searchParams.get("activity_id");
  const contentType = searchParams.get("contentType");
  const contentId = searchParams.get("contentId");
  const userId = searchParams.get("userId");

  // Handle running activity likes
  if (activity_id) {
    return handleActivityLikesGet(activity_id);
  }

  // Handle portfolio/blog likes
  if (contentType && contentId) {
    return handleContentLikesGet(contentType, contentId, userId);
  }

  return new Response(
    JSON.stringify({ error: "Missing required parameters" }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function POST(request) {
  const body = await request.json();
  const { activity_id, contentType, contentId } = body;

  // Handle running activity likes
  if (activity_id) {
    return handleActivityLikesPost(activity_id, request);
  }

  // Handle portfolio/blog likes
  if (contentType && contentId) {
    return handleContentLikesPost(contentType, contentId, request);
  }

  return new Response(
    JSON.stringify({ error: "Missing required parameters" }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Handle running activity likes GET
async function handleActivityLikesGet(activity_id) {
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

// Handle portfolio/blog likes GET
async function handleContentLikesGet(contentType, contentId, userId) {
  try {
    const serverSupabase = await createServerClient();

    if (!["portfolio", "blog"].includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Get total likes count
    const { count: likesCount } = await serverSupabase
      .from("user_likes")
      .select("*", { count: "exact", head: true })
      .eq("content_type", contentType)
      .eq("content_id", contentId);

    // Check if specific user liked this content
    let userLiked = false;
    if (userId) {
      const { data: userLike } = await serverSupabase
        .from("user_likes")
        .select("id")
        .eq("user_id", userId)
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .single();

      userLiked = !!userLike;
    }

    return NextResponse.json({
      likesCount: likesCount || 0,
      userLiked,
    });
  } catch (error) {
    console.error("Error fetching content likes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle running activity likes POST
async function handleActivityLikesPost(activity_id, request) {
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

// Handle portfolio/blog likes POST
async function handleContentLikesPost(contentType, contentId, request) {
  try {
    const serverSupabase = await createServerClient();
    const {
      data: { session },
    } = await serverSupabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!["portfolio", "blog"].includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Check if user already liked this content
    const { data: existingLike } = await serverSupabase
      .from("user_likes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .single();

    if (existingLike) {
      // Remove like
      const { error } = await serverSupabase
        .from("user_likes")
        .delete()
        .eq("user_id", session.user.id)
        .eq("content_type", contentType)
        .eq("content_id", contentId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        liked: false,
        message: "Like removed",
      });
    } else {
      // Add like
      const { error } = await serverSupabase.from("user_likes").insert({
        user_id: session.user.id,
        content_type: contentType,
        content_id: contentId,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        liked: true,
        message: "Content liked",
      });
    }
  } catch (error) {
    console.error("Error processing content like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
