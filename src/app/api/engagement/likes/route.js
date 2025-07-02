import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { contentType, contentId } = await request.json();

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: "Content type and ID are required" },
        { status: 400 }
      );
    }

    if (!["portfolio", "blog"].includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Check if user already liked this content
    const { data: existingLike } = await supabase
      .from("user_likes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .single();

    if (existingLike) {
      // Unlike - remove the like
      const { error } = await supabase
        .from("user_likes")
        .delete()
        .eq("user_id", session.user.id)
        .eq("content_type", contentType)
        .eq("content_id", contentId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ liked: false, message: "Like removed" });
    } else {
      // Like - add the like
      const { error } = await supabase.from("user_likes").insert({
        user_id: session.user.id,
        content_type: contentType,
        content_id: contentId,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ liked: true, message: "Like added" });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("contentType");
    const contentId = searchParams.get("contentId");
    const userId = searchParams.get("userId");

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: "Content type and ID are required" },
        { status: 400 }
      );
    }

    // Get total likes count
    const { count: likesCount } = await supabase
      .from("user_likes")
      .select("*", { count: "exact", head: true })
      .eq("content_type", contentType)
      .eq("content_id", contentId);

    // Check if specific user liked this content
    let userLiked = false;
    if (userId) {
      const { data: userLike } = await supabase
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
