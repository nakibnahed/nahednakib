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

    const { contentType, contentId, comment, parentId } = await request.json();

    if (!contentType || !contentId || !comment?.trim()) {
      return NextResponse.json(
        { error: "Content type, ID, and comment are required" },
        { status: 400 }
      );
    }

    if (!["portfolio", "blog"].includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Insert the comment
    const { data, error } = await supabase
      .from("user_comments")
      .insert({
        user_id: session.user.id,
        content_type: contentType,
        content_id: contentId,
        comment: comment.trim(),
        parent_id: parentId || null,
      })
      .select(
        `
        id,
        comment,
        created_at,
        updated_at,
        parent_id,
        user_id,
        profiles!user_id(email, full_name)
      `
      )
      .single();

    if (error) {
      console.error("Database error during comment creation:", error);
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: data,
      message: "Comment added successfully",
    });
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: "Content type and ID are required" },
        { status: 400 }
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get comments with user info, ordered by creation date
    const {
      data: comments,
      error,
      count,
    } = await supabase
      .from("user_comments")
      .select(
        `
        id,
        comment,
        created_at,
        updated_at,
        parent_id,
        user_id,
        profiles!user_id(email, full_name)
      `,
        { count: "exact" }
      )
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("is_approved", true)
      .is("parent_id", null) // Only top-level comments for now
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Database error during comment fetch:", error);
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from("user_comments")
          .select(
            `
            id,
            comment,
            created_at,
            updated_at,
            parent_id,
            user_id,
            profiles!user_id(email, full_name)
          `
          )
          .eq("parent_id", comment.id)
          .eq("is_approved", true)
          .order("created_at", { ascending: true });

        return {
          ...comment,
          replies: replies || [],
        };
      })
    );

    return NextResponse.json({
      comments: commentsWithReplies,
      totalCount: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Delete the comment (only if user owns it)
    const { error } = await supabase
      .from("user_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
