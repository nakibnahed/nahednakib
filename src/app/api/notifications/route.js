import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      Math.min(50, Number.parseInt(searchParams.get("limit") || "20", 10)),
    );
    const cursor = searchParams.get("cursor");

    let query = supabase
      .from("notifications")
      .select(
        `
        id,
        title,
        message,
        type,
        is_read,
        is_admin_notification,
        related_content_type,
        related_content_id,
        created_at,
        read_at,
        sender_id,
        recipient_id
      `,
      )
      .eq("recipient_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch notifications", details: error.message },
        { status: 500 },
      );
    }

    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", session.user.id)
      .eq("is_read", false);

    if (countError) {
      return NextResponse.json(
        { error: "Failed to count unread notifications" },
        { status: 500 },
      );
    }

    const notifications = rows || [];
    const hasMore = notifications.length > limit;
    const sliced = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore
      ? sliced[sliced.length - 1]?.created_at || null
      : null;

    return NextResponse.json({
      notifications: sliced,
      unreadCount: unreadCount || 0,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { notificationId, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("recipient_id", session.user.id)
        .eq("is_read", false);

      if (error) {
        return NextResponse.json(
          {
            error: "Failed to mark notifications as read",
            details: error.message,
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message: "All notifications marked as read",
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("recipient_id", session.user.id);

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to mark notification as read",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Notification marked as read",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
