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

    // Check if user already favorited this content
    const { data: existingFavorite } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .single();

    if (existingFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", session.user.id)
        .eq("content_type", contentType)
        .eq("content_id", contentId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        favorited: false,
        message: "Removed from favorites",
      });
    } else {
      // Add to favorites
      const { error } = await supabase.from("user_favorites").insert({
        user_id: session.user.id,
        content_type: contentType,
        content_id: contentId,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        favorited: true,
        message: "Added to favorites",
      });
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

    // Get total favorites count
    const { count: favoritesCount } = await supabase
      .from("user_favorites")
      .select("*", { count: "exact", head: true })
      .eq("content_type", contentType)
      .eq("content_id", contentId);

    // Check if specific user favorited this content
    let userFavorited = false;
    if (userId) {
      const { data: userFavorite } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .single();

      userFavorited = !!userFavorite;
    }

    return NextResponse.json({
      favoritesCount: favoritesCount || 0,
      userFavorited,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
